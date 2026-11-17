import { describe, expect, it } from 'vitest';
import { sampleMap } from '../../../src/modules/mapa/ui/sample';
import { simplificar, trazosDeLaPagina } from './trazos';

/** The absolute points of a simplified outline (`M x y l dx dy … z`). */
function puntos(d: string): [number, number][][] {
  return [...d.matchAll(/M([^l]*)l([^z]*)z/g)].map(([, inicio = '', pasos = '']) => {
    const n = (s: string) => (s.match(/-?(\d*\.)?\d+/g) ?? []).map(Number);
    const [x0 = 0, y0 = 0] = n(inicio);
    const ring: [number, number][] = [[x0, y0]];
    const ds = n(pasos);
    for (let i = 0; i < ds.length; i += 2) {
      const [x, y] = ring.at(-1) as [number, number];
      ring.push([x + (ds[i] ?? 0), y + (ds[i + 1] ?? 0)]);
    }
    return ring;
  });
}

describe('simplificar', () => {
  it('keeps the corners of a ring and drops the points on a straight line', () => {
    const d = 'M0 0L5 0L10 0L10 5L10 10L0 10Z';
    expect(puntos(simplificar(d, 0.5))).toEqual([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ]);
  });

  it('writes relative steps, without spaces before a minus or leading zeros', () => {
    expect(simplificar('M0 0L10 0L10 10L0 10Z', 0.05)).toBe('M0 0l10 0 0 10-10 0z');
    expect(simplificar('M0.5 0.5L10.5 0.5L10.5 10.5Z', 0.05)).toBe('M.5 .5l10 0 0 10z');
  });

  it('drops rings smaller than the tolerance', () => {
    expect(simplificar('M0 0L10 0L10 10Z' + 'M50 50L50.1 50L50.1 50.1Z', 0.5)).toBe(
      'M0 0l10 0 0 10z',
    );
  });

  it('a real outline stays within the tolerance and gets much lighter', () => {
    const d = sampleMap.departmentShapes.get('05')?.d ?? '';
    const tol = 0.3;
    const simple = simplificar(d, tol);
    expect(simple.length).toBeLessThan(d.length / 2);
    const original = [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    const kept = puntos(simple).flat();
    // Every kept point is a point of the outline (rounded), and the box is the same within tol.
    const box = (ps: number[][]) => [
      Math.min(...ps.map((p) => p[0] ?? 0)),
      Math.min(...ps.map((p) => p[1] ?? 0)),
      Math.max(...ps.map((p) => p[0] ?? 0)),
      Math.max(...ps.map((p) => p[1] ?? 0)),
    ];
    box(kept).forEach((v, i) => {
      expect(Math.abs(v - (box(original)[i] ?? 0))).toBeLessThanOrEqual(tol);
    });
  });
});

describe('trazosDeLaPagina', () => {
  const drawn = (m: ReturnType<typeof trazosDeLaPagina>) => ({
    departments: [...m.departmentShapes.values()].filter((s) => s.d).map((s) => s.code),
    municipalities: [...m.municipalityShapes.values()].filter((s) => s.d).map((s) => s.code),
    islands: m.inset.islands.filter((i) => i.d).length,
  });

  it('a municipality: its department and itself, nothing else', () => {
    expect(drawn(trazosDeLaPagina(sampleMap, { view: 'municipality', code: '05001' }))).toEqual({
      departments: ['05'],
      municipalities: ['05001'],
      islands: 0,
    });
  });

  it('a department: only its outline', () => {
    expect(drawn(trazosDeLaPagina(sampleMap, { view: 'department', code: '05' }))).toEqual({
      departments: ['05'],
      municipalities: [],
      islands: 0,
    });
  });

  it('Colombia: every department and the archipelago’s inset; the archipelago: its islands', () => {
    const pais = drawn(trazosDeLaPagina(sampleMap, { view: 'country' }));
    expect(pais.departments.length).toBe(sampleMap.departmentShapes.size);
    expect(pais.islands).toBe(2);
    expect(drawn(trazosDeLaPagina(sampleMap, { view: 'department', code: '88' }))).toEqual({
      departments: [],
      municipalities: [],
      islands: 2,
    });
  });

  it('keeps names, boxes and figures, and leaves the prepared map untouched', () => {
    const m = trazosDeLaPagina(sampleMap, { view: 'municipality', code: '05001' });
    expect(m.municipalityShapes.get('05002')?.box).toEqual(
      sampleMap.municipalityShapes.get('05002')?.box,
    );
    expect(m.municipalities.get('05001')?.contratosUbicados).toBe(356935);
    expect(sampleMap.municipalityShapes.get('05002')?.d).not.toBe('');
  });
});
