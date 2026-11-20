import { describe, expect, it } from 'vitest';
import { sampleMap } from '../../../src/modules/mapa/ui/sample';
import { jsonInHtml, metadata, sitePages, sitemap, placeTitle, siteUrl } from './site';
import { placeCopy } from './copy';

// The real sample of the map contract (cut 2026-11, data to 7 Nov 2026).
const SITIO = 'https://ejemplo.co';
const paginas = sitePages(sampleMap);
const todos = paginas.map((p) => metadata(sampleMap, p.route, SITIO));
const CIERRE = 'Fuentes: SECOP II y SECOP I, DANE. Este mapa todavía no mide riesgo.';
const meta = (ruta: string) => {
  const pagina = paginas.find((p) => p.path === ruta);
  if (!pagina) throw new Error(`sin página ${ruta}`);
  return metadata(sampleMap, pagina.route, SITIO);
};

describe('sitePages', () => {
  it('one page per place: Colombia, 32 departments and 1.122 municipalities', () => {
    expect(paginas).toHaveLength(1155);
    expect(new Set(paginas.map((p) => p.path)).size).toBe(1155);
    expect(paginas[0]?.path).toBe('/mapa');
    expect(paginas.filter((p) => p.route.view === 'department')).toHaveLength(32);
    expect(paginas.filter((p) => p.route.view === 'municipality')).toHaveLength(1122);
  });

  it('Bogotá, D.C. has no department page: its link is 11001, as in the app', () => {
    const rutas = paginas.map((p) => p.path);
    expect(rutas).not.toContain('/mapa/departamento/11');
    expect(rutas).toContain('/mapa/11001');
    expect(rutas).toContain('/mapa/departamento/05');
  });
});

describe('metadata', () => {
  it('a municipality: name, department, figure, period and sources', () => {
    const m = meta('/mapa/05001');
    expect(m.title).toBe('Medellín, Antioquia: contratos públicos · EKOU Elephants');
    expect(m.description).toBe(
      `356.935 contratos públicos firmados del 1 ene 2021 al 7 nov 2026 y ubicados en Medellín (Antioquia). ${CIERRE}`,
    );
    expect(m.canonical).toBe('https://ejemplo.co/mapa/05001');
  });

  it('a department: its two figures', () => {
    const m = meta('/mapa/departamento/05');
    expect(m.title).toBe('Antioquia: contratos públicos por municipio · EKOU Elephants');
    expect(m.description).toBe(
      `819.086 contratos públicos en los municipios de Antioquia y 8.565 sin municipio identificado, del 1 ene 2021 al 7 nov 2026. ${CIERRE}`,
    );
    expect(m.canonical).toBe('https://ejemplo.co/mapa/departamento/05');
  });

  it('Bogotá, D.C. is named once', () => {
    const m = meta('/mapa/11001');
    expect(m.title).toBe('Bogotá, D.C.: contratos públicos · EKOU Elephants');
    // Its name already ends the sentence: no second period.
    expect(m.description).toMatch(/ y ubicados en Bogotá, D\.C\. Fuentes: SECOP II y SECOP I/);
    expect(m.canonical).toBe('https://ejemplo.co/mapa/11001');
  });

  it('«Sin datos»: says no contract was located, never 0', () => {
    const m = meta('/mapa/94884');
    expect(m.title).toMatch(/, Guainía: contratos públicos · EKOU Elephants$/);
    expect(m.description).toMatch(
      /^Sin datos: no encontramos contratos públicos ubicados con certeza en .+ \(Guainía\) del 1 ene 2021 al 7 nov 2026\. Fuentes: /,
    );
    const sinDatos = todos.filter((t) => t.description.startsWith('Sin datos'));
    expect(sinDatos.length).toBeGreaterThan(0);
    for (const { description } of sinDatos) expect(description).not.toMatch(/\b0\b/);
  });

  it('the Archipelago goes by its short name; the official one only in the JSON-LD', () => {
    const d = meta('/mapa/departamento/88');
    expect(d.title).toBe(
      'San Andrés y Providencia: contratos públicos por municipio · EKOU Elephants',
    );
    expect(d.description).toContain(' en los municipios de San Andrés y Providencia ');
    expect(d.jsonLd.name).toMatch(/Archipiélago/);
    const m = meta('/mapa/88001');
    expect(m.title).toBe(
      'San Andrés, San Andrés y Providencia: contratos públicos · EKOU Elephants',
    );
    expect(m.description).toContain(' y ubicados en San Andrés (San Andrés y Providencia). ');
    for (const { title, description } of todos) {
      expect(title).not.toMatch(/Archipiélago/);
      expect(description).not.toMatch(/Archipiélago/);
    }
  });

  it('the place fits in the first 41 characters of every title', () => {
    for (const { title } of todos) {
      const lugar = title.startsWith('Mapa de') ? 'Colombia' : (title.split(':')[0] ?? '');
      expect(title.slice(0, 41), title).toContain(lugar);
    }
  });

  it('Colombia: the national total', () => {
    const m = meta('/mapa');
    expect(m.title).toBe('Mapa de contratación pública de Colombia · EKOU Elephants');
    expect(m.description).toBe(
      `7.456.749 contratos públicos firmados en Colombia del 1 ene 2021 al 7 nov 2026, por departamento y municipio. ${CIERRE}`,
    );
    expect(m.canonical).toBe('https://ejemplo.co/mapa');
  });

  it('every title and description is unique (namesakes carry their department)', () => {
    expect(new Set(todos.map((m) => m.title)).size).toBe(1155);
    expect(new Set(todos.map((m) => m.description)).size).toBe(1155);
  });

  it('JSON-LD Dataset: the place, the cut date and each source with its license', () => {
    const { jsonLd } = meta('/mapa/05001');
    expect(jsonLd).toMatchObject({
      '@type': 'Dataset',
      name: 'Contratos públicos ubicados en Medellín, Antioquia, Colombia',
      url: 'https://ejemplo.co/mapa/05001',
      dateModified: '2026-11-07',
      temporalCoverage: '2021-01-01/2026-11-07',
    });
    const fuentes = jsonLd.isBasedOn as { name: string; license: string }[];
    expect(fuentes.map((f) => f.name)).toEqual([
      'SECOP II – Contratos',
      'SECOP I – Procesos de compra',
      'DIVIPOLA – Municipios',
      'Marco Geoestadístico Nacional 2025',
    ]);
    expect(fuentes[0]?.license).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(fuentes[3]?.license).toBe('https://creativecommons.org/licenses/by/4.0/');
  });

  it('JSON-LD never closes its script tag', () => {
    expect(jsonInHtml({ a: '</script><b>' })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});

describe('placeCopy', () => {
  it('one contract is singular', () => {
    expect(
      placeCopy(
        { tipo: 'municipio', nombre: 'X', departamento: 'Y', contratos: 1 },
        'del 1 ene 2021 al 7 nov 2026',
      ).description,
    ).toBe(`1 contrato público firmado del 1 ene 2021 al 7 nov 2026 y ubicado en X (Y). ${CIERRE}`);
  });

  it('0 measured is written 0, not «Sin datos»', () => {
    expect(
      placeCopy(
        { tipo: 'municipio', nombre: 'X', departamento: 'Y', contratos: 0 },
        'del 1 ene 2021 al 7 nov 2026',
      ).description,
    ).toMatch(/^0 contratos públicos firmados /);
  });

  it('a department missing one of its figures is «Sin datos»', () => {
    expect(
      placeCopy(
        { tipo: 'departamento', nombre: 'Y', enMunicipios: 3, soloDepartamento: null },
        'del 1 ene 2021 al 7 nov 2026',
      ).description,
    ).toBe(
      `Sin datos: no encontramos contratos públicos ubicados con certeza en los municipios de Y del 1 ene 2021 al 7 nov 2026. ${CIERRE}`,
    );
  });
});

describe('sitemap', () => {
  it('the 1.155 pages with the cut date as lastmod', () => {
    const xml = sitemap(paginas, SITIO, '2026-11-07');
    expect(xml.match(/<url>/g)).toHaveLength(1155);
    expect(xml.match(/<lastmod>2026-11-07<\/lastmod>/g)).toHaveLength(1155);
    expect(xml).toContain('<loc>https://ejemplo.co/mapa/05001</loc>');
    expect(xml).not.toContain('/mapa/departamento/11<');
  });
});

describe('siteUrl', () => {
  it('absolute http(s), without the trailing slash', () => {
    expect(siteUrl('https://ejemplo.co/')).toBe('https://ejemplo.co');
    expect(() => siteUrl(undefined)).toThrow('Falta la URL del sitio');
    expect(() => siteUrl('ftp://ejemplo.co')).toThrow('http(s)');
  });
});

describe('placeTitle', () => {
  it('is the page title of every place, so the app tab never changes on mount', () => {
    paginas.forEach((p, i) => {
      expect(placeTitle(sampleMap, p.route)).toBe(todos[i]?.title);
    });
  });

  it('a place out of the cut has none (the app keeps its generic title)', () => {
    expect(placeTitle(sampleMap, { view: 'municipality', code: '99999' })).toBeUndefined();
  });
});
