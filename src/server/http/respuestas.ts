// Shared helpers to document and send JSON responses. Every module's HTTP adapter uses them
// (docs/api.md, docs/how-to/crear-una-api.md).
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { resolver } from 'hono-openapi';
import { z } from 'zod';

/**
 * Sends `valor` as the JSON body of a response documented by `esquema`. Typecheck fails if `valor`
 * lacks a field the schema promises. It does not validate at runtime: the contract tests check
 * that the real body matches the strict schema, which also catches undocumented extra fields.
 */
export function responder<S extends z.ZodType>(
  c: Context,
  _esquema: S,
  valor: z.input<S>,
  estado: ContentfulStatusCode = 200,
) {
  return c.json(valor as never, estado);
}

/** OpenAPI response (for `describeRoute`) with a JSON body described by a zod schema. */
export const json = (description: string, schema: z.ZodType) => ({
  description,
  content: { 'application/json': { schema: resolver(schema) } },
});

/** Error body for one code: `{ "error": "<código>" }`. */
export const esquemaError = <C extends string>(codigo: C) =>
  z.object({ error: z.literal(codigo) }).strict();
