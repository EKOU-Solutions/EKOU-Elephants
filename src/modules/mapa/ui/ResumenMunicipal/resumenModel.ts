import { formatNumber } from '../../../../components/ui/format';

// Shapes live in the domain (the API contract); the screen imports them from here.
import type {
  Etapas,
  GastoPublico,
  ResumenMunicipalDatos,
  Rubro,
  RubroClave,
} from '../../domain/resumen-municipal';

export type {
  Contratado,
  Desglose,
  Etapas,
  FuenteResumen,
  GastoPublico,
  ResumenMunicipalDatos,
  Rubro,
  RubroClave,
} from '../../domain/resumen-municipal';

/** First year the Contaduría (CUIPO) publishes this detail. */
export const PRIMER_ANIO_CUIPO = 2023;

export const NOMBRE_RUBRO: Record<RubroClave, { nombre: string; glosa: string }> = {
  inversion: { nombre: 'Inversión', glosa: 'obras, salud, educación y otros servicios' },
  deuda: { nombre: 'Pago de deuda', glosa: 'lo que se debe a bancos y otros prestamistas' },
  funcionamiento: { nombre: 'Funcionamiento', glosa: 'nómina y gastos de oficina' },
};

/** Fixed order of the bar and the legend (usually largest-first, but not sorted); the contract delivers funcionamiento, deuda, inversión. */
export const ORDEN_BARRA: RubroClave[] = ['inversion', 'deuda', 'funcionamiento'];
export const TONO_RUBRO = { inversion: 'ink', deuda: 'mid', funcionamiento: 'light' } as const;
export const LLAVE_RUBRO = {
  inversion: 'ink',
  deuda: 'inkMid',
  funcionamiento: 'inkLight',
} as const;

/** Whole pesos → «$70.684 millones», «$11,0 billones»; never rounds a small amount to «0 millones». */
export function formatDinero(cop: number): string {
  if (cop >= 1e12) {
    const n = (cop / 1e12).toLocaleString('es-CO', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `$${n} ${n === '1,0' ? 'billón' : 'billones'}`;
  }
  if (cop >= 1e6) return `$${formatNumber(cop / 1e6, 0)} millones`;
  return `$${formatNumber(cop, 0)}`;
}

/** «86 %»; a rubro with money but under 1 % reads «<1 %», never «0 %». */
export function formatPorcentaje(p: number): string {
  return p > 0 && p < 1 ? '<1 %' : `${formatNumber(p, 0)} %`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Who the summary is about: the noun of its texts. */
export type Nivel = 'municipio' | 'departamento';
export const NIVEL: Record<Nivel, { entidad: string; lugar: string }> = {
  municipio: { entidad: 'la alcaldía', lugar: 'municipio' },
  departamento: { entidad: 'la gobernación', lugar: 'departamento' },
};

/** «2025-09» → «sep 2025». */
export function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  return `${MESES[(m ?? 1) - 1]} ${y}`;
}

/** «2026-06-30» → «30 jun 2026». */
export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[(m ?? 1) - 1]} ${y}`;
}

/** Spending can exceed what was collected (the budget also uses earlier balances and credit): a note, not an error. */
export function superaLoRecibido(g: GastoPublico): boolean {
  return g.recibido !== null && g.total.comprometido > g.recibido;
}

/**
 * What the place received and has not committed: the part of the bar left empty. `null` when the
 * received amount is unknown or the spending exceeds it (then the bar splits the spending alone).
 */
export function quedaLibre(g: GastoPublico): number | null {
  if (g.recibido === null || superaLoRecibido(g)) return null;
  return g.recibido - g.total.comprometido;
}

/**
 * Share of each rubro, in the bar order. A rubro at 0 stays in the list at «0 %». The 100 % is the
 * `base` (what was received) or, without it, the committed total.
 */
export function repartoPorRubro(
  rubros: Rubro[],
  base?: number,
): { clave: RubroClave; valor: number; porcentaje: number }[] {
  const total = base ?? rubros.reduce((s, r) => s + r.etapas.comprometido, 0);
  return ORDEN_BARRA.map((clave) => {
    const valor = rubros.find((r) => r.clave === clave)?.etapas.comprometido ?? 0;
    return { clave, valor, porcentaje: total > 0 ? (100 * valor) / total : 0 };
  });
}

/** The common scale of the three progress bars: the largest value, so none is clipped. */
export function escalaComun(e: Etapas): number {
  return Math.max(e.comprometido, e.obligado, e.pagado);
}

export type SinInformacion = 'anio-sin-cuipo' | 'sin-gasto' | null;

/** Why the balance is missing, if it is. A year before CUIPO is explained apart from «did not report». */
export function motivoSinGasto(d: ResumenMunicipalDatos): SinInformacion {
  if (d.gastoPublico) return null;
  return d.anio < PRIMER_ANIO_CUIPO ? 'anio-sin-cuipo' : 'sin-gasto';
}
