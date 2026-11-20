import type { CSSProperties } from 'react';
import { FILL } from '../mapModel';
import { freeInsets, PANEL_WIDTH } from './camera';
import { ANCHOR_TRANSFORM, type FullscreenMapProps, HATCH, LABEL_CLASS } from './FullscreenMap';
import styles from './MapWithLegend.module.css';

// Phone width of the free area used to size the hatch, which CSS cannot scale (390 − 88 − 68).
const HATCH_WIDTH = 234;

/** CSS custom properties (unitless numbers) read by `.staticArea` and its children. */
const vars = (values: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(values).map(([k, v]) => [`--${k}`, String(Math.round(v * 1000) / 1000)]),
  ) as CSSProperties;

/**
 * The full-screen map in a generated page (ADR 0003), before any JavaScript: no camera, so CSS frames
 * the place in the same free area and at the same scale as `frameWithin` (container query units over
 * the free area, `freeInsets`). It draws only what the page carries: the department's outline with the
 * chosen municipality (Colombia: its departments; the archipelago: its islands). No zoom, no corner
 * inset. The app replaces it with `FullscreenMap` on mount.
 */
export function StaticFullscreenMap({
  title,
  departments,
  municipalities,
  department,
  outline,
  selected,
  inset,
  focus,
  fill,
  context,
  labels,
}: FullscreenMapProps) {
  const drawn = context ?? focus;
  const [x0, y0, x1, y1] = drawn;
  const width = (b: readonly number[]) => (b[2] ?? 0) - (b[0] ?? 0) || 1;
  const height = (b: readonly number[]) => (b[3] ?? 0) - (b[1] ?? 0) || 1;
  // frameWithin's scale is min(own fit, department fit): the fit of this virtual box.
  const wv = Math.max(width(focus) / fill, context ? width(context) / FILL.place : 0);
  const hv = Math.max(height(focus) / fill, context ? height(context) / FILL.place : 0);
  const { phone, panel } = freeInsets(
    inset.placement === 'corner',
    labels.some((l) => l.anchor === 'above'),
  );
  const style = vars({
    wv,
    hv,
    dw: x1 - x0,
    dh: y1 - y0,
    cx: (focus[0] + focus[2]) / 2 - x0,
    cy: (focus[1] + focus[3]) / 2 - y0,
    'top-phone': phone.top,
    'left-phone': phone.left,
    'right-phone': phone.right,
    'bottom-phone': phone.bottom,
    'min-phone': phone.minHeight,
    'top-panel': panel.top,
    'left-panel': panel.left,
    // What the panel takes beyond its own width (the zoom column): CSS adds `--map-panel-width`.
    'right-panel': panel.right - PANEL_WIDTH,
    'bottom-panel': panel.bottom,
  });
  const hatch = (HATCH * wv) / HATCH_WIDTH;
  const shown = municipalities.filter((t) => t.d && (t.transform || t.code === selected));
  const [ix0, iy0, ix1, iy1] = inset.box;

  return (
    <div className={styles.staticScreen} data-static-map="screen">
      <div className={styles.staticArea} data-static-map="area" style={style}>
        <svg
          className={styles.staticWorld}
          data-static-map="world"
          viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`}
          role="img"
          aria-label={title}
        >
          {shown.some((t) => t.fill === 'unknown') ? (
            <defs>
              <pattern id="static-hatch" patternUnits="userSpaceOnUse" width={hatch} height={hatch}>
                <rect className={styles.hatchBg} width={hatch} height={hatch} />
                <path className={styles.hatchLine} d={`M0 ${hatch}L${hatch} 0`} />
              </pattern>
            </defs>
          ) : null}
          {department ? null : departments.map((t) => (t.d ? <path key={t.code} d={t.d} /> : null))}
          {outline ? (
            <path
              className={styles.staticRegion}
              d={outline}
              data-dimmed={selected ? 'true' : undefined}
            />
          ) : null}
          {inset.placement === 'corner' ? null : (
            <rect
              className={styles.insetBox}
              x={ix0}
              y={iy0}
              width={ix1 - ix0}
              height={iy1 - iy0}
            />
          )}
          {inset.placement === 'map'
            ? inset.islands.map((i) =>
                i.d ? <path key={i.code} d={i.d} transform={i.transform} /> : null,
              )
            : null}
          {shown.map((t) => (
            <path
              key={t.code}
              d={t.d}
              transform={t.transform}
              fill={t.fill === 'unknown' ? 'url(#static-hatch)' : undefined}
              data-selected={t.code === selected ? 'true' : undefined}
              data-dimmed={t.dimmed ? 'true' : undefined}
            />
          ))}
        </svg>
        <div aria-hidden="true">
          {labels.map((l) => (
            <span
              key={l.text}
              className={`${LABEL_CLASS[l.anchor] ?? ''} ${styles.staticLabel}`}
              style={{
                ...vars({ lx: l.x - x0, ly: l.y - y0 }),
                transform: ANCHOR_TRANSFORM[l.anchor],
              }}
            >
              {l.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
