import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { sitePages } from '../pages-site/src/lib/site';
import { departmentRoute, routePath } from '../src/modules/mapa/ui/mapModel';
import {
  EXPECTED,
  expectedPagePaths,
  parseArgs,
  loadPageRules,
  checkCounts,
  checkPages,
  checkSite,
  variations,
  verifyCut,
} from './cut-verify.mjs';

const MUESTRA = fileURLToPath(new URL('../docs/design/pages/map/sample/', import.meta.url));
const leer = (archivo) => JSON.parse(readFileSync(join(MUESTRA, archivo), 'utf8'));
/** The real sample of cut 2026-11, as a fresh copy each time. */
const muestra = () => ({
  corte: '2026-11',
  info: leer('corte.json'),
  departamentos: leer('departamentos.json'),
  municipios: leer('municipios.json'),
});

/** The modules the bot loads through Vite (`loadPageRules`), here imported by Vitest. */
const RULES = { sitePages, departmentRoute, routePath };
const rutas = () => expectedPagePaths(RULES, muestra());

const carpetas = [];
// Deleting 1.155 pages can take longer than the default 10 s on Windows when the suite runs in parallel.
afterEach(() => {
  for (const c of carpetas.splice(0)) rmSync(c, { recursive: true, force: true });
}, 60_000);

/** A publication folder: `datos/` with the given cuts (the first is current) and, optionally, pages. */
function publicacion(cortes, { paginas = true, cambiarPagina } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'ekou-verificar-'));
  carpetas.push(raiz);
  for (const c of cortes) {
    const dir = join(raiz, 'datos', c.corte);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'corte.json'), JSON.stringify({ ...c.info, corte: c.corte }));
    writeFileSync(
      join(dir, 'departamentos.json'),
      JSON.stringify({ ...c.departamentos, corte: c.corte }),
    );
    writeFileSync(
      join(dir, 'municipios.json'),
      JSON.stringify({ ...c.municipios, corte: c.corte }),
    );
  }
  writeFileSync(join(raiz, 'datos', 'latest.json'), JSON.stringify({ corte: cortes[0].corte }));
  if (paginas) {
    // Written by hand on purpose: an oracle independent of `sitePages`.
    const { departamentos, municipios } = cortes[0];
    const rutas = [
      'mapa',
      ...departamentos.departamentos
        .filter((d) => d.codigo !== '11')
        .map((d) => `mapa/departamento/${d.codigo}`),
      ...municipios.municipios.map((m) => `mapa/${m.codigo}`),
    ];
    for (const ruta of rutas) {
      const archivo = join(raiz, 'paginas', `${ruta}.html`);
      mkdirSync(dirname(archivo), { recursive: true });
      const titulo = cambiarPagina?.(ruta) ?? ruta;
      writeFileSync(
        archivo,
        `<title>${titulo}</title><meta name="description" content="d ${titulo}">`,
      );
    }
    writeFileSync(join(raiz, 'paginas', 'sitemap.xml'), '<url></url>'.repeat(rutas.length));
  }
  return raiz;
}

/** The same cut one month earlier, with `cambiar` applied to its municipalities. */
function anterior(cambiar = (m) => m) {
  const c = muestra();
  c.corte = '2026-10';
  c.municipios.municipios = c.municipios.municipios.map(cambiar);
  return c;
}

describe('checkCounts', () => {
  it('the real cut: 33 departments, 1.122 municipalities and totals that add up', () => {
    expect(checkCounts(muestra()).every((r) => r.ok)).toBe(true);
  });

  it('a missing municipality or a total that does not add up fails', () => {
    const c = muestra();
    c.municipios.municipios.pop();
    c.departamentos.nacional.contratos += 1;
    const fallos = checkCounts(c).filter((r) => !r.ok);
    expect(fallos.map((r) => r.texto).join('\n')).toMatch(/1\.121 municipios[\s\S]*total nacional/);
  });
});

describe('variations', () => {
  it('marks a figure that jumps past the threshold and ranks it first', () => {
    const antes = anterior((m) =>
      m.codigo === '05266' ? { ...m, contratosUbicados: m.contratosUbicados * 2 } : m,
    );
    const { marcadas, lista, faltan } = variations(muestra(), antes, {
      umbral: 0.25,
      minimo: 100,
    });
    expect(faltan).toEqual([]);
    expect(marcadas).toHaveLength(1);
    expect(lista[0]).toMatchObject({ lugar: 'Envigado, Antioquia (05266)', cambio: -0.5 });
  });

  it('small figures do not count, and «Sin datos» is −100 %', () => {
    const antes = anterior((m) => {
      if (m.codigo === '94883') return { ...m, contratosUbicados: 50 }; // San Felipe has 2 now
      if (m.codigo === '05001') return { ...m, contratosUbicados: m.contratosUbicados };
      return m;
    });
    expect(variations(muestra(), antes, { umbral: 0.25, minimo: 100 }).marcadas).toEqual([]);
    const ahora = muestra();
    ahora.municipios.municipios = ahora.municipios.municipios.map((m) =>
      m.codigo === '05001' ? { ...m, contratosUbicados: null } : m,
    );
    const { marcadas } = variations(ahora, anterior(), { umbral: 0.25, minimo: 100 });
    expect(marcadas[0]).toMatchObject({ ahora: null, cambio: -1 });
  });

  it('a place of the previous cut that is gone is reported', () => {
    const ahora = muestra();
    ahora.municipios.municipios = ahora.municipios.municipios.filter((m) => m.codigo !== '05001');
    expect(variations(ahora, anterior()).faltan).toEqual(['Medellín, Antioquia (05001)']);
  });
});

describe('expectedPagePaths', () => {
  it("the generator's own list: Colombia, each department but Bogotá, D.C., each municipality", () => {
    const lista = rutas();
    expect(lista).toHaveLength(EXPECTED.paginas);
    expect(new Set(lista).size).toBe(lista.length);
    expect(lista[0]).toBe('/mapa');
    expect(lista).toContain('/mapa/departamento/05');
    expect(lista).toContain('/mapa/05001');
    expect(lista).toContain('/mapa/11001');
    expect(lista).not.toContain('/mapa/departamento/11');
    expect(lista.filter((r) => r.startsWith('/mapa/departamento/'))).toHaveLength(32);
  });

  it('the modules loaded through Vite give the same list', { timeout: 60_000 }, async () => {
    expect(expectedPagePaths(await loadPageRules(), muestra())).toEqual(rutas());
  });
});

// Writing 1.155 small pages takes a few seconds on Windows.
describe('checkPages', { timeout: 60_000 }, () => {
  it('1.155 pages, the sitemap and unique titles', () => {
    expect(checkPages(publicacion([muestra()]), rutas()).every((r) => r.ok)).toBe(true);
  });

  it('a missing page, or a list that is not the 1.155 places, fails', () => {
    const carpeta = publicacion([muestra()]);
    rmSync(join(carpeta, 'paginas', 'mapa', '05001.html'));
    const fallos = checkPages(carpeta, rutas()).filter((r) => !r.ok);
    expect(fallos.map((r) => r.texto).join('\n')).toContain('faltan: mapa/05001.html');
    // Pages and list agree, but the list is not the 1.155 places of EXPECTED.paginas.
    const corta = checkPages(
      carpeta,
      rutas().filter((r) => r !== '/mapa/05001'),
    ).filter((r) => !r.ok);
    expect(corta).toHaveLength(2); // the places and the sitemap's 1.155 URL
    expect(corta[0]?.texto).toMatch(/^1\.154 lugares con página/);
  });

  it('no pages, or a repeated title, fails', () => {
    const sin = checkPages(publicacion([muestra()], { paginas: false }), rutas());
    expect(sin).toEqual([{ ok: false, texto: expect.stringContaining('npm run paginas') }]);
    const repetido = publicacion([muestra()], {
      cambiarPagina: (ruta) => (ruta === 'mapa/05002' ? 'mapa/05001' : undefined),
    });
    const fallos = checkPages(repetido, rutas()).filter((r) => !r.ok);
    expect(fallos.map((r) => r.texto).join('\n')).toContain(
      'Títulos repetidos o vacíos: mapa/05001',
    );
  });
});

describe('checkSite', () => {
  const sitio = (paginas) => async (url) => {
    const ruta = new URL(url).pathname;
    if (ruta === '/api/salud') return new Response('{"ok":true}');
    if (ruta === '/api/mapa/corte') return new Response('{"corte":"2026-11"}');
    const html = paginas[ruta];
    return html ? new Response(html) : new Response('<div id="root"></div>');
  };
  const pagina = (texto) => `<link rel="canonical" href="x">${texto}`;

  it('each page brings its name and its figure in the HTML, and the API answers', async () => {
    const revisiones = await checkSite(
      'https://pr-1.example.dev',
      muestra(),
      RULES,
      sitio({
        '/mapa': pagina('Colombia 7.456.749'),
        '/mapa/05001': pagina('Medellín 356.935'),
        '/mapa/11001': pagina('Bogotá, D.C. 1.190.373'),
      }),
    );
    expect(revisiones.every((r) => r.ok)).toBe(true);
    expect(revisiones[2]?.texto).toMatch(/^\/mapa\/11001: 200/);
  });

  it('the SPA without the generated page fails', async () => {
    const revisiones = await checkSite('https://pr-1.example.dev', muestra(), RULES, sitio({}));
    expect(revisiones.filter((r) => !r.ok)).toHaveLength(3);
    expect(revisiones[1]?.texto).toContain('sin página generada');
  });
});

describe('verifyCut', { timeout: 60_000 }, () => {
  it('compares with the other cut of the same publication and writes the summary', async () => {
    const antes = anterior((m) =>
      m.codigo === '05266' ? { ...m, contratosUbicados: m.contratosUbicados * 2 } : m,
    );
    const { ok, markdown } = await verifyCut({
      carpeta: publicacion([muestra(), antes]),
      umbral: 0.25,
      minimo: 100,
    });
    expect(ok).toBe(false);
    expect(markdown).toContain('## Verificación del corte 2026-11 ❌');
    expect(markdown).toContain('1 cifra cambia más de ±25 % frente a 2026-10');
    expect(markdown).toContain(
      '| Envigado, Antioquia (05266) | contratos ubicados | 43.246 | 21.623 | **-50 %** |',
    );
  });

  it('without a previous cut it does not compare, and passes', async () => {
    const { ok, markdown } = await verifyCut({
      carpeta: publicacion([muestra()]),
      umbral: 0.25,
      minimo: 100,
    });
    expect(ok).toBe(true);
    expect(markdown).toContain('Sin corte anterior en la publicación');
  });
});

describe('parseArgs', () => {
  it('defaults and validation', () => {
    expect(parseArgs([])).toEqual({ carpeta: 'datos-locales', umbral: 0.25, minimo: 100 });
    expect(parseArgs(['--umbral', '0.1', '--url', 'https://a.dev'])).toMatchObject({
      umbral: 0.1,
      url: 'https://a.dev',
    });
    expect(() => parseArgs(['--umbral', '0'])).toThrow('--umbral');
    expect(() => parseArgs(['--otro', 'x'])).toThrow('Argumento desconocido');
  });
});
