import { useEffect, useMemo, useState } from 'react';
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

/**
 * The map page in the app: reads the cut from our API (contract: docs/design/pages/map/contract.md)
 * and the geometry file it names, and keeps the view in the address bar so every place has a link.
 */
export function MapScreen() {
  const [route, setRoute] = useState<MapRoute>(() => {
    // One address per place: «/mapa/departamento/11» or a trailing slash become the canonical link.
    const canonical = canonicalPath(window.location.pathname);
    if (canonical) window.history.replaceState(null, '', canonical);
    return parseRoute(window.location.pathname);
  });
  const [state, setState] = useState<MapPageState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the load on «Reintentar»
  useEffect(() => {
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
  }, [attempt]);

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

  // The tab says where you are: «Medellín · Mapa de contratación pública».
  const place = useMemo(() => {
    if (state.status !== 'ready') return undefined;
    if (route.view === 'municipality') return state.map.municipalities.get(route.code)?.nombre;
    if (route.view === 'department') return state.map.departments.get(route.code)?.nombre;
    return undefined;
  }, [state, route]);
  useEffect(() => {
    document.title = `${place ? `${place} · ` : ''}Mapa de contratación pública · EKOU Elephants`;
  }, [place]);

  return (
    <MapPage
      state={state}
      route={route}
      onNavigate={navigate}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
