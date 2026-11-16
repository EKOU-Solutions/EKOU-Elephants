import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import type { Hono } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { crearApp } from '../app';
import type { Queryable } from '../db';

/**
 * Build-time only (scripts/generar-docs-api.mjs and tests): the Worker serves the generated files.
 * Routes carry their own docs (`describeRoute` with the response schemas, `validator` for the
 * parameters); `generateSpecs` and the Markdown converter stay out of the Worker bundle.
 */
export const RUTAS_DOCUMENTACION = ['/api/openapi.json', '/api/llms.txt', '/api/docs'] as const;

type Spec = Awaited<ReturnType<typeof generateSpecs>>;

/** Builds the OpenAPI 3.1 document from the routes already registered on `app`. */
export async function generarOpenApi(app: Hono): Promise<Spec> {
  return generateSpecs(app, {
    // Keeps a route without describeRoute in the spec, so docs.test.ts reports it.
    includeEmptyPaths: true,
    exclude: [...RUTAS_DOCUMENTACION],
    documentation: {
      info: {
        title: 'API de EKOU Elephants',
        version: '0.1.0',
        description:
          'API pública de solo lectura con el presupuesto y las obras por territorio de Colombia. Todos los errores responden JSON con la forma `{ "error": "<código>" }`.',
      },
      tags: [
        { name: 'Salud', description: 'Disponibilidad del servicio.' },
        { name: 'Mapa', description: 'Datos territoriales del corte mensual vigente.' },
      ],
    },
  });
}

const sinDb: Queryable = {
  query: async () => {
    throw new Error('generating the API docs must not query the database');
  },
};

/** Builds both served documents from the real app: the OpenAPI JSON and its Markdown (llms.txt). */
export async function generarDocumentos(): Promise<{ openApi: Spec; llms: string }> {
  const openApi = await generarOpenApi(crearApp(sinDb));
  return { openApi, llms: await createMarkdownFromOpenApi(JSON.stringify(openApi)) };
}
