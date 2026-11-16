import { describe, expect, it } from 'vitest';
import { crearApp } from './app';
import type { Queryable } from './db';
import { ENRIQUECIMIENTO_RUTAS, RUTAS_DOCUMENTACION } from './docs';

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

async function openApi() {
  const res = await crearApp(db).request('/api/openapi.json');
  expect(res.status).toBe(200);
  return (await res.json()) as {
    openapi: string;
    paths: Record<string, { get?: { responses: Record<string, unknown>; summary?: string } }>;
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

  it('el enriquecimiento corresponde a rutas existentes y añade los errores conocidos', async () => {
    const spec = await openApi();
    expect([...ENRIQUECIMIENTO_RUTAS].sort()).toEqual([...RUTAS_API].sort());
    expect(spec.paths['/api/mapa/corte']?.get?.summary).toBe('Corte mensual vigente');
    expect(spec.paths['/api/mapa/municipios/{codigo}']?.get?.responses).toHaveProperty('400');
    expect(spec.paths['/api/mapa/municipios/{codigo}']?.get?.responses).toHaveProperty('404');
    expect(spec.paths['/api/mapa/corte']?.get?.responses).toHaveProperty('503');
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
