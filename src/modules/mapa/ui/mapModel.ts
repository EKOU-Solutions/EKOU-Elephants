// View model of the map page (spec: docs/design/pages/map/spec.md). Pure: routes, copy helpers and the
// projected shapes, so the page and its stories render the same thing from the contract's data.
import { formatNumber } from '../../../components/ui/format';
import type {
  CorteVigente,
  DepartamentoDelMapa,
  DepartamentosDelCorte,
  MunicipioDelMapa,
  MunicipiosDelCorte,
} from '../domain/mapa';
import {
  archipelagoPanel,
  type Box,
  type Shape,
  shapesOf,
  type TopoJson,
  unionBox,
} from './geometry';

/** Everything the page needs, exactly as the API and the geometry file return it. */
export interface MapData {
  cut: CorteVigente;
  departments: DepartamentosDelCorte;
  municipalities: MunicipiosDelCorte;
  topology: TopoJson;
}

export type MapRoute =
  | { view: 'country' }
  | { view: 'department'; code: string }
  | { view: 'municipality'; code: string }
  | { view: 'invalid' };

export const BOGOTA = '11001';
export const ARCHIPELAGO = '88';

/** `/mapa`, `/mapa/departamento/05`, `/mapa/05001`. «/» is the map too (it is the only page). */
export function parseRoute(path: string): MapRoute {
  const p = path.replace(/\/+$/, '');
  if (p === '' || p === '/mapa') return { view: 'country' };
  const department = /^\/mapa\/departamento\/(\d{2})$/.exec(p);
  // Bogotá, D.C. is a department with one municipality: its department link opens 11001.
  if (department?.[1]) return departmentRoute(department[1]);
  const municipality = /^\/mapa\/(\d{5})$/.exec(p);
  if (municipality?.[1]) return { view: 'municipality', code: municipality[1] };
  return { view: 'invalid' };
}

export function routePath(route: MapRoute): string {
  if (route.view === 'department') return `/mapa/departamento/${route.code}`;
  if (route.view === 'municipality') return `/mapa/${route.code}`;
  return '/mapa';
}

/** Bogotá, D.C. is a department of one municipality: it goes straight to 11001 (spec, decision 4). */
export const departmentRoute = (code: string): MapRoute =>
  code === '11' ? { view: 'municipality', code: BOGOTA } : { view: 'department', code };

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «2026-11-07» → «7 nov 2026». */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** The one wording of the window: in sentences and in captions or source lines (spec, copy). */
export function period(cut: CorteVigente, from: number) {
  const to = shortDate(cut.fechaCorte);
  return { sentence: `del 1 ene ${from} al ${to}`, caption: `${from} – ${to}`, cutDate: to };
}

export interface SourceLink {
  text: string;
  url?: string;
}

/** Source line: «Fuentes: SECOP II y SECOP I (…), DIVIPOLA y Marco Geoestadístico 2025 (…). Datos al …». */
export function sourceParts(cut: CorteVigente): SourceLink[] {
  const f = (id: string) => cut.fuentes.find((x) => x.id === id);
  const secop = f('jbjy-vk9h');
  const mgn = f('mgn-2025');
  return [
    { text: 'Fuentes: ' },
    { text: 'SECOP II', url: secop?.url },
    { text: ' y ' },
    { text: 'SECOP I', url: f('f789-7hwg')?.url },
    { text: ` (Colombia Compra Eficiente${secop ? `, ${secop.licencia}` : ''}), ` },
    { text: 'DIVIPOLA', url: f('gdxc-w37w')?.url },
    { text: ' y ' },
    { text: 'Marco Geoestadístico 2025', url: mgn?.url },
    { text: ` (DANE${mgn ? `, ${mgn.licencia}` : ''}). Datos al ${shortDate(cut.fechaCorte)}.` },
  ];
}

/** Air around a municipality drawn alone, as a share of its larger side on each side. */
const MARGIN = 0.06;
/** A box grown by `share` of its larger side on every side. */
function around(box: Box, share: number): Box {
  const m = Math.max(box[2] - box[0], box[3] - box[1]) * share;
  return [box[0] - m, box[1] - m, box[2] + m, box[3] + m];
}

/** Spanish alphabetical order by name («Ñ» after «N», accents ignored), for the tables. */
const collator = new Intl.Collator('es-CO');
export const byName = (a: { nombre: string }, b: { nombre: string }) =>
  collator.compare(a.nombre, b.nombre);

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export interface SearchEntry {
  key: string;
  name: string;
  context: string;
  route: MapRoute;
}

export interface PreparedMap {
  data: MapData;
  departments: Map<string, DepartamentoDelMapa>;
  municipalities: Map<string, MunicipioDelMapa>;
  byDepartment: Map<string, MunicipioDelMapa[]>;
  departmentShapes: Map<string, Shape>;
  municipalityShapes: Map<string, Shape>;
  archipelago: { shapes: Shape[]; box: Box };
  mainland: Box;
  search: SearchEntry[];
}

/** Projects the geometry once and indexes the data. */
export function prepareMap(data: MapData): PreparedMap {
  const departments = new Map(data.departments.departamentos.map((d) => [d.codigo, d]));
  const municipalities = new Map(data.municipalities.municipios.map((m) => [m.codigo, m]));
  const byDepartment = new Map<string, MunicipioDelMapa[]>();
  for (const m of data.municipalities.municipios) {
    const list = byDepartment.get(m.departamento.codigo) ?? [];
    list.push(m);
    byDepartment.set(m.departamento.codigo, list);
  }
  const departmentShapes = shapesOf(data.topology, 'departamentos');
  const municipalityShapes = shapesOf(data.topology, 'municipios');
  const mainland = unionBox(
    [...departmentShapes.values()].filter((s) => s.code !== ARCHIPELAGO).map((s) => s.box),
  );
  const search: SearchEntry[] = [
    ...data.departments.departamentos
      .filter((d) => d.codigo !== '11')
      .map((d) => ({
        key: fold(d.nombre),
        name: d.nombre,
        context: 'departamento',
        route: departmentRoute(d.codigo),
      })),
    ...data.municipalities.municipios.map((m) => ({
      key: fold(m.nombre),
      name: m.nombre,
      context: m.codigo === BOGOTA ? 'Distrito Capital' : m.departamento.nombre,
      route: { view: 'municipality', code: m.codigo } as const,
    })),
  ];
  return {
    data,
    departments,
    municipalities,
    byDepartment,
    departmentShapes,
    municipalityShapes,
    archipelago: archipelagoPanel(data.topology),
    mainland,
    search,
  };
}

/** Up to 8 places: names that start with the text first, then alphabetical. */
export function searchPlaces(map: PreparedMap, text: string): SearchEntry[] {
  const t = fold(text.trim());
  if (t.length < 2) return [];
  return map.search
    .filter((e) => e.key.includes(t))
    .sort(
      (a, b) =>
        Number(b.key.startsWith(t)) - Number(a.key.startsWith(t)) ||
        collator.compare(a.name, b.name),
    )
    .slice(0, 8);
}

/** A route the data can draw; anything else is the «Ese enlace no corresponde…» state. */
export function isKnownRoute(map: PreparedMap, route: MapRoute): boolean {
  if (route.view === 'department') return map.departments.has(route.code) && route.code !== '11';
  if (route.view === 'municipality') return map.municipalities.has(route.code);
  return route.view === 'country';
}

// ---------- map views ----------

/** Same shapes as the map component's props, kept here so the model has no React import. */
export type ViewFill = 'neutral' | 'low' | 'medium' | 'high' | 'unknown';
export interface ViewTerritory {
  code: string;
  d: string;
  fill: ViewFill;
  description: string;
}
export interface MapView {
  title: string;
  territories: ViewTerritory[];
  box: Box;
  inset?: { territories: ViewTerritory[]; box: Box; label: string };
  labels: { text: string; x: number; y: number; dy?: number }[];
  selected?: string;
  /** Some territory has no data: the legend adds the hatch item. */
  withUnknown: boolean;
  /** The archipelago view: the legend adds the reduced-distance note. */
  archipelago: boolean;
}

const RISK_TEXT = { low: 'Riesgo bajo', medium: 'Riesgo intermedio', high: 'Riesgo alto' } as const;

/**
 * Territories, box and labels of a view. `fictionalLevel` is ONLY for the phase 2 preview in
 * Storybook: it paints invented levels and says «(ficticio)» in each title.
 */
export function mapView(
  map: PreparedMap,
  route: MapRoute,
  fictionalLevel?: (code: string) => 'low' | 'medium' | 'high',
): MapView {
  const fill = (code: string, noData = false): ViewFill =>
    noData ? 'unknown' : fictionalLevel ? fictionalLevel(code) : 'neutral';
  const risk = (code: string) =>
    fictionalLevel ? ` · ${RISK_TEXT[fictionalLevel(code)]} (ficticio)` : '';

  if (route.view !== 'department' && route.view !== 'municipality') {
    return {
      title: 'Mapa de Colombia por departamento. Los valores están en la tabla de departamentos.',
      territories: map.data.departments.departamentos
        .filter((d) => d.codigo !== ARCHIPELAGO)
        .map((d) => ({
          code: d.codigo,
          d: map.departmentShapes.get(d.codigo)?.d ?? '',
          fill: fill(d.codigo),
          description: `${d.nombre}${risk(d.codigo)}`,
        })),
      box: map.mainland,
      inset: {
        box: map.archipelago.box,
        label: 'San Andrés y Providencia',
        territories: [
          {
            code: ARCHIPELAGO,
            d: map.archipelago.shapes.map((s) => s.d).join(''),
            fill: fill(ARCHIPELAGO),
            description: `San Andrés y Providencia${risk(ARCHIPELAGO)}`,
          },
        ],
      },
      labels: [],
      withUnknown: false,
      archipelago: false,
    };
  }

  const selected = route.view === 'municipality' ? route.code : undefined;
  const department =
    route.view === 'department'
      ? route.code
      : (map.municipalities.get(route.code)?.departamento.codigo ?? '');
  const list = map.byDepartment.get(department) ?? [];
  const archipelago = department === ARCHIPELAGO;
  const shapeOf = (c: string) =>
    archipelago ? map.archipelago.shapes.find((s) => s.code === c) : map.municipalityShapes.get(c);
  const centre = (shape?: Shape) => {
    const b = shape?.box ?? [0, 0, 0, 0];
    return { x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2, bottom: b[3] };
  };
  const territories = list.map((m) => {
    const noData = m.contratosUbicados === null;
    const value = noData
      ? 'Sin datos'
      : `${formatNumber(m.contratosUbicados ?? 0, 0)} contratos${risk(m.codigo)}`;
    return {
      code: m.codigo,
      d: shapeOf(m.codigo)?.d ?? '',
      fill: fill(m.codigo, noData),
      description: `${m.nombre}: ${value}`,
    };
  });
  // A municipality of the cut without a shape in this geometry version is listed but not drawn,
  // and never stretches the frame; with no shapes at all, the department's own outline frames it.
  const boxes = list.map((m) => shapeOf(m.codigo)?.box).filter((b): b is Box => b !== undefined);
  const box = boxes.length
    ? unionBox(boxes)
    : (map.departmentShapes.get(department)?.box ?? map.mainland);
  // A chosen municipality is drawn alone and fills the frame (spec, decision 16). Without a shape
  // in this geometry version, the department stays in view instead of an empty frame.
  const selectedShape = selected ? shapeOf(selected) : undefined;
  const drawn = selectedShape ? territories.filter((t) => t.code === selected) : territories;
  const name = map.departments.get(department)?.nombre ?? department;
  const selectedName = selected ? map.municipalities.get(selected)?.nombre : undefined;
  const labels = archipelago
    ? list.map((m) => {
        const c = centre(shapeOf(m.codigo));
        return { text: m.nombre, x: c.x, y: c.bottom, dy: 14 };
      })
    : [
        ...(department === '25'
          ? [{ text: 'Bogotá, D.C.', ...centre(map.municipalityShapes.get(BOGOTA)) }]
          : []),
        ...(selected && selectedName && selected !== BOGOTA
          ? [{ text: selectedName, ...centre(shapeOf(selected)) }]
          : []),
      ];
  return {
    title: `${
      selectedShape && selectedName
        ? `Mapa de ${selectedName}, ${name}`
        : `Mapa de ${name} por municipio`
    }. Los valores están en la tabla de municipios.`,
    territories: drawn,
    // In the archipelago, room under the islands for their names.
    box: selectedShape
      ? around(selectedShape.box, MARGIN)
      : archipelago
        ? [box[0], box[1], box[2], box[3] + (box[3] - box[1]) * 0.12]
        : box,
    // Alone in the frame, the municipality is already named by the heading above the map.
    labels: (selectedShape ? [] : labels).map(({ text, x, y, ...rest }) => ({
      text,
      x,
      y,
      ...('dy' in rest ? { dy: rest.dy } : {}),
    })),
    selected,
    withUnknown: drawn.some((t) => t.fill === 'unknown'),
    // Its note on the sea between the islands only applies when both are drawn.
    archipelago: archipelago && !selectedShape,
  };
}
