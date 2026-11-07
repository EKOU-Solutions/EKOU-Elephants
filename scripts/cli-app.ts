// Entrypoint for `hono request` and other Hono CLI commands: same app as production,
// but with an in-memory database so no PostgreSQL is needed. Sample figures are fictitious.
import { crearApp } from '../src/server/app';
import type { Queryable } from '../src/server/db';

const filas: Record<string, unknown>[] = [
  { codigo: '05', nombre: 'Antioquia', presupuesto_asignado: '1000000000', gasto_actual: '400000000', total_obras: 120, obras_con_retraso: 18 },
];

const db: Queryable = {
  async query(_text, params = []) {
    return filas.filter((f) => f.codigo === params[0]) as never;
  },
};

export default crearApp(db);
