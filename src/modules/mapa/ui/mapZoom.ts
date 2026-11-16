import type { MapRoute } from './mapModel';

/**
 * Zoom between views (spec, decisions 15 and 16): going from Colombia into a department, or from a
 * department into a municipality, the map grows toward that place until it fills the frame; going
 * back, it shrinks into its place. Built on
 * the View Transitions API: the map's `<svg>` carries `view-transition-name: map-zoom` (MapPage sets
 * it), and its two snapshots are animated with transforms measured on screen. Without the API, or
 * with reduced motion, the view changes at once.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Point {
  x: number;
  y: number;
}
/** Viewport map p → a·p + b. */
interface Affine {
  a: number;
  b: Point;
}

const DURATION = 450;
const EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const NAME = 'map-zoom';

/** The uniform scale and shift that carry one rectangle onto another, centre on centre. */
export function rectToRect(from: Rect, to: Rect): Affine {
  const a = Math.min(to.w / from.w, to.h / from.h);
  return {
    a,
    b: {
      x: to.x + to.w / 2 - a * (from.x + from.w / 2),
      y: to.y + to.h / 2 - a * (from.y + from.h / 2),
    },
  };
}

/**
 * CSS transform (origin 0 0) for a snapshot in the transition group, so that it shows the viewport
 * map `v`. The snapshot was taken of a box at `source` and is drawn at the group's origin `group`,
 * scaled by `k` (the group's width over the source's).
 */
export function placement(v: Affine, source: Point, k: number, group: Point): string {
  const m = v.a / k;
  const n = { x: v.b.x - group.x + v.a * source.x, y: v.b.y - group.y + v.a * source.y };
  return `translate(${n.x}px, ${n.y}px) scale(${m})`;
}

const IDENTITY: Affine = { a: 1, b: { x: 0, y: 0 } };

/** Keyframes for both snapshots, from the frames and the focused place before and after. */
export function zoomKeyframes(oldFrame: Rect, oldFocus: Rect, newFrame: Rect, newFocus: Rect) {
  const k = newFrame.w / oldFrame.w;
  return {
    old: [
      { transform: placement(IDENTITY, oldFrame, k, newFrame), opacity: 1 },
      { transform: placement(rectToRect(oldFocus, newFocus), oldFrame, k, newFrame), opacity: 0 },
    ],
    new: [
      { transform: placement(rectToRect(newFocus, oldFocus), newFrame, 1, newFrame), opacity: 0 },
      { transform: placement(IDENTITY, newFrame, 1, newFrame), opacity: 1 },
    ],
  };
}

const departmentOf = (route: MapRoute) =>
  route.view === 'department'
    ? route.code
    : route.view === 'municipality'
      ? route.code.slice(0, 2)
      : undefined;

type Focus = 'shape' | 'content';
/**
 * What the zoom follows: a place drawn in both views, measured in each as its own shape or as the
 * whole drawing. Into a department, or from a department into one of its municipalities, the
 * place's shape becomes the whole new drawing; going back, the drawing shrinks into that shape.
 * None between two municipalities or two departments: the eye has nothing in common to follow.
 */
export function zoomPlan(
  from: MapRoute,
  to: MapRoute,
): { code: string; old: Focus; new: Focus } | undefined {
  const fromDepartment = departmentOf(from);
  const toDepartment = departmentOf(to);
  if (from.view === 'country' && toDepartment)
    return { code: toDepartment, old: 'shape', new: 'content' };
  if (to.view === 'country' && fromDepartment)
    return { code: fromDepartment, old: 'content', new: 'shape' };
  if (from.view === 'department' && to.view === 'municipality' && fromDepartment === toDepartment)
    return { code: to.code, old: 'shape', new: 'content' };
  if (from.view === 'municipality' && to.view === 'department' && fromDepartment === toDepartment)
    return { code: from.code, old: 'content', new: 'shape' };
  return undefined;
}

const rectOf = (el: Element | null | undefined): Rect | undefined => {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : undefined;
};
const mapSvg = () => document.querySelector<SVGSVGElement>(`svg[data-view-transition="${NAME}"]`);
/** The drawn territories (the first group), without the archipelago inset. */
const content = (svg: SVGSVGElement | null) => rectOf(svg?.querySelector('g > g'));
const shape = (svg: SVGSVGElement | null, code: string) =>
  rectOf(svg?.querySelector(`path[data-code="${code}"]`));

/**
 * Runs `update` (which must render the new view synchronously, e.g. with flushSync) inside a zoom
 * transition when the views allow one; otherwise just runs it.
 */
export function withMapZoom(from: MapRoute, to: MapRoute, update: () => void): void {
  const zoom = zoomPlan(from, to);
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!zoom || reduced || typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  const oldSvg = mapSvg();
  const oldFrame = rectOf(oldSvg);
  const oldFocus = zoom.old === 'shape' ? shape(oldSvg, zoom.code) : content(oldSvg);
  if (!oldFrame || !oldFocus) {
    update();
    return;
  }
  let frames: ReturnType<typeof zoomKeyframes> | undefined;
  const transition = document.startViewTransition(() => {
    update();
    const newSvg = mapSvg();
    const newFrame = rectOf(newSvg);
    const newFocus = zoom.new === 'shape' ? shape(newSvg, zoom.code) : content(newSvg);
    if (newFrame && newFocus) frames = zoomKeyframes(oldFrame, oldFocus, newFrame, newFocus);
  });
  transition.ready
    .then(() => {
      if (!frames) return;
      const options = { duration: DURATION, easing: EASING, fill: 'both' as const };
      const root = document.documentElement;
      const animations = [
        root.animate(frames.old, { ...options, pseudoElement: `::view-transition-old(${NAME})` }),
        root.animate(frames.new, { ...options, pseudoElement: `::view-transition-new(${NAME})` }),
      ];
      // Once the snapshots are gone, their animations are released too.
      transition.finished.finally(() => {
        for (const animation of animations) animation.cancel();
      });
    })
    .catch(() => {});
}
