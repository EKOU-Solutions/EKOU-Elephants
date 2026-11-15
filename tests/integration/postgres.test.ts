import { runner } from 'node-pg-migrate';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/server/app';
import { createDb } from '../../src/server/db';

const url = process.env.TEST_DATABASE_URL;
// Solo se usa dentro del describe, que se omite cuando no hay URL.
const dbUrl = url ?? '';

// Needs a disposable database: it runs migrations up/down against it.
describe.skipIf(!url)('HTTP → caso de uso → PostgreSQL', () => {
  // Programmatic API: same SQL loader and table as `npm run migrate`, with no child process,
  // so it behaves the same on Windows (npx.cmd), macOS and Linux.
  const migrarArriba = () =>
    runner({
      databaseUrl: dbUrl,
      dir: 'migrations',
      direction: 'up',
      migrationsTable: 'pgmigrations',
      log: () => {},
    });
  const client = new pg.Client({ connectionString: url });
  let conectado = false;

  beforeAll(async () => {
    await migrarArriba();
    await client.connect();
    conectado = true;
    await client.query(
      `INSERT INTO gasto_territorial VALUES ('98','Territorio de prueba',1000.50,400,10,2) ON CONFLICT DO NOTHING`,
    );
  });
  afterAll(async () => {
    // If beforeAll failed, report that error instead of hanging on a client that never connected.
    if (!conectado) return;
    await client.query(`DELETE FROM gasto_territorial WHERE codigo IN ('98', '96')`);
    await client.end();
  });

  it('devuelve el resumen almacenado', async () => {
    const res = await crearApp(createDb(() => dbUrl)).request('/api/mapa/territorios/98/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      codigo: '98',
      presupuestoAsignadoCentavos: 100050,
      obrasConRetraso: 2,
    });
  });

  it('devuelve 404 para un territorio inexistente', async () => {
    const res = await crearApp(createDb(() => dbUrl)).request('/api/mapa/territorios/97/resumen');
    expect(res.status).toBe(404);
  });

  it('conserva centavos exactos en el límite de ambos campos', async () => {
    await client.query(
      `INSERT INTO gasto_territorial VALUES ('96','Límite', $1, $1, 0, 0) ON CONFLICT DO NOTHING`,
      ['90071992547409.91'],
    );
    const res = await crearApp(createDb(() => dbUrl)).request('/api/mapa/territorios/96/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      presupuestoAsignadoCentavos: Number.MAX_SAFE_INTEGER,
      gastoActualCentavos: Number.MAX_SAFE_INTEGER,
    });
  });

  it.each(['presupuesto_asignado', 'gasto_actual'])(
    'PostgreSQL rechaza %s fuera de rango',
    async (campo) => {
      // The column name comes from this fixed test list, never from user input.
      await expect(
        client.query(`UPDATE gasto_territorial SET ${campo} = $1 WHERE codigo = '98'`, [
          '90071992547409.92',
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    },
  );

  it('no reaplica migraciones ya ejecutadas', async () => {
    expect(await migrarArriba()).toEqual([]);
  });
});
