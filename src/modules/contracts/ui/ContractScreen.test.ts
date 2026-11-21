import { describe, expect, it } from 'vitest';
import { pastoContract } from './ContractDetailPage/ContractDetailPage.fixtures';
import {
  arrivalOrigin,
  contractIdFromPath,
  copy,
  loadContract,
  share,
  tabTitle,
} from './ContractScreen';

const CUT = { corte: '2026-11', fechaCorte: '2026-11-07' };

/** A fetch that answers each URL with the given status and body, and records what was asked. */
function fakeFetch(answers: Record<string, { status: number; body?: unknown }>) {
  const asked: string[] = [];
  const fetcher = async (url: string) => {
    asked.push(url);
    const { status, body } = answers[url] ?? { status: 404 };
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  };
  return { fetcher, asked };
}
const CONTRACT_URL = '/api/contracts/CO1.PCCNTR.7954915';
const load = (answers: Record<string, { status: number; body?: unknown }>) =>
  loadContract(
    'CO1.PCCNTR.7954915',
    'link',
    new AbortController().signal,
    fakeFetch(answers).fetcher,
  );

describe('contractIdFromPath', () => {
  it('reads the SECOP id as it is, from SECOP II and SECOP I', () => {
    expect(contractIdFromPath('/contratos/CO1.PCCNTR.7954915')).toBe('CO1.PCCNTR.7954915');
    expect(contractIdFromPath('/contratos/25-12-14382349-13325351/')).toBe(
      '25-12-14382349-13325351',
    );
    expect(contractIdFromPath('/contratos/a%20b')).toBe('a b');
  });

  it('finds no contract in any other path', () => {
    expect(contractIdFromPath('/contratos')).toBeNull();
    expect(contractIdFromPath('/contratos/')).toBeNull();
    expect(contractIdFromPath('/contratos/a/b')).toBeNull();
    expect(contractIdFromPath('/contratos/%E0%A4%A')).toBeNull();
    expect(contractIdFromPath('/mapa/52001')).toBeNull();
  });
});

describe('arrivalOrigin', () => {
  it('is the app only when the previous page was Elephants', () => {
    const origin = 'https://elephants.example';
    expect(arrivalOrigin('https://elephants.example/mapa/52001', origin, 2)).toBe('app');
    expect(arrivalOrigin('https://otro.example/mapa', origin, 5)).toBe('link');
    expect(arrivalOrigin('', origin, 3)).toBe('link');
  });

  it('is a link when there is no history to go back to (opened in a new tab)', () => {
    const origin = 'https://elephants.example';
    expect(arrivalOrigin('https://elephants.example/mapa/52001', origin, 1)).toBe('link');
  });
});

describe('loadContract', () => {
  it('200: the contract, dated with the day of its cut', async () => {
    const state = await load({
      [CONTRACT_URL]: { status: 200, body: pastoContract },
      '/api/mapa/corte': { status: 200, body: CUT },
    });
    expect(state).toEqual({ status: 'ready', contract: pastoContract, cutDate: '2026-11-07' });
  });

  it('without the cut date, or with the date of another cut, keeps only the month', async () => {
    const contract = { status: 200, body: pastoContract };
    expect(await load({ [CONTRACT_URL]: contract, '/api/mapa/corte': { status: 503 } })).toEqual({
      status: 'ready',
      contract: pastoContract,
      cutDate: undefined,
    });
    const other = { status: 200, body: { corte: '2026-12', fechaCorte: '2026-12-05' } };
    expect(await load({ [CONTRACT_URL]: contract, '/api/mapa/corte': other })).toMatchObject({
      cutDate: undefined,
    });
  });

  it('400 and 404: the contract does not exist, and the page keeps how the person arrived', async () => {
    const cut = { status: 200, body: CUT };
    for (const status of [400, 404])
      expect(await load({ [CONTRACT_URL]: { status }, '/api/mapa/corte': cut })).toEqual({
        status: 'not_found',
        origin: 'link',
      });
  });

  it('a path without an id does not exist, and the API is not asked', async () => {
    const { fetcher, asked } = fakeFetch({});
    expect(await loadContract(null, 'app', new AbortController().signal, fetcher)).toEqual({
      status: 'not_found',
      origin: 'app',
    });
    expect(asked).toEqual([]);
  });

  it('503 or a network failure: not available, so the page offers «Reintentar»', async () => {
    expect(await load({ [CONTRACT_URL]: { status: 503 } })).toEqual({ status: 'unavailable' });
    const failing = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await loadContract('1-2-3-4', 'link', new AbortController().signal, failing)).toEqual({
      status: 'unavailable',
    });
  });

  it('escapes the id in the request', async () => {
    const { fetcher, asked } = fakeFetch({});
    await loadContract('a/b', 'link', new AbortController().signal, fetcher);
    expect(asked).toContain('/api/contracts/a%2Fb');
  });
});

describe('share and copy', () => {
  const data = { title: 'Contrato de obra', url: 'https://elephants.example/contratos/1-2-3-4' };
  const named = (name: string) => Object.assign(new Error(name), { name });
  /** A clipboard that records what it receives, or refuses. */
  const clipboard = (refuses = false) => {
    const written: string[] = [];
    const writeText = async (text: string) => {
      if (refuses) throw named('NotAllowedError');
      written.push(text);
    };
    return { written, clipboard: { writeText } as Clipboard };
  };

  it('shares with the system menu when there is one', async () => {
    const shared: unknown[] = [];
    const outcome = await share(data, { share: async (d) => void shared.push(d) });
    expect(outcome).toBe('done');
    expect(shared).toEqual([data]);
  });

  it('closing the share menu is not a failure', async () => {
    const closing = async () => {
      throw named('AbortError');
    };
    expect(await share(data, { share: closing })).toBe('done');
  });

  it('says so when the share menu fails', async () => {
    const failing = async () => {
      throw named('NotAllowedError');
    };
    expect(await share(data, { share: failing })).toBe('failed');
  });

  it('without a share menu, copies the link instead', async () => {
    const { written, clipboard: board } = clipboard();
    expect(await share(data, { clipboard: board })).toBe('copied');
    expect(written).toEqual([data.url]);
  });

  it('fails without a share menu or a clipboard, and when the clipboard refuses', async () => {
    expect(await share(data, {})).toBe('failed');
    expect(await share(data, { clipboard: clipboard(true).clipboard })).toBe('failed');
  });

  it('copy says whether the text reached the clipboard, and never throws', async () => {
    const { written, clipboard: board } = clipboard();
    expect(await copy('CO1.PCCNTR.7954915', { clipboard: board })).toBe(true);
    expect(written).toEqual(['CO1.PCCNTR.7954915']);
    expect(await copy('x', { clipboard: clipboard(true).clipboard })).toBe(false);
    expect(await copy('x', {})).toBe(false);
  });
});

describe('tabTitle', () => {
  it('names the contract and its entity, or says what the page is', () => {
    expect(tabTitle({ status: 'ready', contract: pastoContract })).toBe(
      'Contrato de obra · ALCALDIA DE PASTO · EKOU Elephants',
    );
    expect(tabTitle({ status: 'loading' })).toBe('Contrato · EKOU Elephants');
    expect(tabTitle({ status: 'not_found', origin: 'link' })).toBe(
      'No encontramos ese contrato · EKOU Elephants',
    );
  });
});
