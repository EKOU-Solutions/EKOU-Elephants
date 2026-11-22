import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { type MapRoute, parseRoute } from '../mapModel';
import { anioCerradoParcial, sanBenito } from '../ResumenMunicipal/muestra';
import { sampleMap } from '../sample';
import type { ResumenState } from '../useResumen';
import { readFileSync } from 'node:fs';
import { PANEL_WIDTH } from '../MapWithLegend/camera';
import { MapPage, type MapPageProps, type MapPageState } from './MapPage';

/** The page as HTML, with the real sample (cut 2026-11) unless another state is given. */
function page(
  route: MapRoute,
  state: MapPageState = { status: 'ready', map: sampleMap },
  props: Partial<MapPageProps> = {},
) {
  return renderToStaticMarkup(
    <MapPage state={state} route={route} onNavigate={() => {}} onRetry={() => {}} {...props} />,
  );
}
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const h1 = (html: string) => /<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1];
const kicker = (html: string) => /<p class="[^"]*kicker[^"]*">(.*?)<\/p>/.exec(html)?.[1];
/** Visible labels of the crumbs, in order. */
const crumbs = (html: string) =>
  [
    ...(/<nav [^>]*aria-label="Volver"[^>]*>(.*?)<\/nav>/.exec(html)?.[1] ?? '').matchAll(
      /<button[^>]*>(.*?)<\/button>/g,
    ),
  ].map((m) => text(m[1] ?? '').trim());
/** Row names of the table, in order. */
const rowNames = (html: string) =>
  [...html.matchAll(/<th scope="row"[^>]*>.*?<a [^>]*>(.*?)<\/a>/g)].map((m) => m[1]);

describe('MapPage states', () => {
  it('loading: says it is loading in a status region, with no data yet', () => {
    const html = page({ view: 'country' }, { status: 'loading' });
    expect(html).toContain('<p role="status">Cargando el mapa…</p>');
    expect(html).not.toContain('<table');
    expect(html).not.toContain('<svg');
  });

  it('error: the cut is unavailable, with a way to retry and no figures', () => {
    const html = page({ view: 'country' }, { status: 'unavailable' });
    expect(text(html)).toContain('Los datos del mapa no están disponibles');
    expect(text(html)).toContain('Reintentar');
    expect(html).not.toContain('<table');
  });

  it('invalid link: says so over the map of Colombia, with a way back', () => {
    for (const html of [page({ view: 'municipality', code: '99999' }), page(parseRoute('/hola'))]) {
      expect(h1(html)).toBe('No encontramos ese lugar');
      expect(text(html)).toContain('Ese enlace no corresponde a un municipio de Colombia.');
      expect(text(html)).toContain('Ver el mapa de Colombia');
      expect(text(html)).toContain('Mapa de Colombia por departamento');
    }
  });

  it('«Sin datos»: a municipality without located contracts never shows 0', () => {
    const html = text(page({ view: 'municipality', code: '94884' }));
    expect(html).toContain('Sin datos');
    expect(html).toContain('No encontramos contratos ubicados con certeza');
    expect(html).not.toMatch(/\b0 contratos/);
  });

  it('a department with nulls says what the hatch means', () => {
    expect(text(page({ view: 'department', code: '94' }))).toContain(
      'Sin datos: no hay contratos ubicados con certeza',
    );
    expect(text(page({ view: 'department', code: '05' }))).not.toContain('Sin datos:');
  });

  it('search: up to 8 places with their department, or what to do when nothing matches', () => {
    const found = page({ view: 'country' }, undefined, { defaultQuery: 'granada' });
    expect(text(found)).toMatch(/\d resultados/);
    expect(text(found)).toContain('Granada , Antioquia');
    const none = page({ view: 'country' }, undefined, { defaultQuery: 'medelin' });
    expect(text(none)).toContain('No encontramos «medelin»');
  });
});

describe('MapPage places', () => {
  it('Colombia: the national total, the window, the source and the way to the table', () => {
    const html = page({ view: 'country' });
    expect(kicker(html)).toBe('Mapa de contratación pública');
    expect(h1(html)).toBe('7.456.749 contratos públicos firmados en Colombia');
    expect(text(html)).toContain(
      'Del 1 ene 2021 al 7 nov 2026. Elige un departamento. Este mapa todavía no mide riesgo.',
    );
    expect(text(html)).toContain('Fuentes: SECOP II y SECOP I, DANE. Datos al 7 nov 2026.');
    expect(text(html)).toContain('Ver cifras, tabla y fuentes');
    expect(crumbs(html)).toEqual([]);
  });

  it('department: «DANE 05», its two figures and «← Colombia»', () => {
    const html = page({ view: 'department', code: '05' });
    expect(kicker(html)).toBe('DANE 05');
    expect(h1(html)).toBe('Antioquia');
    expect(text(html)).toContain('sin municipio identificado');
    expect(text(html)).toContain('Ver tabla y fuentes');
    expect(crumbs(html)).toEqual(['Colombia']);
  });

  it('municipality: name, department and DANE code, its figure and the way back', () => {
    const html = page({ view: 'municipality', code: '05001' });
    expect(kicker(html)).toBe('Antioquia · DANE 05001');
    expect(h1(html)).toBe('Medellín');
    expect(text(html)).toContain('356.935');
    expect(text(html)).toContain('Copiar enlace');
    expect(text(html)).toContain('Ver Antioquia y tabla');
    expect(crumbs(html)).toEqual(['Colombia', 'Antioquia']);
    expect(html).toMatch(/<tr[^>]*aria-current="true"[^>]*><th scope="row"[^>]*><a [^>]*>Medellín/);
  });

  it('Bogotá: the department link opens 11001, with one crumb, one figure and no table', () => {
    const html = page(parseRoute('/mapa/departamento/11'));
    expect(h1(html)).toBe('Bogotá, D.C.');
    expect(crumbs(html)).toEqual(['Colombia']);
    expect(text(html)).toContain('registrados solo como Bogotá, D.C. (departamento)');
    expect(text(html)).toContain('Ver más cifras y fuentes');
    expect(text(html)).not.toContain('en los municipios de');
    expect(html).not.toContain('<table');
  });

  it('archipelago: the note on the shortened sea, and its name with an article', () => {
    const html = text(page({ view: 'department', code: '88' }));
    expect(html).toContain('En el mapa se acorta la distancia entre San Andrés y Providencia');
    expect(html).toContain('en los municipios del Archipiélago de San Andrés');
    expect(html).toContain('Contratos por municipio del Archipiélago de San Andrés');
  });

  it('a department missing from the cut shows «Sin datos», never 0', () => {
    const departamentos = sampleMap.data.departments.departamentos.filter((d) => d.codigo !== '05');
    const map = { ...sampleMap, departments: new Map(departamentos.map((d) => [d.codigo, d])) };
    const html = text(page({ view: 'municipality', code: '05001' }, { status: 'ready', map }));
    expect(html).toContain('Sin datos: no hay contratos ubicados con certeza');
    expect(html).not.toContain('en los municipios de');
  });

  it('tables say their order, source and date', () => {
    expect(text(page({ view: 'country' }))).toContain(
      'En orden alfabético. Fuentes: SECOP II y SECOP I, DANE. Datos al 7 nov 2026.',
    );
  });

  it('tables go in Spanish alphabetical order, not DANE code order', () => {
    const departments = rowNames(page({ view: 'country' }));
    expect(departments[0]).toBe('Amazonas');
    expect(departments).toEqual(
      [...departments].sort((a = '', b = '') => a.localeCompare(b, 'es')),
    );
    const municipalities = rowNames(page({ view: 'department', code: '05' }));
    expect(municipalities[0]).toBe('Abejorral');
    expect(municipalities).toHaveLength(125);
  });

  it('the full sheet says «Volver al mapa» instead of opening the table', () => {
    const html = page({ view: 'municipality', code: '05001' }, undefined, {
      defaultDetent: 'full',
    });
    expect(text(html)).toContain('Volver al mapa');
    expect(text(html)).not.toContain('Ver Antioquia y tabla');
  });
});

describe('MapPage layout', () => {
  it('the search has a hidden label, a magnifier and the short placeholder', () => {
    const html = page({ view: 'country' });
    expect(html).toContain('placeholder="Busca municipio o departamento"');
    expect(text(html)).toContain('Busca tu municipio o departamento');
  });

  it('takes the desktop panel width from camera.ts, never a number of its own', () => {
    expect(page({ view: 'country' })).toContain(`--map-panel-width:${PANEL_WIDTH}px`);
    const css = readFileSync('src/modules/mapa/ui/MapPage/MapPage.module.css', 'utf8');
    expect(css).not.toContain(`${PANEL_WIDTH}px`);
  });
});

describe('MapPage in a generated page (prerendered, ADR 0003)', () => {
  const medellin: MapRoute = { view: 'municipality', code: '05001' };

  it('draws the department and the place with CSS framing, the name over it, no camera map', () => {
    const html = page(medellin, undefined, { prerendered: true });
    expect(html).toMatch(/class="[^"]*staticScreen/);
    expect(html).toMatch(/<path class="[^"]*staticRegion[^"]*" d="M/);
    expect(html).toMatch(/<path d="M[^"]*" data-selected="true"/);
    expect(html).toMatch(/<span class="[^"]*placeLabel[^"]*staticLabel[^"]*" style="[^"]*--lx/);
    // The free area of camera.ts, with the corner column and the room for the name.
    expect(html).toContain('--top-phone:148;--left-phone:88');
    expect(html).not.toMatch(/class="[^"]*screenMap/);
  });

  it('the sheet stands at half height with CSS alone; decision 32 comes as the map minimum', () => {
    const html = page(medellin, undefined, { prerendered: true });
    expect(html).toMatch(/class="[^"]*page[^"]*prerendered[^"]*"/);
    // 116 + 160 + 12, plus the 32 px a chosen municipality keeps above it for its name.
    expect(html).toContain('--static-map-min:320px');
    const department = page({ view: 'department', code: '05' }, undefined, { prerendered: true });
    expect(department).toContain('--static-map-min:288px');
    expect(html).toMatch(/<div class="[^"]*layer[^"]*static[^"]*">/);
    expect(html).not.toContain('translateY');
  });

  it('the body is never inert without JavaScript: the links of the panel work (CSS hides it on a phone)', () => {
    expect(page(medellin, undefined, { prerendered: true })).not.toContain('inert');
    expect(page(medellin)).toMatch(/<div class="[^"]*body[^"]*" inert="">/);
  });

  it('the app never renders it: the camera map and the measured sheet', () => {
    const html = page(medellin);
    expect(html).not.toContain('staticScreen');
    expect(html).not.toContain('--static-map-min');
    expect(html).toContain('translateY');
  });
});

describe('MapPage summary of spending', () => {
  const medellin: MapRoute = { view: 'municipality', code: '05001' };
  const withResumen = (route: MapRoute, resumen: ResumenState, anio?: string) =>
    text(page(route, undefined, { resumen, anio, defaultDetent: 'full' }));
  const ready: ResumenState = { status: 'ready', datos: sanBenito };

  it('the key figure says «la alcaldía» and the year; a department says «la gobernación»', () => {
    expect(withResumen(medellin, ready)).toContain('En 2025 la alcaldía recibió $70.684 millones');
    expect(withResumen({ view: 'department', code: '05' }, ready)).toContain(
      'En 2025 la gobernación recibió $70.684 millones',
    );
    expect(withResumen(medellin, ready)).toContain('Gasto público de San Benito Abad');
  });

  it('without «recibido» it says «Sin información», never $0', () => {
    const gasto = sanBenito.gastoPublico as NonNullable<typeof sanBenito.gastoPublico>;
    const datos = { ...sanBenito, gastoPublico: { ...gasto, recibido: null } };
    const html = withResumen(medellin, { status: 'ready', datos });
    expect(html).toContain('la alcaldía recibió Sin información');
    expect(html).not.toContain('recibió $0');
  });

  it('a year that does not exist: warns in one line and shows the real one', () => {
    const invalid: ResumenState = { status: 'ready', datos: sanBenito, anioInvalido: '1999' };
    expect(withResumen(medellin, invalid, '1999')).toContain(
      'El enlace pedía 1999, que no existe; mostramos 2025.',
    );
    expect(withResumen(medellin, ready)).not.toContain('El enlace pedía');
  });

  it('a closed year with partial data says until when, without «Año en curso»', () => {
    const html = withResumen(medellin, { status: 'ready', datos: anioCerradoParcial });
    expect(html).toContain('Cifras acumuladas hasta sep 2024');
    expect(html).not.toContain('Año en curso');
  });

  it('loading says the year; the error offers to try again; the country has no summary', () => {
    expect(withResumen(medellin, { status: 'loading' }, '2024')).toContain(
      'Cargando el resumen de 2024',
    );
    const error = withResumen(medellin, { status: 'error' });
    expect(error).toContain('No pudimos cargar el resumen');
    expect(error).toContain('Intentar de nuevo');
    expect(withResumen({ view: 'country' }, { status: 'idle' })).not.toContain('Gasto público');
  });

  it('a generated page (no summary given) shows none', () => {
    expect(text(page(medellin))).not.toContain('recibió');
  });
});
