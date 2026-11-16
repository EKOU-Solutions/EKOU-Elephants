import { Hono } from 'hono';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import type {
  CorteVigente,
  DepartamentosDelCorte,
  MunicipioSeleccionado,
  MunicipiosDelCorte,
} from '../../domain/mapa';
import type { ResumenTerritorial } from '../../domain/resumen-territorial';
import {
  esquemaCorteVigente,
  esquemaDepartamentosDelCorte,
  esquemaMunicipioSeleccionado,
  esquemaMunicipiosDelCorte,
  esquemaResumenTerritorial,
} from './mapa.schemas';
import { esquemaError, json, responder } from '../../../../server/http/respuestas';

const params = z.object({
  codigo: z
    .string()
    .regex(/^(\d{2}|\d{5})$/, 'Código DIVIPOLA inválido')
    .meta({
      description: 'Código DIVIPOLA: 2 dígitos (departamento) o 5 (municipio).',
      example: '05',
    }),
});
const municipioParams = z.object({
  codigo: z
    .string()
    .regex(/^\d{5}$/)
    .meta({ description: 'Código DIVIPOLA del municipio (5 dígitos).', example: '05001' }),
});

// Cut data changes once a month: short cache, long revalidation (contract.md).
const CACHE_CORTE = 'public, max-age=300, stale-while-revalidate=86400';

const errores = {
  400: json('El código DIVIPOLA no tiene el formato esperado.', esquemaError('codigo_invalido')),
  503: json(
    'No hay un corte mensual publicado o sus archivos no son coherentes.',
    esquemaError('corte_no_disponible'),
  ),
  500: json('Error inesperado del servidor.', esquemaError('error_interno')),
};

export interface MapaCasosDeUso {
  obtenerResumenTerritorial: (codigo: string) => Promise<ResumenTerritorial>;
  obtenerCorte: () => Promise<CorteVigente>;
  listarMunicipios: () => Promise<MunicipiosDelCorte>;
  listarDepartamentos: () => Promise<DepartamentosDelCorte>;
  obtenerMunicipio: (codigo: string) => Promise<MunicipioSeleccionado>;
}

// Each handler sends its body with `responder(c, schema, value)`: typecheck fails if a documented
// field is missing; the contract tests catch undocumented extra fields (strict schemas).
export function mapaRoutes(casos: MapaCasosDeUso) {
  return new Hono()
    .get(
      '/territorios/:codigo/resumen',
      describeRoute({
        summary: 'Resumen presupuestal de un territorio',
        description:
          'Presupuesto asignado, gasto actual (en centavos) y obras de un departamento o municipio según su código DIVIPOLA.',
        tags: ['Mapa'],
        responses: {
          200: json('Resumen del territorio.', esquemaResumenTerritorial),
          400: errores[400],
          404: json(
            'No existe un territorio con ese código.',
            esquemaError('territorio_no_encontrado'),
          ),
          500: errores[500],
        },
      }),
      validator('param', params, (resultado, c) => {
        if (!resultado.success) return c.json({ error: 'codigo_invalido' }, 400);
      }),
      async (c) => {
        const resumen = await casos.obtenerResumenTerritorial(c.req.valid('param').codigo);
        return responder(c, esquemaResumenTerritorial, resumen);
      },
    )
    .get(
      '/corte',
      describeRoute({
        summary: 'Corte mensual vigente',
        description: 'Metadatos del corte de datos publicado y sus fuentes.',
        tags: ['Mapa'],
        responses: {
          200: json('Corte vigente.', esquemaCorteVigente),
          503: errores[503],
          500: errores[500],
        },
      }),
      async (c) => {
        const corte = await casos.obtenerCorte();
        c.header('Cache-Control', CACHE_CORTE);
        return responder(c, esquemaCorteVigente, corte);
      },
    )
    .get(
      '/municipios',
      describeRoute({
        summary: 'Municipios del corte vigente',
        tags: ['Mapa'],
        responses: {
          200: json('Municipios del corte.', esquemaMunicipiosDelCorte),
          503: errores[503],
          500: errores[500],
        },
      }),
      async (c) => {
        const municipios = await casos.listarMunicipios();
        c.header('Cache-Control', CACHE_CORTE);
        return responder(c, esquemaMunicipiosDelCorte, municipios);
      },
    )
    .get(
      '/departamentos',
      describeRoute({
        summary: 'Departamentos del corte vigente',
        description: 'Departamentos con sus agregados y el total nacional.',
        tags: ['Mapa'],
        responses: {
          200: json('Departamentos del corte.', esquemaDepartamentosDelCorte),
          503: errores[503],
          500: errores[500],
        },
      }),
      async (c) => {
        const departamentos = await casos.listarDepartamentos();
        c.header('Cache-Control', CACHE_CORTE);
        return responder(c, esquemaDepartamentosDelCorte, departamentos);
      },
    )
    .get(
      '/municipios/:codigo',
      describeRoute({
        summary: 'Detalle de un municipio',
        description: 'Datos del municipio en el corte vigente.',
        tags: ['Mapa'],
        responses: {
          200: json('Municipio seleccionado.', esquemaMunicipioSeleccionado),
          400: errores[400],
          404: json(
            'El municipio no está en el corte vigente.',
            esquemaError('municipio_no_encontrado'),
          ),
          503: errores[503],
          500: errores[500],
        },
      }),
      validator('param', municipioParams, (resultado, c) => {
        if (!resultado.success) return c.json({ error: 'codigo_invalido' }, 400);
      }),
      async (c) => {
        const municipio = await casos.obtenerMunicipio(c.req.valid('param').codigo);
        c.header('Cache-Control', CACHE_CORTE);
        return responder(c, esquemaMunicipioSeleccionado, municipio);
      },
    );
}
