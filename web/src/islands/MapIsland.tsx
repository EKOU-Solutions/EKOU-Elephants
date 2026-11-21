import { useEffect, useMemo, useRef, useState } from 'react';
import { fromPageMap, type PageMap } from '../lib/pageMap';
import { placeTitle } from '../../../pages-site/src/lib/site';
import { MapPage, type MapPageState } from '../../../src/modules/mapa/ui/MapPage/MapPage';
import { loadMap } from '../../../src/modules/mapa/ui/MapScreen';
import { type MapRoute, parseRoute, routePath } from '../../../src/modules/mapa/ui/mapModel';

export interface MapIslandProps {
  route: MapRoute;
  /** The page's own data (ADR-0004 point 4): every figure, only this page's outlines, as
   * the JSON of a `PageMap`. */
  map: string;
}

/**
 * The map screen as an island (ADR-0004): it HYDRATES the page Astro rendered, never replaces it.
 * The first render equals the server's (`prerendered`, same data); after hydration the screen turns
 * interactive. The whole country (topojson ~95 KB plus the API lists) downloads only when the person
 * shows intent (pointer, wheel, keyboard or focus) or navigates.
 */
export function MapIsland({ route: initialRoute, map }: MapIslandProps) {
  const [hydrated, setHydrated] = useState(false);
  const [route, setRoute] = useState(initialRoute);
  const [state, setState] = useState<MapPageState>(() => ({ status: 'ready', map: fromPageMap(JSON.parse(map) as PageMap) }));
  const [attempt, setAttempt] = useState(0);
  const full = useRef<Promise<boolean> | undefined>(undefined);

  useEffect(() => setHydrated(true), []);

  const loadFull = () => {
    full.current ??= loadMap(new AbortController().signal).then(
      (all) => {
        setState({ status: 'ready', map: all });
        return true;
      },
      () => {
        full.current = undefined;
        return false;
      },
    );
    return full.current;
  };

  // «Reintentar» (only reachable after a failed full load).
  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the load
  useEffect(() => {
    if (attempt > 0) void loadFull();
  }, [attempt]);

  const navigate = async (next: MapRoute) => {
    if (!(await loadFull())) return setState({ status: 'unavailable' });
    const path = routePath(next);
    if (path !== window.location.pathname) window.history.pushState(null, '', path);
    setRoute(next);
  };

  useEffect(() => {
    const onPop = () => {
      void loadFull();
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const title = useMemo(
    () => (state.status === 'ready' ? placeTitle(state.map, route) : undefined),
    [state, route],
  );
  useEffect(() => {
    if (hydrated && title) document.title = title;
  }, [hydrated, title]);

  const intent = () => void loadFull();
  return (
    <div
      style={{ display: 'contents' }}
      onPointerDownCapture={intent}
      onWheelCapture={intent}
      onKeyDownCapture={intent}
      onFocusCapture={intent}
    >
      <MapPage
        state={state}
        route={route}
        onNavigate={(next) => void navigate(next)}
        onRetry={() => setAttempt((n) => n + 1)}
        prerendered={!hydrated}
      />
    </div>
  );
}
