import {
  type MouseEvent,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Alert } from '../../../../components/ui/Alert/Alert';
import {
  BottomSheet,
  type Detent,
  type SheetFrame,
} from '../../../../components/ui/BottomSheet/BottomSheet';
import { Button } from '../../../../components/ui/Button/Button';
import { Counter } from '../../../../components/ui/Counter/Counter';
import { DataTable, type DataTableRow } from '../../../../components/ui/DataTable/DataTable';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Input } from '../../../../components/ui/Input/Input';
import { KeyFigure } from '../../../../components/ui/KeyFigure/KeyFigure';
import { LegendKey } from '../../../../components/ui/LegendKey/LegendKey';
import { formatNumber } from '../../../../components/ui/format';
import {
  ARCHIPELAGO,
  BOGOTA,
  byName,
  departmentRoute,
  fullscreenView,
  isKnownRoute,
  type MapRoute,
  type PreparedMap,
  period,
  routePath,
  searchPlaces,
  sourceParts,
} from '../mapModel';
import {
  freeInsets,
  PANEL_MAX,
  PANEL_MIN,
  PANEL_WIDTH,
  PANEL_WIDTH_KEY,
} from '../MapWithLegend/camera';
import { MapWithLegend } from '../MapWithLegend/MapWithLegend';
import {
  EnPanel,
  Recibido,
  ResumenMunicipal,
  SelectorAnio,
} from '../ResumenMunicipal/ResumenMunicipal';
import { type Nivel, NIVEL } from '../ResumenMunicipal/resumenModel';
import { SearchResults } from '../SearchResults/SearchResults';
import type { ResumenState } from '../useResumen';
import styles from './MapPage.module.css';
import {
  arrivalState,
  clampPanelWidth,
  crumbFocus,
  crumbsFor,
  lowered,
  MIN_FREE_MAP,
  mapTap,
  PANEL_STEP,
  type SheetState,
  selectedText,
} from './mapPageRules';

// The desktop panel's width, from the one place that defines it (camera.ts), for the page's CSS.
declare module 'react' {
  interface CSSProperties {
    '--map-panel-width'?: string;
    '--static-map-min'?: string;
  }
}

/** The width saved in this browser, or the default (storage may be missing or blocked). */
function readPanelWidth(): number {
  try {
    const saved = Number(localStorage.getItem(PANEL_WIDTH_KEY));
    return saved ? clampPanelWidth(saved, Number.POSITIVE_INFINITY) : PANEL_WIDTH;
  } catch {
    return PANEL_WIDTH;
  }
}

export type MapPageState =
  | { status: 'loading' }
  /** 503 `corte_no_disponible`, 404 `geometria_no_encontrada` or 500: no map, no figures. */
  | { status: 'unavailable' }
  | { status: 'ready'; map: PreparedMap };

/**
 * How the place was reached (spec §3, focus): from the search or the table the focus goes to the `h1`;
 * a tap on the map leaves it on the map; a crumb keeps it on the crumbs.
 */
export type NavigationKind = 'choose' | 'map' | 'crumb';

export interface MapPageProps {
  /** Carga, error o los datos del corte ya preparados (`prepareMap`). */
  state: MapPageState;
  /** El lugar que se ve: Colombia, un departamento o un municipio (sale de la dirección). */
  route: MapRoute;
  /** Pide otro lugar; quien la usa cambia la dirección y devuelve la nueva `route`. */
  onNavigate: (route: MapRoute, how: NavigationKind) => void;
  /** «Reintentar» cuando los datos no están disponibles. */
  onRetry?: () => void;
  /** El resumen de gasto del municipio o departamento que se ve (`useResumen`); sin él, la ficha no lo muestra. */
  resumen?: ResumenState;
  /** El año que pide la dirección (`?anio=`), tal cual; sin él, el que la API trae por defecto. */
  anio?: string;
  /** La persona eligió otro año en el selector del resumen. */
  onAnioChange?: (anio: number) => void;
  /** «Intentar de nuevo» cuando el resumen no cargó. */
  onRetryResumen?: () => void;
  /** Texto con el que empieza el buscador (historias de búsqueda). */
  defaultQuery?: string;
  /**
   * Altura con la que empieza la ficha. Sin ella, cada lugar llega a media altura, o recogido si al mapa
   * le quedarían menos de 160 px (decisión 32).
   */
  defaultDetent?: Detent;
  /**
   * Página generada sin JavaScript (ADR 0003): el mapa y la ficha se acomodan solo con CSS, en la misma
   * posición que toman al montar. Solo la usa `pages-site/`; la app nunca la pasa.
   */
  prerendered?: boolean;
}

const KICKER = 'Mapa de contratación pública';
const SEARCH_LABEL = 'Busca tu municipio o departamento';
const SEARCH_PLACEHOLDER = 'Busca municipio o departamento';
const RESULTS_ID = 'map-search-results';
const AREA_TYPE: Record<string, string> = {
  area_no_municipalizada: ' · Área no municipalizada',
  isla: ' · Isla',
};
const RISK_NOTE = 'Este mapa todavía no mide riesgo.';
const GREY_NOTE = 'Todavía no hay color por riesgo. Gris no quiere decir «sin problemas».';
const ISLANDS_NOTE =
  'En el mapa se acorta la distancia entre San Andrés y Providencia (unos 90 km) para verlas juntas, a la misma escala y sin cambiar su forma.';
const NO_DATA_LEGEND = 'Sin datos: no hay contratos ubicados con certeza';
const GLOSS = {
  municipality: 'sabemos en qué municipio se firmaron',
  department: 'sabemos el departamento, no el municipio',
  nowhere: 'no sabemos dónde',
} as const;
// A repeated «Enlace copiado» is announced again: the region is emptied first, then filled.
const ANNOUNCE_AGAIN_MS = 100;

/** One key per place; an invalid link is its own place (its path would read as Colombia). */
const keyOf = (route: MapRoute) => (route.view === 'invalid' ? 'invalid' : routePath(route));

/** What the sheet shows for one place (spec §2): title, half-height header and full-height body. */
interface SheetText {
  kicker: string;
  title: string;
  /** The half-height header, before the buttons. */
  summary: ReactNode;
  /** Button that opens the full sheet; none for a broken link. */
  more?: string;
  /** «Copiar enlace»: only a municipality. */
  copy: boolean;
  body: ReactNode;
}

/** Map page (TASK-09, spec of 2026-11-17): the full-screen map with the search, the crumbs and the sheet. */
export function MapPage({
  state,
  route,
  onNavigate,
  onRetry,
  resumen,
  anio,
  onAnioChange,
  onRetryResumen,
  defaultQuery = '',
  defaultDetent,
  prerendered = false,
}: MapPageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const crumbsRef = useRef<HTMLElement>(null);
  const pending = useRef<{ how: NavigationKind; crumb?: string } | null>(null);
  const announceTimer = useRef(0);
  const routeKey = keyOf(route);
  const arrived = useRef(routeKey);
  const [query, setQuery] = useState(defaultQuery);
  const [announcement, setAnnouncement] = useState('');
  const [sheet, setSheet] = useState<SheetFrame>();
  // Decision 35: the desktop panel's width, which the person drags; kept in this browser only.
  const [panelWidth, setPanelWidthState] = useState(readPanelWidth);
  const setPanelWidth = (width: number) => {
    const next = clampPanelWidth(width, pageRef.current?.clientWidth ?? Number.POSITIVE_INFINITY);
    setPanelWidthState(next);
    try {
      localStorage.setItem(PANEL_WIDTH_KEY, String(next));
    } catch {
      // Storage may be blocked: the width just is not remembered.
    }
  };
  // The height belongs to a place: a new place starts over (half, or collapsed on a short screen).
  const [sheetState, setSheetState] = useState<SheetState>({
    key: defaultDetent ? routeKey : '',
    detent: defaultDetent ?? 'half',
    auto: !defaultDetent,
  });
  const detent = sheetState.key === routeKey ? sheetState.detent : 'half';
  const setDetent = (next: Detent) => setSheetState({ key: routeKey, detent: next, auto: false });
  // The years are the same for every place: the selector keeps them while a new year is loading.
  const [knownYears, setKnownYears] = useState<number[]>([]);
  if (resumen?.status === 'ready' && resumen.datos.anios !== knownYears)
    setKnownYears(resumen.datos.anios);
  const map = state.status === 'ready' ? state.map : undefined;
  const crumbs = map ? crumbsFor(map, route) : [];
  const known = map ? isKnownRoute(map, route) : false;
  const view = map && fullscreenView(map, known ? route : { view: 'country' });
  // A chosen municipality carries its name above it: that room is not free map (decision 32).
  const roomAbove = view?.labels.some((l) => l.anchor === 'above') ?? false;

  // Decision 32, on arrival: once the sheet has measured the new place, before paint. Here and not in
  // the sheet's callback, which runs before the page's own ref is attached.
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const box = {
      width: page.clientWidth,
      height: page.clientHeight,
      roomAbove,
      country: route.view === 'country',
    };
    setSheetState((s) => arrivalState(s, sheet, routeKey, box));
  }, [sheet, routeKey, roomAbove, route.view]);

  const announce = (text: string) => {
    clearTimeout(announceTimer.current);
    setAnnouncement('');
    announceTimer.current = window.setTimeout(() => setAnnouncement(text), ANNOUNCE_AGAIN_MS);
  };
  useEffect(() => () => clearTimeout(announceTimer.current), []);

  // After a change of place: focus as the spec asks (§3) and «Seleccionado: …» in the status region.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new place only
  useEffect(() => {
    if (arrived.current === routeKey) return;
    arrived.current = routeKey;
    const done = pending.current;
    pending.current = null;
    if (done?.how === 'choose') titleRef.current?.focus({ preventScroll: true });
    if (done?.how === 'crumb' && done.crumb) {
      const target = crumbFocus(crumbs, done.crumb);
      const crumb = crumbsRef.current?.querySelector<HTMLElement>(`[data-crumb="${target}"]`);
      (crumb ?? titleRef.current)?.focus({ preventScroll: true });
    }
    if (map) announce(selectedText(map, route));
  }, [routeKey]);

  const go = (next: MapRoute, how: NavigationKind, crumb?: string) => {
    setQuery('');
    if (keyOf(next) === routeKey) {
      if (how === 'choose') titleRef.current?.focus({ preventScroll: true });
      return;
    }
    pending.current = { how, crumb };
    onNavigate(next, how);
  };

  const titleBlock = (kicker: string | undefined, title: string) => (
    <>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
    </>
  );
  // The generated page cannot read this browser's storage: it takes the width from `--saved-panel-width`,
  // which a script in its head sets before the first paint (src/server/pages.ts), so the panel and the map
  // are already framed for it and do not jump when the app starts.
  const pageStyle = {
    '--map-panel-width': prerendered
      ? `var(--saved-panel-width, ${PANEL_WIDTH}px)`
      : `${panelWidth}px`,
  };

  if (!map || !view) {
    return (
      <main ref={pageRef} className={styles.page} style={pageStyle}>
        <div className={styles.placeholder} />
        <div className={styles.sheetArea}>
          <BottomSheet
            label="Ficha del lugar"
            contentKey={routeKey}
            detent={detent}
            onDetentChange={setDetent}
            onLayoutChange={setSheet}
            title={titleBlock(undefined, KICKER)}
            header={() =>
              state.status === 'loading' ? (
                <p role="status">Cargando el mapa…</p>
              ) : (
                <Alert
                  variant="inline"
                  tone="danger"
                  title="Los datos del mapa no están disponibles en este momento."
                  message="Vuelve a intentarlo en unos minutos."
                  action={onRetry ? 'Reintentar' : undefined}
                  onAction={onRetry}
                />
              )
            }
          >
            {null}
          </BottomSheet>
        </div>
      </main>
    );
  }

  /** Table names are real links (new tab, shareable), handled in place on a plain click. */
  const link = (next: MapRoute) => ({
    href: routePath(next),
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(next, 'choose');
    },
  });
  const text: SheetText = known
    ? sheetText(
        map,
        route,
        link,
        resumen && {
          state: resumen,
          anio,
          anios: knownYears,
          onAnioChange: onAnioChange ?? (() => {}),
          onRetry: onRetryResumen ?? (() => {}),
        },
      )
    : {
        kicker: KICKER,
        title: 'No encontramos ese lugar',
        summary: (
          <Alert
            variant="inline"
            tone="warning"
            title="Ese enlace no corresponde a un municipio de Colombia."
            message="Revisa el enlace o busca el municipio."
            action="Ver el mapa de Colombia"
            onAction={() => go({ view: 'country' }, 'choose')}
          />
        ),
        copy: false,
        body: null,
      };

  // Decision 32 in the generated page (arrivalDetent's free area): the sheet arrives collapsed unless
  // the map keeps MIN_FREE_MAP px free over it at half height. CSS alone: the map's minimum height.
  const { phone } = freeInsets(false, roomAbove);
  const style = prerendered
    ? { ...pageStyle, '--static-map-min': `${phone.top + MIN_FREE_MAP + phone.bottom}px` }
    : pageStyle;
  const found = searchPlaces(map, query);
  const sheetFull = sheet?.shown === 'full' && !sheet.isPanel;
  // The results (or the 2-letter hint) cover the zoom: it hides while they are open (validation, item 10).
  const searchOpen = query.trim().length > 0;

  const handleSelect = (code: string) => {
    const tap = mapTap(code, sheet, detent);
    if ('detent' in tap) setDetent(tap.detent);
    else go(tap.route, 'map');
  };

  return (
    <main
      ref={pageRef}
      className={prerendered ? `${styles.page} ${styles.prerendered}` : styles.page}
      style={style}
    >
      <p className={styles.srOnly} role="status">
        {announcement}
      </p>
      <search className={styles.search} hidden={sheetFull}>
        <Input
          label={SEARCH_LABEL}
          hideLabel
          icon={<Icon name="search" />}
          fullWidth
          type="search"
          autoComplete="off"
          placeholder={SEARCH_PLACEHOLDER}
          aria-controls={RESULTS_ID}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SearchResults
          id={RESULTS_ID}
          variant="floating"
          query={query}
          results={found.map((e) => ({ id: routePath(e.route), name: e.name, context: e.context }))}
          onChoose={(id) => {
            const entry = found.find((e) => routePath(e.route) === id);
            if (entry) go(entry.route, 'choose');
          }}
        />
      </search>
      {crumbs.length ? (
        <nav ref={crumbsRef} className={styles.crumbs} aria-label="Volver" hidden={sheetFull}>
          {crumbs.map((c) => (
            <Button
              key={c.key}
              data-crumb={c.key}
              variant="secondary"
              label={c.label}
              // The department may be long: cut with an ellipsis at 320 px; the h1 has it whole.
              truncate={c.key !== 'country'}
              icon={c.key === 'country' ? <Icon name="arrow-left" /> : undefined}
              onClick={() => go(c.to, 'crumb', c.key)}
            />
          ))}
        </nav>
      ) : null}
      <MapWithLegend
        variant="fullscreen"
        {...view}
        sheet={sheet}
        panelWidth={panelWidth}
        controlsHidden={searchOpen}
        prerendered={prerendered}
        onSelect={handleSelect}
        onZoomToCountry={() => go({ view: 'country' }, 'map')}
      />
      <div className={styles.sheetArea}>
        <BottomSheet
          label="Ficha del lugar"
          contentKey={routeKey}
          prerendered={prerendered}
          detent={prerendered && route.view === 'country' ? 'peek' : detent}
          onDetentChange={setDetent}
          onLayoutChange={setSheet}
          title={titleBlock(text.kicker, text.title)}
          header={({ shown, isPanel }) => (
            <Mostrando.Provider value={shown}>
              {text.summary}
              {text.copy || (text.more && !isPanel) ? (
                <div className={styles.actions}>
                  {text.copy ? (
                    <CopyLink path={routePath(route)} onCopied={() => announce('Enlace copiado')} />
                  ) : null}
                  {/* In the panel the table is already in view (spec §6): no height button. */}
                  {text.more && !isPanel ? (
                    <Button
                      data-height-button
                      variant="secondary"
                      label={shown === 'full' ? 'Volver al mapa' : text.more}
                      aria-expanded={shown === 'full'}
                      onClick={() => setDetent(shown === 'full' ? lowered(detent) : 'full')}
                    />
                  ) : null}
                </div>
              ) : null}
            </Mostrando.Provider>
          )}
        >
          <EnPanel.Provider value={sheet?.isPanel === true}>
            <div className={styles.body}>{text.body}</div>
          </EnPanel.Provider>
        </BottomSheet>
      </div>
      {prerendered ? null : (
        // A separator that is also the handle: drag it, or use the arrow keys, Home and End.
        // biome-ignore lint/a11y/useSemanticElements: an <hr> cannot take focus or be dragged
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Ancho de la ficha"
          aria-valuemin={PANEL_MIN}
          aria-valuemax={PANEL_MAX}
          aria-valuenow={panelWidth}
          tabIndex={0}
          className={styles.divider}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const right = pageRef.current?.getBoundingClientRect().right ?? e.clientX;
            setPanelWidth(right - e.clientX);
          }}
          onKeyDown={(e) => {
            const step = { ArrowLeft: PANEL_STEP, ArrowRight: -PANEL_STEP }[e.key];
            if (step !== undefined) setPanelWidth(panelWidth + step);
            else if (e.key === 'Home') setPanelWidth(PANEL_MIN);
            else if (e.key === 'End') setPanelWidth(PANEL_MAX);
            else return;
            e.preventDefault();
          }}
        />
      )}
    </main>
  );
}

type Link = (next: MapRoute) => {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/** «del Archipiélago de San Andrés…», «de Antioquia»: the archipelago's name takes an article. */
const of = (name: string, code: string) => (code === ARCHIPELAGO ? `del ${name}` : `de ${name}`);

/** What the sheet shows now: the key figure of the summary is for the half-height sheet only. */
const Mostrando = createContext<'peek' | 'half' | 'full'>('half');

/** In the full sheet the section below says the figure itself: it is not said twice. */
function EnFichaMedia({ children }: { children: ReactNode }) {
  return useContext(Mostrando) === 'full' ? null : children;
}

interface ResumenProps {
  state: ResumenState;
  anio?: string;
  anios: number[];
  onAnioChange: (anio: number) => void;
  onRetry: () => void;
}

/**
 * The spending summary in the sheet (resumen-municipal spec): the key figure goes in the half-height
 * header, the whole section in the full body. A link with a year that does not exist says so once.
 */
function resumenSheet(
  nivel: Nivel,
  lugar: string,
  r: ResumenProps,
): {
  /** The year selector: first thing under the place's title. */
  selector: ReactNode;
  /** Contracts signed in the chosen year; `null` when the year has none located, `undefined` while unknown. */
  contratos: number | null | undefined;
  anio: number | undefined;
  summary: ReactNode;
  body: ReactNode;
} {
  const { state } = r;
  const datos = state.status === 'ready' ? state.datos : undefined;
  const asked = Number(r.anio);
  const anio = datos?.anio ?? (Number.isInteger(asked) && asked > 0 ? asked : undefined);
  let figure: ReactNode;
  if (datos) figure = <Recibido datos={datos} nivel={nivel} />;
  else if (state.status === 'error')
    // The alert with «Intentar de nuevo» is in the full sheet; here, one line that says so.
    figure = <p role="status">El gasto de {NIVEL[nivel].entidad} no cargó por ahora.</p>;
  else figure = <p>Buscando lo que recibió {NIVEL[nivel].entidad}…</p>;
  const c = datos?.contratado;
  const contratos =
    c === undefined || c === null ? undefined : c.contratos > 0 ? c.contratos : null;
  return {
    anio,
    contratos,
    selector:
      anio !== undefined && r.anios.length > 0 ? (
        <EnFichaMedia>
          <div className={styles.selectorAnio}>
            <SelectorAnio anio={anio} anios={r.anios} onAnioChange={r.onAnioChange} />
          </div>
        </EnFichaMedia>
      ) : null,
    summary: (
      <>
        {state.status === 'ready' && state.anioInvalido ? (
          <div className={styles.resumenAviso}>
            <Alert
              variant="inline"
              tone="warning"
              title={`El enlace pedía ${state.anioInvalido}, que no existe; mostramos ${state.datos.anio}.`}
            />
          </div>
        ) : null}
        <div className={styles.resumen}>
          <EnFichaMedia>{figure}</EnFichaMedia>
        </div>
      </>
    ),
    body: (
      <ResumenMunicipal
        status={state.status === 'ready' || state.status === 'error' ? state.status : 'loading'}
        datos={datos}
        nivel={nivel}
        nombre={lugar}
        anio={anio}
        anios={r.anios}
        onAnioChange={r.onAnioChange}
        onReintentar={r.onRetry}
      />
    ),
  };
}

/** The sheet of a known place: Colombia, a department or a municipality (spec §2 and §6). */
function sheetText(
  map: PreparedMap,
  route: MapRoute,
  link: Link,
  resumen?: ResumenProps,
): SheetText {
  const { cut, departments } = map.data;
  const { sentence, caption, cutDate } = period(cut, departments.ventana.desde);
  const shortSource = `Fuentes: SECOP II y SECOP I, DANE. Datos al ${cutDate}.`;
  const placeSource = `${shortSource} ${RISK_NOTE}`;
  const tableCaption = `En orden alfabético. ${shortSource}`;
  const sources = (
    <>
      <h2>Fuentes</h2>
      <p className={styles.sources}>
        {sourceParts(cut).map((p, i) =>
          // The parts repeat (« y »): the position is their identity.
          p.url ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed list, never reordered
            <a key={i} href={p.url}>
              {p.text}
            </a>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed list, never reordered
            <span key={i}>{p.text}</span>
          ),
        )}
      </p>
      <p className={styles.note}>{GREY_NOTE}</p>
    </>
  );

  if (route.view !== 'department' && route.view !== 'municipality') {
    const n = departments.nacional;
    const rows: DataTableRow[] = [...departments.departamentos].sort(byName).map((d) => ({
      id: d.codigo,
      header: <a {...link(departmentRoute(d.codigo))}>{d.nombre}</a>,
      cells: [
        formatNumber(d.contratosEnMunicipios, 0),
        formatNumber(d.contratosSoloDepartamento, 0),
      ],
    }));
    return {
      kicker: KICKER,
      title: `${formatNumber(n.contratos, 0)} contratos públicos firmados en Colombia`,
      summary: (
        <>
          <p className={styles.lead}>
            Del 1 ene {departments.ventana.desde} al {cutDate}. Elige un departamento. {RISK_NOTE}
          </p>
          <p className={styles.note}>{shortSource}</p>
        </>
      ),
      more: 'Ver cifras, tabla y fuentes',
      copy: false,
      body: (
        <>
          <h2>Dónde quedó cada contrato</h2>
          <Counter
            layout="adaptive"
            counts={[
              {
                value: n.contratosEnMunicipios,
                label: 'en un municipio',
                note: GLOSS.municipality,
              },
              {
                value: n.contratosSoloDepartamento,
                label: 'sin municipio identificado',
                note: GLOSS.department,
              },
              { value: n.contratosSinLugar, label: 'sin lugar identificado', note: GLOSS.nowhere },
            ]}
          />
          <h2>Contratos por departamento, {caption}</h2>
          <DataTable
            caption={tableCaption}
            columns={[
              { label: 'Departamento' },
              { label: 'En municipios', numeric: true },
              { label: 'Sin municipio', numeric: true },
            ]}
            rows={rows}
            stickyHeader
            collapsedLabel="Ver la tabla de departamentos"
          />
          {sources}
        </>
      ),
    };
  }

  const municipality =
    route.view === 'municipality' ? map.municipalities.get(route.code) : undefined;
  const code = municipality?.departamento.codigo ?? route.code;
  const dep = map.departments.get(code);
  const name = dep?.nombre ?? municipality?.departamento.nombre ?? code;
  const bogota = municipality?.codigo === BOGOTA;
  const islands = code === ARCHIPELAGO ? <p className={styles.note}>{ISLANDS_NOTE}</p> : null;
  const list = [...(map.byDepartment.get(code) ?? [])].sort(byName);
  const rows: DataTableRow[] = list.map((m) => ({
    id: m.codigo,
    header: <a {...link({ view: 'municipality', code: m.codigo })}>{m.nombre}</a>,
    cells: [
      m.contratosUbicados === null ? <NoData key="n" /> : formatNumber(m.contratosUbicados, 0),
    ],
  }));
  // Without the department in the cut its figures are «Sin datos», never 0.
  let counts: ReactNode = (
    <p className={styles.legend}>
      <LegendKey kind="unknown" />
      {NO_DATA_LEGEND}
    </p>
  );
  if (dep && bogota)
    counts = (
      <Counter
        layout="adaptive"
        counts={[
          {
            value: dep.contratosSoloDepartamento,
            label: 'registrados solo como Bogotá, D.C. (departamento)',
            note: GLOSS.department,
          },
        ]}
      />
    );
  else if (dep)
    counts = (
      <Counter
        layout="adaptive"
        counts={[
          {
            value: dep.contratosEnMunicipios,
            label: `en los municipios ${of(name, code)}`,
            note: GLOSS.municipality,
          },
          {
            value: dep.contratosSoloDepartamento,
            label: 'sin municipio identificado',
            note: GLOSS.department,
          },
        ]}
      />
    );
  const table = (
    <>
      <h2>
        Contratos por municipio {code === ARCHIPELAGO ? `del ${name}` : `en ${name}`}, {caption}
      </h2>
      <DataTable
        caption={tableCaption}
        columns={[{ label: 'Municipio' }, { label: 'Contratos ubicados', numeric: true }]}
        rows={rows}
        currentRowId={municipality?.codigo}
        stickyHeader
        collapsedLabel="Ver la tabla de municipios"
      />
    </>
  );

  const gasto =
    resumen &&
    resumenSheet(
      municipality ? 'municipio' : 'departamento',
      municipality ? municipality.nombre : name,
      resumen,
    );
  if (municipality) {
    // With the summary loaded, the figure is the chosen year's; until then, the whole period's.
    const delAnio = gasto?.contratos !== undefined;
    const value = delAnio ? (gasto?.contratos ?? null) : municipality.contratosUbicados;
    const periodo = delAnio ? `en ${gasto?.anio}` : sentence;
    return {
      kicker: `${bogota ? 'Distrito Capital' : name} · DANE ${municipality.codigo}${
        AREA_TYPE[municipality.tipo] ?? ''
      }`,
      title: municipality.nombre,
      summary: (
        <>
          {gasto?.selector}
          <KeyFigure
            value={value}
            context={
              value === null
                ? `No encontramos contratos ubicados con certeza en este lugar ${periodo}.`
                : `contratos firmados ${periodo} y ubicados en ${municipality.nombre}`
            }
            source={placeSource}
          />
          {islands}
          {gasto?.summary}
        </>
      ),
      // Decision 31: Bogotá has no table (one row would repeat the key figure).
      more: bogota ? 'Ver más cifras y fuentes' : `Ver ${name} y tabla`,
      copy: true,
      body: (
        <>
          {gasto?.body}
          <h2>{bogota ? 'Dónde quedó cada contrato' : name}</h2>
          {counts}
          {bogota ? null : table}
          {sources}
        </>
      ),
    };
  }

  const withUnknown = list.some((m) => m.contratosUbicados === null);
  return {
    kicker: `DANE ${code}`,
    title: name,
    summary: (
      <>
        {gasto?.selector}
        {dep ? (
          <p className={styles.lead}>
            Contratos firmados{' '}
            {gasto?.anio !== undefined && gasto.contratos !== undefined
              ? `en ${gasto.anio}`
              : sentence}
            . Elige un municipio.
          </p>
        ) : (
          <p className={styles.legend}>
            <LegendKey kind="unknown" />
            {NO_DATA_LEGEND}
          </p>
        )}
        {islands}
        {withUnknown && dep ? (
          <p className={styles.legend}>
            <LegendKey kind="unknown" />
            {NO_DATA_LEGEND}
          </p>
        ) : null}
        {gasto?.summary}
        <p className={styles.note}>{placeSource}</p>
      </>
    ),
    more: 'Ver tabla y fuentes',
    copy: false,
    body: (
      <>
        {gasto?.body}
        <h2>Dónde quedó cada contrato</h2>
        {counts}
        {table}
        {sources}
      </>
    ),
  };
}

function NoData() {
  return (
    <span className={styles.noData}>
      <LegendKey kind="unknown" />
      Sin datos
    </span>
  );
}

/** «Copiar enlace» → «Enlace copiado»; if the clipboard is refused, the URL in a read-only field. */
function CopyLink({ path, onCopied }: { path: string; onCopied: () => void }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle');
  const url = typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new place starts a new copy
  useEffect(() => setStatus('idle'), [path]);
  return (
    <>
      <Button
        variant="secondary"
        label={status === 'copied' ? 'Enlace copiado' : 'Copiar enlace'}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setStatus('copied');
            onCopied();
          } catch {
            setStatus('manual');
          }
        }}
      />
      {status === 'manual' ? (
        <input
          className={styles.copyField}
          readOnly
          value={url}
          aria-label="Enlace para compartir"
          // biome-ignore lint/a11y/noAutofocus: the person just asked for the link; it is selected for them
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
    </>
  );
}
