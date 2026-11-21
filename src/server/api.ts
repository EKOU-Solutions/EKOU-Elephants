// The API Worker (ADR-0004): only Hono at /api/*. It serves no pages; the web Worker (Astro, web/)
// serves them and calls this one by service binding.
import { almacenDesdeWorker } from '../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import { crearApp } from './app';
import { createDb } from './db';
import { leerEnv } from './env';

export default {
  fetch(request: Request, rawEnv: unknown, ctx: ExecutionContext) {
    // Env is validated when a query needs it, so routes without a database (e.g. /api/salud) still work.
    const datos = almacenDesdeWorker((rawEnv as { DATOS?: Fetcher }).DATOS);
    return crearApp(
      createDb(() => leerEnv(rawEnv).DATABASE_URL),
      datos,
    ).fetch(request, rawEnv, ctx);
  },
} satisfies ExportedHandler;
