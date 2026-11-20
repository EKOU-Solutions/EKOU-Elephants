import { describe, expect, it } from 'vitest';
import {
  contractKey,
  groupOf,
  type ObjectStore,
} from '../modules/contracts/adapters/data-worker/contracts.data-worker';
import { claves } from '../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import { crearApp } from './app';
import type { Queryable } from './db';

const CUT = '2026-11';
// Real contract of cut 2026-11 (docs/design/pages/contract-detail/contract.md).
const company = {
  id: 'CO1.PCCNTR.7954915',
  source: 'secop_ii',
  sourceUrl:
    'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.8249008&isFromPublicArea=True&isModal=true&asPopupView=true',
  description: 'Aunar esfuerzos para el mantenimiento rutinario de las vías rurales',
  type: 'Obra',
  isPublicWorks: true,
  procurementMethod: 'Contratación directa',
  methodJustification: 'Convenios Solidarios Regimen articulo 92 Ley 2166 de 2021',
  status: 'expired_unclosed',
  sourceStatus: 'Modificado',
  provisional: false,
  buyer: { name: 'ALCALDIA DE PASTO', taxId: '891280000' },
  supplier: { kind: 'company', name: 'JAC Mojondinoy', taxId: '800167184' },
  location: {
    municipality: { code: '52001', name: 'Pasto' },
    department: { code: '52', name: 'Nariño' },
  },
  dates: { signed: '2025-06-09', start: '2025-07-09', end: '2026-09-30', addedDays: 273 },
  amounts: {
    currentCents: 6781538313,
    initialCents: 5609556600,
    changePct: 0.2089,
    exceedsLegalAdditionLimit: false,
    reliable: true,
    paidCents: null,
  },
};
// SECOP I, natural person: no name, no document, missing figures as null.
const person = {
  ...company,
  id: '25-12-14382349-13325351',
  source: 'secop_i',
  supplier: { kind: 'natural_person' },
  dates: { signed: '2025-02-03', start: null, end: null, addedDays: null },
  amounts: { ...company.amounts, initialCents: null, changePct: null },
};

const cutFile = {
  corte: CUT,
  fechaCorte: '2026-11-07',
  publicadoEn: '2026-11-15T17:43:18Z',
  geometria: 'mgn-2025',
  fuentes: [],
};

const noDatabase: Queryable = {
  async query() {
    throw new Error('contracts must not query PostgreSQL');
  },
};

/** A published cut whose group files hold `contracts`, one per line, as the pipeline writes them. */
async function published(contracts: unknown[], cut = CUT): Promise<Record<string, string>> {
  const files: Record<string, string> = {
    [claves.puntero]: JSON.stringify({ corte: cut }),
    [claves.corte(cut)]: JSON.stringify({ ...cutFile, corte: cut }),
  };
  for (const contract of contracts) {
    const key = await contractKey(cut, (contract as { id: string }).id);
    files[key] = `${files[key] ?? ''}${JSON.stringify(contract)}\n`;
  }
  return files;
}

function app(files: Record<string, string>) {
  const read: string[] = [];
  const store: ObjectStore = {
    async get(key) {
      read.push(key);
      const text = files[key];
      return text === undefined ? null : { text: async () => text };
    },
  };
  return { app: crearApp(noDatabase, store), read };
}

describe('groupOf', () => {
  // Same values as `group_of` in the pipeline (pipeline/tests/test_contracts.py computes them
  // with hashlib): if one side changes its rule, the API stops finding the contracts.
  it('matches the pipeline', async () => {
    expect(await groupOf('CO1.PCCNTR.7954915')).toBe('2f08');
    expect(await groupOf('25-12-14382349-13325351')).toBe('2651');
  });
});

describe('GET /api/contracts/:id', () => {
  it('returns the contract with its cut and a short cache', async () => {
    const { app: api, read } = app(await published([company]));
    const res = await api.request('/api/contracts/CO1.PCCNTR.7954915');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...company, cut: CUT });
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=86400',
    );
    // One group file per request, never the whole cut.
    expect(read.filter((k) => k.includes('/contratos/'))).toEqual([
      'datos/2026-11/contratos/2f08.ndjson',
    ]);
  });

  it('returns a natural person without name or document, and missing figures as null', async () => {
    const { app: api } = app(await published([person]));
    const res = await api.request('/api/contracts/25-12-14382349-13325351');
    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof person;
    expect(body.supplier).toEqual({ kind: 'natural_person' });
    expect(body.amounts.initialCents).toBeNull();
    expect(body.dates.addedDays).toBeNull();
  });

  it('finds a contract that is not the first line of its file', async () => {
    const files = await published([company]);
    const key = await contractKey(CUT, company.id);
    files[key] = `${JSON.stringify({ ...company, id: 'CO1.PCCNTR.1' })}\n${files[key]}`;
    const res = await app(files).app.request('/api/contracts/CO1.PCCNTR.7954915');
    expect(((await res.json()) as typeof company).id).toBe(company.id);
  });

  it('does not match a longer id that starts the same', async () => {
    const { app: api } = app(await published([{ ...company, id: 'CO1.PCCNTR.79549150' }]));
    const res = await api.request('/api/contracts/CO1.PCCNTR.7954915');
    expect(res.status).toBe(404);
  });

  it.each(['CO1.PCCNTR.404', '25-12-1-1'])(
    'answers 404 for a valid id that is not in the cut: %s',
    async (id) => {
      const res = await app(await published([company])).app.request(`/api/contracts/${id}`);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'contract_not_found' });
    },
  );

  it.each([
    'abc',
    'CO1.PCCNTR.',
    'CO1.PCCNTR.12x',
    '25-12-1',
    '..%2Flatest',
    `CO1.PCCNTR.${'9'.repeat(40)}`,
  ])('answers 400 without reading any data for an invalid id: %s', async (id) => {
    const { app: api, read } = app(await published([company]));
    const res = await api.request(`/api/contracts/${id}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_contract_id' });
    expect(read).toEqual([]);
  });

  it('answers 503 when no cut is published', async () => {
    const res = await app({}).app.request('/api/contracts/CO1.PCCNTR.7954915');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'corte_no_disponible' });
  });

  it('answers 503, not the data, if a natural person comes with a name', async () => {
    const leaked = { ...person, supplier: { kind: 'natural_person', name: 'NOMBRE' } };
    const res = await app(await published([leaked])).app.request(`/api/contracts/${person.id}`);
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain('NOMBRE');
  });

  it.each([
    ['a field outside the contract', { ...company, contratistaId: 'k1_abc' }],
    [
      'a zero where missing data must be null',
      { ...company, dates: { ...company.dates, addedDays: 0 } },
    ],
    ['a link that is not https', { ...company, sourceUrl: 'javascript:alert(1)' }],
  ])('answers 503 if the published line has %s', async (_case, contract) => {
    const res = await app(await published([contract])).app.request(
      '/api/contracts/CO1.PCCNTR.7954915',
    );
    expect(res.status).toBe(503);
  });

  it('answers 503 if the published line is not JSON', async () => {
    const files = await published([]);
    files[await contractKey(CUT, company.id)] = `{"id":"${company.id}",oops\n`;
    const res = await app(files).app.request('/api/contracts/CO1.PCCNTR.7954915');
    expect(res.status).toBe(503);
  });
});
