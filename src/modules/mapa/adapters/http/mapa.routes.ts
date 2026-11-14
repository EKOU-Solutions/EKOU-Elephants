import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { ResumenTerritorial } from '../../domain/resumen-territorial';

const params = z.object({ codigo: z.string().regex(/^(\d{2}|\d{5})$/, 'Código DIVIPOLA inválido') });

export interface MapaCasosDeUso {
  obtenerResumenTerritorial: (codigo: string) => Promise<ResumenTerritorial>;
}

export function mapaRoutes(casos: MapaCasosDeUso) {
  return new Hono().get(
    '/territorios/:codigo/resumen',
    zValidator('param', params, (resultado, c) => {
      if (!resultado.success) return c.json({ error: 'codigo_invalido' }, 400);
    }),
    async (c) => c.json(await casos.obtenerResumenTerritorial(c.req.valid('param').codigo)),
  );
}
