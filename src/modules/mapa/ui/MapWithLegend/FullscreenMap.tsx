import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { SheetFrame } from '../../../../components/ui/BottomSheet/BottomSheet';
import { Button } from '../../../../components/ui/Button/Button';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { unionBox } from '../geometry';
import { ARCHIPELAGO, FILL, type FullscreenTerritory, type FullscreenView } from '../mapModel';
import {
  type Camera,
  clampPan,
  durationOf,
  easingOf,
  fitCamera,
  flightDuration,
  flightFrame,
  frameWithin,
  freeRect,
  isNearCountry,
  zoomAround,
  zoomLimits,
} from './camera';
import styles from './MapWithLegend.module.css';

export interface FullscreenMapProps extends FullscreenView {
  variant: 'fullscreen';
  /** Cómo se ve la ficha encima (`onLayoutChange` de `BottomSheet`): el mapa se encuadra en lo que queda libre. Sin ella, nada tapa el mapa. */
  sheet?: SheetFrame;
  /** Un toque sin moverse elige: el código DANE del lugar tocado (departamento, municipio o «88» del recuadro). */
  onSelect?: (code: string) => void;
  /** Alejar desde un departamento o municipio hasta cerca del encuadre del país: la página vuelve a Colombia. */
  onZoomToCountry?: () => void;
  /** Oculta el zoom y el recuadro de esquina mientras algo los cubre, p. ej. la lista del buscador abierta (v1.6.0). */
  controlsHidden?: boolean;
  /** Página generada sin JavaScript (ADR 0003): `StaticFullscreenMap`, encuadrado solo con CSS. */
  prerendered?: boolean;
}

const DRAG_THRESHOLD = 6; // px: a press that moves less is a tap (spec §3)
const ZOOM_STEP = 1.8;
const WHEEL_RATE = 0.0022; // zoom factor per wheel delta unit: e^(−delta · rate)
const WHEEL_SETTLE_MS = 250; // after the last wheel tick, check whether the map went back to the country
const HATCH = 7; // «Sin datos» hatch size in screen pixels
const LABEL_INSET = 4; // px between an island's name and the dashed frame
const SHEET_CLEARANCE = 8; // px the sheet keeps clear below a floating control
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

type Duration = 'short' | 'base' | 'long';
const DURATION_TOKEN: Record<Duration, string> = {
  short: '--el-duration-short',
  base: '--el-duration-base',
  long: '--el-duration-long',
};

// Where a name sits around its point: above the chosen place, below an island, centred on Bogotá.
const ANCHOR_TRANSFORM: Record<string, string> = {
  above: 'translate(-50%, calc(-100% - var(--el-space-4)))',
  below: 'translate(-50%, var(--el-space-4))',
  'below-start': 'translateY(var(--el-space-4))',
  centre: 'translate(-50%, -50%)',
};
const LABEL_CLASS: Record<string, string | undefined> = {
  above: styles.placeLabel,
  below: styles.islandName,
  'below-start': styles.insetName,
  centre: styles.islandLabel,
};

type Gesture =
  | { type: 'pan'; start: [number, number]; cam: Camera; travel: number; code?: string }
  | { type: 'pinch'; distance: number; middle: [number, number] };

const codeAt = (target: EventTarget | null) =>
  target instanceof Element
    ? (target.closest('[data-code]')?.getAttribute('data-code') ?? undefined)
    : undefined;

/**
 * The map at full screen (map spec of 2026-11-17): one camera over one map, framed in the free area
 * over the sheet. One finger or the mouse always drags, two fingers, the wheel or + / − zoom, a still
 * tap chooses. Flights between places use the motion tokens; with reduced motion the frame jumps.
 */
export function FullscreenMap({
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
  home,
  labels,
  sheet,
  onSelect,
  onZoomToCountry,
  controlsHidden = false,
}: FullscreenMapProps) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const hatchId = `hatch-${id}`;
  const titleId = `${hatchId}-title`;
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const patternRef = useRef<SVGPatternElement>(null);
  const insetPatternRef = useRef<SVGPatternElement>(null);
  const cornerRef = useRef<HTMLButtonElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLFieldSetElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [moved, setMoved] = useState(false);
  const [candidate, setCandidate] = useState<string>();
  const [dragging, setDragging] = useState(false);
  // The zoom buttons and the corner inset hide when the sheet reaches their strip (short screens, 200 % text).
  const [covered, setCovered] = useState({ zoom: false, corner: false });
  // The camera and the gestures change on every frame: they live outside React and are applied to the DOM.
  const cam = useRef<Camera>({ x: 0, y: 0, k: 1 });
  const flight = useRef(0);
  const movedRef = useRef(false);
  const sheetHeight = useRef(0);
  const pointers = useRef(new Map<number, [number, number]>());
  const gesture = useRef<Gesture | null>(null);
  const wheelTimer = useRef(0);
  const last = useRef<{ view: string; department?: string; layout: string } | null>(null);
  // Until the first frame is painted, the sheet may still settle (decision 32): the map jumps with it.
  const painted = useRef(false);

  const isPanel = sheet?.isPanel ?? false;
  const sheetFull = !isPanel && sheet?.shown === 'full';
  // Nothing is framed yet before the map has a size (e.g. a hidden page): no controls to press either.
  const hideControls = sheetFull || !size.w || controlsHidden;

  /** The free area and the cameras for the current props (read again on every frame of a flight). */
  const geometry = () => {
    const rect = freeRect({
      width: size.w,
      height: size.h,
      sheetHeight: sheetHeight.current,
      isPanel,
      corner: inset.placement === 'corner',
      roomAbove: labels.some((l) => l.anchor === 'above'),
    });
    const homeK = fitCamera(home, rect, FILL.place).k;
    return {
      rect,
      target: frameWithin(focus, rect, fill, context, FILL.place),
      homeK,
      clamp: (c: Camera) => clampPan(c, home, rect),
      leave: () => {
        if (department && isNearCountry(cam.current.k, homeK)) onZoomToCountry?.();
      },
    };
  };
  const live = useRef(geometry);
  useLayoutEffect(() => {
    live.current = geometry;
  });

  const apply = () => {
    const { x, y, k } = cam.current;
    worldRef.current?.setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
    patternRef.current?.setAttribute('patternTransform', `scale(${1 / k})`);
    // The islands are drawn enlarged: their hatch is shrunk back by the same factor.
    const islands = insetPatternRef.current;
    islands?.setAttribute('patternTransform', `scale(${1 / (k * Number(islands.dataset.scale))})`);
    for (const el of Array.from(labelsRef.current?.children ?? [])) {
      if (!(el instanceof HTMLElement)) continue;
      let sx = Math.round(Number(el.dataset.x) * k + x);
      const sy = Math.round(Number(el.dataset.y) * k + y);
      if (el.dataset.min !== undefined) {
        // An island's name stays inside the archipelago's dashed frame.
        const half = el.offsetWidth / 2 + LABEL_INSET;
        const lo = Number(el.dataset.min) * k + x + half;
        const hi = Number(el.dataset.max) * k + x - half;
        if (lo <= hi) sx = Math.round(Math.min(hi, Math.max(lo, sx)));
      }
      el.style.transform = `translate(${sx}px, ${sy}px) ${ANCHOR_TRANSFORM[el.dataset.anchor ?? ''] ?? ''}`;
    }
  };
  // New labels come without a position.
  useLayoutEffect(apply);

  useLayoutEffect(() => {
    const top = isPanel || !sheet ? Number.POSITIVE_INFINITY : size.h - sheet.height;
    const reaches = (el: HTMLElement | null) =>
      el !== null && el.offsetTop + el.offsetHeight + SHEET_CLEARANCE > top;
    const next = { zoom: reaches(zoomRef.current), corner: reaches(cornerRef.current) };
    setCovered((c) => (c.zoom === next.zoom && c.corner === next.corner ? c : next));
  });

  const markMoved = (value: boolean) => {
    movedRef.current = value;
    setMoved(value);
  };

  const stopFlight = () => {
    cancelAnimationFrame(flight.current);
    flight.current = 0;
  };

  /** Flies to `to` (read on every frame, so a sheet that settles mid-flight bends the end). */
  const fly = (to: () => Camera, duration: Duration, then?: () => void) => {
    stopFlight();
    const frame = frameRef.current;
    if (!frame) return;
    const style = getComputedStyle(frame);
    const ms = durationOf(style.getPropertyValue(DURATION_TOKEN[duration]));
    if (ms === 0 || window.matchMedia?.(REDUCED_MOTION).matches) {
      cam.current = to();
      apply();
      then?.();
      return;
    }
    const ease = easingOf(style.getPropertyValue('--el-ease-standard'));
    const { rect } = live.current();
    const anchor: [number, number] = [rect.x + rect.w / 2, rect.y + rect.h / 2];
    const from = cam.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      cam.current = flightFrame(from, to(), anchor, ease(t));
      apply();
      if (t < 1) flight.current = requestAnimationFrame(step);
      else {
        flight.current = 0;
        then?.();
      }
    };
    flight.current = requestAnimationFrame(step);
  };

  // Measured before the first paint too, so the map never shows a frame without its camera.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(flight.current);
      clearTimeout(wheelTimer.current);
    };
  }, []);

  // Decides how the camera follows a change: a flight to a new place, a short refit when the sheet
  // settles at another height (only if the person has not moved the map), a jump on a resize.
  const reframe = (layout: string, view: string) => {
    if (sheet && !sheetFull) sheetHeight.current = sheet.height; // the full sheet keeps the half's frame
    if (!size.w) return; // the sheet may report before the map has a size: its height is kept above
    const previous = last.current;
    last.current = { view, department, layout };
    const target = () => live.current().target;
    if (!previous) {
      cam.current = target();
      apply();
      requestAnimationFrame(() => {
        painted.current = true;
      });
      return;
    }
    if (previous.view !== view) {
      markMoved(false);
      fly(target, flightDuration(previous.department, department));
      return;
    }
    if (movedRef.current || flight.current) return; // a running flight already follows the new frame
    const [size0, sheet0] = previous.layout.split('|');
    const [size1] = layout.split('|');
    // A resize, or the sheet's first measures (before the first paint), frame at once; a sheet that
    // changes height later, with a short flight.
    if (size0 !== size1 || sheet0 === '0' || !painted.current) {
      cam.current = target();
      apply();
    } else if (previous.layout !== layout) fly(target, 'short');
  };
  // The latest `reframe`, set before the effect below runs in the same commit: it must see this render's sheet.
  const reframeRef = useRef(reframe);
  useLayoutEffect(() => {
    reframeRef.current = reframe;
  });
  const layout = `${size.w}x${size.h}x${isPanel}|${sheetFull ? 'full' : (sheet?.height ?? 0)}`;
  const view = `${department ?? ''}/${selected ?? ''}`;
  useLayoutEffect(() => reframeRef.current(layout, view), [layout, view]);

  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = frameRef.current?.getBoundingClientRect();
    return [e.clientX - (r?.left ?? 0), e.clientY - (r?.top ?? 0)];
  };

  const handleWheel = useEffectEvent((e: WheelEvent) => {
    e.preventDefault(); // the page never scrolls: the wheel always zooms the map
    stopFlight();
    const g = live.current();
    const factor = Math.exp(-e.deltaY * WHEEL_RATE);
    cam.current = g.clamp(zoomAround(cam.current, local(e), factor, zoomLimits(g.homeK)));
    apply();
    markMoved(true);
    clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => live.current().leave(), WHEEL_SETTLE_MS);
  });
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const listener = (e: WheelEvent) => handleWheel(e);
    el.addEventListener('wheel', listener, { passive: false });
    return () => el.removeEventListener('wheel', listener);
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // only the main button drags and chooses
    const code = codeAt(e.target);
    // On touch there is no hover: the outline shows while the finger rests on the place (decision 25).
    if (e.pointerType !== 'mouse') setCandidate(code);
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    // Touching the map mid-flight keeps the camera where it is: the person took it over.
    if (flight.current) markMoved(true);
    stopFlight();
    const [a, b] = [...pointers.current.values()];
    if (a && b) {
      gesture.current = {
        type: 'pinch',
        distance: Math.hypot(a[0] - b[0], a[1] - b[1]),
        middle: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      };
    } else if (a) {
      gesture.current = { type: 'pan', start: a, cam: { ...cam.current }, travel: 0, code };
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) {
      if (e.pointerType === 'mouse') setCandidate(codeAt(e.target));
      return;
    }
    pointers.current.set(e.pointerId, local(e));
    const [a, b] = [...pointers.current.values()];
    const geo = live.current();
    if (g.type === 'pan' && a && !b) {
      const dx = a[0] - g.start[0];
      const dy = a[1] - g.start[1];
      g.travel = Math.max(g.travel, Math.hypot(dx, dy));
      if (g.travel < DRAG_THRESHOLD) return;
      if (!dragging) {
        setDragging(true);
        setCandidate(undefined); // a drag is not a choice
      }
      if (!movedRef.current) markMoved(true);
      cam.current = geo.clamp({ k: g.cam.k, x: g.cam.x + dx, y: g.cam.y + dy });
      apply();
    } else if (g.type === 'pinch' && a && b) {
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const middle: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const panned = {
        k: cam.current.k,
        x: cam.current.x + middle[0] - g.middle[0],
        y: cam.current.y + middle[1] - g.middle[1],
      };
      cam.current = geo.clamp(
        zoomAround(panned, middle, distance / g.distance, zoomLimits(geo.homeK)),
      );
      g.distance = distance;
      g.middle = middle;
      if (!movedRef.current) markMoved(true);
      apply();
    }
  };

  const handlePointerEnd = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (e.pointerType !== 'mouse') setCandidate(undefined);
    const [rest] = [...pointers.current.values()];
    if (g?.type === 'pinch' && rest) {
      // The finger that stays drags on; it never chooses.
      gesture.current = {
        type: 'pan',
        start: rest,
        cam: { ...cam.current },
        travel: DRAG_THRESHOLD,
      };
      setDragging(true);
    } else if (g?.type === 'pinch') live.current().leave();
    else if (g && e.type === 'pointerup' && g.travel < DRAG_THRESHOLD && g.code) onSelect?.(g.code);
  };

  const zoomBy = (factor: number) => {
    const g = live.current();
    const centre: [number, number] = [g.rect.x + g.rect.w / 2, g.rect.y + g.rect.h / 2];
    const to = g.clamp(zoomAround(cam.current, centre, factor, zoomLimits(g.homeK)));
    markMoved(true);
    fly(() => to, 'short', factor < 1 ? () => live.current().leave() : undefined);
  };

  const showAll = () => {
    markMoved(false);
    fly(() => live.current().target, 'base');
    // The button goes away: focus moves to «Acercar» (decision 12c).
    zoomRef.current?.querySelector('button')?.focus();
  };

  // The candidate is drawn above its neighbours and the chosen place above everything (decisions 12b and 25).
  const rank = (t: FullscreenTerritory) => (t.code === selected ? 2 : t.code === candidate ? 1 : 0);
  const ordered = (list: FullscreenTerritory[]) => [...list].sort((a, b) => rank(a) - rank(b));

  const shape = (t: FullscreenTerritory) => (
    <path
      key={t.code}
      d={t.d}
      transform={t.transform}
      className={t.dimmed ? styles.dimmed : t.fill === 'unknown' ? undefined : styles.neutral}
      fill={
        t.fill === 'unknown' ? `url(#${t.transform ? `${hatchId}-inset` : hatchId})` : undefined
      }
      data-code={t.code}
      data-selected={t.code === selected ? 'true' : undefined}
      data-candidate={t.code === candidate ? 'true' : undefined}
    >
      <title>{t.description}</title>
    </path>
  );

  const [ix0, iy0, ix1, iy1] = inset.box;
  // The corner inset frames the islands themselves, so they fill its 56 px.
  const [cx0, cy0, cx1, cy1] = unionBox(inset.islands.map((i) => i.box));

  return (
    <div ref={frameRef} className={styles.screen}>
      <svg
        ref={svgRef}
        className={styles.screenMap}
        role="img"
        aria-labelledby={titleId}
        data-dragging={dragging ? 'true' : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setCandidate(undefined);
        }}
      >
        <title id={titleId}>{title}</title>
        <defs>
          <pattern
            ref={patternRef}
            id={hatchId}
            patternUnits="userSpaceOnUse"
            width={HATCH}
            height={HATCH}
          >
            <rect className={styles.hatchBg} width={HATCH} height={HATCH} />
            <path className={styles.hatchLine} d={`M0 ${HATCH}L${HATCH} 0`} />
          </pattern>
          <pattern
            ref={insetPatternRef}
            id={`${hatchId}-inset`}
            patternUnits="userSpaceOnUse"
            width={HATCH}
            height={HATCH}
            data-scale={inset.scale}
          >
            <rect className={styles.hatchBg} width={HATCH} height={HATCH} />
            <path className={styles.hatchLine} d={`M0 ${HATCH}L${HATCH} 0`} />
          </pattern>
        </defs>
        <g ref={worldRef}>
          <g>{ordered(departments).map(shape)}</g>
          {inset.placement === 'corner' ? null : (
            <g>
              {/* The dashed frame never comes to the front: it would cover the islands (decision 25). */}
              <rect
                className={styles.insetBox}
                x={ix0}
                y={iy0}
                width={ix1 - ix0}
                height={iy1 - iy0}
                data-code={ARCHIPELAGO}
              >
                <title>{inset.label}</title>
              </rect>
              {inset.placement === 'map'
                ? inset.islands.map((island) => (
                    <path
                      key={island.code}
                      d={island.d}
                      transform={island.transform}
                      className={styles.neutral}
                      data-code={ARCHIPELAGO}
                      data-candidate={candidate === ARCHIPELAGO ? 'true' : undefined}
                    >
                      <title>{inset.label}</title>
                    </path>
                  ))
                : null}
            </g>
          )}
          {/* Keyed by department: its municipalities fade in when it opens. */}
          {department ? (
            <g key={department} className={styles.appear}>
              {ordered(municipalities).map(shape)}
            </g>
          ) : null}
          {outline ? <path className={styles.regionOutline} d={outline} /> : null}
        </g>
      </svg>
      <div ref={labelsRef} aria-hidden="true" hidden={sheetFull}>
        {labels.map((label) => (
          <span
            key={label.text}
            className={LABEL_CLASS[label.anchor]}
            data-x={label.x}
            data-y={label.y}
            data-anchor={label.anchor}
            data-min={label.within?.[0]}
            data-max={label.within?.[1]}
          >
            {label.text}
          </span>
        ))}
      </div>
      {inset.placement === 'corner' ? (
        <button
          ref={cornerRef}
          type="button"
          className={styles.corner}
          data-panel={isPanel ? 'true' : undefined}
          data-covered={covered.corner ? 'true' : undefined}
          hidden={hideControls}
          aria-label={`Ir a ${inset.label}`}
          onClick={() => onSelect?.(ARCHIPELAGO)}
        >
          <svg
            viewBox={`${cx0} ${cy0} ${cx1 - cx0} ${cy1 - cy0}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {inset.islands.map((island) => (
              <path key={island.code} d={island.d} transform={island.transform} />
            ))}
          </svg>
          {/* Decision 29: «San Andrés y» / «Providencia», never a lone word. */}
          <span>{inset.label.replace(/ (?=.* )/g, '\u00a0')}</span>
        </button>
      ) : null}
      <fieldset
        ref={zoomRef}
        className={styles.screenZoom}
        data-panel={isPanel ? 'true' : undefined}
        data-covered={covered.zoom ? 'true' : undefined}
        hidden={hideControls}
      >
        <legend className={styles.srOnly}>Zoom del mapa</legend>
        <Button
          variant="secondary"
          label="Acercar"
          hideLabel
          icon={<Icon name="plus" />}
          onClick={() => zoomBy(ZOOM_STEP)}
        />
        <Button
          variant="secondary"
          label="Alejar"
          hideLabel
          icon={<Icon name="minus" />}
          onClick={() => zoomBy(1 / ZOOM_STEP)}
        />
        {/* Only with the map zoomed or moved (decision 12c). */}
        {moved ? (
          <Button
            variant="secondary"
            label="Ver todo"
            hideLabel
            icon={<Icon name="maximize" />}
            onClick={showAll}
          />
        ) : null}
      </fieldset>
    </div>
  );
}
