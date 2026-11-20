import { almacenDesdeWorker } from '../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import { crearApp } from './app';
import { createDb } from './db';
import { leerEnv } from './env';
import { type PagesEnv, isPagePath, servePage } from './pages';

export default {
  async fetch(request: Request, rawEnv: unknown, ctx: ExecutionContext) {
    // The generated page of a place (ADR 0003), or the SPA as always: outside the API.
    const env = rawEnv as Partial<PagesEnv>;
    if (env.ASSETS && isPagePath(new URL(request.url).pathname))
      return servePage(request, { ASSETS: env.ASSETS, DATOS: env.DATOS });
    // Env is validated when a query needs it, so routes without a database (e.g. /api/salud) still work.
    // Without the DATOS binding (DATOS_CORTE_ENABLED unset) the map routes answer corte_no_disponible.
    const datos = almacenDesdeWorker((rawEnv as { DATOS?: Fetcher }).DATOS);
    return crearApp(
      createDb(() => leerEnv(rawEnv).DATABASE_URL),
      datos,
    ).fetch(request, rawEnv, ctx);
  },
} satisfies ExportedHandler;
