import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { AlmacenObjetos } from '../modules/mapa/adapters/r2/mapa.r2';
import {
  CorteNoDisponible,
  GeometriaNoEncontrada,
  MunicipioNoEncontrado,
} from '../modules/mapa/domain/mapa';
import { TerritorioNoEncontrado } from '../modules/mapa/domain/resumen-territorial';
import { componerMapa } from './composition/mapa';
import type { Queryable } from './db';

/** Without a bucket every map read finds nothing, so the API answers 503 corte_no_disponible. */
const sinDatos: AlmacenObjetos = { get: async () => null };

/** Builds the HTTP app from injected dependencies, so tests can swap the database and the bucket. */
export function crearApp(db: Queryable, datos: AlmacenObjetos = sinDatos) {
  const app = new Hono();

  app.use(secureHeaders());
  app.get('/api/salud', (c) => c.json({ ok: true }));
  app.route('/api/mapa', componerMapa(db, datos));

  app.notFound((c) => c.json({ error: 'no_encontrado' }, 404));
  app.onError((err, c) => {
    if (err instanceof TerritorioNoEncontrado)
      return c.json({ error: 'territorio_no_encontrado' }, 404);
    if (err instanceof MunicipioNoEncontrado)
      return c.json({ error: 'municipio_no_encontrado' }, 404);
    if (err instanceof GeometriaNoEncontrada)
      return c.json({ error: 'geometria_no_encontrada' }, 404);
    if (err instanceof CorteNoDisponible) {
      console.error('Corte no disponible:', err.message); // keys and reasons only, no data
      return c.json({ error: 'corte_no_disponible' }, 503);
    }
    console.error('Unhandled error:', err.name); // no message/stack: may contain connection details
    return c.json({ error: 'error_interno' }, 500);
  });
  return app;
}
