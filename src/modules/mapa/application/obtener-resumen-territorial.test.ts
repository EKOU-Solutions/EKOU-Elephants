import { describe, expect, it } from 'vitest';
import { TerritorioNoEncontrado, type ResumenTerritorial } from '../domain/resumen-territorial';
import { obtenerResumenTerritorial } from './obtener-resumen-territorial';

const antioquia: ResumenTerritorial = {
  codigo: '05',
  nombre: 'Antioquia',
  presupuestoAsignadoCentavos: 100000,
  gastoActualCentavos: 40000,
  totalObras: 10,
  obrasConRetraso: 2,
};

describe('obtenerResumenTerritorial', () => {
  it('devuelve el resumen cuando el territorio existe', async () => {
    const caso = obtenerResumenTerritorial({ porCodigo: async () => antioquia });
    await expect(caso('05')).resolves.toEqual(antioquia);
  });

  it('lanza TerritorioNoEncontrado cuando no existe', async () => {
    const caso = obtenerResumenTerritorial({ porCodigo: async () => null });
    await expect(caso('99')).rejects.toBeInstanceOf(TerritorioNoEncontrado);
  });
});
