import { mapaRoutes } from '../../modules/mapa/adapters/http/mapa.routes';
import { gastoTerritorialRepository } from '../../modules/mapa/adapters/postgres/gasto-territorial.repository';
import {
  type AlmacenObjetos,
  mapaDesdeDatos,
  resumenDesdeDatos,
} from '../../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import {
  listarDepartamentos,
  listarMunicipios,
  obtenerCorte,
  obtenerMunicipio,
} from '../../modules/mapa/application/consultar-mapa';
import {
  obtenerResumenDepartamental,
  obtenerResumenMunicipal,
} from '../../modules/mapa/application/obtener-resumen';
import { obtenerResumenTerritorial } from '../../modules/mapa/application/obtener-resumen-territorial';
import type { Queryable } from '../db';

export function componerMapa(db: Queryable, datos: AlmacenObjetos) {
  const mapa = mapaDesdeDatos(datos);
  const resumen = resumenDesdeDatos(datos);
  return mapaRoutes({
    obtenerResumenTerritorial: obtenerResumenTerritorial(gastoTerritorialRepository(db)),
    obtenerCorte: obtenerCorte(mapa),
    listarMunicipios: listarMunicipios(mapa),
    listarDepartamentos: listarDepartamentos(mapa),
    obtenerMunicipio: obtenerMunicipio(mapa),
    obtenerResumenMunicipal: obtenerResumenMunicipal(mapa, resumen),
    obtenerResumenDepartamental: obtenerResumenDepartamental(mapa, resumen),
  });
}
