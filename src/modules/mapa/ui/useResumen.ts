import { useEffect, useState } from 'react';
import type { ResumenMunicipalDatos } from '../domain/resumen-municipal';
import type { MapRoute } from './mapModel';

type Fetch = (url: string, init: { signal: AbortSignal }) => Promise<Response>;

/** The summary of the place on screen: loading, failed (offers «Reintentar») or ready. */
export type ResumenState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      datos: ResumenMunicipalDatos;
      /** The year the link asked for when the API refused it: the page warns and shows `datos.anio`. */
      anioInvalido?: string;
    };

/** `?anio=2024` → «2024». The API is the one that says whether the year is valid. */
export function parseAnio(search: string): string | undefined {
  return new URLSearchParams(search).get('anio') ?? undefined;
}

/** The address of a place with its year: «/mapa/70678?anio=2024». */
export function withAnio(path: string, anio: string | number | undefined): string {
  return anio === undefined ? path : `${path}?anio=${anio}`;
}

/** Country view has no summary; a department and a municipality each have their own endpoint. */
export function resumenUrl(route: MapRoute, anio?: string): string | undefined {
  const query = anio === undefined ? '' : `?anio=${encodeURIComponent(anio)}`;
  if (route.view === 'municipality') return `/api/mapa/municipios/${route.code}/resumen${query}`;
  if (route.view === 'department') return `/api/mapa/departamentos/${route.code}/resumen${query}`;
  return undefined;
}

/**
 * Reads the summary of a place. If the API refuses the year (400 `anio_invalido`) it asks again
 * without it, so the page still shows the place, and returns the refused year for the warning.
 * Any other failed response rejects.
 */
export async function loadResumen(
  url: string,
  signal: AbortSignal,
  fetcher: Fetch = fetch,
): Promise<{ datos: ResumenMunicipalDatos; anioInvalido?: string }> {
  const response = await fetcher(url, { signal });
  if (response.ok) return { datos: (await response.json()) as ResumenMunicipalDatos };

  const asked = new URL(url, 'http://local').searchParams.get('anio');
  if (response.status === 400 && asked !== null) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (body?.error === 'anio_invalido') {
      const sinAnio = url.replace(/\?.*$/, '');
      const retry = await fetcher(sinAnio, { signal });
      if (retry.ok)
        return { datos: (await retry.json()) as ResumenMunicipalDatos, anioInvalido: asked };
    }
  }
  throw new Error(`${url}: ${response.status}`);
}

/**
 * The first render after a change of place or year still holds the previous answer (the effect
 * marks «loading» later): an answer of another place, or of a year that was not asked for, is not shown.
 */
export function vigente(
  state: ResumenState,
  code: string | undefined,
  anio: string | undefined,
): ResumenState {
  if (code === undefined) return { status: 'idle' };
  if (state.status !== 'ready') return state;
  const otroLugar = state.datos.codigo !== code;
  const otroAnio =
    anio !== undefined && state.anioInvalido !== anio && String(state.datos.anio) !== anio;
  return otroLugar || otroAnio ? { status: 'loading' } : state;
}

/**
 * The summary of `route` for `anio` (the latest year with data when `anio` is missing). Changing
 * place or year starts a new read and cancels the one in flight; `attempt` re-runs it («Reintentar»).
 */
export function useResumen(
  route: MapRoute,
  anio: string | undefined,
  attempt = 0,
  fetcher: Fetch = fetch,
): ResumenState {
  const url = resumenUrl(route, anio);
  const [state, setState] = useState<ResumenState>({ status: 'idle' });
  const code =
    route.view === 'municipality' || route.view === 'department' ? route.code : undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` only forces a new read
  useEffect(() => {
    if (!url) {
      setState({ status: 'idle' });
      return;
    }
    const control = new AbortController();
    setState({ status: 'loading' });
    loadResumen(url, control.signal, fetcher).then(
      (listo) => setState({ status: 'ready', ...listo }),
      (error: unknown) => {
        if ((error as Error).name !== 'AbortError') setState({ status: 'error' });
      },
    );
    return () => control.abort();
  }, [url, attempt, fetcher]);

  return vigente(state, url ? code : undefined, anio);
}
