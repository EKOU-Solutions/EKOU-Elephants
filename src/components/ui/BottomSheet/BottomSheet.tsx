import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styles from './BottomSheet.module.css';
import {
  type Detent,
  type Heights,
  measureHeights,
  nextDetent,
  shownDetent,
  snapDetent,
} from './detents';

export type { Detent } from './detents';

/** Cómo se ve la ficha ahora, para que el encabezado adapte sus botones. */
export type SheetLayout = {
  /** La altura que se ve: con el encabezado sin espacio, `half` se ve como `full`. */
  shown: Detent;
  /** Panel fijo de escritorio (contenedor de 1024 px o más): no hay alturas. */
  isPanel: boolean;
};

/** Cómo se ve la ficha y cuánto tapa desde abajo, para encuadrar lo que queda libre encima. */
export type SheetFrame = SheetLayout & {
  /** Alto que tapa la ficha, en px (0 en el panel). */
  height: number;
  /** El `contentKey` con el que se midió: al cambiar de contenido, el marco anterior llega antes que el suyo. */
  contentKey?: string;
};

type Props = {
  /** Nombre accesible de la ficha («Ficha del lugar»). */
  label: string;
  /** Lo que se ve con la ficha recogida: rótulo de una línea y `h1`. */
  title: ReactNode;
  /** El resto del encabezado (cifra, fuente y acciones), según cómo se ve la ficha: «Volver al mapa» con `shown === 'full'`, sin botón de altura en el panel. */
  header: (layout: SheetLayout) => ReactNode;
  /** El cuerpo: solo se ve y se recorre con la ficha completa (o en el panel de escritorio). */
  children: ReactNode;
  /** Altura pedida, controlada por quien usa la ficha. Al llegar por un enlace, `half`. */
  detent: Detent;
  /** Pide otra altura: borde, arrastre o Escape. Los botones del encabezado la piden por su cuenta. */
  onDetentChange: (detent: Detent) => void;
  /** Avisa cada vez que la ficha queda en otra altura o cambia de medida (no durante el arrastre): el mapa de debajo se encuadra con ella. */
  onLayoutChange?: (frame: SheetFrame) => void;
  /**
   * Qué muestra la ficha (el lugar, v1.6.0). Cuando cambia, la ficha no anuncia la altura con la que
   * llega el contenido nuevo (ni el ajuste que pida quien la usa al medirla): quien la usa ya anuncia
   * el cambio de lugar, y dos anuncios a la vez se pisan. Los cambios siguientes sí se anuncian.
   */
  contentKey?: string;
  /**
   * HTML generado sin JavaScript (páginas de ADR 0003): sin medidas, la ficha queda a media altura solo
   * con CSS (desde 1024 px, el panel, con sus enlaces activos) y su cuerpo debajo, fuera de la vista y
   * del orden del foco. En el navegador no se usa:
   * al montar, la ficha se mide como siempre.
   */
  prerendered?: boolean;
};

const DETENT_NAME: Record<Detent, string> = {
  peek: 'Ficha recogida',
  half: 'Ficha a media altura',
  full: 'Ficha completa',
};
// Map spec §5 (decision 22): from this container width the sheet is a fixed side panel.
const PANEL_MIN_WIDTH = 1024;
// Pointer travel (px) below which a press is a tap, not a drag.
const DRAG_THRESHOLD = 4;
// While dragging, the sheet can go a bit below the collapsed height and springs back.
const MIN_DRAG_RATIO = 0.8;

type Drag = {
  pointerId: number;
  startY: number;
  startScroll: number;
  /** A header drag on the full sheet scrolls the body first and only moves the sheet past its top. */
  scrollsBody: boolean;
  fromDetent: Detent;
  from: number;
  height: number;
  time: number;
  velocity: number;
  travel: number;
};

/** Ficha deslizable sobre un mapa: tres alturas con un borde que es botón; desde 1024 px de ancho, panel fijo a la derecha. */
export function BottomSheet({
  label,
  title,
  header,
  children,
  detent,
  onDetentChange,
  onLayoutChange,
  contentKey,
  prerendered = false,
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressGripClick = useRef(false);
  const lastFocused = useRef<Element | null>(null);
  const lastEdge = useRef<Detent>('peek');
  const lastShown = useRef<Detent | null>(null);
  const lastContent = useRef(contentKey);
  const arriving = useRef(false);
  const arrivingFrame = useRef(0);
  const gripClickTimer = useRef(0);
  const [heights, setHeights] = useState<Heights>({ peek: 0, half: 0, full: 0 });
  const [measuredKey, setMeasuredKey] = useState(contentKey);
  const [headerFits, setHeaderFits] = useState(true);
  const [isPanel, setIsPanel] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // No transition until the first measured height has been painted: the sheet never slides on mount.
  const [settled, setSettled] = useState(false);

  const isMeasured = heights.full > 0;
  const shown = shownDetent(detent, headerFits);
  const isFull = shown === 'full';
  // The latest callback, so an inline function does not re-run the report on every render.
  const layoutListener = useRef(onLayoutChange);
  useLayoutEffect(() => {
    layoutListener.current = onLayoutChange;
  });
  const shownHeight = isPanel ? 0 : heights[shown];

  // Before paint, so the map under the sheet never shows a frame framed for the previous height.
  useLayoutEffect(() => {
    if (isMeasured)
      layoutListener.current?.({ shown, isPanel, height: shownHeight, contentKey: measuredKey });
  }, [isMeasured, shown, isPanel, shownHeight, measuredKey]);

  // Pending callbacks that outlive a run on purpose (see `arriving` and the grip click): they only
  // write refs, but must not stay behind once the sheet is gone.
  useEffect(
    () => () => {
      cancelAnimationFrame(arrivingFrame.current);
      clearTimeout(gripClickTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!isMeasured) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setSettled(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [isMeasured]);

  // Collapsed and half heights come from the content; full is the whole layer. Measured again, before
  // paint, when the content changes: its first frame already carries its own heights.
  useLayoutEffect(() => {
    const layer = layerRef.current;
    const titleBox = titleRef.current;
    const head = headRef.current;
    if (!layer || !titleBox || !head) return;
    const measure = () => {
      const measured = measureHeights(
        layer.clientHeight,
        titleBox.offsetTop + titleBox.offsetHeight,
        head.offsetTop + head.offsetHeight,
      );
      setIsPanel(layer.clientWidth >= PANEL_MIN_WIDTH);
      setHeaderFits(measured.headerFits);
      setHeights(measured.heights);
      setMeasuredKey(contentKey);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(layer);
    observer.observe(head);
    return () => observer.disconnect();
  }, [contentKey]);

  // Runs before the browser blurs a newly inert element, so focus can still be moved to the grip.
  useLayoutEffect(() => {
    if (shown !== 'full' && scrollRef.current) scrollRef.current.scrollTop = 0;
    const active = document.activeElement;
    // The grip is gone in the panel: if it had the focus, the title takes it.
    if (
      lastFocused.current &&
      !lastFocused.current.isConnected &&
      (!active || active === document.body)
    )
      titleRef.current?.focus();
    if (isPanel) return;
    if (active && sectionRef.current?.contains(active) && active.closest('[inert]'))
      gripRef.current?.focus();
  }, [shown, isPanel]);

  // Announces what is shown, only after a change: not on arrival, not in the panel, not while new
  // content arrives (the height it comes with, and any adjustment in the same task, stay silent).
  useEffect(() => {
    if (!isMeasured || isPanel) {
      lastShown.current = null;
      return;
    }
    if (lastContent.current !== contentKey) {
      lastContent.current = contentKey;
      arriving.current = true;
      // Not cancelled on the next run: an adjustment right after must still find it set.
      arrivingFrame.current = requestAnimationFrame(() => {
        arriving.current = false;
      });
      lastShown.current = shown;
      if (shown !== 'half') lastEdge.current = shown;
      return;
    }
    if (shown !== 'half') lastEdge.current = shown;
    if (lastShown.current !== null && lastShown.current !== shown && !arriving.current)
      setAnnouncement(DETENT_NAME[shown]);
    lastShown.current = shown;
  }, [shown, isMeasured, isPanel, contentKey]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || isPanel || !isFull) return;
    if (shownDetent('half', headerFits) === 'full') return; // half would look the same: nothing to do
    event.preventDefault();
    onDetentChange('half');
    gripRef.current?.focus();
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (isPanel || !event.isPrimary || event.button !== 0) return;
    if (!(event.target instanceof Element)) return;
    // Controls inside the header keep their own tap; only the grip itself may start a drag.
    const control = event.target.closest('a, button, input, select, textarea');
    if (control && control !== event.currentTarget) return;
    const from = heights[shown];
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScroll: scrollRef.current?.scrollTop ?? 0,
      scrollsBody: isFull && event.currentTarget === headRef.current,
      fromDetent: shown,
      from,
      height: from,
      time: event.timeStamp,
      velocity: 0,
      travel: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dy = event.clientY - drag.startY;
    drag.travel = Math.max(drag.travel, Math.abs(dy));
    if (drag.travel < DRAG_THRESHOLD) return;
    let pull = dy;
    if (drag.scrollsBody && scrollRef.current) {
      const scrollTop = drag.startScroll - dy;
      scrollRef.current.scrollTop = Math.max(0, scrollTop);
      pull = Math.max(0, -scrollTop); // only what is left once the body is back at its top
    }
    const height = Math.min(
      heights.full,
      Math.max(heights.peek * MIN_DRAG_RATIO, drag.from - pull),
    );
    drag.velocity = (height - drag.height) / Math.max(1, event.timeStamp - drag.time);
    drag.height = height;
    drag.time = event.timeStamp;
    setDragHeight(height);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setDragHeight(null);
    if (drag.travel < DRAG_THRESHOLD) return; // a tap: the grip's click moves one step
    if (event.currentTarget === gripRef.current) {
      // The click that follows this drag must not also step; the next tap or key must.
      suppressGripClick.current = true;
      gripClickTimer.current = window.setTimeout(() => {
        suppressGripClick.current = false;
      }, 0);
    }
    onDetentChange(snapDetent(heights, drag.fromDetent, drag.height, drag.velocity));
  };

  const handleGripClick = () => {
    if (suppressGripClick.current) return;
    onDetentChange(nextDetent(shown, lastEdge.current, headerFits));
  };

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    // The safety net: if the browser takes the capture away, the drag ends instead of hanging.
    // After a normal release `dragRef` is already empty, so this does nothing.
    onLostPointerCapture: handlePointerUp,
  };
  const offset = heights.full - (dragHeight ?? heights[shown]);
  // Only in the generated HTML: the first measure in the browser replaces it before paint.
  const staticLayout = prerendered && !isMeasured;
  const sheetClass = [
    styles.sheet,
    isPanel && styles.panel,
    isFull && !isPanel && styles.full,
    (dragHeight !== null || !settled) && styles.dragging,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={layerRef}
      className={
        staticLayout
          ? [styles.layer, styles.static, shown === 'peek' && styles.staticPeek]
              .filter(Boolean)
              .join(' ')
          : styles.layer
      }
    >
      <section
        ref={sectionRef}
        aria-label={label}
        className={sheetClass}
        style={isPanel || staticLayout ? undefined : { transform: `translateY(${offset}px)` }}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          lastFocused.current = event.target;
        }}
      >
        <p role="status" className={styles.srOnly}>
          {announcement}
        </p>
        {isPanel ? null : (
          <button
            ref={gripRef}
            type="button"
            className={styles.grip}
            aria-label={`${DETENT_NAME[shown]}. Cambiar altura`}
            onClick={handleGripClick}
            {...dragHandlers}
          >
            <span className={styles.handle} />
          </button>
        )}
        <div ref={scrollRef} className={styles.scroll}>
          <div ref={headRef} className={styles.head} {...dragHandlers}>
            <div ref={titleRef} className={styles.title} tabIndex={-1}>
              {title}
            </div>
            <div inert={!isPanel && !staticLayout && shown === 'peek'}>
              {header({ shown, isPanel })}
            </div>
          </div>
          {/* The generated HTML has no inert body: the panel's links work without JavaScript, and on a
              phone CSS hides the body out of sight (visibility), so it stays out of the focus order. */}
          <div className={styles.body} inert={!staticLayout && !isPanel && !isFull}>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
