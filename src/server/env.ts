import { z } from 'zod';

const esquema = z.object({ DATABASE_URL: z.string().min(1) });

export type Env = z.infer<typeof esquema>;

export function leerEnv(raw: unknown): Env {
  return esquema.parse(raw);
}
