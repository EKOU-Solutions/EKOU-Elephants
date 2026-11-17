import {
  type MouseEvent,
  type ReactNode,
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
import { PANEL_WIDTH } from '../MapWithLegend/camera';
import { MapWithLegend } from '../MapWithLegend/MapWithLegend';
import { SearchResults } from '../SearchResults/SearchResults';
import styles from './MapPage.module.css';
import {
  arrivalDetent,
  crumbFocus,
  crumbsFor,
  lowered,
  mapTap,
  selectedText,
} from './mapPageRules';

// The desktop panel's width, from the one place that defines it (camera.ts), for the page's CSS.
declare module 'react' {
  interface CSSProperties {
    '--map-panel-width'?: string;
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
  /** Texto con el que empieza el buscador (historias de búsqueda). */
  defaultQuery?: string;
  /**
   * Altura con la que empieza la ficha. Sin ella, cada lugar llega a media altura, o recogido si al mapa
   * le quedarían menos de 160 px (decisión 32).
   */
  defaultDetent?: Detent;
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

/** The sheet's height for one place; `auto` until the person moves it (decision 32 may still adjust it). */
interface SheetState {
  key: string;
  detent: Detent;
  auto: boolean;
}

/** Map page (TASK-09, spec of 2026-11-17): the full-screen map with the search, the crumbs and the sheet. */
export function MapPage({
  state,
  route,
  onNavigate,
  onRetry,
  defaultQuery = '',
  defaultDetent,
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
  // The height belongs to a place: a new place starts over (half, or collapsed on a short screen).
  const [sheetState, setSheetState] = useState<SheetState>({
    key: defaultDetent ? routeKey : '',
    detent: defaultDetent ?? 'half',
    auto: !defaultDetent,
  });
  const detent = sheetState.key === routeKey ? sheetState.detent : 'half';
  const setDetent = (next: Detent) => setSheetState({ key: routeKey, detent: next, auto: false });
  const map = state.status === 'ready' ? state.map : undefined;
  const crumbs = map ? crumbsFor(map, route) : [];

  // Decision 32, on arrival: once the sheet has measured the new place, before paint. Here and not in
  // the sheet's callback, which runs before the page's own ref is attached.
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page || !sheet || sheet.shown === 'peek') return;
    const next = arrivalDetent(sheet, page.clientWidth, page.clientHeight);
    setSheetState((s) =>
      s.key === routeKey && (!s.auto || s.detent === next)
        ? s
        : { key: routeKey, detent: next, auto: true },
    );
  }, [sheet, routeKey]);

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
  const pageStyle = { '--map-panel-width': `${PANEL_WIDTH}px` };

  if (!map) {
    return (
      <main ref={pageRef} className={styles.page} style={pageStyle}>
        <div className={styles.placeholder} />
        <div className={styles.sheetArea}>
          <BottomSheet
            label="Ficha del lugar"
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

  const known = isKnownRoute(map, route);
  const view = fullscreenView(map, known ? route : { view: 'country' });
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
    ? sheetText(map, route, link)
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
    <main ref={pageRef} className={styles.page} style={pageStyle}>
      <p className={styles.srOnly} role="status">
        {announcement}
      </p>
      <search className={styles.search}>
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
        controlsHidden={searchOpen}
        onSelect={handleSelect}
        onZoomToCountry={() => go({ view: 'country' }, 'map')}
      />
      <div className={styles.sheetArea}>
        <BottomSheet
          label="Ficha del lugar"
          contentKey={routeKey}
          detent={detent}
          onDetentChange={setDetent}
          onLayoutChange={setSheet}
          title={titleBlock(text.kicker, text.title)}
          header={({ shown, isPanel }) => (
            <>
              {text.summary}
              {text.copy || (text.more && !isPanel) ? (
                <div className={styles.actions}>
                  {text.copy ? (
                    <CopyLink path={routePath(route)} onCopied={() => announce('Enlace copiado')} />
                  ) : null}
                  {/* In the panel the table is already in view (spec §6): no height button. */}
                  {text.more && !isPanel ? (
                    <Button
                      variant="secondary"
                      label={shown === 'full' ? 'Volver al mapa' : text.more}
                      aria-expanded={shown === 'full'}
                      onClick={() => setDetent(shown === 'full' ? lowered(detent) : 'full')}
                    />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        >
          <div className={styles.body}>{text.body}</div>
        </BottomSheet>
      </div>
    </main>
  );
}

type Link = (next: MapRoute) => {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/** «del Archipiélago de San Andrés…», «de Antioquia»: the archipelago's name takes an article. */
const of = (name: string, code: string) => (code === ARCHIPELAGO ? `del ${name}` : `de ${name}`);

/** The sheet of a known place: Colombia, a department or a municipality (spec §2 and §6). */
function sheetText(map: PreparedMap, route: MapRoute, link: Link): SheetText {
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
      />
    </>
  );

  if (municipality) {
    const value = municipality.contratosUbicados;
    return {
      kicker: `${bogota ? 'Distrito Capital' : name} · DANE ${municipality.codigo}${
        AREA_TYPE[municipality.tipo] ?? ''
      }`,
      title: municipality.nombre,
      summary: (
        <>
          <KeyFigure
            value={value}
            context={
              value === null
                ? `No encontramos contratos ubicados con certeza en este lugar ${sentence}.`
                : `contratos firmados ${sentence} y ubicados en ${municipality.nombre}`
            }
            source={placeSource}
          />
          {islands}
        </>
      ),
      // Decision 31: Bogotá has no table (one row would repeat the key figure).
      more: bogota ? 'Ver más cifras y fuentes' : `Ver ${name} y tabla`,
      copy: true,
      body: (
        <>
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
        {dep ? (
          <p className={styles.lead}>
            <strong>{formatNumber(dep.contratosEnMunicipios, 0)}</strong> contratos en sus
            municipios y <strong>{formatNumber(dep.contratosSoloDepartamento, 0)}</strong> sin
            municipio identificado, {sentence}. Elige un municipio.
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
        <p className={styles.note}>{placeSource}</p>
      </>
    ),
    more: 'Ver tabla y fuentes',
    copy: false,
    body: (
      <>
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
