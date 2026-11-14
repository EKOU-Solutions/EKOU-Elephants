export class ImporteInvalido extends Error {
  constructor(motivo: 'formato' | 'fuera_de_rango') {
    super(`Importe de base de datos inválido: ${motivo}`);
    this.name = 'ImporteInvalido';
  }
}

/** Parse non-negative NUMERIC(20,2) text exactly, then enforce JSON's safe integer range. */
export function importeACentavos(valor: unknown): number {
  // Validate BEFORE Number(): coercion could round large amounts or accept empty/NaN inputs.
  if (typeof valor !== 'string' || valor.trim() !== valor || !/^\d{1,18}(?:\.\d{1,2})?$/.test(valor)) {
    throw new ImporteInvalido('formato');
  }
  const [entero, fraccion = ''] = valor.split('.');
  const centavos = BigInt(entero!) * 100n + BigInt(fraccion.padEnd(2, '0'));
  if (centavos > BigInt(Number.MAX_SAFE_INTEGER)) throw new ImporteInvalido('fuera_de_rango');
  return Number(centavos);
}
