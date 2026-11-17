// What the Astro build reads, once: `scripts/paginas.mjs` passes the folders and the site's URL as
// environment variables (absolute paths), since the built modules run from another folder.
import type { PreparedMap } from '../../../src/modules/mapa/ui/mapModel';
import { leerPublicacion } from './publicacion';
import { type Pagina, paginasDelSitio, urlDelSitio } from './sitio';

export interface Sitio {
  /** The cut, with every outline: each page keeps only its own (`trazosDeLaPagina`). */
  map: PreparedMap;
  sitio: string;
  /** Every page of the cut (the sitemap lists them all). */
  paginas: Pagina[];
  /** The pages to write: all, or the paths in EKOU_PAGINAS_SOLO (tests). */
  aGenerar: Pagina[];
}

let cargado: Promise<Sitio> | undefined;

export function cargarSitio(): Promise<Sitio> {
  cargado ??= (async () => {
    const { EKOU_PUBLICACION, EKOU_GEOMETRIA, EKOU_SITIO_URL, EKOU_PAGINAS_SOLO } = process.env;
    if (!EKOU_PUBLICACION || !EKOU_GEOMETRIA)
      throw new Error('Genera las páginas con `npm run paginas` (scripts/paginas.mjs).');
    const sitio = urlDelSitio(EKOU_SITIO_URL);
    const map = await leerPublicacion(EKOU_PUBLICACION, EKOU_GEOMETRIA);
    const paginas = paginasDelSitio(map);
    const solo = EKOU_PAGINAS_SOLO ? new Set(EKOU_PAGINAS_SOLO.split(',')) : undefined;
    return {
      map,
      sitio,
      paginas,
      aGenerar: solo ? paginas.filter((p) => solo.has(p.ruta)) : paginas,
    };
  })();
  return cargado;
}
