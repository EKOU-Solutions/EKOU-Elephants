// Pure camera rules of the full-screen map (map spec §3, as in the approved sketch prototipo-a.html):
// the world is drawn at `screen = world · k + (x, y)`, and every place is framed in the free area that
// the search field, the crumbs, the zoom buttons, the corner inset and the sheet leave.
import type { Box } from '../geometry';

export interface Camera {
  x: number;
  y: number;
  k: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Spec §5 layout around the map, in px. The CSS Modules place the controls on the same lines:
// camera.test.ts checks these values against MapWithLegend.module.css and BottomSheet.module.css.
const EDGE = 16; // map air on the left when nothing covers that side
export const CORNER_WIDTH = 68; // the corner inset (decision 23)
const CORNER_COLUMN = 12 + CORNER_WIDTH + 8;
const ZOOM_COLUMN = 68; // the zoom buttons: 12 + 44 + 12
export const PANEL_WIDTH = 400; // the BottomSheet's desktop side panel (decision 22)
const PHONE_TOP = 116; // search 12 + 44, crumbs 8 + 44, 8
const PANEL_TOP = 72; // crumbs 12 + 44, 16
const LABEL_ROOM = 32; // a chosen place carries its name above it: it never meets the crumbs
const SHEET_GAP = 12;
const MIN_HEIGHT = 140; // a very tall sheet never squeezes the map to nothing

export interface FreeAreaInput {
  width: number;
  height: number;
  /** Height of the sheet that covers the map's bottom (phone). Ignored with the side panel. */
  sheetHeight: number;
  isPanel: boolean;
  /** The archipelago's corner inset is shown and takes a column on the left. */
  corner: boolean;
  /** A label goes above the chosen place. */
  roomAbove: boolean;
}

/** The free area over the sheet, below the search and the crumbs, left of the zoom buttons. */
export function freeRect({
  width,
  height,
  sheetHeight,
  isPanel,
  corner,
  roomAbove,
}: FreeAreaInput): Rect {
  const left = corner ? CORNER_COLUMN : EDGE;
  const top = (isPanel ? PANEL_TOP : PHONE_TOP) + (roomAbove ? LABEL_ROOM : 0);
  if (isPanel) {
    return { x: left, y: top, w: width - PANEL_WIDTH - ZOOM_COLUMN - left, h: height - top - EDGE };
  }
  const bottom = Math.max(top + MIN_HEIGHT, height - sheetHeight - SHEET_GAP);
  return { x: left, y: top, w: width - ZOOM_COLUMN - left, h: bottom - top };
}

/** The camera that centres `box` in `rect`, filling `fill` of it on its tighter side. */
export function fitCamera(box: Box, rect: Rect, fill: number): Camera {
  const k = Math.min(rect.w / (box[2] - box[0] || 1), rect.h / (box[3] - box[1] || 1)) * fill;
  return {
    k,
    x: rect.x + rect.w / 2 - ((box[0] + box[2]) / 2) * k,
    y: rect.y + rect.h / 2 - ((box[1] + box[3]) / 2) * k,
  };
}

/**
 * A municipality's frame (decision 20, widened by the user on 2026-11-17): it fills at most `fill` of
 * the free area, and never zooms in further than keeping its whole department (`context`, framed like a
 * department) on screen; centred on the municipality as far as the department allows. In a small
 * municipality the department rules and the municipality looks smaller.
 */
export function frameWithin(
  focus: Box,
  rect: Rect,
  fill: number,
  context: Box | undefined,
  contextFill: number,
): Camera {
  const own = fitCamera(focus, rect, fill);
  if (!context) return own;
  const k = Math.min(own.k, fitCamera(context, rect, contextFill).k);
  const axis = (lo: number, hi: number, start: number, size: number, centre: number) => {
    const centred = start + size / 2 - centre * k;
    const min = start - lo * k; // the department's near edge stays inside
    const max = start + size - hi * k; // and so does its far edge
    return min > max ? centred : Math.min(max, Math.max(min, centred));
  };
  return {
    k,
    x: axis(context[0], context[2], rect.x, rect.w, (focus[0] + focus[2]) / 2),
    y: axis(context[1], context[3], rect.y, rect.h, (focus[1] + focus[3]) / 2),
  };
}

/**
 * A cubic Bézier easing, like CSS `cubic-bezier(x1, y1, x2, y2)`: solves x(u) = t for u with Newton's
 * method (bisection if the slope vanishes) and returns y(u).
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (a: number, b: number, u: number) =>
    3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u * u * b + u * u * u;
  const slope = (a: number, b: number, u: number) =>
    3 * (1 - u) * (1 - u) * a + 6 * (1 - u) * u * (b - a) + 3 * u * u * (1 - b);
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, u);
      if (Math.abs(d) < 1e-6) break;
      u = Math.min(1, Math.max(0, u - (curve(x1, x2, u) - t) / d));
    }
    let [lo, hi] = [0, 1];
    for (let i = 0; i < 30 && Math.abs(curve(x1, x2, u) - t) > 1e-6; i++) {
      if (curve(x1, x2, u) < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return curve(y1, y2, u);
  };
}

/** The easing of a token value such as `cubic-bezier(0.2, 0.7, 0.2, 1)`; linear if it is not one. */
export function easingOf(value: string): (t: number) => number {
  const n = /cubic-bezier\(([^)]+)\)/.exec(value)?.[1]?.split(',').map(Number);
  if (n?.length !== 4 || n.some(Number.isNaN)) return (t) => t;
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = n;
  return cubicBezier(x1, y1, x2, y2);
}

/** Milliseconds of a token value such as `450ms` or `0.45s`; 0 if unreadable. */
export function durationOf(value: string): number {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return 0;
  const unit = value.trim();
  return unit.endsWith('ms') ? n : unit.endsWith('s') ? n * 1000 : n;
}

/**
 * One frame of a flight at eased progress `e` (0 → 1): the zoom is interpolated geometrically, so
 * zooming 20 times never feels like a jump, and the world point under `anchor` moves in a straight
 * line from the old centre to the new one. Ends exactly on `to`.
 */
export function flightFrame(from: Camera, to: Camera, anchor: [number, number], e: number): Camera {
  const [ax, ay] = anchor;
  const k = from.k * (to.k / from.k) ** e;
  const cx = (ax - from.x) / from.k + ((ax - to.x) / to.k - (ax - from.x) / from.k) * e;
  const cy = (ay - from.y) / from.k + ((ay - to.y) / to.k - (ay - from.y) / from.k) * e;
  return { k, x: ax - cx * k, y: ay - cy * k };
}

/** Spec §3: the zoom goes from 0.7 to 80 times the country's frame. */
export function zoomLimits(homeK: number) {
  return { min: homeK * 0.7, max: homeK * 80 };
}

/**
 * Zoom by `factor` around a screen point, within the limits: the world point under it stays put. Never
 * against the request: a camera already past a limit (a framed place can ask for more) stays where it is.
 */
export function zoomAround(
  cam: Camera,
  point: [number, number],
  factor: number,
  limits: { min: number; max: number },
): Camera {
  const wanted = cam.k * factor;
  const k =
    factor >= 1
      ? Math.max(cam.k, Math.min(limits.max, wanted))
      : Math.min(cam.k, Math.max(limits.min, wanted));
  const [px, py] = point;
  return { k, x: px - ((px - cam.x) / cam.k) * k, y: py - ((py - cam.y) / cam.k) * k };
}

/**
 * Drag limits: the country's box never leaves the free area. At least a quarter of the area's smaller
 * side (or the whole box, if it is smaller on screen) stays inside it on each axis.
 */
export function clampPan(cam: Camera, box: Box, rect: Rect): Camera {
  const keep = Math.min(rect.w, rect.h) / 4;
  const axis = (offset: number, lo: number, hi: number, start: number, size: number) => {
    const m = Math.min(keep, (hi - lo) * cam.k);
    const min = start + m - hi * cam.k; // the box's far edge at least `m` inside the area's start
    const max = start + size - m - lo * cam.k; // its near edge at least `m` before the area's end
    return Math.min(max, Math.max(min, offset));
  };
  return {
    k: cam.k,
    x: axis(cam.x, box[0], box[2], rect.x, rect.w),
    y: axis(cam.y, box[1], box[3], rect.y, rect.h),
  };
}

/** Spec §3: zooming out from a department to near the country's frame goes back to Colombia. */
export function isNearCountry(k: number, homeK: number): boolean {
  return k < homeK * 1.35;
}

export type FlightDuration = 'long' | 'base';

/**
 * Spec §3, flights: Colombia ↔ department or another department, `--el-duration-long`; within a
 * department (department ↔ municipality, municipality ↔ municipality), `--el-duration-base`.
 */
export function flightDuration(
  fromDepartment: string | undefined,
  toDepartment: string | undefined,
): FlightDuration {
  return fromDepartment === toDepartment ? 'base' : 'long';
}
