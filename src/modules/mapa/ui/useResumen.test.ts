import { describe, expect, it } from 'vitest';
import type { ResumenMunicipalDatos } from '../domain/resumen-municipal';
import { loadResumen, parseAnio, resumenUrl, vigente, withAnio } from './useResumen';

const datos = { corte: '2026-11', codigo: '70678', nombre: 'San Benito Abad', anio: 2025 };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const signal = () => new AbortController().signal;

describe('address with year', () => {
  it('reads and writes ?anio=', () => {
    expect(parseAnio('?anio=2024')).toBe('2024');
    expect(parseAnio('')).toBeUndefined();
    expect(withAnio('/mapa/70678', 2024)).toBe('/mapa/70678?anio=2024');
    expect(withAnio('/mapa/70678', undefined)).toBe('/mapa/70678');
  });

  it('has a summary for a department and a municipality, not for the country', () => {
    expect(resumenUrl({ view: 'municipality', code: '70678' }, '2024')).toBe(
      '/api/mapa/municipios/70678/resumen?anio=2024',
    );
    expect(resumenUrl({ view: 'department', code: '70' })).toBe(
      '/api/mapa/departamentos/70/resumen',
    );
    expect(resumenUrl({ view: 'country' })).toBeUndefined();
    expect(resumenUrl({ view: 'invalid' })).toBeUndefined();
  });

  it('escapes what the link brought', () => {
    expect(resumenUrl({ view: 'municipality', code: '70678' }, 'a&b')).toContain('anio=a%26b');
  });
});

describe('loadResumen', () => {
  it('returns the summary as the API sent it', async () => {
    const result = await loadResumen('/x?anio=2025', signal(), async () => json(datos));
    expect(result).toEqual({ datos });
  });

  it('asks again without the year when the API refuses it, and reports the refused year', async () => {
    const asked: string[] = [];
    const fetcher = async (url: string) => {
      asked.push(url);
      return url.includes('anio=')
        ? json({ error: 'anio_invalido', anios: [2021, 2022] }, 400)
        : json(datos);
    };
    const result = await loadResumen(
      '/api/mapa/municipios/70678/resumen?anio=1999',
      signal(),
      fetcher,
    );
    expect(asked).toEqual([
      '/api/mapa/municipios/70678/resumen?anio=1999',
      '/api/mapa/municipios/70678/resumen',
    ]);
    expect(result).toEqual({ datos, anioInvalido: '1999' });
  });

  it.each([404, 500, 503])('fails on %s so the page offers «Reintentar»', async (status) => {
    await expect(
      loadResumen('/x?anio=2025', signal(), async () => json({ error: 'otro' }, status)),
    ).rejects.toThrow(String(status));
  });

  it('fails on a 400 that is not about the year', async () => {
    await expect(
      loadResumen('/x?anio=2025', signal(), async () => json({ error: 'codigo_invalido' }, 400)),
    ).rejects.toThrow('400');
  });
});

describe('vigente', () => {
  const listo = { status: 'ready', datos: datos as unknown as ResumenMunicipalDatos } as const;
  it('shows the answer of the place and year on screen', () => {
    expect(vigente(listo, '70678', '2025')).toBe(listo);
    expect(vigente(listo, '70678', undefined)).toBe(listo);
  });
  it('does not show the answer of another place or of another year', () => {
    expect(vigente(listo, '05001', undefined)).toEqual({ status: 'loading' });
    expect(vigente(listo, '70678', '2024')).toEqual({ status: 'loading' });
  });
  it('keeps the answer to a refused year, and has nothing for the country', () => {
    const aviso = { ...listo, anioInvalido: '1999' } as const;
    expect(vigente(aviso, '70678', '1999')).toBe(aviso);
    expect(vigente(listo, undefined, undefined)).toEqual({ status: 'idle' });
  });
});
