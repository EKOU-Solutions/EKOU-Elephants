import type { AlmacenObjetos } from '../modules/mapa/adapters/r2/mapa.r2';
import { crearApp } from './app';
import { createDb } from './db';
import { leerEnv } from './env';

/**
 * DATOS is the static-assets Worker `ekou-elephants-datos` that the monthly cut publishes from the
 * GitHub Release (docs/ci-cd.md). The map adapter reads files by key (`datos/latest.json`, …), so the
 * Worker is wrapped: a key is fetched as a path, and 404 means the file does not exist.
 */
export function almacenDesdeWorker(worker: Fetcher | undefined): AlmacenObjetos | undefined {
  if (!worker) return undefined;
  return {
    async get(clave) {
      const res = await worker.fetch(`https://datos/${clave}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Worker de datos respondió ${res.status} para ${clave}`);
      return res;
    },
  };
}

export default {
  async fetch(request: Request, rawEnv: unknown, ctx: ExecutionContext) {
    // Env is validated when a query needs it, so routes without a database (e.g. /api/salud) still work.
    // Without the DATOS binding (DATOS_CORTE_ENABLED unset) the map routes answer corte_no_disponible.
    const datos = almacenDesdeWorker((rawEnv as { DATOS?: Fetcher }).DATOS);
    return crearApp(
      createDb(() => leerEnv(rawEnv).DATABASE_URL),
      datos,
    ).fetch(request, rawEnv, ctx);
  },
} satisfies ExportedHandler;
