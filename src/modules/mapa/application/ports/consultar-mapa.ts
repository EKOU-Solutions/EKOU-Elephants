import type { CorteVigente, DepartamentosDelCorte, MunicipiosDelCorte } from '../../domain/mapa';

/** Output port: where the published map data lives (the data Worker in production). */
export interface ConsultarMapa {
  /** The current cut, or null if none has been published. */
  corteVigente(): Promise<CorteVigente | null>;
  /** One row per municipality for `corte`, or null if the file is missing. */
  municipios(corte: string): Promise<MunicipiosDelCorte | null>;
  /** The 33 departments and the national total for `corte`, or null if the file is missing. */
  departamentos(corte: string): Promise<DepartamentosDelCorte | null>;
}
