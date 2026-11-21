import {
  contractsFromData,
  type ObjectStore,
} from '../../modules/contracts/adapters/data-worker/contracts.data-worker';
import { contractsRoutes } from '../../modules/contracts/adapters/http/contracts.routes';
import { getContractDetail } from '../../modules/contracts/application/get-contract-detail';
import { mapaDesdeDatos } from '../../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import { obtenerCorte } from '../../modules/mapa/application/consultar-mapa';

export function composeContracts(data: ObjectStore) {
  // The published cut is the map module's: contracts ask it through its use case.
  const cut = obtenerCorte(mapaDesdeDatos(data));
  return contractsRoutes({
    getContractDetail: getContractDetail(contractsFromData(data), async () => (await cut()).corte),
  });
}
