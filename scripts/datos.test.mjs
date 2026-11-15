import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configWorkerPr,
  descargar,
  lanzarCorte,
  punteroLatest,
  subirPreview,
  ultimoCorte,
  validarCorte,
} from './datos.mjs';

const temporales = [];
const carpetaTemporal = () => {
  const c = mkdtempSync(join(tmpdir(), 'datos-test-'));
  temporales.push(c);
  return c;
};
afterEach(() => {
  for (const c of temporales.splice(0)) rmSync(c, { recursive: true, force: true });
});

describe('cortes', () => {
  it('valida el formato AAAA-MM', () => {
    expect(validarCorte('2026-10')).toBe('2026-10');
    expect(() => validarCorte('2026-13')).toThrow('AAAA-MM');
    expect(() => validarCorte('2026-1; rm')).toThrow('AAAA-MM');
  });

  it('elige el corte más reciente e ignora otras etiquetas', () => {
    expect(ultimoCorte(['v1.0.0', 'corte-2026-09', 'corte-2026-11', 'corte-2026-10'])).toBe(
      '2026-11',
    );
    expect(() => ultimoCorte(['v1.0.0'])).toThrow('corte-AAAA-MM');
  });

  it('arma latest.json como el corte mensual, sin archivos de diagnóstico', () => {
    expect(
      punteroLatest(
        '2026-10',
        ['mapa_municipios.json', 'calidad_corte.json', 'reporte-extraccion.json', 'resumen.md'],
        'x',
      ),
    ).toEqual({
      corte: '2026-10',
      publicado: 'x',
      archivos: {
        calidad_corte: 'datos/2026-10/calidad_corte.json',
        mapa_municipios: 'datos/2026-10/mapa_municipios.json',
      },
    });
  });
});

describe('lanzarCorte', () => {
  it('lanza el workflow con o sin mes', () => {
    const run = vi.fn();
    lanzarCorte(undefined, run);
    lanzarCorte('2026-10', run);
    expect(run.mock.calls[0][1]).toEqual(['workflow', 'run', 'corte-mensual.yml']);
    expect(run.mock.calls[1][1]).toEqual([
      'workflow',
      'run',
      'corte-mensual.yml',
      '-f',
      'corte=2026-10',
    ]);
    expect(() => lanzarCorte('octubre', run)).toThrow('AAAA-MM');
  });
});

describe('descargar', () => {
  it('no pisa una carpeta existente sin --forzar', () => {
    const run = vi.fn();
    expect(() => descargar({ carpeta: carpetaTemporal(), forzar: false }, run)).toThrow('--forzar');
    expect(run).not.toHaveBeenCalled();
  });

  it('baja el último corte y escribe latest.json', () => {
    const carpeta = join(carpetaTemporal(), 'datos-locales');
    const run = vi.fn((_gh, args) => {
      if (args[1] === 'list') return 'corte-2026-09\ncorte-2026-10\n';
      const destino = args[args.indexOf('--dir') + 1];
      writeFileSync(join(destino, 'mapa_municipios.json'), '{}');
      writeFileSync(join(destino, 'reporte-extraccion.json'), '{}');
    });
    descargar({ carpeta, forzar: false }, run);
    expect(run.mock.calls[1][1].slice(0, 3)).toEqual(['release', 'download', 'corte-2026-10']);
    expect(existsSync(join(carpeta, 'datos/2026-10/reporte-extraccion.json'))).toBe(false);
    const latest = JSON.parse(readFileSync(join(carpeta, 'datos/latest.json'), 'utf8'));
    expect(latest.archivos).toEqual({ mapa_municipios: 'datos/2026-10/mapa_municipios.json' });
  });

  it('rechaza un corte que no tiene Release', () => {
    const run = vi.fn(() => 'corte-2026-10\n');
    expect(() =>
      descargar({ corte: '2026-08', carpeta: join(carpetaTemporal(), 'x'), forzar: false }, run),
    ).toThrow('corte-2026-08');
  });
});

describe('subirPreview', () => {
  it('exige número de PR y latest.json', () => {
    const run = vi.fn();
    expect(() => subirPreview({ pr: 'abc', carpeta: carpetaTemporal() }, run)).toThrow(
      'número del PR',
    );
    expect(() => subirPreview({ pr: '12', carpeta: carpetaTemporal() }, run)).toThrow(
      'latest.json',
    );
    expect(run).not.toHaveBeenCalled();
  });

  it('despliega el Worker del PR sin URL pública y borra la configuración temporal', () => {
    const carpeta = carpetaTemporal();
    mkdirSync(join(carpeta, 'datos'));
    writeFileSync(join(carpeta, 'datos/latest.json'), '{}');
    let config;
    const run = vi.fn((_node, args) => {
      config = args[args.indexOf('--config') + 1];
      expect(JSON.parse(readFileSync(config, 'utf8'))).toEqual(configWorkerPr('12', carpeta));
    });
    subirPreview({ pr: '12', carpeta }, run);
    expect(run.mock.calls[0][1]).toContain('deploy');
    expect(existsSync(config)).toBe(false);
    expect(configWorkerPr('12', carpeta)).toMatchObject({
      name: 'ekou-elephants-datos-pr-12',
      workers_dev: false,
      preview_urls: false,
    });
  });
});
