import { Client } from 'pg';

export interface Queryable {
  query<R extends Record<string, unknown>>(text: string, params?: unknown[]): Promise<R[]>;
}

/**
 * One short-lived connection per query: safe in Workers (no cross-request I/O sharing)
 * and works against local PostgreSQL and Neon. Swap for Hyperdrive/pooling when needed.
 */
export function createDb(connectionString: () => string): Queryable {
  return {
    async query<R extends Record<string, unknown>>(text: string, params: unknown[] = []) {
      const client = new Client({ connectionString: connectionString() });
      await client.connect();
      try {
        const result = await client.query<R>(text, params);
        return result.rows;
      } finally {
        await client.end();
      }
    },
  };
}
