import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MapPageState } from './MapPage/MapPage';
import { initialState, loadMap, MapScreen } from './MapScreen';
import { sampleData, sampleMap } from './sample';

/** A fetch that answers from the real sample (cut 2026-11), or with `status` for the listed URLs. */
function fakeFetch(failing: Record<string, number> = {}) {
  const bodies: Record<string, unknown> = {
    '/api/mapa/corte': sampleData.cut,
    '/api/mapa/departamentos': sampleData.departments,
    '/api/mapa/municipios': sampleData.municipalities,
    [`/geometria/${sampleData.cut.geometria}.topojson`]: sampleData.topology,
  };
  const asked: string[] = [];
  const fetcher = async (url: string) => {
    asked.push(url);
    const status = failing[url] ?? (url in bodies ? 200 : 404);
    return new Response(status === 200 ? JSON.stringify(bodies[url]) : null, { status });
  };
  return { fetcher, asked };
}

describe('loadMap', () => {
  it('reads the cut, its three companions and the geometry that the cut names', async () => {
    const { fetcher, asked } = fakeFetch();
    const map = await loadMap(new AbortController().signal, fetcher);
    expect(asked[0]).toBe('/api/mapa/corte');
    expect(asked).toContain('/geometria/mgn-2025.topojson');
    expect(map.municipalities.get('05001')?.nombre).toBe('Medellín');
    expect(map.departments.size).toBe(33);
  });

  it('fails when the cut is not published (503), so the page shows «no disponibles»', async () => {
    const { fetcher, asked } = fakeFetch({ '/api/mapa/corte': 503 });
    await expect(loadMap(new AbortController().signal, fetcher)).rejects.toThrow('503');
    expect(asked).toEqual(['/api/mapa/corte']);
  });

  it('never mixes two cuts: asks again past the cache, then fails if they still differ', async () => {
    const stale = { ...sampleData.municipalities, corte: '2026-10' };
    const caches: (string | undefined)[] = [];
    const fetcher = async (url: string, init: { cache?: RequestCache }) => {
      caches.push(init.cache);
      const { fetcher: real } = fakeFetch();
      return url === '/api/mapa/municipios'
        ? new Response(JSON.stringify(stale), { status: 200 })
        : real(url);
    };
    await expect(loadMap(new AbortController().signal, fetcher)).rejects.toThrow(
      'Cortes distintos',
    );
    expect(caches).toContain('no-cache');
  });

  it('fails when any companion file fails, instead of drawing half a map', async () => {
    const { fetcher } = fakeFetch({ '/api/mapa/municipios': 500 });
    await expect(loadMap(new AbortController().signal, fetcher)).rejects.toThrow('500');
  });
});

describe('initialState (a generated page already in view)', () => {
  it('without a generated page (the SPA) reads nothing: the screen shows its loading state', async () => {
    const { fetcher, asked } = fakeFetch();
    await expect(initialState(false, fetcher)).resolves.toBeUndefined();
    expect(asked).toEqual([]);
  });

  it('with a generated page reads the data first, so the app starts on the place', async () => {
    const { fetcher } = fakeFetch();
    const state = await initialState(true, fetcher);
    expect(state?.status).toBe('ready');
    expect(state?.status === 'ready' && state.map.municipalities.get('05001')?.nombre).toBe(
      'Medellín',
    );
  });

  it('if the data fail, it starts on the usual error, never on a page that does nothing', async () => {
    const { fetcher } = fakeFetch({ '/api/mapa/corte': 503 });
    await expect(initialState(true, fetcher)).resolves.toEqual({ status: 'unavailable' });
  });
});

describe('MapScreen first render', () => {
  afterEach(() => vi.unstubAllGlobals());
  const screen = (initial?: MapPageState) => {
    vi.stubGlobal('window', {
      location: { pathname: '/mapa/05001' },
      history: { replaceState: () => {} },
    });
    return renderToStaticMarkup(createElement(MapScreen, { initial }));
  };

  it('with data already read: the place, no «Cargando el mapa…» and nothing announced', () => {
    const html = screen({ status: 'ready', map: sampleMap });
    expect(html).toMatch(/<h1[^>]*>Medellín<\/h1>/);
    expect(html).not.toContain('Cargando el mapa');
    expect(html).toMatch(/<p class="[^"]*" role="status"><\/p>/);
  });

  it('without them (the SPA): the loading state, as always', () => {
    expect(screen()).toContain('Cargando el mapa…');
  });
});
