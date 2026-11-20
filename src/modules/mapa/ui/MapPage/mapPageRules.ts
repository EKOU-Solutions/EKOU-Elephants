// Pure behaviour rules of the map page (spec §3, decision 32), kept apart from the component so they
// can be tested without a browser.
import type { Detent, SheetFrame } from '../../../../components/ui/BottomSheet/BottomSheet';
import {
  BOGOTA,
  departmentRoute,
  isKnownRoute,
  type MapRoute,
  type PreparedMap,
} from '../mapModel';
import { freeRect } from '../MapWithLegend/camera';

/** Decision 32: below this free map height (px) with the sheet at half, the sheet arrives collapsed. */
export const MIN_FREE_MAP = 160;

export interface Crumb {
  /** `country` for «← Colombia», else the department code. */
  key: string;
  label: string;
  to: MapRoute;
}

/** Spec row B: «← Colombia» outside Colombia, plus the department in a municipality (not in Bogotá). */
export function crumbsFor(map: PreparedMap, route: MapRoute): Crumb[] {
  if (route.view === 'country' || route.view === 'invalid' || !isKnownRoute(map, route)) return [];
  const country: Crumb = { key: 'country', label: 'Colombia', to: { view: 'country' } };
  if (route.view === 'department' || route.code === BOGOTA) return [country];
  const code = map.municipalities.get(route.code)?.departamento.codigo ?? route.code.slice(0, 2);
  const label = map.departments.get(code)?.nombre ?? code;
  return [country, { key: code, label, to: departmentRoute(code) }];
}

/**
 * Spec §3: after a crumb, focus stays on it; if it is gone, on «← Colombia»; back in Colombia (no
 * crumbs left), on the `h1`. Returns the crumb key, or `title`.
 */
export function crumbFocus(after: Crumb[], pressed: string): string {
  if (after.some((c) => c.key === pressed)) return pressed;
  return after[0]?.key ?? 'title';
}

/**
 * With the full sheet, a tap on the map or «Volver al mapa» lowers it: to half, or to collapsed when
 * half already looks full (header too tall, spec §3).
 */
export const lowered = (detent: Detent): Detent => (detent === 'full' ? 'half' : 'peek');

/**
 * Spec §3: a still tap on the map chooses the place, except with the full sheet (phone), where it only
 * lowers the sheet. A two-digit code is a department, five digits a municipality.
 */
export function mapTap(
  code: string,
  sheet: SheetFrame | undefined,
  detent: Detent,
): { detent: Detent } | { route: MapRoute } {
  if (sheet?.shown === 'full' && !sheet.isPanel) return { detent: lowered(detent) };
  return {
    route: code.length === 2 ? departmentRoute(code) : { view: 'municipality', code },
  };
}

/**
 * Decision 32: the height a place arrives at, from how the sheet looks at half. If the map keeps less
 * than about 160 px free over it (320 × 640), or the header does not even fit at half, it arrives
 * collapsed. A chosen municipality takes its name's room above it (`roomAbove`). The desktop panel has
 * no heights.
 */
export function arrivalDetent(
  frame: SheetFrame,
  width: number,
  height: number,
  roomAbove: boolean,
  country = false,
): Detent {
  if (frame.isPanel) return 'half';
  // On the phone the map comes first: the country arrives with the sheet collapsed, and choosing a
  // place brings it up to half.
  if (country) return 'peek';
  if (frame.shown === 'full') return 'peek';
  const free = freeRect({
    width,
    height,
    sheetHeight: frame.height,
    isPanel: false,
    corner: false,
    roomAbove,
  });
  return free.h < MIN_FREE_MAP ? 'peek' : 'half';
}

/** The sheet's height for one place; `auto` until the person moves it (decision 32 may still adjust it). */
export interface SheetState {
  key: string;
  detent: Detent;
  auto: boolean;
}

/**
 * Decision 32 on arrival at the place `key`: the sheet state once the sheet has measured it. A frame of
 * the previous place (it still arrives first) or a collapsed one changes nothing, so the sheet never
 * bounces through collapsed; a height the person chose is kept.
 */
export function arrivalState(
  state: SheetState,
  frame: SheetFrame | undefined,
  key: string,
  page: { width: number; height: number; roomAbove: boolean; country?: boolean },
): SheetState {
  if (!frame || frame.contentKey !== key || frame.shown === 'peek') return state;
  const detent = arrivalDetent(frame, page.width, page.height, page.roomAbove, page.country);
  if (state.key === key && (!state.auto || state.detent === detent)) return state;
  return { key, detent, auto: true };
}

/** What the status region says after a change of place: «Seleccionado: Medellín, Antioquia». */
export function selectedText(map: PreparedMap, route: MapRoute): string {
  if (route.view === 'department')
    return `Seleccionado: ${map.departments.get(route.code)?.nombre ?? route.code}`;
  const m = route.view === 'municipality' ? map.municipalities.get(route.code) : undefined;
  if (!m) return 'Seleccionado: Colombia';
  return `Seleccionado: ${m.codigo === BOGOTA ? m.nombre : `${m.nombre}, ${m.departamento.nombre}`}`;
}
