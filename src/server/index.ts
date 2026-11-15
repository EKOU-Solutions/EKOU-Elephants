import type { AlmacenObjetos } from '../modules/mapa/adapters/r2/mapa.r2';
import { crearApp } from './app';
import { createDb } from './db';
import { leerEnv } from './env';

export default {
  async fetch(request: Request, rawEnv: unknown, ctx: ExecutionContext) {
    // Env is validated when a query needs it, so routes without a database (e.g. /api/salud) still work.
    // DATOS is the R2 bucket the pipeline publishes to (wrangler.jsonc); local dev emulates it on disk.
    const datos = (rawEnv as { DATOS?: AlmacenObjetos }).DATOS;
    return crearApp(createDb(() => leerEnv(rawEnv).DATABASE_URL), datos).fetch(request, rawEnv, ctx);
  },
} satisfies ExportedHandler;
