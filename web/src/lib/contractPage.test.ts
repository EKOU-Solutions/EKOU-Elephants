import { describe, expect, it } from 'vitest';
import { pastoContract } from '../../../src/modules/contracts/ui/ContractDetailPage/ContractDetailPage.fixtures';
import type { ApiGateway } from './apiGateway';
import { cacheKey, contractResponse, contractState, isContractPath } from './contractPage';

const ORIGIN = 'https://elephants.example';
const CUT = { corte: pastoContract.cut, fechaCorte: '2026-11-07' };

/** An API that answers each path with the given status and body, and records what was asked. */
function fakeApi(answers: Record<string, { status: number; body?: unknown }>) {
  const asked: string[] = [];
  const api: ApiGateway = {
    async fetch(request) {
      const { pathname } = new URL(request.url);
      asked.push(request.url);
      const { status, body } = answers[pathname] ?? { status: 404 };
      return new Response(body === undefined ? null : JSON.stringify(body), { status });
    },
  };
  return { api, asked };
}
const CONTRACT = `/api/contracts/${pastoContract.id}`;

describe('isContractPath', () => {
  it('is only a contract page', () => {
    expect(isContractPath('/contratos/CO1.PCCNTR.7954915')).toBe(true);
    expect(isContractPath('/contratos/25-12-14382349-13325351')).toBe(true);
    expect(isContractPath('/contratos')).toBe(false);
    expect(isContractPath('/contratos/a/b')).toBe(false);
    expect(isContractPath('/mapa/52001')).toBe(false);
  });
});

describe('cacheKey', () => {
  const url = new URL(`${ORIGIN}/contratos/CO1.PCCNTR.7954915?utm_source=x`);

  it('changes with the cut and with the app version, and ignores the page query', () => {
    const key = cacheKey(url, '2026-11', 'abc');
    expect(key).toBe(`${ORIGIN}/contratos/CO1.PCCNTR.7954915?corte=2026-11&v=abc`);
    expect(cacheKey(url, '2026-12', 'abc')).not.toBe(key);
    expect(cacheKey(url, '2026-11', 'def')).not.toBe(key);
  });
});

describe('contractState', () => {
  it('reads the contract and its cut date from the API, at the web\'s own origin', async () => {
    const { api, asked } = fakeApi({
      [CONTRACT]: { status: 200, body: pastoContract },
      '/api/mapa/corte': { status: 200, body: CUT },
    });
    expect(await contractState(pastoContract.id, api, ORIGIN)).toEqual({
      status: 'ready',
      contract: pastoContract,
      cutDate: '2026-11-07',
    });
    expect(asked).toContain(`${ORIGIN}${CONTRACT}`);
  });

  it('says «no existe» for a 404 and for an id the API rejects, as a link would', async () => {
    const notFound = { status: 'not_found', origin: 'link' };
    expect(await contractState('nope', fakeApi({}).api, ORIGIN)).toEqual(notFound);
    const rejected = fakeApi({ '/api/contracts/x': { status: 400 } }).api;
    expect(await contractState('x', rejected, ORIGIN)).toEqual(notFound);
  });

  it('says «no disponible» when the API fails or does not answer', async () => {
    const failing = fakeApi({ [CONTRACT]: { status: 503 } }).api;
    expect(await contractState(pastoContract.id, failing, ORIGIN)).toEqual({ status: 'unavailable' });
    const broken: ApiGateway = { fetch: () => Promise.reject(new Error('down')) };
    expect(await contractState(pastoContract.id, broken, ORIGIN)).toEqual({ status: 'unavailable' });
    const silent: ApiGateway = { fetch: () => new Promise(() => {}) };
    expect(await contractState(pastoContract.id, silent, ORIGIN, 10)).toEqual({
      status: 'unavailable',
    });
  });
});

describe('contractResponse', () => {
  it('keeps a contract for long and gives it a title and a description', () => {
    const answer = contractResponse({ status: 'ready', contract: pastoContract });
    expect(answer.status).toBe(200);
    expect(answer.cacheControl).toMatch(/^public, max-age=3600, s-maxage=\d+$/);
    expect(answer.title).toContain(pastoContract.buyer.name);
    expect(answer.description).toContain('(SECOP II, datos de nov 2026)');
  });

  it('keeps «no existe» for a short while and never «no disponible»; neither is described', () => {
    const missing = contractResponse({ status: 'not_found', origin: 'link' });
    expect(missing).toMatchObject({ status: 404, cacheControl: 'public, max-age=300' });
    expect(missing.description).toBeUndefined();
    const down = contractResponse({ status: 'unavailable' });
    expect(down).toMatchObject({ status: 503, cacheControl: 'no-store' });
    expect(down.description).toBeUndefined();
  });
});
