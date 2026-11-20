// What the Astro build reads, once: `scripts/pages.mjs` passes the folders and the site's URL as
// environment variables (absolute paths), since the built modules run from another folder.
import type { PreparedMap } from '../../../src/modules/mapa/ui/mapModel';
import { readPublication } from './publication';
import { type Page, sitePages, siteUrl } from './site';

export interface Site {
  /** The cut, with every outline: each page keeps only its own (`pageOutlines`). */
  map: PreparedMap;
  site: string;
  /** Every page of the cut (the sitemap lists them all). */
  pages: Page[];
  /** The pages to write: all, or the paths in EKOU_PAGINAS_SOLO (tests). */
  toGenerate: Page[];
}

let cargado: Promise<Site> | undefined;

export function loadSite(): Promise<Site> {
  cargado ??= (async () => {
    const { EKOU_PUBLICACION, EKOU_GEOMETRIA, EKOU_SITIO_URL, EKOU_PAGINAS_SOLO } = process.env;
    if (!EKOU_PUBLICACION || !EKOU_GEOMETRIA)
      throw new Error('Genera las páginas con `npm run paginas` (scripts/pages.mjs).');
    const site = siteUrl(EKOU_SITIO_URL);
    const map = await readPublication(EKOU_PUBLICACION, EKOU_GEOMETRIA);
    const pages = sitePages(map);
    const only = EKOU_PAGINAS_SOLO ? new Set(EKOU_PAGINAS_SOLO.split(',')) : undefined;
    return {
      map,
      site,
      pages,
      toGenerate: only ? pages.filter((p) => only.has(p.path)) : pages,
    };
  })();
  return cargado;
}
