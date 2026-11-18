// Generated pages of each place (ADR 0003). `npm run paginas` writes them with each monthly cut into
// the data Worker (`paginas/mapa/05001.html`…). For `/mapa…` and `/sitemap.xml` the app Worker asks
// DATOS for the page, adds the current app's scripts and styles, and serves it; if there is no page
// or anything fails, it serves what it always served (the SPA's index.html). The API is not involved.
import { parseRoute, routePath } from '../modules/mapa/ui/mapModel';

export interface EntornoPaginas {
  DATOS?: Fetcher;
  ASSETS: Fetcher;
}

/**
 * A page may be stored but is revalidated on every use: it names the app's hashed scripts, so a copy
 * from before a deploy would load `/assets/index-OLD.js`, which is gone (the SPA fallback answers it
 * as HTML and the app never starts). Its `ETag` joins the page's version and the app's (`etagPagina`),
 * so while neither changes the revalidation is a 304 without body; after a cut or a deploy, the new
 * page. The same as the SPA's own index.html, which is always revalidated.
 */
export const CACHE_PAGINA = 'public, no-cache';

/** The sitemap names no scripts: a minute in the browser, five in shared caches. */
export const CACHE_SITEMAP = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

/** Paths the Worker answers before the static assets (`assets.run_worker_first` in wrangler.jsonc). */
export function esRutaDePagina(pathname: string): boolean {
  return pathname === '/mapa' || pathname.startsWith('/mapa/') || pathname === '/sitemap.xml';
}

/**
 * The page's path in the data Worker, which serves `x.html` at `x`: one per place, as the app's own
 * canonical link (`/mapa/departamento/11` is 11001, a trailing slash is the same place).
 */
export function clavePagina(pathname: string): string | undefined {
  if (pathname === '/sitemap.xml') return 'paginas/sitemap.xml';
  if (!esRutaDePagina(pathname)) return undefined;
  const route = parseRoute(pathname);
  return route.view === 'invalid' ? undefined : `paginas${routePath(route)}`;
}

const atributo = (valor: string) => valor.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * The app's `<script type="module">`, `<link rel="modulepreload">` and `<link rel="stylesheet">`, in
 * order and with all their attributes, from its current index.html. Inline module scripts keep their
 * content (`npm run dev` needs Vite's). Empty if the index has none.
 */
export async function etiquetasDeLaApp(indice: Response): Promise<string> {
  const etiquetas: { abre: string; cuerpo: string[]; cierre: string }[] = [];
  const copiar = (cierre: string): HTMLRewriterElementContentHandlers => ({
    element(e) {
      // The DOM lib's `Element` merges with the Workers one: its `attributes` are [name, value] pairs.
      const pares = e.attributes as unknown as Iterable<[string, string]>;
      const atributos = [...pares]
        .map(([nombre, valor]) => (valor ? ` ${nombre}="${atributo(valor)}"` : ` ${nombre}`))
        .join('');
      etiquetas.push({ abre: `<${e.tagName}${atributos}>`, cuerpo: [], cierre });
    },
    text(t) {
      etiquetas.at(-1)?.cuerpo.push(t.text);
    },
  });
  await new HTMLRewriter()
    .on('script[type="module"]', copiar('</script>'))
    .on('link[rel="modulepreload"], link[rel="stylesheet"]', copiar(''))
    .transform(indice)
    .text();
  return etiquetas.map((e) => `${e.abre}${e.cuerpo.join('')}${e.cierre}`).join('');
}

/** An ETag's value without `W/` and quotes; undefined if there is none. */
const valorEtag = (etag: string | null) => etag?.replace(/^W\//, '').replace(/"/g, '') || undefined;

/** A short SHA-256 of a text: the version of something that has no ETag of its own. */
async function resumen(texto: string): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)),
  );
  return [...hash.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The page's ETag: the page's version and the app's, so a new cut or a new deploy changes it. */
export const etagPagina = (pagina: string, app: string) => `W/"${pagina}-${app}"`;

/** If-None-Match as the browser sends it (a list, `*`, weak or strong): weak comparison. */
function coincide(cabecera: string | null, etag: string): boolean {
  if (!cabecera) return false;
  const valor = valorEtag(etag);
  return cabecera.split(',').some((v) => v.trim() === '*' || valorEtag(v.trim()) === valor);
}

interface App {
  /** The deployed index.html's ETag this was read from. */
  indice: string;
  etiquetas: string;
  /** Hash of `etiquetas`: what the page's ETag takes from the app. */
  version: string;
}

/** Kept by the isolate: the index only changes with a deploy, and a deploy starts new isolates. */
let appLeida: App | undefined;

/**
 * The app's tags (`etiquetasDeLaApp`) and their version, read once per deployed index.html (its
 * ETag). An index without an ETag (`npm run dev`) is read every time. Undefined if it fails.
 */
export async function laApp(assets: Fetcher, url: URL): Promise<App | undefined> {
  const indice = await assets.fetch(new Request(new URL('/', url)));
  const etag = indice.headers.get('ETag');
  if (!indice.ok || (etag && appLeida?.indice === etag)) {
    await indice.body?.cancel();
    return indice.ok ? appLeida : undefined;
  }
  const etiquetas = await etiquetasDeLaApp(indice);
  const app = { indice: etag ?? '', etiquetas, version: await resumen(etiquetas) };
  if (etag) appLeida = app;
  return app;
}

export async function servirPagina(request: Request, env: EntornoPaginas): Promise<Response> {
  const deSiempre = () => env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const clave = clavePagina(url.pathname);
  if ((request.method !== 'GET' && request.method !== 'HEAD') || !clave || !env.DATOS)
    return deSiempre();
  try {
    // The page first: without one, the index is not even read.
    const pagina = await env.DATOS.fetch(`https://datos/${clave}`, { redirect: 'manual' });
    if (pagina.status !== 200) {
      await pagina.body?.cancel();
      return deSiempre();
    }
    const sinCuerpo = request.method === 'HEAD';
    if (clave.endsWith('.xml'))
      return new Response(sinCuerpo ? null : pagina.body, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': CACHE_SITEMAP,
        },
      });
    // Without the app's scripts the page would never become the map: serve the SPA instead.
    const app = await laApp(env.ASSETS, url);
    if (!app?.etiquetas.includes('<script')) {
      await pagina.body?.cancel();
      return deSiempre();
    }
    // The data Worker's static files bring an ETag; if not (`npm run dev`), the page's own hash.
    let cuerpo: ReadableStream | string | null = pagina.body;
    let version = valorEtag(pagina.headers.get('ETag'));
    if (!version) {
      cuerpo = await pagina.text();
      version = await resumen(cuerpo);
    }
    const etag = etagPagina(version, app.version);
    if (coincide(request.headers.get('If-None-Match'), etag)) {
      if (typeof cuerpo !== 'string') await cuerpo?.cancel();
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': CACHE_PAGINA },
      });
    }
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': CACHE_PAGINA,
      ETag: etag,
    };
    if (sinCuerpo) {
      if (typeof cuerpo !== 'string') await cuerpo?.cancel();
      return new Response(null, { headers });
    }
    return new HTMLRewriter()
      .on('head', {
        element(e) {
          e.append(app.etiquetas, { html: true });
        },
      })
      .transform(new Response(cuerpo, { headers }));
  } catch (error) {
    console.error('Página generada no disponible:', (error as Error).name); // no URLs or data
    return deSiempre();
  }
}
