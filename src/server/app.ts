import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { TerritorioNoEncontrado } from '../modules/mapa/domain/resumen-territorial';
import { componerMapa } from './composition/mapa';
import type { Queryable } from './db';

/** Builds the HTTP app from injected dependencies, so tests can swap the database. */
export function crearApp(db: Queryable) {
  const app = new Hono();

  app.use(secureHeaders());
  app.get('/api/salud', (c) => c.json({ ok: true }));
  app.route('/api/mapa', componerMapa(db));

  app.notFound((c) => c.json({ error: 'no_encontrado' }, 404));
  app.onError((err, c) => {
    if (err instanceof TerritorioNoEncontrado) return c.json({ error: 'territorio_no_encontrado' }, 404);
    console.error('Unhandled error:', err.name); // no message/stack: may contain connection details
    return c.json({ error: 'error_interno' }, 500);
  });
  return app;
}
