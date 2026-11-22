import { describe, expect, it } from 'vitest';
import { medellin, sanBenito } from './muestra';
import {
  escalaComun,
  formatDinero,
  formatFecha,
  formatPorcentaje,
  motivoSinGasto,
  repartoPorRubro,
  superaLoRecibido,
} from './resumenModel';

const gasto = sanBenito.gastoPublico;

describe('formatDinero', () => {
  it('escribe millones y billones sin romper el ancho', () => {
    expect(formatDinero(70_684_311_036)).toBe('$70.684 millones');
    expect(formatDinero(11_026_000_000_000)).toBe('$11,0 billones');
    expect(formatDinero(1_000_000_000_000)).toBe('$1,0 billón');
    expect(formatDinero(10_400_000_000_000)).toBe('$10,4 billones');
  });
  it('no redondea una cifra pequeña a cero millones', () => {
    expect(formatDinero(0)).toBe('$0');
    expect(formatDinero(450_000)).toBe('$450.000');
  });
  it('en el borde de millones sube sin romperse', () => {
    expect(formatDinero(999_999_999)).toBe('$1.000 millones');
  });
});

describe('formatPorcentaje', () => {
  it('no dice 0 % cuando hay plata', () => {
    expect(formatPorcentaje(0.3)).toBe('<1 %');
    expect(formatPorcentaje(0)).toBe('0 %');
    expect(formatPorcentaje(86.4)).toBe('86 %');
  });
});

describe('formatFecha', () => {
  it('escribe día, mes corto y año', () => {
    expect(formatFecha('2026-06-30')).toBe('30 jun 2026');
  });
});

describe('repartoPorRubro', () => {
  it('usa el orden fijo de la barra y suma 100 %', () => {
    const r = repartoPorRubro(gasto?.rubros ?? []);
    expect(r.map((x) => x.clave)).toEqual(['inversion', 'deuda', 'funcionamiento']);
    expect(r.reduce((s, x) => s + x.porcentaje, 0)).toBeCloseTo(100);
  });
  it('un rubro en cero queda en la lista con 0 %', () => {
    const r = repartoPorRubro([
      { clave: 'funcionamiento', etapas: { comprometido: 10, obligado: 10, pagado: 10 } },
      { clave: 'deuda', etapas: { comprometido: 0, obligado: 0, pagado: 0 } },
      { clave: 'inversion', etapas: { comprometido: 90, obligado: 90, pagado: 90 } },
    ]);
    expect(r.find((x) => x.clave === 'deuda')?.porcentaje).toBe(0);
  });
});

describe('escalaComun', () => {
  it('usa el mayor de los tres valores, aunque pagado supere lo obligado', () => {
    expect(escalaComun({ comprometido: 100, obligado: 60, pagado: 110 })).toBe(110);
  });
  it('con todo en cero devuelve cero', () => {
    expect(escalaComun({ comprometido: 0, obligado: 0, pagado: 0 })).toBe(0);
  });
});

describe('superaLoRecibido', () => {
  it('avisa solo si se sabe lo recibido y el gasto lo supera', () => {
    expect(gasto && superaLoRecibido(gasto)).toBe(true);
    expect(gasto && superaLoRecibido({ ...gasto, recibido: null })).toBe(false);
    expect(medellin.gastoPublico && superaLoRecibido(medellin.gastoPublico)).toBe(true);
  });
});

describe('motivoSinGasto', () => {
  it('distingue un año sin CUIPO de un municipio que no reportó', () => {
    expect(motivoSinGasto({ ...sanBenito, anio: 2022, gastoPublico: null })).toBe('anio-sin-cuipo');
    expect(motivoSinGasto({ ...sanBenito, anio: 2025, gastoPublico: null })).toBe('sin-gasto');
    expect(motivoSinGasto(sanBenito)).toBeNull();
  });
});
