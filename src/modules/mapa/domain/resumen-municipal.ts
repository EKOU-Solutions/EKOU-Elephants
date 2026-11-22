// Municipal and departmental summary contract (TASK-10): docs/design/pages/resumen-municipal/contract.md.
import type { Fuente } from './mapa';

export type RubroClave = 'funcionamiento' | 'deuda' | 'inversion';
export type Etapas = { comprometido: number; obligado: number; pagado: number };
export type Rubro = { clave: RubroClave; etapas: Etapas };
export type Desglose = { rubros: Rubro[]; total: Etapas };
export type GastoPublico = {
  /** "2025-12": last quarter reported in the year; figures accumulate from January to its end. */
  periodo: string;
  /** 'departamento-isla' only for 88001: San Andrés, Providencia y Santa Catalina as one. */
  alcance: 'municipio' | 'departamento-isla';
  /** True when `periodo` is the year's last quarter. */
  completo: boolean;
  /** COP collected in the year; null = not reported. */
  recibido: number | null;
  rubros: Rubro[];
  total: Etapas;
  reservas: Desglose | null;
  cuentasPorPagar: Desglose | null;
};
export type Contratado = { valor: number | null; contratos: number };
export type FuenteResumen = Fuente & {
  /** Date the source is current to (ISO date). */
  fechaCorte: string;
  usadoPara: 'gastoPublico' | 'contratado';
};

/** What the API answers for one territory and one year. A missing block is null, never zeros. */
export type ResumenMunicipalDatos = {
  corte: string;
  codigo: string;
  nombre: string;
  anio: number;
  anios: number[];
  gastoPublico: GastoPublico | null;
  contratado: Contratado | null;
  fuentes: FuenteResumen[];
};

/** One published file per territory: every year of the window, only the years with data. */
export type ResumenDelTerritorio = {
  corte: string;
  codigo: string;
  nombre: string;
  nivel: 'municipio' | 'departamento';
  anios: number[];
  porAnio: Record<string, { gastoPublico: GastoPublico | null; contratado: Contratado | null }>;
  fuentes: FuenteResumen[];
};

/** `anio` is not one of the years the selector offers. */
export class AnioInvalido extends Error {
  constructor(readonly anios: number[]) {
    super('anio_invalido');
    this.name = 'AnioInvalido';
  }
}

export class DepartamentoNoEncontrado extends Error {
  constructor(readonly codigo: string) {
    super(`departamento ${codigo}`);
    this.name = 'DepartamentoNoEncontrado';
  }
}
