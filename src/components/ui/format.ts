/** es-CO number format: dot for thousands, comma for decimals, at most `decimals` decimals. */
export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimals }).format(value);
}
