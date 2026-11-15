import { describe, expect, it } from 'vitest';
import {
  bloqueoPorMigraciones,
  leerOpciones,
  MARCA,
  prefijoR2,
  renderizarComentario,
} from './control.mjs';

const opciones = { copiaBd: false, prefijoR2Propio: false };

describe('comentario de control', () => {
  it('sin comentario usa la base compartida y el prefijo datos/', () => {
    expect(leerOpciones(undefined)).toEqual(opciones);
    expect(prefijoR2(7, opciones)).toBe('datos/');
  });

  it('lo que renderiza se vuelve a leer igual (ida y vuelta)', () => {
    for (const o of [
      opciones,
      { copiaBd: true, prefijoR2Propio: true },
      { copiaBd: true, prefijoR2Propio: false },
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
    expect(leerOpciones(cuerpo)).toEqual({ copiaBd: true, prefijoR2Propio: false });
    expect(prefijoR2(7, { prefijoR2Propio: true })).toBe('previews/pr-7/datos/');
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
      opciones: { copiaBd: true, prefijoR2Propio: false },
      estado: 'bloqueado',
      motivo: 'razón',
      url: 'https://pr-7.x.dev/',
    });
    expect(cuerpo).toContain('preview/pr-7');
    expect(cuerpo).toContain('> razón');
    expect(cuerpo).toContain('https://pr-7.x.dev/');
  });
});
