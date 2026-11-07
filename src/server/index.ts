import { crearApp } from './app';
import { createDb } from './db';
import { leerEnv } from './env';

export default {
  async fetch(request: Request, rawEnv: unknown, ctx: ExecutionContext) {
    // Env is validated when a query needs it, so routes without a database (e.g. /api/salud) still work.
    return crearApp(createDb(() => leerEnv(rawEnv).DATABASE_URL)).fetch(request, rawEnv, ctx);
  },
} satisfies ExportedHandler;
