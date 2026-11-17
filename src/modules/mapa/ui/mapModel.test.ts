import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TopoJson } from './geometry';
import {
  departmentRoute,
  fullscreenView,
  isKnownRoute,
  type MapData,
  mapView,
  parseRoute,
  period,
  prepareMap,
  routePath,
  searchPlaces,
  shortDate,
  sourceParts,
} from './mapModel';

// Muestra real del contrato (corte 2026-11), versionada con el diseño del mapa.
const sample = (file: string) =>
  JSON.parse(readFileSync(`docs/design/pages/map/sample/${file}`, 'utf8')) as unknown;
const data = {
  cut: sample('corte.json'),
  departments: sample('departamentos.json'),
  municipalities: sample('municipios.json'),
  topology: sample('mgn-2025.topojson') as TopoJson,
} as MapData;
const map = prepareMap(data);

describe('rutas del mapa', () => {
  it('lee las tres vistas y rechaza lo demás', () => {
    expect(parseRoute('/')).toEqual({ view: 'country' });
    expect(parseRoute('/mapa/')).toEqual({ view: 'country' });
    expect(parseRoute('/mapa/departamento/05')).toEqual({ view: 'department', code: '05' });
    expect(parseRoute('/mapa/05001')).toEqual({ view: 'municipality', code: '05001' });
    expect(parseRoute('/mapa/123')).toEqual({ view: 'invalid' });
    expect(parseRoute('/otra')).toEqual({ view: 'invalid' });
  });

  it('escribe la misma ruta que lee', () => {
    for (const p of ['/mapa', '/mapa/departamento/05', '/mapa/05001'])
      expect(routePath(parseRoute(p))).toBe(p);
  });

  it('lleva Bogotá directo al municipio 11001', () => {
    expect(departmentRoute('11')).toEqual({ view: 'municipality', code: '11001' });
  });

  it('distingue códigos que existen de los que no', () => {
    expect(isKnownRoute(map, { view: 'municipality', code: '05001' })).toBe(true);
    expect(isKnownRoute(map, { view: 'municipality', code: '99999' })).toBe(false);
    expect(isKnownRoute(map, { view: 'department', code: '11' })).toBe(false);
  });
});

describe('textos del mapa', () => {
  it('escribe el periodo igual en frases y en fuentes', () => {
    expect(shortDate('2026-11-07')).toBe('7 nov 2026');
    expect(period(data.cut, 2021)).toEqual({
      sentence: 'del 1 ene 2021 al 7 nov 2026',
      caption: '2021 – 7 nov 2026',
      cutDate: '7 nov 2026',
    });
  });

  it('enlaza cada fuente del corte en la línea de fuentes', () => {
    const parts = sourceParts(data.cut);
    expect(parts.map((p) => p.text).join('')).toBe(
      'Fuentes: SECOP II y SECOP I (Colombia Compra Eficiente, CC BY-SA 4.0), DIVIPOLA y Marco Geoestadístico 2025 (DANE, CC BY 4.0). Datos al 7 nov 2026.',
    );
    expect(parts.filter((p) => p.url)).toHaveLength(4);
  });
});

describe('búsqueda de lugares', () => {
  it('ignora tildes y pone primero los nombres que empiezan por el texto', () => {
    const found = searchPlaces(map, 'medellin');
    expect(found[0]?.name).toBe('Medellín');
  });

  it('distingue nombres repetidos por su departamento y lista Bogotá una vez', () => {
    expect(searchPlaces(map, 'granada').map((e) => e.context).length).toBeGreaterThan(1);
    expect(searchPlaces(map, 'bogota').filter((e) => e.name.startsWith('Bogotá'))).toHaveLength(1);
  });

  it('no busca con menos de 2 letras y devuelve como máximo 8', () => {
    expect(searchPlaces(map, 'm')).toEqual([]);
    expect(searchPlaces(map, 'san').length).toBe(8);
  });
});

describe('mapView with a geometry that lacks a municipality', () => {
  it('lists it without drawing it and keeps the department frame', async () => {
    const { sampleData } = await import('./sample');
    const full = mapView(prepareMap(sampleData), { view: 'department', code: '94' });
    const topology = structuredClone(sampleData.topology);
    const municipios = topology.objects.municipios;
    if (!municipios) throw new Error('sample without municipios');
    municipios.geometries = municipios.geometries.filter((g) => g.properties.codigo !== '94001');
    const view = mapView(prepareMap({ ...sampleData, topology }), {
      view: 'department',
      code: '94',
    });
    expect(view.territories.find((t) => t.code === '94001')?.d).toBe('');
    expect(view.box[0]).toBeGreaterThan(0);
    expect(view.box[2] - view.box[0]).toBeLessThanOrEqual(full.box[2] - full.box[0]);
  });
});

describe('mapView of a municipality', () => {
  it('draws only the chosen municipality, filling the frame', async () => {
    const { sampleMap } = await import('./sample');
    const department = mapView(sampleMap, { view: 'department', code: '05' });
    const medellin = mapView(sampleMap, { view: 'municipality', code: '05001' });
    const width = (b: readonly number[]) => (b[2] ?? 0) - (b[0] ?? 0);
    expect(medellin.territories.map((t) => t.code)).toEqual(['05001']);
    expect(width(medellin.box)).toBeLessThan(width(department.box) / 5);
    expect(medellin.labels).toEqual([]);
    expect(medellin.title).toContain('Mapa de Medellín, Antioquia');
  });
});

describe('fullscreenView: un solo mapa con tres niveles', () => {
  it('en Colombia dibuja los departamentos sin el archipiélago, que va en el recuadro dentro del mapa', () => {
    const view = fullscreenView(map, { view: 'country' });
    expect(view.departments).toHaveLength(32);
    expect(view.departments.some((d) => d.code === '88' || d.dimmed)).toBe(false);
    expect(view.municipalities).toEqual([]);
    expect(view.inset.placement).toBe('map');
    expect(view.focus).toEqual(view.home);
    // El encuadre del país incluye el recuadro, para que siempre se vea al llegar.
    expect(view.home[1]).toBeLessThanOrEqual(view.inset.box[1]);
    expect(view.labels.map((l) => l.text)).toEqual(['San Andrés y Providencia']);
  });

  it('en un departamento atenúa los demás y deja el recuadro en la esquina', () => {
    const view = fullscreenView(map, { view: 'department', code: '05' });
    expect(view.departments.every((d) => d.dimmed)).toBe(true);
    expect(view.departments.some((d) => d.code === '05')).toBe(false);
    expect(view.municipalities.length).toBe(125);
    expect(view.municipalities.some((m) => m.dimmed)).toBe(false);
    expect(view.outline).toBeTruthy();
    expect(view.inset.placement).toBe('corner');
    expect(view.fill).toBe(0.9);
    expect(view.labels).toEqual([]);
  });

  it('en un municipio atenúa los vecinos, lo rotula encima y lo encuadra con tope (decisión 20)', () => {
    const view = fullscreenView(map, { view: 'municipality', code: '05001' });
    const medellin = view.municipalities.find((m) => m.code === '05001');
    expect(medellin?.dimmed).toBe(false);
    expect(view.municipalities.filter((m) => m.dimmed)).toHaveLength(124);
    expect(view.selected).toBe('05001');
    expect(view.fill).toBe(0.55);
    expect(view.labels).toEqual([expect.objectContaining({ text: 'Medellín', anchor: 'above' })]);
    expect(view.title).toContain('Mapa de Medellín, Antioquia');
    // Decisión 20 ampliada: el departamento sigue a la vista.
    expect(view.context).toEqual(fullscreenView(map, { view: 'department', code: '05' }).focus);
  });

  it('la leyenda «Sin datos» solo cuenta lo que está en foco, no los vecinos atenuados', () => {
    const inirida = fullscreenView(map, { view: 'municipality', code: '94001' });
    expect(inirida.municipalities.some((m) => m.dimmed && m.fill === 'unknown')).toBe(true);
    expect(inirida.withUnknown).toBe(false);
  });

  it('en el archipiélago dibuja las islas en el recuadro, con su nombre debajo', () => {
    const view = fullscreenView(map, { view: 'department', code: '88' });
    expect(view.inset.placement).toBe('outline');
    expect(view.outline).toBeUndefined();
    // El marco punteado es el contorno del departamento y deja sitio bajo las islas para sus nombres.
    expect(view.focus).toEqual(view.inset.box);
    expect(view.inset.box[3]).toBeGreaterThan(Math.max(...view.inset.islands.map((i) => i.box[3])));
    expect(view.labels.every((l) => l.within?.[0] === view.inset.box[0])).toBe(true);
    expect(view.municipalities.every((m) => m.transform?.includes('scale('))).toBe(true);
    expect(view.labels.map((l) => [l.text, l.anchor])).toEqual([
      ['San Andrés', 'below'],
      ['Providencia', 'below'],
    ]);
  });

  it('marca «Sin datos» con la trama, nunca como cero', () => {
    const view = fullscreenView(map, { view: 'department', code: '94' });
    expect(view.withUnknown).toBe(true);
    const nulo = view.municipalities.find((m) => m.code === '94884');
    expect(nulo?.fill).toBe('unknown');
    expect(nulo?.description).toBe('Puerto Colombia: Sin datos');
  });

  it('rotula Bogotá en Cundinamarca', () => {
    const view = fullscreenView(map, { view: 'department', code: '25' });
    expect(view.labels).toEqual([
      expect.objectContaining({ text: 'Bogotá, D.C.', anchor: 'centre' }),
    ]);
  });
});
