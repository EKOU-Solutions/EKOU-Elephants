// Deterministic design checks over the Storybook stories (`npm run design:check`).
// For every story × theme × width it checks: the story renders, axe-core finds no violations,
// and the page has no horizontal overflow. It also saves a screenshot of each render.
// The design flows (`elephant-designer`) run it instead of checking these by hand.
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const WIDTHS = [320, 390, 768, 1280];
export const THEMES = ['light', 'dark'];
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const STATIC_DIR = 'storybook-static';
const OUTPUT_DIR = '.design-check';
const CONCURRENCY = 4;
const VIEWPORT_HEIGHT = 844;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const HELP = `Uso: npm run design:check -- [opciones]

  --filter <texto>   Solo las historias cuyo id o título contiene el texto (se puede repetir).
  --no-build         Usa el Storybook ya generado en ${STATIC_DIR}/.
  --url <base>       Revisa un Storybook publicado (por ejemplo, el preview de un PR).
  --no-screenshots   No guarda capturas.
  --html <archivo>   Solo captura un HTML local (por ejemplo, los bocetos de una página) a 1280 px.
  --list             Lista las historias que se revisarían y termina.

Resultado: ${OUTPUT_DIR}/report.json y las capturas en ${OUTPUT_DIR}/screenshots/.
Si falta el navegador de Playwright, el comando lo descarga la primera vez.`;

export function parseArgs(argv) {
  const options = {
    filters: [],
    build: true,
    url: null,
    html: null,
    screenshots: true,
    list: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--filter' || arg === '--url' || arg === '--html') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Falta el valor de ${arg}.`);
      if (arg === '--filter') options.filters.push(value);
      else if (arg === '--html') options.html = value;
      else options.url = value.replace(/\/+$/, '');
      i += 1;
    } else if (arg === '--no-build') options.build = false;
    else if (arg === '--no-screenshots') options.screenshots = false;
    else if (arg === '--list') options.list = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Opción desconocida: ${arg}.`);
  }
  return options;
}

const fold = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

// Stories only (docs pages are not rendered here), optionally narrowed by id or title.
export function selectStories(index, filters = []) {
  const wanted = filters.map(fold);
  return Object.values(index.entries ?? {})
    .filter((entry) => entry.type === 'story')
    .filter(
      (entry) =>
        wanted.length === 0 ||
        wanted.some((text) => fold(entry.id).includes(text) || fold(entry.title).includes(text)),
    )
    .map(({ id, title, name }) => ({ id, title, name }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function storyUrl(base, id, theme) {
  return `${base}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme}`;
}

export function summarize(results) {
  const failures = [];
  let incomplete = 0;
  for (const result of results) {
    const where = `${result.id} · ${result.theme} · ${result.width} px`;
    if (result.error) failures.push(`${where}: no se pudo revisar (${result.error})`);
    if (result.overflow > 0) {
      failures.push(`${where}: desplazamiento horizontal de ${result.overflow} px`);
    }
    for (const violation of result.violations ?? []) {
      failures.push(
        `${where}: axe ${violation.id} [${violation.impact ?? 'sin impacto'}] ${violation.help} (${violation.targets.join(', ')})`,
      );
    }
    incomplete += result.incomplete?.length ?? 0;
  }
  return { renders: results.length, failures, incomplete };
}

function run(command, args) {
  const { status } = spawnSync(command, args, { stdio: ['ignore', 'ignore', 'inherit'] });
  if (status !== 0) throw new Error(`Falló: ${command} ${args.join(' ')}`);
}

export const isMissingBrowser = (error) =>
  error instanceof Error && /Executable doesn't exist|playwright install/i.test(error.message);

// Launches Chromium; the first time on a machine it downloads the browser, so nobody has to.
async function launchBrowser() {
  const { chromium } = await import('playwright');
  try {
    return await chromium.launch();
  } catch (error) {
    if (!isMissingBrowser(error)) throw error;
    console.log('Falta el navegador de Playwright; se descarga una sola vez (unos 100 MB)…');
    run('npx', ['playwright', 'install', 'chromium-headless-shell']);
    return chromium.launch();
  }
}

// Screenshot of a local HTML file (page sketches): one wide capture per theme.
async function captureHtml(file) {
  if (!existsSync(file)) throw new Error(`No existe ${file}.`);
  const dir = join(OUTPUT_DIR, 'screenshots');
  mkdirSync(dir, { recursive: true });
  const name = file
    .replace(/\.html?$/, '')
    .split(/[\\/]/)
    .slice(-2)
    .join('-');
  const browser = await launchBrowser();
  try {
    for (const theme of THEMES) {
      const page = await browser.newPage({ viewport: { width: 1280, height: VIEWPORT_HEIGHT } });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const path = join(dir, `${name}--${theme}-1280.png`);
      await page.screenshot({ path, fullPage: true });
      console.log(`Captura: ${path}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

function serve(root) {
  const base = resolve(root);
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = normalize(join(base, path === '/' ? 'index.html' : path));
    if (
      (file !== base && !file.startsWith(base + sep)) ||
      !existsSync(file) ||
      !statSync(file).isFile()
    ) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () =>
      done({ server, url: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}

async function loadIndex(base) {
  const response = await fetch(`${base}/index.json`);
  if (!response.ok) throw new Error(`No se pudo leer ${base}/index.json (${response.status}).`);
  return response.json();
}

async function checkRender(context, axeSource, base, story, theme, width, screenshotDir) {
  const result = { id: story.id, title: story.title, name: story.name, theme, width };
  const page = await context.newPage();
  try {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(storyUrl(base, story.id, theme), { waitUntil: 'load' });
    await page.waitForFunction(
      () => /sb-show-(main|errordisplay|nopreview)/.test(document.body.className),
      null,
      { timeout: 20_000 },
    );
    const shown = await page.evaluate(() => document.body.className);
    if (!shown.includes('sb-show-main')) throw new Error('la historia no se renderizó');
    await page.evaluate(() => document.fonts.ready);

    result.overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return Math.max(0, root.scrollWidth - root.clientWidth);
    });

    await page.evaluate(axeSource);
    // The Storybook a11y addon runs its own axe on a heavy story; if ours collides with it, wait and retry.
    let axe;
    for (let attempt = 1; ; attempt += 1) {
      try {
        axe = await page.evaluate(
          (tags) =>
            globalThis.axe.run('#storybook-root', {
              runOnly: { type: 'tag', values: tags },
              resultTypes: ['violations', 'incomplete'],
            }),
          AXE_TAGS,
        );
        break;
      } catch (error) {
        if (attempt >= 5 || !String(error).includes('Axe is already running')) throw error;
        await page.waitForTimeout(500 * attempt);
      }
    }
    const compact = ({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map((node) => node.target.join(' ')),
    });
    result.violations = axe.violations.map(compact);
    result.incomplete = axe.incomplete.map(compact);

    if (screenshotDir) {
      result.screenshot = join(screenshotDir, `${story.id}--${theme}-${width}.png`);
      await page.screenshot({ path: result.screenshot, fullPage: true });
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message.split('\n')[0] : String(error);
  } finally {
    await page.close();
  }
  return result;
}

async function checkAll(base, stories, screenshotDir) {
  const require = createRequire(import.meta.url);
  const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const jobs = stories.flatMap((story) =>
    THEMES.flatMap((theme) => WIDTHS.map((width) => ({ story, theme, width }))),
  );
  const results = [];
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ locale: 'es-CO' });
    const worker = async () => {
      for (let job = jobs.shift(); job; job = jobs.shift()) {
        results.push(
          await checkRender(
            context,
            axeSource,
            base,
            job.story,
            job.theme,
            job.width,
            screenshotDir,
          ),
        );
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } finally {
    await browser.close();
  }
  return results.sort(
    (a, b) => a.id.localeCompare(b.id) || a.theme.localeCompare(b.theme) || a.width - b.width,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  if (options.html) {
    await captureHtml(options.html);
    return 0;
  }

  let local = null;
  let base = options.url;
  try {
    if (!base) {
      if (options.build && !options.list) {
        console.log('1/3 Guía: tokens, catálogo y contraste (build.py)');
        run('python3', ['docs/design/guide/build.py']);
        console.log('2/3 Storybook: build');
        run('npx', ['storybook', 'build', '--quiet', '--output-dir', STATIC_DIR]);
      }
      if (!existsSync(join(STATIC_DIR, 'index.json'))) {
        throw new Error(`No existe ${STATIC_DIR}/index.json. Ejecuta sin --no-build.`);
      }
      local = await serve(STATIC_DIR);
      base = local.url;
    }

    const stories = selectStories(await loadIndex(base), options.filters);
    if (stories.length === 0) throw new Error('Ninguna historia coincide con el filtro.');
    if (options.list) {
      for (const story of stories) console.log(`${story.id}  (${story.title} › ${story.name})`);
      return 0;
    }

    const screenshotDir = options.screenshots ? join(OUTPUT_DIR, 'screenshots') : null;
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(screenshotDir ?? OUTPUT_DIR, { recursive: true });

    console.log(
      `3/3 Historias: ${stories.length} × ${THEMES.length} temas × ${WIDTHS.length} anchos (${WIDTHS.join(', ')} px)`,
    );
    const results = await checkAll(base, stories, screenshotDir);
    const summary = summarize(results);
    await writeFile(
      join(OUTPUT_DIR, 'report.json'),
      `${JSON.stringify({ base: options.url ?? STATIC_DIR, widths: WIDTHS, themes: THEMES, axeTags: AXE_TAGS, ...summary, results }, null, 2)}\n`,
    );

    for (const failure of summary.failures) console.log(`✗ ${failure}`);
    console.log(
      `${summary.failures.length === 0 ? '✓' : '✗'} ${summary.renders} renders, ${summary.failures.length} fallas, ${summary.incomplete} avisos «incompleto» de axe (revisión manual).`,
    );
    console.log(
      `Reporte: ${OUTPUT_DIR}/report.json${screenshotDir ? ` · capturas: ${screenshotDir}/` : ''}`,
    );
    return summary.failures.length === 0 ? 0 : 1;
  } finally {
    local?.server.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(`design:check: ${error instanceof Error ? error.message : error}`);
      process.exit(2);
    },
  );
}
