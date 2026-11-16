import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type {
  CorteVigente,
  DepartamentosDelCorte,
  MunicipiosDelCorte,
  MunicipioSeleccionado,
} from '../../domain/mapa';
import type { ResumenTerritorial } from '../../domain/resumen-territorial';

const params = z.object({
  codigo: z.string().regex(/^(\d{2}|\d{5})$/, 'Código DIVIPOLA inválido'),
});
const municipioParams = z.object({ codigo: z.string().regex(/^\d{5}$/) });

// Cut data changes once a month: short cache, long revalidation (contract.md).
const CACHE_CORTE = 'public, max-age=300, stale-while-revalidate=86400';

export interface MapaCasosDeUso {
  obtenerResumenTerritorial: (codigo: string) => Promise<ResumenTerritorial>;
  obtenerCorte: () => Promise<CorteVigente>;
  listarMunicipios: () => Promise<MunicipiosDelCorte>;
  listarDepartamentos: () => Promise<DepartamentosDelCorte>;
  obtenerMunicipio: (codigo: string) => Promise<MunicipioSeleccionado>;
}

export function mapaRoutes(casos: MapaCasosDeUso) {
  return new Hono()
    .get(
      '/territorios/:codigo/resumen',
      zValidator('param', params, (resultado, c) => {
        if (!resultado.success) return c.json({ error: 'codigo_invalido' }, 400);
      }),
      async (c) => c.json(await casos.obtenerResumenTerritorial(c.req.valid('param').codigo)),
    )
    .get('/corte', async (c) => {
      const corte = await casos.obtenerCorte();
      c.header('Cache-Control', CACHE_CORTE);
      return c.json(corte);
    })
    .get('/municipios', async (c) => {
      const municipios = await casos.listarMunicipios();
      c.header('Cache-Control', CACHE_CORTE);
      return c.json(municipios);
    })
    .get('/departamentos', async (c) => {
      const departamentos = await casos.listarDepartamentos();
      c.header('Cache-Control', CACHE_CORTE);
      return c.json(departamentos);
    })
    .get(
      '/municipios/:codigo',
      zValidator('param', municipioParams, (resultado, c) => {
        if (!resultado.success) return c.json({ error: 'codigo_invalido' }, 400);
      }),
      async (c) => {
        const municipio = await casos.obtenerMunicipio(c.req.valid('param').codigo);
        c.header('Cache-Control', CACHE_CORTE);
        return c.json(municipio);
      },
    );
}
