import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { LegendKey } from '../../../../components/ui/LegendKey/LegendKey';
import type { Box } from '../geometry';
import { FullscreenMap, type FullscreenMapProps } from './FullscreenMap';
import styles from './MapWithLegend.module.css';

/** Fill of a territory: neutral (locates, measures nothing), a risk level, or «Sin datos» (hatch). */
export type MapFill = 'neutral' | 'low' | 'medium' | 'high' | 'unknown';

export interface MapTerritory {
  code: string;
  /** Projected SVG path (see `shapesOf`). */
  d: string;
  fill: MapFill;
  /** The shape's `<title>`: name and value («Medellín: 356.935 contratos»). */
  description: string;
}

/** Place label in projected units; `dy` moves it in screen pixels. */
export interface MapLabel {
  text: string;
  x: number;
  y: number;
  dy?: number;
}

/** Box at the top left (the archipelago on the national map), named under the box. */
export interface MapInset {
  territories: MapTerritory[];
  box: Box;
  label: string;
}

export interface MapWithLegendProps {
  /** `inline` (por defecto): el mapa en un marco dentro de la página. `fullscreen`: ver `FullscreenMapProps`. */
  variant?: 'inline';
  /** The map's `<title>`: what it shows and where the values are («… en la tabla de municipios»). */
  title: string;
  territories: MapTerritory[];
  /** Box fitted to the frame on «Ver todo». */
  box: Box;
  inset?: MapInset;
  labels?: MapLabel[];
  /** Code of the selected territory: 2.5 px outline in the text colour, drawn on top. */
  selected?: string;
  /** A click or tap without moving chooses a territory. */
  onSelect?: (code: string) => void;
  /** Maximum height in px. By default 640 from 960 px wide, or 62 % of the window below. */
  maxHeight?: number;
  /**
   * `view-transition-name` of the map drawing, for a page that animates between views (the Map
   * page uses `map-zoom`). Only one map on the page may carry a given name.
   */
  transitionName?: string;
}

const MAX_ZOOM = 12;
const PAD = 12;
const PAD_RIGHT = 44 + 16; // room for the zoom buttons: shapes never sit under them
const HATCH = 7; // «Sin datos» hatch size in screen pixels

const FILL_CLASS: Record<Exclude<MapFill, 'unknown'>, string | undefined> = {
  neutral: styles.neutral,
  low: styles.low,
  medium: styles.medium,
  high: styles.high,
};

function defaultMaxHeight() {
  if (typeof window === 'undefined') return 640;
  return window.innerWidth >= 960 ? 640 : Math.round(window.innerHeight * 0.62);
}

export type { FullscreenMapProps } from './FullscreenMap';

/** Map of territories: inline in a page (default) or at full screen under a sheet (`variant="fullscreen"`). */
export function MapWithLegend(props: MapWithLegendProps | FullscreenMapProps) {
  return props.variant === 'fullscreen' ? <FullscreenMap {...props} /> : <InlineMap {...props} />;
}

/**
 * Map of territories. Zoom with buttons, Ctrl + wheel and pinch; a mouse drags at any zoom; a click
 * without moving chooses. On touch, one finger scrolls the page at full view. The keyboard reaches
 * every territory through the data table that always comes with the map.
 */
function InlineMap({
  title,
  territories,
  box,
  inset,
  labels = [],
  selected,
  onSelect,
  maxHeight,
  transitionName,
}: MapWithLegendProps) {
  const hatchId = `hatch-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const titleId = `${hatchId}-title`;
  const frame = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const zoomControls = useRef<HTMLFieldSetElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState({ z: 1, cx: 0, cy: 0 });
  const [hovered, setHovered] = useState<string>();
  const [dragging, setDragging] = useState(false);

  const [x0, y0, x1, y1] = box;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const W = width;
  const H = W
    ? Math.max(240, Math.min(Math.round((W * bh) / bw), maxHeight ?? defaultMaxHeight()))
    : 0;
  const k = W ? Math.min((W - PAD - PAD_RIGHT) / bw, (H - 2 * PAD) / bh) : 1;
  const OX = (PAD + W - PAD_RIGHT) / 2;
  const s = k * view.z;
  const moved = view.z > 1 || view.cx !== (x0 + x1) / 2 || view.cy !== (y0 + y1) / 2;

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // A new view (another box) starts whole and centred: zoom resets when the view changes.
  // Before paint, so a new view never shows one frame with the previous centre.
  useLayoutEffect(() => {
    setView({ z: 1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  }, [x0, y0, x1, y1]);

  const clamp = useCallback(
    (v: { z: number; cx: number; cy: number }) => ({
      z: v.z,
      cx: Math.min(x1, Math.max(x0, v.cx)),
      cy: Math.min(y1, Math.max(y0, v.cy)),
    }),
    [x0, y0, x1, y1],
  );

  /** Zoom by a factor around a screen point (by default, the map's centre). */
  const zoom = useCallback(
    (factor: number, px?: number, py?: number) =>
      setView((v) => {
        const z = Math.min(MAX_ZOOM, Math.max(1, v.z * factor));
        if (z === 1) return { z, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
        const sx = px ?? OX;
        const sy = py ?? H / 2;
        const s0 = k * v.z;
        const s1 = k * z;
        const mx = v.cx + (sx - OX) / s0;
        const my = v.cy + (sy - H / 2) / s0;
        return clamp({ z, cx: mx - (sx - OX) / s1, cy: my - (sy - H / 2) / s1 });
      }),
    [k, OX, H, x0, y0, x1, y1, clamp],
  );

  // Ctrl + wheel zooms; the plain wheel keeps scrolling the page.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(e.deltaY < 0 ? 1.25 : 0.8, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom]);

  // Gesture state lives outside React: it changes on every move.
  const gesture = useRef({
    points: new Map<number, [number, number]>(),
    start: [0, 0] as [number, number],
    moved: false,
    pinch: 0,
  });

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    g.points.set(e.pointerId, [e.clientX, e.clientY]);
    g.moved = false;
    g.start = [e.clientX, e.clientY];
    if (g.points.size === 2) {
      const [a, b] = [...g.points.values()];
      if (a && b) g.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    const previous = g.points.get(e.pointerId);
    if (!previous) return;
    g.points.set(e.pointerId, [e.clientX, e.clientY]);
    if (Math.hypot(e.clientX - g.start[0], e.clientY - g.start[1]) > 6) g.moved = true;
    if (g.points.size === 2) {
      const [a, b] = [...g.points.values()];
      if (!a || !b) return;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (g.pinch) {
        const r = e.currentTarget.getBoundingClientRect();
        zoom(d / g.pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
      }
      g.pinch = d;
    } else if ((view.z > 1 || e.pointerType === 'mouse') && g.moved) {
      if (!dragging) {
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      const dx = e.clientX - previous[0];
      const dy = e.clientY - previous[1];
      setView((v) => clamp({ z: v.z, cx: v.cx - dx / (k * v.z), cy: v.cy - dy / (k * v.z) }));
    }
  };

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    const tap = g.points.size === 1 && !g.moved;
    g.points.delete(e.pointerId);
    if (g.points.size < 2) g.pinch = 0;
    if (!g.points.size) setDragging(false);
    if (tap && e.type === 'pointerup') {
      const code = (e.target as Element).closest?.('path[data-code]')?.getAttribute('data-code');
      if (code) onSelect?.(code);
    }
  };

  const onPointerOver = (e: ReactPointerEvent<SVGSVGElement>) => {
    const code = (e.target as Element).closest?.('path[data-code]')?.getAttribute('data-code');
    if (code && code !== hovered) setHovered(code);
  };

  // The shape under the pointer is drawn after its neighbours so none covers its outline; the
  // selected one always stays on top (spec, decision 12b).
  const ordered = useMemo(() => {
    const rank = (t: MapTerritory) => (t.code === selected ? 2 : t.code === hovered ? 1 : 0);
    return [...territories].sort((a, b) => rank(a) - rank(b));
  }, [territories, hovered, selected]);

  const toScreen = (x: number, y: number) =>
    [OX + (x - view.cx) * s, H / 2 + (y - view.cy) * s] as const;

  // Inset: fixed width, height from its content.
  let insetFrame: { x: number; y: number; w: number; h: number; ks: number } | null = null;
  if (inset && W) {
    const [ix0, iy0, ix1, iy1] = inset.box;
    const w = Math.max(76, Math.min(120, W * 0.15));
    const h = ((w - 16) * (iy1 - iy0)) / (ix1 - ix0) + 16;
    insetFrame = { x: 8, y: 8, w, h, ks: Math.min((w - 16) / (ix1 - ix0), (h - 16) / (iy1 - iy0)) };
  }

  const shape = (t: MapTerritory) => (
    <path
      key={t.code}
      d={t.d}
      className={t.fill === 'unknown' ? styles.unknown : FILL_CLASS[t.fill]}
      fill={t.fill === 'unknown' ? `url(#${hatchId})` : undefined}
      data-code={t.code}
      data-selected={t.code === selected ? 'true' : undefined}
    >
      <title>{t.description}</title>
    </path>
  );

  const hatch = HATCH / s;

  return (
    <div className={styles.frame} ref={frame}>
      {W > 0 && (
        <svg
          ref={svg}
          className={styles.map}
          role="img"
          aria-labelledby={titleId}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          data-zoomed={view.z > 1 ? 'true' : undefined}
          data-view-transition={transitionName}
          style={transitionName ? { viewTransitionName: transitionName } : undefined}
          data-dragging={dragging ? 'true' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerOver={onPointerOver}
        >
          <title id={titleId}>{title}</title>
          <defs>
            <pattern id={hatchId} patternUnits="userSpaceOnUse" width={hatch} height={hatch}>
              <rect className={styles.hatchBg} width={hatch} height={hatch} />
              <path className={styles.hatchLine} d={`M0 ${hatch}L${hatch} 0`} />
            </pattern>
          </defs>
          <g className={styles.outline}>
            <g transform={`matrix(${s} 0 0 ${s} ${OX - view.cx * s} ${H / 2 - view.cy * s})`}>
              {ordered.map(shape)}
            </g>
          </g>
          {inset && insetFrame && (
            <>
              <g className={styles.outline}>
                <g
                  transform={`matrix(${insetFrame.ks} 0 0 ${insetFrame.ks} ${
                    insetFrame.x +
                    insetFrame.w / 2 -
                    ((inset.box[0] + inset.box[2]) / 2) * insetFrame.ks
                  } ${
                    insetFrame.y +
                    insetFrame.h / 2 -
                    ((inset.box[1] + inset.box[3]) / 2) * insetFrame.ks
                  })`}
                >
                  {inset.territories.map(shape)}
                </g>
              </g>
              <rect
                className={styles.insetFrame}
                x={insetFrame.x}
                y={insetFrame.y}
                width={insetFrame.w}
                height={insetFrame.h}
              />
            </>
          )}
        </svg>
      )}
      {W > 0 && (
        <div aria-hidden="true">
          {labels.map((label) => {
            const [x, yBase] = toScreen(label.x, label.y);
            const y = yBase + (label.dy ?? 0);
            if (x < 0 || y < 0 || x > W || y > H) return null;
            return (
              <span
                key={label.text}
                className={styles.label}
                style={{ left: `${(100 * x) / W}%`, top: `${(100 * y) / H}%` }}
              >
                {label.text}
              </span>
            );
          })}
          {inset && insetFrame && (
            <span
              className={`${styles.label} ${styles.insetLabel}`}
              style={{
                left: insetFrame.x,
                top: insetFrame.y + insetFrame.h + 8,
                width: insetFrame.w,
              }}
            >
              {inset.label}
            </span>
          )}
        </div>
      )}
      <fieldset className={styles.zoom} ref={zoomControls}>
        <legend className={styles.srOnly}>Zoom del mapa</legend>
        <Button
          variant="secondary"
          label="Acercar"
          hideLabel
          icon={<Icon name="plus" />}
          onClick={() => zoom(1.5)}
        />
        <Button
          variant="secondary"
          label="Alejar"
          hideLabel
          icon={<Icon name="minus" />}
          onClick={() => zoom(1 / 1.5)}
        />
        {/* Only when there is something to undo: zoomed in or moved away from the starting frame. */}
        {moved ? (
          <Button
            variant="secondary"
            label="Ver todo"
            hideLabel
            icon={<Icon name="maximize" />}
            onClick={() => {
              zoom(1 / MAX_ZOOM);
              // The button disappears; keyboard focus stays in the zoom controls.
              zoomControls.current?.querySelector('button')?.focus();
            }}
          />
        ) : null}
      </fieldset>
    </div>
  );
}

export interface MapLegendItem {
  fill: MapFill;
  label: string;
}

/** The legend says what the colour measures; each key carries its words; notes say what it does not. */
export function MapLegend({
  title,
  items,
  notes = [],
}: {
  title: string;
  items: MapLegendItem[];
  notes?: string[];
}) {
  return (
    <div className={styles.legend}>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.fill}>
            <LegendKey kind={item.fill} />
            {item.label}
          </li>
        ))}
      </ul>
      {notes.map((note) => (
        <p key={note} className={styles.note}>
          {note}
        </p>
      ))}
    </div>
  );
}
