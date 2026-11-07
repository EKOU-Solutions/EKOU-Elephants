import { execFileSync } from 'node:child_process';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/server/app';
import { createDb } from '../../src/server/db';

const url = process.env.TEST_DATABASE_URL;

// Needs a disposable database: it runs migrations up/down against it.
describe.skipIf(!url)('HTTP → caso de uso → PostgreSQL', () => {
  const migrate = (...args: string[]) =>
    execFileSync('npx', ['node-pg-migrate', ...args, '--migrations-dir', 'migrations', '--no-verbose'], {
      env: { ...process.env, DATABASE_URL: url! },
      stdio: 'pipe',
    });
  const client = new pg.Client({ connectionString: url });

  beforeAll(async () => {
    migrate('up');
    await client.connect();
    await client.query(
      `INSERT INTO gasto_territorial VALUES ('98','Territorio de prueba',1000.50,400,10,2) ON CONFLICT DO NOTHING`,
    );
  });
  afterAll(async () => {
    await client.query(`DELETE FROM gasto_territorial WHERE codigo = '98'`);
    await client.end();
  });

  it('devuelve el resumen almacenado', async () => {
    const res = await crearApp(createDb(() => url!)).request('/api/mapa/territorios/98/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ codigo: '98', presupuestoAsignado: 1000.5, obrasConRetraso: 2 });
  });

  it('devuelve 404 para un territorio inexistente', async () => {
    const res = await crearApp(createDb(() => url!)).request('/api/mapa/territorios/97/resumen');
    expect(res.status).toBe(404);
  });

  it('no reaplica migraciones ya ejecutadas', () => {
    expect(migrate('up').toString()).toContain('No migrations to run');
  });
});
