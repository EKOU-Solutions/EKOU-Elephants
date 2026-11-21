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
  archipelagoInset,
  archipelagoPanel,
  type Box,
  type InsetIsland,
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

/**
 * One address per place: the link to replace the current one with, or `undefined` if it is already
 * canonical or does not name a place. «/mapa/departamento/11» → «/mapa/11001»; «/mapa/» → «/mapa».
 */
export function canonicalPath(path: string): string | undefined {
  const route = parseRoute(path);
  if (route.view === 'invalid') return undefined;
  const canonical = routePath(route);
  return canonical === path ? undefined : canonical;
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
  /** The archipelago inset of the full-screen map (decision 24): islands enlarged at the mainland's north-west. */
  inset: { islands: InsetIsland[]; box: Box; scale: number };
  mainland: Box;
  /** The country's frame on the full-screen map: the mainland and the inset. */
  home: Box;
  search: SearchEntry[];
}

/** What a map needs from the cut's lists alone, without geometry: indexes and the search entries. */
export function indexData(data: Pick<MapData, 'departments' | 'municipalities'>) {
  const departments = new Map(data.departments.departamentos.map((d) => [d.codigo, d]));
  const municipalities = new Map(data.municipalities.municipios.map((m) => [m.codigo, m]));
  const byDepartment = new Map<string, MunicipioDelMapa[]>();
  for (const m of data.municipalities.municipios) {
    const list = byDepartment.get(m.departamento.codigo) ?? [];
    list.push(m);
    byDepartment.set(m.departamento.codigo, list);
  }
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
  return { departments, municipalities, byDepartment, search };
}

/** Projects the geometry once and indexes the data. */
export function prepareMap(data: MapData): PreparedMap {
  const { departments, municipalities, byDepartment, search } = indexData(data);
  const departmentShapes = shapesOf(data.topology, 'departamentos');
  const municipalityShapes = shapesOf(data.topology, 'municipios');
  const mainland = unionBox(
    [...departmentShapes.values()].filter((s) => s.code !== ARCHIPELAGO).map((s) => s.box),
  );
  const archipelago = archipelagoPanel(data.topology);
  const inset = archipelagoInset(archipelago, mainland);
  return {
    data,
    departments,
    municipalities,
    byDepartment,
    departmentShapes,
    municipalityShapes,
    archipelago,
    inset,
    mainland,
    home: unionBox([mainland, inset.box]),
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

// ---------- full-screen map (spec of 2026-11-17, sketch A) ----------

export interface FullscreenTerritory extends ViewTerritory {
  /** Around the place in focus: still drawn and tappable, in the subtle surface (decisions 20 and 25). */
  dimmed: boolean;
  /** The archipelago's islands are drawn at the inset: their SVG transform. */
  transform?: string;
}

/** A place name over the map, in projected units: above the chosen place, below an island, or centred. */
export interface FullscreenLabel {
  text: string;
  x: number;
  y: number;
  anchor: 'above' | 'below' | 'below-start' | 'centre';
  /** Horizontal bounds (projected units) the name never leaves: the archipelago's dashed frame. */
  within?: readonly [number, number];
}

/** How much of the free area a view fills: a department or the country 90 %, a municipality 55 % (decision 20). */
export const FILL = { place: 0.9, municipality: 0.55 } as const;

export interface FullscreenView {
  /** The map's accessible name: what it shows and where the values are. */
  title: string;
  /** Every department but the archipelago and the open one: dimmed around an open department. */
  departments: FullscreenTerritory[];
  /** Municipalities of the open department (none in Colombia). */
  municipalities: FullscreenTerritory[];
  /** Open department: its municipalities are drawn and its outline goes on top. */
  department?: string;
  outline?: string;
  selected?: string;
  /**
   * The archipelago: `map` in Colombia (inside the map, at its approximate place), `outline` in the
   * archipelago (its dashed frame outlines the department), `corner` anywhere else (fixed inset).
   */
  inset: {
    islands: InsetIsland[];
    box: Box;
    /** The islands' enlargement: the «Sin datos» hatch is compensated by it. */
    scale: number;
    label: string;
    placement: 'map' | 'outline' | 'corner';
  };
  /** The camera frames this box, filling `fill` of the free area. */
  focus: Box;
  fill: number;
  /** A chosen municipality's department: the zoom never leaves it off screen (decision 20). */
  context?: Box;
  /** The country's frame: zoom limits and the way back to Colombia. */
  home: Box;
  labels: FullscreenLabel[];
  /** Some drawn municipality has no data: the sheet adds the «Sin datos» legend. */
  withUnknown: boolean;
}

const MAP_TITLE_END = 'Los valores están en la tabla de la ficha.';

/**
 * What the full-screen map draws for a route: one map with three levels (decision 17). The department
 * in focus shows its municipalities and the others are dimmed around it; a chosen municipality keeps
 * its fill and its neighbours are dimmed (decision 20).
 */
export function fullscreenView(map: PreparedMap, route: MapRoute): FullscreenView {
  const inset = {
    islands: map.inset.islands,
    box: map.inset.box,
    scale: map.inset.scale,
    label: 'San Andrés y Providencia',
  };
  const departmentsBut = (open?: string): FullscreenTerritory[] =>
    map.data.departments.departamentos
      .filter((d) => d.codigo !== ARCHIPELAGO && d.codigo !== open)
      .map((d) => ({
        code: d.codigo,
        d: map.departmentShapes.get(d.codigo)?.d ?? '',
        fill: 'neutral',
        description: d.nombre,
        dimmed: open !== undefined,
      }));

  if (route.view !== 'department' && route.view !== 'municipality') {
    return {
      title: `Mapa de Colombia por departamento. ${MAP_TITLE_END}`,
      departments: departmentsBut(),
      municipalities: [],
      inset: { ...inset, placement: 'map' },
      focus: map.home,
      fill: FILL.place,
      home: map.home,
      labels: [{ text: inset.label, x: inset.box[0], y: inset.box[3], anchor: 'below-start' }],
      withUnknown: false,
    };
  }

  const department =
    route.view === 'department'
      ? route.code
      : (map.municipalities.get(route.code)?.departamento.codigo ?? '');
  const archipelago = department === ARCHIPELAGO;
  const islandOf = (c: string) => map.inset.islands.find((i) => i.code === c);
  const shapeOf = (c: string) => (archipelago ? islandOf(c) : map.municipalityShapes.get(c));
  // A municipality of the cut without a shape in this geometry version is listed in the table, not drawn.
  const drawable = (map.byDepartment.get(department) ?? []).filter((m) => shapeOf(m.codigo));
  const selected = route.view === 'municipality' ? route.code : undefined;
  const selectedBox = selected ? shapeOf(selected)?.box : undefined;
  const municipalities: FullscreenTerritory[] = drawable.map((m) => ({
    code: m.codigo,
    d: shapeOf(m.codigo)?.d ?? '',
    fill: m.contratosUbicados === null ? 'unknown' : 'neutral',
    description: `${m.nombre}: ${
      m.contratosUbicados === null
        ? 'Sin datos'
        : `${formatNumber(m.contratosUbicados, 0)} contratos`
    }`,
    dimmed: selectedBox !== undefined && m.codigo !== selected,
    ...(archipelago ? { transform: islandOf(m.codigo)?.transform } : {}),
  }));
  const boxes = drawable.flatMap((m) => {
    const box = shapeOf(m.codigo)?.box;
    return box ? [box] : [];
  });
  const [ix0, iy0, ix1, iy1] = map.inset.box;
  // In the archipelago, room under the islands for their names, inside the dashed frame.
  const departmentBox: Box = archipelago
    ? [ix0, iy0, ix1, iy1 + (iy1 - iy0) * 0.12]
    : boxes.length
      ? unionBox(boxes)
      : (map.departmentShapes.get(department)?.box ?? map.mainland);
  const name = map.departments.get(department)?.nombre ?? department;
  const selectedName = selected ? map.municipalities.get(selected)?.nombre : undefined;
  const bogota = department === '25' ? map.municipalityShapes.get(BOGOTA)?.box : undefined;
  // Decision 10: names only for the chosen place, the archipelago's islands and Bogotá.
  const labels: FullscreenLabel[] = archipelago
    ? drawable.flatMap((m) => {
        const b = shapeOf(m.codigo)?.box;
        return b
          ? [
              {
                text: m.nombre,
                x: (b[0] + b[2]) / 2,
                y: b[3],
                anchor: 'below' as const,
                within: [ix0, ix1] as const,
              },
            ]
          : [];
      })
    : [
        ...(bogota
          ? [
              {
                text: 'Bogotá, D.C.',
                x: (bogota[0] + bogota[2]) / 2,
                y: (bogota[1] + bogota[3]) / 2,
                anchor: 'centre' as const,
              },
            ]
          : []),
        ...(selectedBox && selectedName
          ? [
              {
                text: selectedName,
                x: (selectedBox[0] + selectedBox[2]) / 2,
                y: selectedBox[1],
                anchor: 'above' as const,
              },
            ]
          : []),
      ];
  return {
    title: `${
      selectedBox && selectedName
        ? `Mapa de ${selectedName}, ${name}, con sus municipios vecinos`
        : `Mapa de ${name} por municipio`
    }. ${MAP_TITLE_END}`,
    departments: departmentsBut(department),
    municipalities,
    department,
    outline: archipelago ? undefined : map.departmentShapes.get(department)?.d,
    selected,
    // In the archipelago the dashed frame outlines the department, names included.
    inset: archipelago
      ? { ...inset, box: departmentBox, placement: 'outline' }
      : { ...inset, placement: 'corner' },
    // Without its shape in this geometry version, the department's frame stays (spec, municipality row 1).
    focus: selectedBox ?? departmentBox,
    fill: selectedBox ? FILL.municipality : FILL.place,
    ...(selectedBox ? { context: departmentBox } : {}),
    home: map.home,
    labels,
    // Only what is in focus: dimmed neighbours do not bring the «Sin datos» legend.
    withUnknown: municipalities.some((m) => !m.dimmed && m.fill === 'unknown'),
  };
}
