import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { updateReference, assemblePublication, readReference, validateReference } from './cut.mjs';

const P = '2026-11-16T00:00:00Z';
const Q = '2026-12-16T00:00:00Z';
const carpetas = [];
afterEach(() => {
  for (const c of carpetas.splice(0)) rmSync(c, { recursive: true, force: true });
});

describe('referencia del corte vigente', () => {
  it('the one in the repository is valid', () => {
    expect(readReference()).toMatchObject({ corte: '2026-11', cortes: ['2026-11'] });
  });

  it('a new cut becomes current and keeps the previous one', () => {
    const ref = { corte: '2026-11', publicado: P, cortes: ['2026-11', '2026-10'] };
    expect(updateReference(ref, '2026-12', Q)).toEqual({
      corte: '2026-12',
      publicado: Q,
      cortes: ['2026-12', '2026-11'],
    });
    expect(updateReference(null, '2026-11', P)).toEqual({
      corte: '2026-11',
      publicado: P,
      cortes: ['2026-11'],
    });
  });

  it('reprocessing the current cut or an older one changes nothing', () => {
    const ref = { corte: '2026-11', publicado: P, cortes: ['2026-11', '2026-10'] };
    expect(updateReference(ref, '2026-11', P)).toBeNull();
    expect(updateReference(ref, '2026-09', Q)).toBeNull();
    expect(() => updateReference(ref, '2026-13', Q)).toThrow('AAAA-MM');
    expect(() => updateReference(ref, '2026-12')).toThrow('--publicado');
  });

  it('reprocessing the current cut changes `publicado`: it opens its own PR', () => {
    const ref = { corte: '2026-11', publicado: P, cortes: ['2026-11', '2026-10'] };
    expect(updateReference(ref, '2026-11', Q)).toEqual({ ...ref, publicado: Q });
  });

  it('rejects a reference out of order or with too many cuts', () => {
    expect(() =>
      validateReference({ corte: '2026-10', publicado: P, cortes: ['2026-10', '2026-11'] }),
    ).toThrow('del más reciente');
    expect(() =>
      validateReference({
        corte: '2026-12',
        publicado: P,
        cortes: ['2026-12', '2026-11', '2026-10'],
      }),
    ).toThrow('a lo sumo 2');
    expect(() =>
      validateReference({ corte: '2026-11', publicado: P, cortes: ['2026-10'] }),
    ).toThrow();
    expect(() => validateReference({ corte: '2026-11', cortes: ['2026-11'] })).toThrow('publicado');
  });
});

describe('assemblePublication', () => {
  it('downloads each cut from its Release and points latest.json to the current one', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'ekou-armar-'));
    carpetas.push(raiz);
    const llamadas = [];
    // Stand-in for `gh release download`: writes what the Release would have.
    const run = (comando, args, opciones) => {
      llamadas.push([comando, ...args].join(' '));
      if (comando === 'tar') {
        // Stand-in for extracting resumen.tar.gz into the cut folder (its cwd).
        mkdirSync(join(opciones.cwd, 'resumen'), { recursive: true });
        writeFileSync(join(opciones.cwd, 'resumen', '05001.json'), '{}');
        return;
      }
      const dir = args[args.indexOf('--dir') + 1];
      const corte = args[2].replace('corte-', '');
      if (corte === '2026-11') writeFileSync(join(dir, 'resumen.tar.gz'), 'x');
      writeFileSync(
        join(dir, 'corte.json'),
        JSON.stringify({ corte, publicadoEn: corte === '2026-11' ? P : Q }),
      );
      writeFileSync(join(dir, 'municipios.json'), '{}');
      writeFileSync(join(dir, 'departamentos.json'), '{}');
      writeFileSync(join(dir, 'reporte-extraccion.json'), '{}');
    };
    const { puntero } = assemblePublication(
      {
        referencia: { corte: '2026-11', publicado: P, cortes: ['2026-11', '2026-10'] },
        carpeta: raiz,
      },
      run,
    );
    const patrones = '--pattern *.json --pattern resumen.tar.gz';
    const vigente = join(raiz, 'datos', '2026-11');
    expect(llamadas).toEqual([
      `gh release download corte-2026-11 --dir ${vigente} ${patrones}`,
      'tar -xzf resumen.tar.gz',
      // Un corte anterior a los resúmenes no trae el paquete: no se extrae nada.
      `gh release download corte-2026-10 --dir ${join(raiz, 'datos', '2026-10')} ${patrones}`,
    ]);
    // Los resúmenes quedan extraídos y el paquete no se publica.
    expect(existsSync(join(vigente, 'resumen', '05001.json'))).toBe(true);
    expect(existsSync(join(vigente, 'resumen.tar.gz'))).toBe(false);
    expect(puntero).toEqual({
      corte: '2026-11',
      publicado: P,
      archivos: {
        corte: 'datos/2026-11/corte.json',
        departamentos: 'datos/2026-11/departamentos.json',
        municipios: 'datos/2026-11/municipios.json',
      },
    });
    expect(JSON.parse(readFileSync(join(raiz, 'datos', 'latest.json'), 'utf8'))).toEqual(puntero);
  });

  it('refuses a Release reprocessed after the review', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'ekou-armar-'));
    carpetas.push(raiz);
    const run = (_comando, args) => {
      const dir = args[args.indexOf('--dir') + 1];
      for (const a of ['departamentos.json', 'municipios.json']) writeFileSync(join(dir, a), '{}');
      writeFileSync(join(dir, 'corte.json'), JSON.stringify({ publicadoEn: Q }));
    };
    expect(() =>
      assemblePublication(
        { referencia: { corte: '2026-11', publicado: P, cortes: ['2026-11'] }, carpeta: raiz },
        run,
      ),
    ).toThrow('se reprocesó después de la revisión');
  });

  it('a Release without the map files (before export-mapa) cannot be published', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'ekou-armar-'));
    carpetas.push(raiz);
    const run = (_comando, args) => {
      const dir = args[args.indexOf('--dir') + 1];
      writeFileSync(join(dir, 'calidad_corte.json'), '{}');
    };
    expect(() =>
      assemblePublication(
        { referencia: { corte: '2026-11', publicado: P, cortes: ['2026-11'] }, carpeta: raiz },
        run,
      ),
    ).toThrow('no trae corte.json, departamentos.json, municipios.json');
  });
});
