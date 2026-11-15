import { describe, expect, it } from 'vitest';
import {
  bloqueoPorMigraciones,
  leerOpciones,
  MARCA,
  renderizarComentario,
  workerDatos,
} from './control.mjs';

const opciones = { copiaBd: false, datosPropios: false };

describe('comentario de control', () => {
  it('sin comentario usa la base compartida y los datos de producción', () => {
    expect(leerOpciones(undefined)).toEqual(opciones);
    expect(workerDatos(7, opciones)).toBe('ekou-elephants-datos');
    expect(workerDatos(7, { datosPropios: true })).toBe('ekou-elephants-datos-pr-7');
  });

  it('lo que renderiza se vuelve a leer igual (ida y vuelta)', () => {
    for (const o of [
      opciones,
      { copiaBd: true, datosPropios: false },
      { copiaBd: false, datosPropios: true },
    ]) {
      const cuerpo = renderizarComentario({
        pr: 7,
        sha: 'abcdef123',
        opciones: o,
        estado: 'desplegado',
      });
      expect(cuerpo.startsWith(MARCA)).toBe(true);
      expect(leerOpciones(cuerpo)).toEqual(o);
    }
  });

  it('lee una casilla marcada a mano en GitHub con [x] o [X]', () => {
    const cuerpo = renderizarComentario({
      pr: 7,
      sha: 'abcdef1',
      opciones,
      estado: 'desplegado',
    }).replace('- [ ] **Copia propia', '- [X] **Copia propia');
    expect(leerOpciones(cuerpo)).toEqual({ copiaBd: true, datosPropios: false });
  });

  it('bloquea migraciones sobre la base compartida', () => {
    expect(bloqueoPorMigraciones({ opciones, migracionesCambiadas: true })).toMatch(/migrations/);
    expect(bloqueoPorMigraciones({ opciones, migracionesCambiadas: false })).toBeNull();
    expect(
      bloqueoPorMigraciones({
        opciones: { ...opciones, copiaBd: true },
        migracionesCambiadas: true,
      }),
    ).toBeNull();
  });

  it('muestra URL, base y motivo de bloqueo', () => {
    const cuerpo = renderizarComentario({
      pr: 7,
      sha: 'abcdef1',
      opciones: { copiaBd: true, datosPropios: true },
      estado: 'bloqueado',
      motivo: 'razón',
      url: 'https://pr-7.x.dev/',
    });
    expect(cuerpo).toContain('preview/pr-7');
    expect(cuerpo).toContain('ekou-elephants-datos-pr-7');
    expect(cuerpo).toContain('> razón');
    expect(cuerpo).toContain('https://pr-7.x.dev/');
    expect(cuerpo).toContain('(https://pr-7.x.dev/storybook/)');
  });

  it('dice si el preview lee los datos de producción o ninguno', () => {
    const base = { pr: 7, sha: 'abcdef1', opciones, estado: 'desplegado' };
    expect(renderizarComentario(base)).toContain('sin datos del corte');
    expect(renderizarComentario({ ...base, datosCorte: true })).toContain(
      'de producción `ekou-elephants-datos`',
    );
  });
});
