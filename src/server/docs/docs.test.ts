import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { crearApp } from '../app';
import type { Queryable } from '../db';
import { generarDocumentos, RUTAS_DOCUMENTACION } from './openapi';

const db: Queryable = {
  async query() {
    throw new Error('documentation must not query the database');
  },
};

const RUTAS_API = [
  '/api/salud',
  '/api/mapa/territorios/{codigo}/resumen',
  '/api/mapa/corte',
  '/api/mapa/municipios',
  '/api/mapa/departamentos',
  '/api/mapa/municipios/{codigo}',
];

const versionado = (archivo: string) => readFileSync(new URL(archivo, import.meta.url), 'utf8');

describe('documentos generados en build', () => {
  it('openapi.json y llms.txt versionados coinciden con las rutas actuales (npm run docs:api)', async () => {
    const { openApi, llms } = await generarDocumentos();
    expect(JSON.parse(versionado('./openapi.json'))).toEqual(JSON.parse(JSON.stringify(openApi)));
    expect(versionado('./llms.txt')).toBe(llms);
  });

  it('llms.txt contiene las 6 rutas de la API', () => {
    const llms = versionado('./llms.txt');
    for (const ruta of RUTAS_API) expect(llms).toContain(`GET ${ruta}`);
  });
});

interface Operacion {
  summary?: string;
  tags?: string[];
  parameters?: { name: string; schema?: { pattern?: string } }[];
  responses: Record<string, { content?: { 'application/json'?: { schema?: unknown } } }>;
}

async function openApi() {
  const res = await crearApp(db).request('/api/openapi.json');
  expect(res.status).toBe(200);
  return (await res.json()) as {
    openapi: string;
    paths: Record<string, { get?: Operacion }>;
    components?: { schemas?: Record<string, unknown> };
  };
}

describe('GET /api/openapi.json', () => {
  it('documenta las 6 rutas GET de la API y nada más', async () => {
    const spec = await openApi();
    expect(spec.openapi).toMatch(/^3\.1/);
    expect(Object.keys(spec.paths).sort()).toEqual([...RUTAS_API].sort());
    for (const ruta of RUTAS_API) expect(spec.paths[ruta]?.get).toBeDefined();
  });

  it('no incluye las rutas de documentación', async () => {
    const spec = await openApi();
    for (const ruta of RUTAS_DOCUMENTACION) expect(spec.paths).not.toHaveProperty(ruta);
  });

  it('cada ruta tiene resumen, etiqueta y el body JSON de cada respuesta (200 y errores)', async () => {
    const spec = await openApi();
    for (const ruta of RUTAS_API) {
      const operacion = spec.paths[ruta]?.get;
      expect(operacion?.summary, ruta).toBeTruthy();
      expect(operacion?.tags?.length, ruta).toBeGreaterThan(0);
      expect(operacion?.responses, ruta).toHaveProperty('200');
      for (const [estado, respuesta] of Object.entries(operacion?.responses ?? {})) {
        expect(respuesta.content?.['application/json']?.schema, `${ruta} ${estado}`).toBeDefined();
      }
    }
  });

  it('documenta los campos del body con sus tipos y el patrón del código DIVIPOLA', async () => {
    const spec = await openApi();
    expect(spec.components?.schemas).toHaveProperty('MunicipioSeleccionado');
    expect(spec.components?.schemas?.MunicipioSeleccionado).toMatchObject({
      type: 'object',
      additionalProperties: false,
      properties: { contratosUbicados: { anyOf: [{ type: 'integer' }, { type: 'null' }] } },
    });
    const parametro = spec.paths['/api/mapa/municipios/{codigo}']?.get?.parameters?.[0];
    expect(parametro).toMatchObject({ name: 'codigo', schema: { pattern: '^\\d{5}$' } });
  });
});

describe('GET /api/llms.txt', () => {
  it('responde Markdown con las rutas de la API', async () => {
    const res = await crearApp(db).request('/api/llms.txt');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^text\/(markdown|plain)/);
    const texto = await res.text();
    expect(texto).toContain('/api/mapa/corte');
    expect(texto).toContain('API de EKOU Elephants');
  });
});

describe('GET /api/docs', () => {
  it('responde la interfaz HTML que lee el OpenAPI', async () => {
    const res = await crearApp(db).request('/api/docs');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^text\/html/);
    expect(await res.text()).toContain('/api/openapi.json');
  });
});
