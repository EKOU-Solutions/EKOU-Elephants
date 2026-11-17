// Reads the data Worker's publication folder (`datos/latest.json` + `datos/<corte>/…`) with the same
// adapter and use cases as the API, so the pages never show a figure the API would not return.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type AlmacenObjetos,
  mapaDesdeDatos,
} from '../../../src/modules/mapa/adapters/worker-datos/mapa.worker-datos';
import {
  listarDepartamentos,
  listarMunicipios,
  obtenerCorte,
} from '../../../src/modules/mapa/application/consultar-mapa';
import type { TopoJson } from '../../../src/modules/mapa/ui/geometry';
import { type PreparedMap, prepareMap } from '../../../src/modules/mapa/ui/mapModel';

/** The data Worker's files on disk: a key is a path under `raiz`, a missing file is `null`. */
export function almacenEnDisco(raiz: string): AlmacenObjetos {
  return {
    async get(clave) {
      try {
        const texto = await readFile(join(raiz, clave), 'utf8');
        return { text: async () => texto };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
  };
}

/**
 * The current cut of a publication folder, prepared as the app prepares it (`prepareMap`). The
 * geometry is the app's own static file (`public/geometria/<version>.topojson`), as in the browser.
 */
export async function leerPublicacion(raiz: string, geometrias: string): Promise<PreparedMap> {
  const mapa = mapaDesdeDatos(almacenEnDisco(raiz));
  const cut = await obtenerCorte(mapa)();
  const [departments, municipalities] = await Promise.all([
    listarDepartamentos(mapa)(),
    listarMunicipios(mapa)(),
  ]);
  const topology = JSON.parse(
    await readFile(join(geometrias, `${cut.geometria}.topojson`), 'utf8'),
  ) as TopoJson;
  return prepareMap({ cut, departments, municipalities, topology });
}
