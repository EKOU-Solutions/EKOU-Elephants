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
 * The browser keeps a page a minute and shared caches five; then it is revalidated. Short on
 * purpose: the page names the app's hashed scripts, which change with every deploy.
 */
export const CACHE_PAGINA = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

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

export async function servirPagina(request: Request, env: EntornoPaginas): Promise<Response> {
  const deSiempre = () => env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const clave = clavePagina(url.pathname);
  if ((request.method !== 'GET' && request.method !== 'HEAD') || !clave || !env.DATOS)
    return deSiempre();
  const esSitemap = clave.endsWith('.xml');
  try {
    const [pagina, indice] = await Promise.all([
      env.DATOS.fetch(`https://datos/${clave}`, { redirect: 'manual' }),
      esSitemap ? undefined : env.ASSETS.fetch(new Request(new URL('/', url))),
    ]);
    if (pagina.status !== 200) return deSiempre();
    const sinCuerpo = request.method === 'HEAD';
    if (esSitemap)
      return new Response(sinCuerpo ? null : pagina.body, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': CACHE_PAGINA,
        },
      });
    // Without the app's scripts the page would never become the map: serve the SPA instead.
    const etiquetas = indice?.ok ? await etiquetasDeLaApp(indice) : '';
    if (!etiquetas.includes('<script')) return deSiempre();
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': CACHE_PAGINA,
    };
    if (sinCuerpo) return new Response(null, { headers });
    return new HTMLRewriter()
      .on('head', {
        element(e) {
          e.append(etiquetas, { html: true });
        },
      })
      .transform(new Response(pagina.body, { headers }));
  } catch (error) {
    console.error('Página generada no disponible:', (error as Error).name); // no URLs or data
    return deSiempre();
  }
}
