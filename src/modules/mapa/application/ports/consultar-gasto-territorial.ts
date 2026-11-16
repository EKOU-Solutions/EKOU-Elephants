import type { ResumenTerritorial } from '../../domain/resumen-territorial';

export interface ConsultarGastoTerritorial {
  porCodigo(codigo: string): Promise<ResumenTerritorial | null>;
}
