import { describe, expect, it } from 'vitest';
import { importeACentavos, ImporteInvalido } from './importe';

describe('importeACentavos', () => {
  it.each([
    ['0', 0], ['0.00', 0], ['0.01', 1], ['100.25', 10025], ['1000.5', 100050],
    ['90071992547409.91', Number.MAX_SAFE_INTEGER],
  ])('convierte %s sin aritmética decimal de coma flotante', (input, esperado) => {
    expect(importeACentavos(input)).toBe(esperado);
  });

  it.each([
    '', ' ', 'NaN', 'Infinity', '-1.00', '1.001', '1e3', '1,25', '.50', '1.',
    '100\n', null, undefined, 100.25, Number.NaN,
  ])('rechaza formato incorrecto: %s', (input) => {
    expect(() => importeACentavos(input)).toThrow(ImporteInvalido);
  });

  it.each(['90071992547409.92', '90071992547409.93', '440000000000000000.00'])('rechaza %s antes de redondear', (input) => {
    expect(() => importeACentavos(input)).toThrow('fuera_de_rango');
  });
});
