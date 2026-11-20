import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FILL } from '../mapModel';
import {
  clampPan,
  cubicBezier,
  durationOf,
  easingOf,
  fitCamera,
  flightDuration,
  flightFrame,
  frameWithin,
  freeInsets,
  PANEL_WIDTH,
  freeRect,
  isTrackpadScroll,
  isNearCountry,
  zoomAround,
  zoomLimits,
} from './camera';

const phone = { width: 390, height: 760, isPanel: false, corner: false, roomAbove: false };

describe('zona libre del mapa', () => {
  it('en celular queda sobre la ficha, bajo buscador y migas, a la izquierda del zoom', () => {
    expect(freeRect({ ...phone, sheetHeight: 240 })).toEqual({ x: 68, y: 116, w: 254, h: 392 });
  });

  it('en celular sin recuadro de esquina queda centrada en la pantalla (márgenes iguales)', () => {
    const r = freeRect({ ...phone, sheetHeight: 240 });
    expect(r.x + r.w / 2).toBe(phone.width / 2);
  });

  it('reserva la columna del recuadro de esquina y el sitio del rótulo', () => {
    const r = freeRect({ ...phone, sheetHeight: 240, corner: true, roomAbove: true });
    expect(r).toEqual({ x: 88, y: 148, w: 234, h: 360 });
  });

  it('en la vista del país no hay migas: la zona libre empieza bajo el buscador (decisión 39)', () => {
    const r = freeRect({ ...phone, sheetHeight: 240, crumbs: false });
    expect(r.y).toBe(68);
    expect(r.h).toBe(440);
  });

  it('nunca deja el mapa sin alto aunque la ficha sea muy alta', () => {
    expect(freeRect({ ...phone, sheetHeight: 700 }).h).toBe(140);
  });

  it('en escritorio queda a la izquierda del panel de 440 px', () => {
    const r = freeRect({ ...phone, width: 1280, isPanel: true, sheetHeight: 999 });
    expect(r).toEqual({ x: 16, y: 72, w: 756, h: 672 });
  });

  it('en escritorio sigue el ancho que la persona le da al panel', () => {
    const r = freeRect({ ...phone, width: 1280, isPanel: true, sheetHeight: 999, panelWidth: 600 });
    expect(r).toEqual({ x: 16, y: 72, w: 596, h: 672 });
  });
});

describe('encuadre', () => {
  const rect = { x: 0, y: 0, w: 200, h: 100 };

  it('centra la caja y llena la parte pedida por su lado más estrecho', () => {
    const cam = fitCamera([0, 0, 10, 10], rect, FILL.place);
    expect(cam.k).toBeCloseTo(9);
    expect(5 * cam.k + cam.x).toBeCloseTo(100);
    expect(5 * cam.k + cam.y).toBeCloseTo(50);
  });

  it('el municipio llena como máximo el 55 % (decisión 20)', () => {
    const cam = fitCamera([0, 0, 10, 10], rect, FILL.municipality);
    expect(10 * cam.k).toBeCloseTo(55);
  });
});

describe('curva y duraciones de los tokens', () => {
  it('reproduce cubic-bezier(0.2, 0.7, 0.2, 1): empieza en 0, acaba en 1 y adelanta al lineal', () => {
    const ease = easingOf('cubic-bezier(0.2, 0.7, 0.2, 1)');
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.8);
    for (let t = 0.1; t < 1; t += 0.1) expect(ease(t)).toBeGreaterThan(ease(t - 0.05));
  });

  it('la curva lineal devuelve el mismo progreso', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0.3)).toBeCloseTo(0.3, 5);
  });

  it('un valor que no es una curva queda lineal', () => {
    expect(easingOf('ease')(0.3)).toBe(0.3);
  });

  it('lee la duración en ms o en s', () => {
    expect(durationOf('450ms')).toBe(450);
    expect(durationOf(' 0.75s')).toBe(750);
    expect(durationOf('')).toBe(0);
  });
});

describe('vuelo', () => {
  const from = { x: 0, y: 0, k: 1 };
  const to = { x: -1900, y: -900, k: 20 };
  const anchor: [number, number] = [100, 50];

  it('empieza en la cámara de salida y acaba exactamente en la de llegada', () => {
    expect(flightFrame(from, to, anchor, 0)).toEqual(from);
    const end = flightFrame(from, to, anchor, 1);
    expect(end.k).toBeCloseTo(20);
    expect(end.x).toBeCloseTo(-1900);
    expect(end.y).toBeCloseTo(-900);
  });

  it('interpola el zoom de forma geométrica, no lineal', () => {
    expect(flightFrame(from, to, anchor, 0.5).k).toBeCloseTo(Math.sqrt(20));
  });

  it('dura más al cambiar de departamento que dentro de uno', () => {
    expect(flightDuration(undefined, '05')).toBe('long');
    expect(flightDuration('05', '25')).toBe('long');
    expect(flightDuration('05', '05')).toBe('base');
  });
});

describe('zoom y arrastre', () => {
  const limits = zoomLimits(1);

  it('va de 0,7 a 80 veces el encuadre del país', () => {
    expect(limits).toEqual({ min: 0.7, max: 80 });
    expect(zoomAround({ x: 0, y: 0, k: 1 }, [0, 0], 1000, limits).k).toBe(80);
    expect(zoomAround({ x: 0, y: 0, k: 1 }, [0, 0], 0.001, limits).k).toBe(0.7);
  });

  it('acerca alrededor del punto: lo que está bajo él no se mueve', () => {
    const cam = zoomAround({ x: 10, y: 20, k: 2 }, [100, 60], 1.8, limits);
    const [wx, wy] = [(100 - 10) / 2, (60 - 20) / 2];
    expect(wx * cam.k + cam.x).toBeCloseTo(100);
    expect(wy * cam.k + cam.y).toBeCloseTo(60);
  });

  it('el país nunca sale de la zona libre al arrastrar', () => {
    const rect = { x: 0, y: 0, w: 400, h: 400 };
    const box = [0, 0, 100, 100] as const;
    const far = clampPan({ x: 5000, y: -5000, k: 2 }, box, rect);
    // A cuarto del lado (100 px) dentro de la zona: borde izquierdo a 300 px, borde inferior a 100 px.
    expect(far.x).toBe(300);
    expect(far.y + 100 * 2).toBe(100);
    const inside = { x: 50, y: 60, k: 2 };
    expect(clampPan(inside, box, rect)).toEqual(inside);
  });

  it('alejar hasta cerca del encuadre del país vuelve a Colombia', () => {
    expect(isNearCountry(1.3, 1)).toBe(true);
    expect(isNearCountry(2, 1)).toBe(false);
  });
});

describe('encuadre del municipio dentro de su departamento (decisión 20 ampliada)', () => {
  const rect = { x: 0, y: 0, w: 400, h: 400 };
  const department = [0, 0, 100, 100] as const;

  it('en un municipio pequeño manda el departamento: no acerca más que verlo entero', () => {
    const small = [10, 10, 12, 12] as const;
    const cam = frameWithin(small, rect, FILL.municipality, department, FILL.place);
    expect(cam.k).toBeCloseTo(3.6); // el encuadre del departamento (400 · 0,9 / 100)
    // El departamento entero queda en la zona libre…
    expect(cam.x).toBeGreaterThanOrEqual(0);
    expect(100 * cam.k + cam.x).toBeLessThanOrEqual(400 + 1e-9);
    // …y el municipio, lo más centrado posible: el departamento llega al borde derecho.
    expect(cam.x).toBeCloseTo(40);
  });

  it('un municipio grande conserva su tope del 55 %', () => {
    const big = [0, 0, 90, 90] as const;
    const cam = frameWithin(big, rect, FILL.municipality, department, FILL.place);
    expect(90 * cam.k).toBeCloseTo(220);
  });

  it('sin departamento, el tope del 55 % de siempre', () => {
    const cam = frameWithin([0, 0, 10, 10], rect, FILL.municipality, undefined, FILL.place);
    expect(10 * cam.k).toBeCloseTo(220);
  });
});

describe('zoom nunca contra lo pedido', () => {
  it('con la cámara por encima del tope, «+» no aleja y «−» sí aleja', () => {
    const limits = zoomLimits(1);
    const above = { x: 0, y: 0, k: 120 };
    expect(zoomAround(above, [0, 0], 1.8, limits).k).toBe(120);
    expect(zoomAround(above, [0, 0], 1 / 1.8, limits).k).toBeCloseTo(120 / 1.8);
    const below = { x: 0, y: 0, k: 0.5 };
    expect(zoomAround(below, [0, 0], 1 / 1.8, limits).k).toBe(0.5);
  });
});

describe('medidas compartidas con el CSS', () => {
  it('el panel de escritorio mide lo mismo en la cámara, el mapa y la ficha', () => {
    const map = readFileSync('src/modules/mapa/ui/MapWithLegend/MapWithLegend.module.css', 'utf8');
    const sheet = readFileSync('src/components/ui/BottomSheet/BottomSheet.module.css', 'utf8');
    expect(map).toContain(
      `right: calc(var(--map-panel-width, ${PANEL_WIDTH}px) + var(--el-space-16))`,
    );
    expect(sheet).toMatch(
      new RegExp(`\\.panel \\{[^}]*width: var\\(--map-panel-width, ${PANEL_WIDTH}px\\)`),
    );
  });
});

describe('zona libre sin JavaScript (página generada)', () => {
  it('los márgenes de freeInsets dan la misma zona que freeRect, en celular y en el panel', () => {
    for (const corner of [false, true])
      for (const roomAbove of [false, true]) {
        const { phone: p, panel: q } = freeInsets(corner, roomAbove);
        const flags = { corner, roomAbove };
        // Phone: the frame ends at the sheet's top edge (760 − 240).
        expect(freeRect({ ...phone, ...flags, sheetHeight: 240 })).toEqual({
          x: p.left,
          y: p.top,
          w: 390 - p.left - p.right,
          h: 760 - 240 - p.bottom - p.top,
        });
        expect(freeRect({ ...phone, ...flags, sheetHeight: 700 }).h).toBe(p.minHeight);
        expect(
          freeRect({ ...phone, ...flags, width: 1280, isPanel: true, sheetHeight: 0 }),
        ).toEqual({ x: q.left, y: q.top, w: 1280 - q.left - q.right, h: 760 - q.top - q.bottom });
      }
  });
});

describe('isTrackpadScroll', () => {
  const wheel = (o: Partial<Parameters<typeof isTrackpadScroll>[0]>) => ({
    ctrlKey: false,
    deltaMode: 0,
    deltaX: 0,
    deltaY: 0,
    ...o,
  });

  it('two fingers sliding: small, fractional or horizontal deltas pan', () => {
    expect(isTrackpadScroll(wheel({ deltaY: 7 }))).toBe(true);
    expect(isTrackpadScroll(wheel({ deltaY: 120.5 }))).toBe(true);
    expect(isTrackpadScroll(wheel({ deltaX: 12, deltaY: 130 }))).toBe(true);
  });

  it('a mouse wheel notch, in pixels or lines, and a pinch (ctrlKey) are not a slide', () => {
    expect(isTrackpadScroll(wheel({ deltaY: 100 }))).toBe(false);
    expect(isTrackpadScroll(wheel({ deltaY: -120 }))).toBe(false);
    expect(isTrackpadScroll(wheel({ deltaMode: 1, deltaY: 3 }))).toBe(false);
    expect(isTrackpadScroll(wheel({ ctrlKey: true, deltaY: 4 }))).toBe(false);
  });
});
