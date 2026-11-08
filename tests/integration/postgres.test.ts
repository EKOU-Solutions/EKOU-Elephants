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
    await client.query(`DELETE FROM gasto_territorial WHERE codigo IN ('98', '96')`);
    await client.end();
  });

  it('devuelve el resumen almacenado', async () => {
    const res = await crearApp(createDb(() => url!)).request('/api/mapa/territorios/98/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ codigo: '98', presupuestoAsignadoCentavos: 100050, obrasConRetraso: 2 });
  });

  it('devuelve 404 para un territorio inexistente', async () => {
    const res = await crearApp(createDb(() => url!)).request('/api/mapa/territorios/97/resumen');
    expect(res.status).toBe(404);
  });

  it('conserva centavos exactos en el límite de ambos campos', async () => {
    await client.query(
      `INSERT INTO gasto_territorial VALUES ('96','Límite', $1, $1, 0, 0) ON CONFLICT DO NOTHING`,
      ['90071992547409.91'],
    );
    const res = await crearApp(createDb(() => url!)).request('/api/mapa/territorios/96/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      presupuestoAsignadoCentavos: Number.MAX_SAFE_INTEGER, gastoActualCentavos: Number.MAX_SAFE_INTEGER,
    });
  });

  it.each(['presupuesto_asignado', 'gasto_actual'])('PostgreSQL rechaza %s fuera de rango', async (campo) => {
    // The column name comes from this fixed test list, never from user input.
    await expect(client.query(
      `UPDATE gasto_territorial SET ${campo} = $1 WHERE codigo = '98'`, ['90071992547409.92'],
    )).rejects.toMatchObject({ code: '23514' });
  });

  it('no reaplica migraciones ya ejecutadas', () => {
    expect(migrate('up').toString()).toContain('No migrations to run');
  });
});
