// Map geometry: decodes the contract's TopoJSON (/geometria/<version>.topojson) into projected SVG
// paths. Same logic as the approved mockup (docs/design/pages/map/build.py): equirectangular with
// the cosine of 4.5° (Colombia's mean latitude); one projected unit is about 1.6 km.

export type Box = readonly [x0: number, y0: number, x1: number, y1: number];
export type Projection = (lon: number, lat: number) => readonly [number, number];

interface TopoGeometry {
  type: string;
  arcs?: number[][] | number[][][];
  properties: { codigo: string };
}

export interface TopoJson {
  type: 'Topology';
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<string, { type: 'GeometryCollection'; geometries: TopoGeometry[] }>;
}

export interface Shape {
  code: string;
  /** SVG path in projected units. */
  d: string;
  box: Box;
}

const LON0 = -82;
const LAT1 = 14;
const SCALE = 70;

/** Equirectangular projection corrected by the cosine of the reference latitude. */
export function projection(referenceLatitude = 4.5): Projection {
  const k = Math.cos((referenceLatitude * Math.PI) / 180);
  return (lon, lat) => [(lon - LON0) * k * SCALE, (LAT1 - lat) * SCALE];
}

// The map projects the same topology several times (departments, municipalities, archipelago):
// its arcs are decoded once.
const decoded = new WeakMap<TopoJson, [number, number][][]>();
function decodeArcs(topo: TopoJson): [number, number][][] {
  const cached = decoded.get(topo);
  if (cached) return cached;
  const arcs = decodeArcsOnce(topo);
  decoded.set(topo, arcs);
  return arcs;
}

function decodeArcsOnce(topo: TopoJson): [number, number][][] {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty] as [number, number];
    });
  });
}

function ring(arcs: [number, number][][], indices: number[]): [number, number][] {
  const points: [number, number][] = [];
  for (const i of indices) {
    const original = i >= 0 ? arcs[i] : arcs[~i];
    if (!original) throw new Error(`Arc ${i} missing from the geometry`);
    const arc = i >= 0 ? original : [...original].reverse();
    points.push(...(points.length ? arc.slice(1) : arc));
  }
  return points;
}

function polygons(g: TopoGeometry): number[][][] {
  if (g.type === 'Polygon') return [g.arcs as number[][]];
  if (g.type === 'MultiPolygon') return g.arcs as unknown as number[][][];
  return [];
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Shapes of a TopoJSON object (`municipios` or `departamentos`) by DANE code. `offset` moves every
 * shape (used by the archipelago panel).
 */
export function shapesOf(
  topo: TopoJson,
  object: string,
  project: Projection = projection(),
  filter: (code: string) => boolean = () => true,
  offset: readonly [number, number] = [0, 0],
): Map<string, Shape> {
  const collection = topo.objects[object];
  if (!collection) throw new Error(`The TopoJSON has no «${object}» object`);
  const arcs = decodeArcs(topo);
  const shapes = new Map<string, Shape>();
  for (const g of collection.geometries) {
    const { codigo: code } = g.properties;
    if (!filter(code)) continue;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    const parts: string[] = [];
    for (const polygon of polygons(g)) {
      for (const indices of polygon) {
        const points: string[] = [];
        let previous = '';
        for (const [lon, lat] of ring(arcs, indices)) {
          const [px, py] = project(lon, lat);
          const x = px + offset[0];
          const y = py + offset[1];
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
          const point = `${r2(x)} ${r2(y)}`;
          if (point !== previous) points.push(point);
          previous = point;
        }
        if (points.length >= 3) parts.push(`M${points.join('L')}Z`);
      }
    }
    shapes.set(code, { code, d: parts.join(''), box: [r2(x0), r2(y0), r2(x1), r2(y1)] });
  }
  return shapes;
}

/** Box that contains every given box. */
export function unionBox(boxes: Iterable<Box>): Box {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    x0 = Math.min(x0, b[0]);
    y0 = Math.min(y0, b[1]);
    x1 = Math.max(x1, b[2]);
    y1 = Math.max(y1, b[3]);
  }
  return [x0, y0, x1, y1];
}

export const SAN_ANDRES = '88001';
export const PROVIDENCIA = '88564';

/**
 * Archipelago (map spec, decision 12): both islands in one panel at the same scale. They are about
 * 90 km apart, so only the sea between them is removed: Providencia sits to the upper right of San
 * Andrés, shapes and scale untouched, projected with the cosine of 12.9° (their own latitude) so
 * neither is stretched. The page must say the distance is reduced.
 */
export function archipelagoPanel(topo: TopoJson): { shapes: Shape[]; box: Box } {
  const project = projection(12.9);
  const sanAndres = shapesOf(topo, 'municipios', project, (c) => c === SAN_ANDRES).get(SAN_ANDRES);
  const raw = shapesOf(topo, 'municipios', project, (c) => c === PROVIDENCIA).get(PROVIDENCIA);
  if (!sanAndres || !raw) throw new Error('San Andrés or Providencia missing from the geometry');
  const gap = 2.5; // projected units, about 4 km of sea between the two shapes
  const offset = [sanAndres.box[2] + gap - raw.box[0], sanAndres.box[1] - raw.box[1]] as const;
  const providencia = shapesOf(topo, 'municipios', project, (c) => c === PROVIDENCIA, offset).get(
    PROVIDENCIA,
  );
  if (!providencia) throw new Error('Providencia missing from the geometry');
  return { shapes: [sanAndres, providencia], box: unionBox([sanAndres.box, providencia.box]) };
}
