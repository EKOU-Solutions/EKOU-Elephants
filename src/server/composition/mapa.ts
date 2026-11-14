import { mapaRoutes } from '../../modules/mapa/adapters/http/mapa.routes';
import { gastoTerritorialRepository } from '../../modules/mapa/adapters/postgres/gasto-territorial.repository';
import { obtenerResumenTerritorial } from '../../modules/mapa/application/obtener-resumen-territorial';
import type { Queryable } from '../db';

export function componerMapa(db: Queryable) {
  return mapaRoutes({
    obtenerResumenTerritorial: obtenerResumenTerritorial(gastoTerritorialRepository(db)),
  });
}
