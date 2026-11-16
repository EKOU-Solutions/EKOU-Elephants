import { almacenDesdeWorker } from '../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import { crearApp } from './app';
import { createDb } from './db';
import { leerEnv } from './env';

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
