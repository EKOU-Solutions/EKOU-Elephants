import type { ResumenDelTerritorio } from '../../domain/resumen-municipal';

/** Output port: the published summary of one territory (the data Worker in production). */
export interface ConsultarResumen {
  /** The municipality's file for `corte`, or null if it has no data in any year. */
  resumenMunicipio(corte: string, codigo: string): Promise<ResumenDelTerritorio | null>;
  /** The department's file for `corte`, or null if it has no data in any year. */
  resumenDepartamento(corte: string, codigo: string): Promise<ResumenDelTerritorio | null>;
}
