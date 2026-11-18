// The outlines a place's page draws before the app's JavaScript (ADR 0003, StaticFullscreenMap):
// the department's outline with the chosen municipality, Colombia's departments, or the archipelago's
// islands. Simplified to what a screen shows, so each page carries a few KB of outlines.
import type { Shape } from '../../../src/modules/mapa/ui/geometry';
import {
  ARCHIPELAGO,
  type MapRoute,
  type PreparedMap,
} from '../../../src/modules/mapa/ui/mapModel';

/**
 * Tolerance as a share of the framed box's longer side. The camera makes that side at most about
 * 700 px on a desktop (90 % of the free area), so the error stays under a pixel; Colombia by
 * departments weighs about 14 KB.
 */
export const DETALLE = 1 / 1000;

type Punto = [number, number];

/** Squared distance from `p` to the segment `a`–`b`. */
function distancia2(p: Punto, a: Punto, b: Punto): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const largo = dx * dx + dy * dy;
  const t = largo ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / largo)) : 0;
  const [x, y] = [a[0] + t * dx - p[0], a[1] + t * dy - p[1]];
  return x * x + y * y;
}

/** Douglas–Peucker over an open line: the points that keep it within `tolerancia`. */
function douglasPeucker(puntos: Punto[], tolerancia: number): Punto[] {
  const guardar = new Uint8Array(puntos.length);
  guardar[0] = 1;
  guardar[puntos.length - 1] = 1;
  const pila: [number, number][] = [[0, puntos.length - 1]];
  const t2 = tolerancia * tolerancia;
  while (pila.length) {
    const [i, j] = pila.pop() as [number, number];
    let [lejos, max] = [-1, t2];
    for (let k = i + 1; k < j; k++) {
      const d = distancia2(puntos[k] as Punto, puntos[i] as Punto, puntos[j] as Punto);
      if (d > max) [lejos, max] = [k, d];
    }
    if (lejos < 0) continue;
    guardar[lejos] = 1;
    pila.push([i, lejos], [lejos, j]);
  }
  return puntos.filter((_, k) => guardar[k]);
}

/** «0.5» → «.5», «-0.5» → «-.5», without trailing zeros. */
function numero(valor: number, decimales: number): string {
  const texto = String(Number(valor.toFixed(decimales)));
  return (texto === '-0' ? '0' : texto).replace(/^(-?)0\./, '$1.');
}

/**
 * An outline of `shapesOf` (`M x yL…Z` rings) simplified within `tolerancia` (projected units) and
 * written with relative steps. Rings smaller than the tolerance are dropped.
 */
export function simplificar(d: string, tolerancia: number): string {
  const decimales = Math.max(0, Math.ceil(-Math.log10(tolerancia)));
  const factor = 10 ** decimales;
  const redondo = (v: number) => Math.round(v * factor) / factor;
  const partes: string[] = [];
  for (const [, cuerpo = ''] of d.matchAll(/M([^Z]*)Z/g)) {
    const anillo = cuerpo.split('L').map((p) => p.split(' ').map(Number) as Punto);
    if (anillo.length < 3) continue;
    // A closed ring: split at the point farthest from the first, and simplify both halves.
    const primero = anillo[0] as Punto;
    let lejos = 0;
    anillo.forEach((p, k) => {
      if (distancia2(p, primero, primero) > distancia2(anillo[lejos] as Punto, primero, primero))
        lejos = k;
    });
    if (Math.sqrt(distancia2(anillo[lejos] as Punto, primero, primero)) < tolerancia * 2) continue;
    const ida = douglasPeucker(anillo.slice(0, lejos + 1), tolerancia);
    const vuelta = douglasPeucker([...anillo.slice(lejos), primero], tolerancia);
    const puntos = [...ida, ...vuelta.slice(1, -1)].map(
      ([x, y]): Punto => [redondo(x), redondo(y)],
    );
    if (puntos.length < 3) continue;
    const pasos = puntos.slice(1).map(([x, y], k) => {
      const [px, py] = puntos[k] as Punto;
      return `${numero(x - px, decimales)} ${numero(y - py, decimales)}`;
    });
    const [x0, y0] = puntos[0] as Punto;
    const texto = `M${numero(x0, decimales)} ${numero(y0, decimales)}l${pasos.join(' ')}z`;
    partes.push(texto.replace(/ -/g, '-'));
  }
  return partes.join('');
}

const largo = (b: readonly number[]) =>
  Math.max((b[2] ?? 0) - (b[0] ?? 0), (b[3] ?? 0) - (b[1] ?? 0));

/**
 * The prepared map as a page draws it: only the outlines StaticFullscreenMap uses, simplified for the
 * box it frames; every other outline is empty. Names, boxes and figures stay.
 */
export function trazosDeLaPagina(map: PreparedMap, route: MapRoute): PreparedMap {
  const municipio = route.view === 'municipality' ? map.municipalities.get(route.code) : undefined;
  const departamento = route.view === 'department' ? route.code : municipio?.departamento.codigo;
  const vacio = <T extends { d: string }>(s: T): T => ({ ...s, d: '' });
  const formas = (
    m: Map<string, Shape>,
    conservar: (codigo: string) => boolean,
    tolerancia: (s: Shape) => number,
  ) =>
    new Map(
      [...m].map(([k, s]) => [
        k,
        conservar(k) ? { ...s, d: simplificar(s.d, tolerancia(s)) } : vacio(s),
      ]),
    );
  // The box the page frames: the department (its municipalities), or the country.
  const caja =
    departamento === ARCHIPELAGO
      ? map.inset.box
      : departamento
        ? (map.departmentShapes.get(departamento)?.box ?? map.home)
        : map.home;
  const tol = largo(caja) * DETALLE;
  const islas = !departamento || departamento === ARCHIPELAGO;
  return {
    ...map,
    departmentShapes: formas(
      map.departmentShapes,
      (k) => (departamento ? k === departamento && k !== ARCHIPELAGO : true),
      () => tol,
    ),
    // The chosen municipality with its own detail: at the department's, a small one would be dropped.
    municipalityShapes: formas(
      map.municipalityShapes,
      (k) => k === municipio?.codigo,
      (s) => largo(s.box) * DETALLE,
    ),
    archipelago: { ...map.archipelago, shapes: map.archipelago.shapes.map(vacio) },
    inset: {
      ...map.inset,
      islands: map.inset.islands.map((i) =>
        islas ? { ...i, d: simplificar(i.d, tol / map.inset.scale) } : vacio(i),
      ),
    },
  };
}
