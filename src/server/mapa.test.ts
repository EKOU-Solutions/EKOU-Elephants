import { describe, expect, it } from 'vitest';
import { type AlmacenObjetos, claves } from '../modules/mapa/adapters/r2/mapa.r2';
import { crearApp } from './app';
import type { Queryable } from './db';

// Real values from cut 2026-11 (docs/design/pages/map/contract.md).
const corte = {
  corte: '2026-11',
  fechaCorte: '2026-11-07',
  publicadoEn: '2026-11-15T17:43:18Z',
  geometria: 'mgn-2025',
  fuentes: [
    {
      id: 'jbjy-vk9h',
      nombre: 'SECOP II – Contratos',
      entidad: 'Colombia Compra Eficiente',
      url: 'https://www.datos.gov.co/d/jbjy-vk9h',
      licencia: 'CC BY-SA 4.0',
    },
  ],
};
const medellin = {
  codigo: '05001',
  nombre: 'Medellín',
  tipo: 'municipio',
  departamento: { codigo: '05', iso: 'CO-ANT', nombre: 'Antioquia' },
  contratosUbicados: 356935,
};
const cacahual = {
  codigo: '94886',
  nombre: 'Cacahual',
  tipo: 'area_no_municipalizada',
  departamento: { codigo: '94', iso: 'CO-GUA', nombre: 'Guainía' },
  contratosUbicados: null,
};
const municipios = { corte: '2026-11', ventana: { desde: 2021, hasta: 2026 }, municipios: [medellin, cacahual] };
const topojson = '{"type":"Topology","objects":{},"arcs":[]}';

function publicado(): Record<string, string> {
  return {
    [claves.puntero]: JSON.stringify({ corte: '2026-11' }),
    [claves.corte('2026-11')]: JSON.stringify(corte),
    [claves.municipios('2026-11')]: JSON.stringify(municipios),
    [claves.geometria('mgn-2025')]: topojson,
  };
}

const sinBaseDeDatos: Queryable = {
  async query() {
    throw new Error('el mapa no debe consultar PostgreSQL');
  },
};

function app(objetos: Record<string, string> = publicado()) {
  const leidas: string[] = [];
  const almacen: AlmacenObjetos = {
    async get(clave) {
      leidas.push(clave);
      const texto = objetos[clave];
      return texto === undefined ? null : { text: async () => texto };
    },
  };
  return { app: crearApp(sinBaseDeDatos, almacen), leidas };
}

describe('GET /api/mapa/corte', () => {
  it('devuelve el corte vigente con caché corta', async () => {
    const res = await app().app.request('/api/mapa/corte');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(corte);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300, stale-while-revalidate=86400');
  });

  it('responde 503 si no hay corte publicado', async () => {
    const res = await app({}).app.request('/api/mapa/corte');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'corte_no_disponible' });
  });

  it('responde 503 si no hay bucket configurado', async () => {
    const res = await crearApp(sinBaseDeDatos).request('/api/mapa/corte');
    expect(res.status).toBe(503);
  });

  it('responde 503 si el puntero apunta a un corte que no existe', async () => {
    const objetos = { ...publicado(), [claves.puntero]: JSON.stringify({ corte: '2026-12' }) };
    expect((await app(objetos).app.request('/api/mapa/corte')).status).toBe(503);
  });

  it.each([
    ['no es JSON', '{'],
    ['no cumple el contrato', JSON.stringify({ ...corte, fechaCorte: '30/11/2026' })],
    ['trae campos de más', JSON.stringify({ ...corte, extra: 1 })],
  ])('responde 503 si el archivo del corte %s', async (_caso, contenido) => {
    const objetos = { ...publicado(), [claves.corte('2026-11')]: contenido };
    const res = await app(objetos).app.request('/api/mapa/corte');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'corte_no_disponible' });
  });
});

describe('GET /api/mapa/municipios', () => {
  it('devuelve los municipios del corte vigente, con null cuando no hay datos', async () => {
    const res = await app().app.request('/api/mapa/municipios');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(municipios);
  });

  it('responde 503 si faltan los municipios del corte', async () => {
    const { [claves.municipios('2026-11')]: _, ...objetos } = publicado();
    expect((await app(objetos).app.request('/api/mapa/municipios')).status).toBe(503);
  });

  it.each([
    ['un conteo en 0 en vez de null', { ...medellin, contratosUbicados: 0 }],
    ['un código sin el cero inicial', { ...medellin, codigo: '5001' }],
    ['un tipo desconocido', { ...medellin, tipo: 'vereda' }],
  ])('responde 503 si el archivo trae %s', async (_caso, municipio) => {
    const objetos = {
      ...publicado(),
      [claves.municipios('2026-11')]: JSON.stringify({ ...municipios, municipios: [municipio] }),
    };
    expect((await app(objetos).app.request('/api/mapa/municipios')).status).toBe(503);
  });

  it('responde 503 si los municipios son de otro corte', async () => {
    const objetos = {
      ...publicado(),
      [claves.municipios('2026-11')]: JSON.stringify({ ...municipios, corte: '2026-10' }),
    };
    expect((await app(objetos).app.request('/api/mapa/municipios')).status).toBe(503);
  });
});

describe('GET /api/mapa/municipios/:codigo', () => {
  it('devuelve un municipio con el corte y la ventana', async () => {
    const res = await app().app.request('/api/mapa/municipios/05001');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ corte: '2026-11', ventana: { desde: 2021, hasta: 2026 }, ...medellin });
  });

  it('responde 404 si el código no está en DIVIPOLA', async () => {
    const res = await app().app.request('/api/mapa/municipios/99999');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'municipio_no_encontrado' });
  });

  it.each(['5001', '050011', 'abcde', "05001'--"])('responde 400 sin leer R2 si el código es %s', async (codigo) => {
    const { app: a, leidas } = app();
    const res = await a.request(`/api/mapa/municipios/${encodeURIComponent(codigo)}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'codigo_invalido' });
    expect(leidas).toHaveLength(0);
  });
});

describe('GET /api/mapa/geometria/:version', () => {
  it('devuelve el TopoJSON con caché inmutable', async () => {
    const res = await app().app.request('/api/mapa/geometria/mgn-2025');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(topojson);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('responde 404 si la versión no existe', async () => {
    const res = await app().app.request('/api/mapa/geometria/mgn-2030');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'geometria_no_encontrada' });
  });

  it('responde 404 sin leer R2 si la versión intenta salir de la carpeta', async () => {
    const { app: a, leidas } = app();
    const res = await a.request(`/api/mapa/geometria/${encodeURIComponent('../latest')}`);
    expect(res.status).toBe(404);
    expect(leidas).toHaveLength(0);
  });
});
