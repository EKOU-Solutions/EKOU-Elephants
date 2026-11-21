// The map data a page carries (ADR-0004 point 4): the cut's lists as the API gives them, plus the
// shapes' boxes and only this page's outlines. No indexes or search entries: the island rebuilds them
// (`indexData`), so the page does not carry each municipality four times.
import type { Box, InsetIsland, Shape } from '../../../src/modules/mapa/ui/geometry';
import {
  ARCHIPELAGO,
  BOGOTA,
  indexData,
  type MapRoute,
  type PreparedMap,
} from '../../../src/modules/mapa/ui/mapModel';

type CompactShape = [code: string, box: Box, d: string];

export interface PageMap {
  cut: PreparedMap['data']['cut'];
  departments: PreparedMap['data']['departments'];
  municipalities: PreparedMap['data']['municipalities'];
  departmentShapes: CompactShape[];
  municipalityShapes: CompactShape[];
  archipelago: { shapes: CompactShape[]; box: Box };
  inset: { islands: InsetIsland[]; box: Box; scale: number };
  mainland: Box;
  home: Box;
}

// Boxes in projected units: three decimals are far below a pixel.
const round = (b: Box): Box => b.map((v) => Math.round(v * 1000) / 1000) as unknown as Box;
const pack = (s: Shape): CompactShape => [s.code, round(s.box), s.d];
const unpack = ([code, box, d]: CompactShape): Shape => ({ code, box, d });

/**
 * On the server: a prepared map (already `pageOutlines`) as the page carries it. Of the municipalities'
 * shapes only those that frame this page go: its department's (and Bogotá's, labelled on
 * Cundinamarca). Any other place needs the full map, which the island loads before going there.
 */
export function toPageMap(map: PreparedMap, route: MapRoute): PageMap {
  const department =
    route.view === 'department'
      ? route.code
      : route.view === 'municipality'
        ? map.municipalities.get(route.code)?.departamento.codigo
        : undefined;
  // Its department's municipalities, plus Bogotá on Cundinamarca (it is labelled there).
  const inPage = (code: string) =>
    department !== undefined &&
    (map.municipalities.get(code)?.departamento.codigo === department ||
      (department === '25' && code === BOGOTA));
  // The archipelago draws its islands from the inset, not from the municipalities' shapes.
  const frames = (code: string) => department !== ARCHIPELAGO && inPage(code);
  return {
    cut: map.data.cut,
    departments: map.data.departments,
    // A place's page carries its department's municipalities only; the country page, all of them.
    municipalities:
      department === undefined
        ? map.data.municipalities
        : {
            ...map.data.municipalities,
            municipios: map.data.municipalities.municipios.filter((m) => inPage(m.codigo)),
          },
    departmentShapes: [...map.departmentShapes.values()].map(pack),
    municipalityShapes: [...map.municipalityShapes.values()].filter((s) => frames(s.code)).map(pack),
    archipelago: { shapes: map.archipelago.shapes.map(pack), box: map.archipelago.box },
    inset: map.inset,
    mainland: map.mainland,
    home: map.home,
  };
}

const EMPTY_TOPOLOGY = {
  type: 'Topology',
  transform: { scale: [1, 1], translate: [0, 0] },
  arcs: [],
  objects: {},
} as const;

/** In the island (server and browser alike): the prepared map back, with no topology. */
export function fromPageMap(page: PageMap): PreparedMap {
  const data = {
    cut: page.cut,
    departments: page.departments,
    municipalities: page.municipalities,
    topology: EMPTY_TOPOLOGY as unknown as PreparedMap['data']['topology'],
  };
  const shapes = (list: CompactShape[]) => new Map(list.map((s) => [s[0], unpack(s)]));
  return {
    data,
    ...indexData(data),
    departmentShapes: shapes(page.departmentShapes),
    municipalityShapes: shapes(page.municipalityShapes),
    archipelago: { shapes: page.archipelago.shapes.map(unpack), box: page.archipelago.box },
    inset: page.inset,
    mainland: page.mainland,
    home: page.home,
  };
}
