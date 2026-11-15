import type { CorteVigente, MunicipiosDelCorte } from '../../domain/mapa';

/** Output port: where the published map data lives (R2 in production). */
export interface ConsultarMapa {
  /** The current cut, or null if none has been published. */
  corteVigente(): Promise<CorteVigente | null>;
  /** One row per municipality for `corte`, or null if the file is missing. */
  municipios(corte: string): Promise<MunicipiosDelCorte | null>;
  /** TopoJSON text for a geometry version, or null if it does not exist. */
  geometria(version: string): Promise<string | null>;
}
