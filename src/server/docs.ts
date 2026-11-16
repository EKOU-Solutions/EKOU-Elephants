import { Scalar } from '@scalar/hono-api-reference';
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import type { Hono } from 'hono';
import { generateSpecs } from 'hono-openapi';

export const RUTAS_DOCUMENTACION = ['/api/openapi.json', '/api/llms.txt', '/api/docs'] as const;

type Respuestas = Record<string, { description: string }>;
interface Enriquecimiento {
  summary: string;
  description?: string;
  tags: string[];
  responses: Respuestas;
}

const errorJson = (codigo: string, cuando: string) => ({
  description: `${cuando}. Cuerpo: \`{ "error": "${codigo}" }\`.`,
});

const r400 = errorJson('codigo_invalido', 'El código DIVIPOLA no tiene el formato esperado');
const r503 = errorJson(
  'corte_no_disponible',
  'No hay un corte mensual publicado o sus archivos no son coherentes',
);
const r500 = errorJson('error_interno', 'Error inesperado del servidor');

/**
 * Spanish descriptions and known error responses, keyed by the generated path. They are merged
 * onto the operations generated from the routes, so the routes themselves stay untouched. The
 * generator cannot read `@hono/zod-validator`, so responses carry no body schema.
 */
const ENRIQUECIMIENTO: Record<string, Enriquecimiento> = {
  '/api/salud': {
    summary: 'Estado del servicio',
    tags: ['Salud'],
    responses: { 200: { description: 'El Worker responde. Cuerpo: `{ "ok": true }`.' } },
  },
  '/api/mapa/territorios/{codigo}/resumen': {
    summary: 'Resumen presupuestal de un territorio',
    description:
      'Presupuesto asignado, gasto actual (en centavos) y obras de un departamento (2 dígitos) o municipio (5 dígitos) según su código DIVIPOLA.',
    tags: ['Mapa'],
    responses: {
      200: { description: 'Resumen del territorio.' },
      400: r400,
      404: errorJson('territorio_no_encontrado', 'No existe un territorio con ese código'),
      500: r500,
    },
  },
  '/api/mapa/corte': {
    summary: 'Corte mensual vigente',
    description: 'Metadatos del corte de datos publicado y sus fuentes.',
    tags: ['Mapa'],
    responses: { 200: { description: 'Corte vigente.' }, 503: r503, 500: r500 },
  },
  '/api/mapa/municipios': {
    summary: 'Municipios del corte vigente',
    tags: ['Mapa'],
    responses: { 200: { description: 'Municipios del corte.' }, 503: r503, 500: r500 },
  },
  '/api/mapa/departamentos': {
    summary: 'Departamentos del corte vigente',
    description: 'Departamentos con sus agregados y el total nacional.',
    tags: ['Mapa'],
    responses: { 200: { description: 'Departamentos del corte.' }, 503: r503, 500: r500 },
  },
  '/api/mapa/municipios/{codigo}': {
    summary: 'Detalle de un municipio',
    description: 'Datos del municipio (código DIVIPOLA de 5 dígitos) en el corte vigente.',
    tags: ['Mapa'],
    responses: {
      200: { description: 'Municipio seleccionado.' },
      400: r400,
      404: errorJson('municipio_no_encontrado', 'El municipio no está en el corte vigente'),
      503: r503,
      500: r500,
    },
  },
};

type Spec = Awaited<ReturnType<typeof generateSpecs>>;

/** Builds the OpenAPI 3.1 document from the routes already registered on `app`. */
export async function generarOpenApi(app: Hono): Promise<Spec> {
  const spec = await generateSpecs(app, {
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
  for (const [ruta, extra] of Object.entries(ENRIQUECIMIENTO)) {
    const operacion = spec.paths?.[ruta]?.get;
    if (!operacion) continue;
    const { responses, ...resto } = extra;
    Object.assign(operacion, resto);
    operacion.responses = { ...operacion.responses, ...responses };
  }
  return spec;
}

export const ENRIQUECIMIENTO_RUTAS = Object.keys(ENRIQUECIMIENTO);

// Routes are the same for every request, but index.ts builds a new app per request, so cache the
// generated documents per isolate instead of per app.
let openApi: Promise<Spec> | undefined;
let markdown: Promise<string> | undefined;

/** Serves the OpenAPI JSON, its Markdown for agents (llms.txt) and the Scalar UI for people. */
export function montarDocumentacion(app: Hono) {
  const obtenerOpenApi = () => {
    openApi ??= generarOpenApi(app).catch((err) => {
      openApi = undefined;
      throw err;
    });
    return openApi;
  };
  const [rutaJson, rutaLlms, rutaDocs] = RUTAS_DOCUMENTACION;

  app.get(rutaJson, async (c) => c.json(await obtenerOpenApi()));
  app.get(rutaLlms, async (c) => {
    markdown ??= obtenerOpenApi()
      .then((spec) => createMarkdownFromOpenApi(JSON.stringify(spec)))
      .catch((err) => {
        markdown = undefined;
        throw err;
      });
    return c.text(await markdown, 200, { 'Content-Type': 'text/markdown; charset=utf-8' });
  });
  app.get(rutaDocs, Scalar({ url: rutaJson, pageTitle: 'API de EKOU Elephants' }));
}
