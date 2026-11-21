// The contract page of the web Worker (ADR-0004): rendered on demand from the API and kept in
// Cloudflare's cache. Pure: the Astro page, the middleware and the tests share these rules.
import type { ContractDetailState } from '../../../src/modules/contracts/ui/ContractDetailPage/ContractDetailPage';
import { loadContract, tabTitle } from '../../../src/modules/contracts/ui/ContractScreen';
import { pageDescription } from '../../../src/modules/contracts/ui/contractText';
import type { ApiGateway } from './apiGateway';

/** How long the API may take before the page says «datos no disponibles». */
const API_TIMEOUT_MS = 8000;
/** The data change once a month: a browser keeps the page for an hour, Cloudflare for a month. */
const FOUND_CACHE = 'public, max-age=3600, s-maxage=2592000';
/** A contract that is not in the cut may arrive with the next one: asked again after five minutes. */
const NOT_FOUND_CACHE = 'public, max-age=300';

const CONTRACT_PATH = /^\/contratos\/[^/]+$/;

/** Whether the path is a contract page: the only pages the cache keeps. */
export const isContractPath = (pathname: string) => CONTRACT_PATH.test(pathname);

/**
 * The cache key of a contract page: its address plus the cut and the app version, so a new cut or new
 * code always renders it again and nothing is purged by hand. The page's own query never counts.
 */
export function cacheKey(url: URL, cut: string, version: string): string {
  const key = new URL(url.pathname, url.origin);
  key.searchParams.set('corte', cut);
  key.searchParams.set('v', version);
  return key.href;
}

/**
 * The contract as the page shows it, read from our API like any other client. The server never knows
 * where the person came from: a missing contract offers «Ir al mapa» until the browser says otherwise.
 */
export function contractState(
  id: string,
  api: ApiGateway,
  origin: string,
  timeout = API_TIMEOUT_MS,
): Promise<ContractDetailState> {
  const unavailable: ContractDetailState = { status: 'unavailable' };
  const signal = AbortSignal.timeout(timeout);
  // The race answers on time even if the API never does and ignores the signal.
  const late = new Promise<ContractDetailState>((resolve) =>
    signal.addEventListener('abort', () => resolve(unavailable)),
  );
  const read = loadContract(id, 'link', signal, (path, init) =>
    api.fetch(new Request(new URL(path, origin), init)),
  ).catch(() => unavailable);
  return Promise.race([read, late]);
}

export interface ContractResponse {
  status: 200 | 404 | 503;
  cacheControl: string;
  title: string;
  /** Only a contract that exists has a description and may be indexed. */
  description?: string;
}

/** What the answer says besides the page: its status, how long it is kept and its head. */
export function contractResponse(state: ContractDetailState): ContractResponse {
  const title = tabTitle(state);
  if (state.status === 'ready')
    return {
      status: 200,
      cacheControl: FOUND_CACHE,
      title,
      description: pageDescription(state.contract, state.cutDate),
    };
  if (state.status === 'not_found') return { status: 404, cacheControl: NOT_FOUND_CACHE, title };
  return { status: 503, cacheControl: 'no-store', title };
}
