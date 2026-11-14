// Development-only sample rows (fictitious figures) for the archetype's test route.
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(
    `INSERT INTO gasto_territorial VALUES
       ('05', 'Antioquia', 1000000000, 400000000, 120, 18),
       ('05001', 'Medellín', 500000000, 210000000, 60, 7)
     ON CONFLICT (codigo) DO NOTHING`,
  );
  console.log('Seeded sample territories.');
} finally {
  await client.end();
}
