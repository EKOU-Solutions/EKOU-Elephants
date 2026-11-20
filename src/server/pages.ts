// Generated pages of each place (ADR 0003). `npm run paginas` writes them with each monthly cut into
// the data Worker (`paginas/mapa/05001.html`…). For `/mapa…` and `/sitemap.xml` the app Worker asks
// DATOS for the page, adds the current app's scripts and styles, and serves it; if there is no page
// or anything fails, it serves what it always served (the SPA's index.html). The API is not involved.
import { parseRoute, routePath } from '../modules/mapa/ui/mapModel';

export interface PagesEnv {
  DATOS?: Fetcher;
  ASSETS: Fetcher;
}

/**
 * A page may be stored but is revalidated on every use: it names the app's hashed scripts, so a copy
 * from before a deploy would load `/assets/index-OLD.js`, which is gone (the SPA fallback answers it
 * as HTML and the app never starts). Its `ETag` joins the page's version and the app's (`pageEtag`),
 * so while neither changes the revalidation is a 304 without body; after a cut or a deploy, the new
 * page. The same as the SPA's own index.html, which is always revalidated.
 */
export const PAGE_CACHE = 'public, no-cache';

/** The sitemap names no scripts: a minute in the browser, five in shared caches. */
export const SITEMAP_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

/** Paths the Worker answers before the static assets (`assets.run_worker_first` in wrangler.jsonc). */
export function isPagePath(pathname: string): boolean {
  return pathname === '/mapa' || pathname.startsWith('/mapa/') || pathname === '/sitemap.xml';
}

/**
 * The page's path in the data Worker, which serves `x.html` at `x`: one per place, as the app's own
 * canonical link (`/mapa/departamento/11` is 11001, a trailing slash is the same place).
 */
export function pageKey(pathname: string): string | undefined {
  if (pathname === '/sitemap.xml') return 'paginas/sitemap.xml';
  if (!isPagePath(pathname)) return undefined;
  const route = parseRoute(pathname);
  return route.view === 'invalid' ? undefined : `paginas${routePath(route)}`;
}

const atributo = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * The app's `<script type="module">`, `<link rel="modulepreload">` and `<link rel="stylesheet">`, in
 * order and with all their attributes, from its current index.html. Inline module scripts keep their
 * content (`npm run dev` needs Vite's). Empty if the index has none.
 */
export async function appTags(indice: Response): Promise<string> {
  const tags: { open: string; body: string[]; close: string }[] = [];
  const copiar = (close: string): HTMLRewriterElementContentHandlers => ({
    element(e) {
      // The DOM lib's `Element` merges with the Workers one: its `attributes` are [name, value] pairs.
      const pares = e.attributes as unknown as Iterable<[string, string]>;
      const attributes = [...pares]
        .map(([nombre, value]) => (value ? ` ${nombre}="${atributo(value)}"` : ` ${nombre}`))
        .join('');
      tags.push({ open: `<${e.tagName}${attributes}>`, body: [], close });
    },
    text(t) {
      tags.at(-1)?.body.push(t.text);
    },
  });
  await new HTMLRewriter()
    .on('script[type="module"]', copiar('</script>'))
    .on('link[rel="modulepreload"], link[rel="stylesheet"]', copiar(''))
    .transform(indice)
    .text();
  return tags.map((e) => `${e.open}${e.body.join('')}${e.close}`).join('');
}

/** An ETag's value without `W/` and quotes; undefined if there is none. */
const etagValue = (etag: string | null) => etag?.replace(/^W\//, '').replace(/"/g, '') || undefined;

/** A short SHA-256 of a text: the version of something that has no ETag of its own. */
async function digest(texto: string): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)),
  );
  return [...hash.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The page's ETag: the page's version and the app's, so a new cut or a new deploy changes it. */
export const pageEtag = (page: string, app: string) => `W/"${page}-${app}"`;

/** If-None-Match as the browser sends it (a list, `*`, weak or strong): weak comparison. */
function matches(header: string | null, etag: string): boolean {
  if (!header) return false;
  const value = etagValue(etag);
  return header.split(',').some((v) => v.trim() === '*' || etagValue(v.trim()) === value);
}

interface App {
  /** The deployed index.html's ETag this was read from. */
  indice: string;
  tags: string;
  /** Hash of `tags`: what the page's ETag takes from the app. */
  version: string;
}

/** Kept by the isolate: the index only changes with a deploy, and a deploy starts new isolates. */
let appLeida: App | undefined;

/**
 * The app's tags (`appTags`) and their version, read once per deployed index.html (its
 * ETag). An index without an ETag (`npm run dev`) is read every time. Undefined if it fails.
 */
export async function appIndex(assets: Fetcher, url: URL): Promise<App | undefined> {
  const indice = await assets.fetch(new Request(new URL('/', url)));
  const etag = indice.headers.get('ETag');
  if (!indice.ok || (etag && appLeida?.indice === etag)) {
    await indice.body?.cancel();
    return indice.ok ? appLeida : undefined;
  }
  const tags = await appTags(indice);
  const app = { indice: etag ?? '', tags, version: await digest(tags) };
  if (etag) appLeida = app;
  return app;
}

export async function servePage(request: Request, env: PagesEnv): Promise<Response> {
  const deSiempre = () => env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const key = pageKey(url.pathname);
  if ((request.method !== 'GET' && request.method !== 'HEAD') || !key || !env.DATOS)
    return deSiempre();
  try {
    // The page first: without one, the index is not even read.
    const page = await env.DATOS.fetch(`https://datos/${key}`, { redirect: 'manual' });
    if (page.status !== 200) {
      await page.body?.cancel();
      return deSiempre();
    }
    const noBody = request.method === 'HEAD';
    if (key.endsWith('.xml'))
      return new Response(noBody ? null : page.body, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': SITEMAP_CACHE,
        },
      });
    // Without the app's scripts the page would never become the map: serve the SPA instead.
    const app = await appIndex(env.ASSETS, url);
    if (!app?.tags.includes('<script')) {
      await page.body?.cancel();
      return deSiempre();
    }
    // The data Worker's static files bring an ETag; if not (`npm run dev`), the page's own hash.
    let body: ReadableStream | string | null = page.body;
    let version = etagValue(page.headers.get('ETag'));
    if (!version) {
      body = await page.text();
      version = await digest(body);
    }
    const etag = pageEtag(version, app.version);
    if (matches(request.headers.get('If-None-Match'), etag)) {
      if (typeof body !== 'string') await body?.cancel();
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': PAGE_CACHE },
      });
    }
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': PAGE_CACHE,
      ETag: etag,
    };
    if (noBody) {
      if (typeof body !== 'string') await body?.cancel();
      return new Response(null, { headers });
    }
    return new HTMLRewriter()
      .on('head', {
        element(e) {
          e.append(app.tags, { html: true });
        },
      })
      .transform(new Response(body, { headers }));
  } catch (error) {
    console.error('Página generada no disponible:', (error as Error).name); // no URLs or data
    return deSiempre();
  }
}
