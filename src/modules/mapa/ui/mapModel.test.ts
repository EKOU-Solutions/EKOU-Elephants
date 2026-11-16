import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TopoJson } from './geometry';
import {
  departmentRoute,
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
