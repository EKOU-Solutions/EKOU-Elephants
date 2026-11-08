import { type ResumenTerritorial, TerritorioNoEncontrado } from '../domain/resumen-territorial';
import type { ConsultarGastoTerritorial } from './ports/consultar-gasto-territorial';

export function obtenerResumenTerritorial(puerto: ConsultarGastoTerritorial) {
  return async (codigo: string): Promise<ResumenTerritorial> => {
    const resumen = await puerto.porCodigo(codigo);
    if (!resumen) throw new TerritorioNoEncontrado(codigo);
    return resumen;
  };
}
