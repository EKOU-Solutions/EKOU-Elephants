import { describe, expect, it } from 'vitest';
import { loadMap } from './MapScreen';
import { sampleData } from './sample';

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
