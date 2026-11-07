import { describe, expect, it } from 'vitest';
import { crearApp } from './app';
import type { Queryable } from './db';

const fila = {
  codigo: '05', nombre: 'Antioquia', presupuesto_asignado: '1000.50', gasto_actual: '400',
  total_obras: 10, obras_con_retraso: 2,
};

function app(rows: Record<string, unknown>[] | Error) {
  const llamadas: { text: string; params?: unknown[] }[] = [];
  const db: Queryable = {
    async query(text, params) {
      llamadas.push({ text, params });
      if (rows instanceof Error) throw rows;
      return rows as never;
    },
  };
  return { app: crearApp(db), llamadas };
}

describe('GET /api/mapa/territorios/:codigo/resumen', () => {
  it('devuelve 200 con el resumen y consulta parametrizada', async () => {
    const { app: a, llamadas } = app([fila]);
    const res = await a.request('/api/mapa/territorios/05/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      codigo: '05', nombre: 'Antioquia', presupuestoAsignado: 1000.5, gastoActual: 400,
      totalObras: 10, obrasConRetraso: 2,
    });
    expect(llamadas[0]?.params).toEqual(['05']);
    expect(llamadas[0]?.text).not.toContain('05');
  });

  it('devuelve 404 si el territorio no existe', async () => {
    const res = await app([]).app.request('/api/mapa/territorios/99/resumen');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'territorio_no_encontrado' });
  });

  it('devuelve 400 sin tocar la base de datos si el código es inválido', async () => {
    const { app: a, llamadas } = app([fila]);
    const res = await a.request("/api/mapa/territorios/0'; DROP TABLE x;--/resumen");
    expect(res.status).toBe(400);
    expect(llamadas).toHaveLength(0);
  });

  it('devuelve 500 genérico sin filtrar detalles internos', async () => {
    const res = await app(new Error('password authentication failed for user secret')).app.request(
      '/api/mapa/territorios/05/resumen',
    );
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('secret');
  });

  it('incluye cabeceras de seguridad', async () => {
    const res = await app([]).app.request('/api/salud');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
