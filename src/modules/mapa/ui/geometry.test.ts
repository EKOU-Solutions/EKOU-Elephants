import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  shapesOf,
  PROVIDENCIA,
  archipelagoPanel,
  projection,
  SAN_ANDRES,
  type TopoJson,
  unionBox,
} from './geometry';

// Muestra real del contrato (corte 2026-11), versionada con el diseño del mapa.
const topo = JSON.parse(
  readFileSync('docs/design/pages/map/sample/mgn-2025.topojson', 'utf8'),
) as TopoJson;

// TopoJSON mínimo: un cuadrado de dos arcos, uno de ellos recorrido al revés.
const cuadrado: TopoJson = {
  type: 'Topology',
  transform: { scale: [1, 1], translate: [-75, 5] },
  arcs: [
    [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
    ],
  ],
  objects: {
    municipios: {
      type: 'GeometryCollection',
      geometries: [{ type: 'Polygon', arcs: [[0, ~1]], properties: { codigo: '05001' } }],
    },
  },
};

describe('geometría del mapa', () => {
  it('decodifica arcos delta, invierte los negativos y cierra el trazo', () => {
    const forma = shapesOf(cuadrado, 'municipios', (lon, lat) => [lon, lat]).get('05001');
    expect(forma?.d).toBe('M-75 5L-74 5L-74 6L-75 6L-75 5Z');
    expect(forma?.box).toEqual([-75, 5, -74, 6]);
  });

  it('proyecta con norte arriba y corrige la longitud por la latitud de referencia', () => {
    const [x0, y0] = projection()(-82, 14);
    const [x1, y1] = projection()(-81, 13);
    expect([x0, y0]).toEqual([0, 0]);
    expect(y1).toBe(70);
    expect(x1).toBeCloseTo(70 * Math.cos((4.5 * Math.PI) / 180), 6);
  });

  it('falla con un mensaje claro si el objeto no existe', () => {
    expect(() => shapesOf(cuadrado, 'departamentos')).toThrow('departamentos');
  });

  it('produce las 1.122 formas municipales y los 33 departamentos de la muestra', () => {
    expect(shapesOf(topo, 'municipios').size).toBe(1122);
    expect(shapesOf(topo, 'departamentos').size).toBe(33);
  });

  it('pone las dos islas del archipiélago juntas y a la misma escala', () => {
    const { shapes, box } = archipelagoPanel(topo);
    const [san, providencia] = shapes;
    expect(san?.code).toBe(SAN_ANDRES);
    expect(providencia?.code).toBe(PROVIDENCIA);
    if (!san || !providencia) return;
    // Sin solaparse y con poco mar entre ellas (a escala real hay unos 90 km = 56 unidades).
    const separacion = providencia.box[0] - san.box[2];
    expect(separacion).toBeGreaterThan(0);
    expect(separacion).toBeLessThan(5);
    // Misma escala: el tamaño de Providencia no cambia al acercarla.
    const sola = shapesOf(topo, 'municipios', projection(12.9), (c) => c === PROVIDENCIA).get(
      PROVIDENCIA,
    );
    const ancho = (c: readonly number[]) => (c[2] ?? 0) - (c[0] ?? 0);
    expect(ancho(providencia.box)).toBeCloseTo(ancho(sola?.box ?? []), 1);
    expect(box).toEqual(unionBox([san.box, providencia.box]));
  });
});
