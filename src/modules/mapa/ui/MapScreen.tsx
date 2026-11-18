import { useEffect, useMemo, useState } from 'react';
import { tituloDelLugar } from '../../../../paginas/src/lib/sitio';
import type { CorteVigente, DepartamentosDelCorte, MunicipiosDelCorte } from '../domain/mapa';
import type { TopoJson } from './geometry';
import { MapPage, type MapPageState } from './MapPage/MapPage';
import {
  canonicalPath,
  type MapRoute,
  type PreparedMap,
  parseRoute,
  prepareMap,
  routePath,
} from './mapModel';

type Fetch = (
  url: string,
  init: { signal: AbortSignal; cache?: RequestCache },
) => Promise<Response>;

/**
 * Reads the current cut from our API, then the geometry file it names, and prepares the map.
 * Any failed response (a 503 when the cut is not published, a network error) rejects.
 *
 * The API caches each file for a few minutes, so right after a new cut the browser can hold files of
 * two cuts. Figures of different cuts are never mixed: on a mismatch it asks again past the cache,
 * and if they still differ it fails (the page offers «Reintentar»).
 */
export async function loadMap(
  signal: AbortSignal,
  fetcher: Fetch = fetch,
  fresh = false,
): Promise<PreparedMap> {
  const getJson = async <T,>(url: string): Promise<T> => {
    const response = await fetcher(url, fresh ? { signal, cache: 'no-cache' } : { signal });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return (await response.json()) as T;
  };
  const cut = await getJson<CorteVigente>('/api/mapa/corte');
  const [departments, municipalities, topology] = await Promise.all([
    getJson<DepartamentosDelCorte>('/api/mapa/departamentos'),
    getJson<MunicipiosDelCorte>('/api/mapa/municipios'),
    getJson<TopoJson>(`/geometria/${cut.geometria}.topojson`),
  ]);
  if (departments.corte !== cut.corte || municipalities.corte !== cut.corte) {
    if (!fresh) return loadMap(signal, fetcher, true);
    throw new Error(
      `Cortes distintos: ${cut.corte}, ${departments.corte} y ${municipalities.corte}`,
    );
  }
  return prepareMap({ cut, departments, municipalities, topology });
}

// A generated page waits this long for the data before the app takes over anyway (it then loads them).
const INITIAL_TIMEOUT_MS = 8000;

/**
 * The state to start with when `#root` already shows a place's generated page (ADR 0003): the data
 * are read first, so the app replaces that page with the same place, never with «Cargando el mapa…».
 * If they fail, the usual error; if they take longer than `timeout`, nothing: the app mounts and loads
 * them itself (its usual loading state), so the page never stays static. Without a generated page (the
 * SPA), nothing: the screen loads them.
 */
export async function initialState(
  generated: boolean,
  fetcher: Fetch = fetch,
  timeout = INITIAL_TIMEOUT_MS,
): Promise<MapPageState | undefined> {
  if (!generated) return undefined;
  const signal = AbortSignal.timeout(timeout);
  return loadMap(signal, fetcher).then(
    (map) => ({ status: 'ready', map }),
    () => (signal.aborted ? undefined : { status: 'unavailable' }),
  );
}

export interface MapScreenProps {
  /** Data already read (`initialState`): the first load is skipped; «Reintentar» still loads. */
  initial?: MapPageState;
  /** What the person had typed in the generated page's search before the app took over. */
  initialQuery?: string;
}

/**
 * The map page in the app: reads the cut from our API (contract: docs/design/pages/map/contract.md)
 * and the geometry file it names, and keeps the view in the address bar so every place has a link.
 */
export function MapScreen({ initial, initialQuery }: MapScreenProps) {
  const [route, setRoute] = useState<MapRoute>(() => {
    // One address per place: «/mapa/departamento/11» or a trailing slash become the canonical link.
    const canonical = canonicalPath(window.location.pathname);
    if (canonical) window.history.replaceState(null, '', canonical);
    return parseRoute(window.location.pathname);
  });
  const [state, setState] = useState<MapPageState>(initial ?? { status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // `attempt` re-runs the load on «Reintentar»; with data already read, the first load is skipped.
  useEffect(() => {
    if (initial && attempt === 0) return;
    const control = new AbortController();
    const { signal } = control;
    setState({ status: 'loading' });
    loadMap(signal).then(
      (map) => setState({ status: 'ready', map }),
      (error: unknown) => {
        if ((error as Error).name !== 'AbortError') setState({ status: 'unavailable' });
      },
    );
    return () => control.abort();
  }, [attempt, initial]);

  // Each place adds a history entry; the map flies to it (FullscreenMap), and Back flies back.
  const navigate = (next: MapRoute) => {
    const path = routePath(next);
    if (path !== window.location.pathname) window.history.pushState(null, '', path);
    setRoute(next);
  };

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // The tab says where you are, with the generated page's own title, so it never changes on mount.
  const title = useMemo(
    () => (state.status === 'ready' ? tituloDelLugar(state.map, route) : undefined),
    [state, route],
  );
  useEffect(() => {
    document.title = title ?? 'Mapa de contratación pública · EKOU Elephants';
  }, [title]);

  return (
    <MapPage
      state={state}
      route={route}
      defaultQuery={initialQuery}
      onNavigate={navigate}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
