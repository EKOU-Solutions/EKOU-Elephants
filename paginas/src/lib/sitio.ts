// The generated pages of the map (ADR 0003): which places get one, their metadata and the sitemap.
// Pure: the Astro page and the tests build the same thing from the prepared cut.
import {
  ARCHIPELAGO,
  BOGOTA,
  departmentRoute,
  type MapRoute,
  type PreparedMap,
  period,
  routePath,
} from '../../../src/modules/mapa/ui/mapModel';
import { type LugarParaTextos, textosDelLugar } from './textos';

export interface Pagina {
  /** Canonical path in the app: `/mapa`, `/mapa/departamento/05`, `/mapa/05001`. */
  ruta: string;
  route: MapRoute;
}

/**
 * One page per place: Colombia, each department but Bogotá, D.C. (its link opens 11001, as in the
 * app) and each municipality of the cut.
 */
export function paginasDelSitio(map: PreparedMap): Pagina[] {
  const routes: MapRoute[] = [
    { view: 'country' },
    ...map.data.departments.departamentos
      .map((d) => departmentRoute(d.codigo))
      .filter((r) => r.view === 'department'),
    ...map.data.municipalities.municipios.map(
      (m): MapRoute => ({ view: 'municipality', code: m.codigo }),
    ),
  ];
  return routes.map((route) => ({ ruta: routePath(route), route }));
}

/** The site's URL without a trailing slash; rejects anything that is not an absolute http(s) URL. */
export function urlDelSitio(valor: string | undefined): string {
  if (!valor) throw new Error('Falta la URL del sitio (EKOU_SITIO_URL o --sitio).');
  const url = new URL(valor);
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new Error(`La URL del sitio debe ser http(s): ${valor}`);
  return url.href.replace(/\/+$/, '');
}

const LICENCIAS: Record<string, string> = {
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
};

/** What a place's page says in its head: title, description, canonical and the JSON-LD `Dataset`. */
export interface Metadatos {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Record<string, unknown>;
}

/** The Archipelago's short name, as the map labels it; the official one stays in the JSON-LD. */
const nombreCorto = (codigo: string, nombre: string) =>
  codigo === ARCHIPELAGO ? 'San Andrés y Providencia' : nombre;

/** The place as the copy function sees it, from the same figures the sheet shows. */
function lugarParaTextos(map: PreparedMap, route: MapRoute): LugarParaTextos {
  if (route.view === 'municipality') {
    const m = map.municipalities.get(route.code);
    if (!m) throw new Error(`Municipio fuera del corte: ${route.code}`);
    return {
      tipo: 'municipio',
      nombre: m.nombre,
      ...(m.codigo === BOGOTA
        ? {}
        : { departamento: nombreCorto(m.departamento.codigo, m.departamento.nombre) }),
      contratos: m.contratosUbicados,
    };
  }
  if (route.view === 'department') {
    const d = map.departments.get(route.code);
    if (!d) throw new Error(`Departamento fuera del corte: ${route.code}`);
    return {
      tipo: 'departamento',
      nombre: nombreCorto(d.codigo, d.nombre),
      enMunicipios: d.contratosEnMunicipios,
      soloDepartamento: d.contratosSoloDepartamento,
    };
  }
  return { tipo: 'pais', contratos: map.data.departments.nacional.contratos };
}

/** Name of the place for the dataset: «Medellín, Antioquia, Colombia». */
function nombreCompleto(map: PreparedMap, route: MapRoute): string {
  if (route.view === 'municipality') {
    const m = map.municipalities.get(route.code);
    if (m?.codigo === BOGOTA) return `${m.nombre}, Colombia`;
    return `${m?.nombre}, ${m?.departamento.nombre}, Colombia`;
  }
  if (route.view === 'department') return `${map.departments.get(route.code)?.nombre}, Colombia`;
  return 'Colombia';
}

/** `<title>` and `description` of a place of the cut (`textosDelLugar`). */
function textos(map: PreparedMap, route: MapRoute) {
  const { cut, departments } = map.data;
  return textosDelLugar(
    lugarParaTextos(map, route),
    period(cut, departments.ventana.desde).sentence,
  );
}

/**
 * The page's `<title>`, which the app also puts on the tab, so it never changes on mount. A place out
 * of the cut (a broken link) has none.
 */
export function tituloDelLugar(map: PreparedMap, route: MapRoute): string | undefined {
  try {
    return textos(map, route).title;
  } catch {
    return undefined;
  }
}

export function metadatos(map: PreparedMap, route: MapRoute, sitio: string): Metadatos {
  const { cut, departments } = map.data;
  const desde = departments.ventana.desde;
  const { title, description } = textos(map, route);
  const canonical = `${sitio}${routePath(route)}`;
  const lugar = nombreCompleto(map, route);
  return {
    title,
    description,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Contratos públicos ubicados en ${lugar}`,
      description,
      url: canonical,
      inLanguage: 'es-CO',
      dateModified: cut.fechaCorte,
      temporalCoverage: `${desde}-01-01/${cut.fechaCorte}`,
      spatialCoverage: { '@type': 'Place', name: lugar },
      isAccessibleForFree: true,
      isBasedOn: cut.fuentes.map((f) => ({
        '@type': 'Dataset',
        name: f.nombre,
        url: f.url,
        license: LICENCIAS[f.licencia] ?? f.licencia,
        creator: { '@type': 'Organization', name: f.entidad },
      })),
      creditText: `${cut.fuentes.map((f) => `${f.nombre} (${f.entidad}, ${f.licencia})`).join('; ')}. Datos al ${cut.fechaCorte}.`,
    },
  };
}

const escaparXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** `sitemap.xml` with every page and the cut date as `lastmod`. */
export function sitemap(paginas: Pagina[], sitio: string, lastmod: string): string {
  const urls = paginas
    .map(
      (p) =>
        `<url><loc>${escaparXml(`${sitio}${p.ruta}`)}</loc><lastmod>${lastmod}</lastmod></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** JSON for a `<script type="application/ld+json">`: `<` escaped so no text can close the tag. */
export const jsonEnHtml = (valor: unknown) => JSON.stringify(valor).replace(/</g, '\\u003c');
