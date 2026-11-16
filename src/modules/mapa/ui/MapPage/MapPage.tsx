import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from '../../../../components/ui/Alert/Alert';
import { Button } from '../../../../components/ui/Button/Button';
import { Counter } from '../../../../components/ui/Counter/Counter';
import { DataTable, type DataTableRow } from '../../../../components/ui/DataTable/DataTable';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Input } from '../../../../components/ui/Input/Input';
import { KeyFigure } from '../../../../components/ui/KeyFigure/KeyFigure';
import { LegendKey } from '../../../../components/ui/LegendKey/LegendKey';
import { RiskTag } from '../../../../components/ui/RiskTag/RiskTag';
import { formatNumber } from '../../../../components/ui/format';
import {
  BOGOTA,
  byName,
  departmentRoute,
  isKnownRoute,
  type MapRoute,
  mapView,
  type PreparedMap,
  period,
  routePath,
  searchPlaces,
  sourceParts,
} from '../mapModel';
import { MapLegend, MapWithLegend } from '../MapWithLegend/MapWithLegend';
import { SearchResults } from '../SearchResults/SearchResults';
import styles from './MapPage.module.css';

export type MapPageState =
  | { status: 'loading' }
  /** 503 `corte_no_disponible`, 404 `geometria_no_encontrada` or 500: no map, no figures. */
  | { status: 'unavailable' }
  | { status: 'ready'; map: PreparedMap };

/** How the person moved: choosing (tap, search, list, table) moves focus to the `h1`. */
export type NavigationKind = 'choose' | 'link';

export interface MapPageProps {
  state: MapPageState;
  route: MapRoute;
  onNavigate: (route: MapRoute, how: NavigationKind) => void;
  onRetry?: () => void;
  /**
   * ONLY for the phase 2 preview in Storybook: invented risk levels, each one said «(ficticio)».
   * The app never passes it: there is no risk in the contract until TASK-07.
   */
  fictionalLevel?: (code: string) => 'low' | 'medium' | 'high';
}

const KICKER = 'Mapa de contratación pública';
const AREA_TYPE = { area_no_municipalizada: 'Área no municipalizada', isla: 'Isla' } as const;
const ARCHIPELAGO_NOTE =
  'San Andrés y Providencia están a unos 90 km. En el mapa se acercan para verlas juntas a la misma escala, sin cambiar su forma.';

/** Map page (TASK-09): where public contracts were signed, by department and municipality. */
export function MapPage({ state, route, onNavigate, onRetry, fictionalLevel }: MapPageProps) {
  const title = useRef<HTMLHeadingElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const pending = useRef<NavigationKind | null>(null);
  const [query, setQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const go = (next: MapRoute, how: NavigationKind) => {
    // Choosing the place already open changes no view: clear the search and return focus here,
    // instead of leaving a pending choice for the next Back.
    if (routePath(next) === routePath(route)) {
      setQuery('');
      title.current?.focus({ preventScroll: true });
      return;
    }
    pending.current = how;
    onNavigate(next, how);
  };
  /** Real links (they open in a new tab and can be shared), handled in place on a plain click. */
  const link = (next: MapRoute) => ({
    href: routePath(next),
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(next, 'choose');
    },
  });

  const map = state.status === 'ready' ? state.map : undefined;
  const known = map ? isKnownRoute(map, route) : true;
  const routeKey = routePath(route);

  // Every view change clears the search; choosing moves focus to the h1 and brings the figure (or
  // the top of the map) into view, instantly with reduced motion.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new view only
  useEffect(() => {
    setQuery('');
    const how = pending.current;
    pending.current = null;
    if (!how) return;
    title.current?.focus({ preventScroll: true });
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (figure.current && window.innerWidth < 960)
      figure.current.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    else top.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    setAnnouncement(`Seleccionado: ${title.current?.textContent ?? ''}`);
  }, [routeKey]);

  const view = useMemo(
    () => (map && known ? mapView(map, route, fictionalLevel) : undefined),
    [map, known, route, fictionalLevel],
  );

  if (state.status === 'loading') {
    return (
      <main className={styles.page}>
        <Header kicker={KICKER} title={KICKER} />
        <p className={styles.loading} role="status">
          Cargando el mapa…
        </p>
      </main>
    );
  }
  if (state.status === 'unavailable') {
    return (
      <main className={styles.page}>
        <Header kicker={KICKER} title={KICKER} />
        <Alert
          variant="inline"
          tone="danger"
          title="Los datos del mapa no están disponibles en este momento."
          message="Vuelve a intentarlo en unos minutos."
          action={onRetry ? 'Reintentar' : undefined}
          onAction={onRetry}
        />
      </main>
    );
  }
  if (!map || !view) {
    return (
      <main className={styles.page}>
        <Header kicker={KICKER} title="No encontramos ese lugar" />
        <Alert
          variant="inline"
          tone="warning"
          title="Ese enlace no corresponde a un municipio de Colombia."
          message="Revisa el enlace o busca el municipio en el mapa."
          action="Ver el mapa de Colombia"
          actionHref="/mapa"
        />
      </main>
    );
  }

  const { data } = map;
  const window_ = data.departments.ventana;
  const { sentence, caption, cutDate } = period(data.cut, window_.desde);
  const sources = sourceParts(data.cut);
  const sourceLine = (
    <>
      {sources.map((p, i) =>
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
    </>
  );
  const risk = (code: string) => (fictionalLevel ? fictionalLevel(code) : undefined);

  // ----- head, back link, figure, counts and table of the current view -----
  let back: ReactNode = null;
  let kicker = KICKER;
  let heading: string;
  let dek: string | undefined;
  let keyFigure: ReactNode = null;
  let countsTitle: string;
  let counts: { value: number; label: string; note?: string }[];
  let tableTitle: string;
  let tableCaption: string;
  let rows: DataTableRow[];
  let columns: { label: string; numeric?: boolean }[];
  let current: string | undefined;
  let department: string | undefined;

  if (route.view === 'country') {
    const n = data.departments.nacional;
    heading = `${formatNumber(n.contratos, 0)} contratos públicos firmados en Colombia`;
    dek = `Del 1 ene ${window_.desde} al ${cutDate}. Elige un departamento para ver sus municipios. ${
      fictionalLevel
        ? 'Los colores de riesgo de esta vista previa son ficticios.'
        : 'Este mapa muestra dónde se firmaron los contratos; todavía no mide riesgo.'
    }`;
    countsTitle = 'Dónde quedó cada contrato';
    counts = [
      {
        value: n.contratosEnMunicipios,
        label: 'en un municipio',
        note: 'sabemos en qué municipio se firmaron',
      },
      {
        value: n.contratosSoloDepartamento,
        label: 'solo en un departamento',
        note: 'sabemos el departamento, no el municipio',
      },
      { value: n.contratosSinLugar, label: 'sin lugar identificado', note: 'no sabemos dónde' },
    ];
    tableTitle = 'Tabla de departamentos';
    tableCaption = `Contratos por departamento, ${caption}`;
    columns = [
      { label: 'Departamento' },
      { label: 'En sus municipios', numeric: true },
      { label: 'Solo en el departamento', numeric: true },
      ...(fictionalLevel ? [{ label: 'Riesgo (ficticio)' }] : []),
    ];
    rows = [...data.departments.departamentos].sort(byName).map((d) => ({
      id: d.codigo,
      header: <a {...link(departmentRoute(d.codigo))}>{d.nombre}</a>,
      cells: [
        formatNumber(d.contratosEnMunicipios, 0),
        formatNumber(d.contratosSoloDepartamento, 0),
        ...(fictionalLevel ? [<FictionalTag key="r" level={fictionalLevel(d.codigo)} />] : []),
      ],
    }));
  } else {
    const municipality =
      route.view === 'municipality' ? map.municipalities.get(route.code) : undefined;
    department =
      municipality?.departamento.codigo ?? (route.view === 'department' ? route.code : '');
    const dep = map.departments.get(department);
    const bogota = municipality?.codigo === BOGOTA;
    const name = dep?.nombre ?? department;
    current = municipality?.codigo;
    if (municipality) {
      const type =
        municipality.tipo in AREA_TYPE
          ? ` · ${AREA_TYPE[municipality.tipo as keyof typeof AREA_TYPE]}`
          : '';
      kicker = `${bogota ? 'Distrito Capital' : name} · Código DANE ${municipality.codigo}${type}`;
      heading = municipality.nombre;
      back = bogota ? (
        <BackLink {...link({ view: 'country' })}>Colombia</BackLink>
      ) : (
        <BackLink {...link({ view: 'department', code: department })}>{name}</BackLink>
      );
      const value = municipality.contratosUbicados;
      const level = value === null ? undefined : risk(municipality.codigo);
      keyFigure = (
        <div className={styles.figure} ref={figure}>
          {level ? (
            <p className={styles.fictional}>
              <RiskTag level={level} large />
              <span>(ficticio)</span>
            </p>
          ) : null}
          <KeyFigure
            value={value}
            context={
              value === null
                ? `No encontramos contratos ubicados con certeza en este lugar ${sentence}.`
                : `contratos firmados ${sentence} y ubicados en ${municipality.nombre}`
            }
            source={`SECOP II y SECOP I · ${caption} · datos al ${cutDate}`}
          />
          <CopyLink path={routePath(route)} />
        </div>
      );
    } else {
      kicker = `Código DANE ${department}`;
      heading = name;
      dek = `Del 1 ene ${window_.desde} al ${cutDate}. Elige un municipio para ver cuántos contratos tiene.`;
      back = <BackLink {...link({ view: 'country' })}>Colombia</BackLink>;
    }
    countsTitle = `Contratos de ${name}`;
    counts = bogota
      ? [
          {
            value: dep?.contratosSoloDepartamento ?? 0,
            label: 'registrados solo como Bogotá, D.C. (departamento)',
          },
        ]
      : [
          {
            value: dep?.contratosEnMunicipios ?? 0,
            label: 'en sus municipios',
            note: 'sabemos en qué municipio se firmaron',
          },
          {
            value: dep?.contratosSoloDepartamento ?? 0,
            label: 'solo en el departamento',
            note: 'sabemos el departamento, no el municipio',
          },
        ];
    tableTitle = 'Tabla de municipios';
    tableCaption = `Contratos por municipio en ${name}, ${caption}`;
    columns = [
      { label: 'Municipio' },
      { label: 'Código DANE' },
      { label: 'Contratos ubicados', numeric: true },
      ...(fictionalLevel ? [{ label: 'Riesgo (ficticio)' }] : []),
    ];
    rows = [...(map.byDepartment.get(department) ?? [])].sort(byName).map((m) => {
      const noData = m.contratosUbicados === null;
      return {
        id: m.codigo,
        header: <a {...link({ view: 'municipality', code: m.codigo })}>{m.nombre}</a>,
        cells: [
          m.codigo,
          noData ? <NoData key="n" /> : formatNumber(m.contratosUbicados ?? 0, 0),
          ...(fictionalLevel
            ? [
                noData ? (
                  <NoData key="r" />
                ) : (
                  <FictionalTag key="r" level={fictionalLevel(m.codigo)} />
                ),
              ]
            : []),
        ],
      };
    });
  }

  const legend = fictionalLevel ? (
    <MapLegend
      title="Contratos con señales · datos ficticios"
      items={[
        { fill: 'low', label: 'Bajo' },
        { fill: 'medium', label: 'Intermedio' },
        { fill: 'high', label: 'Alto' },
        ...(view.withUnknown ? [{ fill: 'unknown' as const, label: 'Sin datos' }] : []),
      ]}
      notes={[
        'Vista previa de la fase 2: los niveles de riesgo son inventados para mostrar el diseño. Las cifras de contratos sí son reales. El dato de riesgo llegará con la metodología (TASK-07).',
        ...(view.archipelago ? [ARCHIPELAGO_NOTE] : []),
      ]}
    />
  ) : (
    <MapLegend
      title="Qué muestra el mapa"
      items={[
        { fill: 'neutral', label: 'Territorio con contratos ubicados' },
        ...(view.withUnknown
          ? [
              {
                fill: 'unknown' as const,
                label: 'Sin datos: no hay contratos ubicados con certeza',
              },
            ]
          : []),
      ]}
      notes={[
        'Todavía no hay color por riesgo. Gris no quiere decir «sin problemas».',
        ...(view.archipelago ? [ARCHIPELAGO_NOTE] : []),
      ]}
    />
  );

  const found = searchPlaces(map, query);

  return (
    <main className={styles.page} ref={top}>
      <p className={styles.srOnly} role="status">
        {announcement}
      </p>
      {back ? <div className={styles.back}>{back}</div> : null}
      <Header kicker={kicker} title={heading} dek={dek} titleRef={title} />
      {fictionalLevel ? (
        <Alert
          variant="inline"
          tone="warning"
          title="Vista previa con datos ficticios."
          message="Los colores y niveles de riesgo de este mapa son inventados para mostrar cómo se verá la fase 2. Las cifras de contratos son reales."
        />
      ) : null}
      <div className={styles.body}>
        <section className={styles.mapbox} aria-label="Mapa">
          <MapWithLegend
            {...view}
            onSelect={(code) =>
              go(
                route.view === 'country' ? departmentRoute(code) : { view: 'municipality', code },
                'choose',
              )
            }
          />
        </section>
        <div className={styles.legend}>{legend}</div>
        <div className={styles.side}>
          <div className={styles.search}>
            <search className={styles.searchField}>
              <Input
                label="Busca tu municipio o departamento"
                type="search"
                autoComplete="off"
                placeholder="Ej.: Medellín"
                aria-controls="map-search-results"
                help={query.trim().length < 2 ? 'Escribe al menos 2 letras.' : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SearchResults
                id="map-search-results"
                query={query}
                results={found.map((e) => ({
                  id: routePath(e.route),
                  name: e.name,
                  context: e.context,
                }))}
                onChoose={(id) => {
                  const entry = found.find((e) => routePath(e.route) === id);
                  if (entry) go(entry.route, 'choose');
                }}
              />
            </search>
          </div>
          {keyFigure}
          <section className={styles.counts} aria-labelledby="map-counts-title">
            <h2 id="map-counts-title">{countsTitle}</h2>
            <Counter counts={counts} layout="adaptive" />
          </section>
          <p className={styles.source}>{sourceLine}</p>
        </div>
      </div>
      <section className={styles.table} aria-labelledby="map-table-title">
        <h2 id="map-table-title">{tableTitle}</h2>
        <DataTable caption={tableCaption} columns={columns} rows={rows} currentRowId={current} />
        <p className={styles.source}>{sourceLine}</p>
      </section>
    </main>
  );
}

function Header({
  kicker,
  title,
  dek,
  titleRef,
}: {
  kicker: string;
  title: string;
  dek?: string;
  titleRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <header className={styles.head}>
      <p className={styles.kicker}>{kicker}</p>
      <h1 ref={titleRef} tabIndex={-1}>
        {title}
      </h1>
      {dek ? <p className={styles.dek}>{dek}</p> : null}
    </header>
  );
}

function BackLink({
  children,
  ...props
}: {
  children: ReactNode;
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a className={styles.backLink} {...props}>
      <Icon name="arrow-left" />
      {children}
    </a>
  );
}

function NoData() {
  return (
    <span className={styles.noData}>
      <LegendKey kind="unknown" />
      Sin datos
    </span>
  );
}

function FictionalTag({ level }: { level: 'low' | 'medium' | 'high' }) {
  return (
    <span className={styles.fictional}>
      <RiskTag level={level} />
      <span>(ficticio)</span>
    </span>
  );
}

/** «Copiar enlace» → «Enlace copiado»; if the clipboard is refused, the URL in a read-only field. */
function CopyLink({ path }: { path: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle');
  const url = typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new place starts a new copy
  useEffect(() => setStatus('idle'), [path]);
  return (
    <div className={styles.copy}>
      <Button
        variant="secondary"
        label="Copiar enlace"
        icon={<Icon name="link" />}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setStatus('copied');
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
      ) : (
        <span className={styles.copied} role="status">
          {status === 'copied' ? 'Enlace copiado' : ''}
        </span>
      )}
    </div>
  );
}
