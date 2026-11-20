import { z } from 'zod';
import type { ContractReader } from '../../application/ports/contract-reader';
import { ContractDataUnavailable, type ContractRecord } from '../../domain/contract';

/** Read files by key, so tests can use an in-memory fake instead of the data Worker. */
export interface ObjectStore {
  get(key: string): Promise<{ text(): Promise<string> } | null>;
}

/**
 * The data Worker holds at most 20,000 files, so the pipeline publishes the contracts in GROUPS
 * files (`ekou-pipeline export-contracts`, pipeline/src/ekou_pipeline/contracts.py). These two
 * rules mirror the pipeline and must change together with it:
 *
 * - The file of a contract comes from its id alone: the first 16 bits of its SHA-256, scaled to
 *   GROUPS, in hex.
 * - A file has one contract per line, and every line starts with `{"id":"<id>",`.
 */
const GROUPS = 16_384;

export async function groupOf(id: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id)));
  const prefix = ((hash[0] ?? 0) << 8) | (hash[1] ?? 0);
  return Math.floor((prefix * GROUPS) / 65_536)
    .toString(16)
    .padStart(4, '0');
}

export async function contractKey(cut: string, id: string): Promise<string> {
  return `datos/${cut}/contratos/${await groupOf(id)}.ndjson`;
}

const place = (code: RegExp) =>
  z.object({ code: z.string().regex(code), name: z.string().min(1) }).strict();
const cents = z.number().int().nonnegative().nullable();

// Strict on purpose: a natural person with a name or a document fails the schema, so the API
// answers 503 instead of showing it (TASK-08).
const supplier = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('company'), name: z.string().min(1), taxId: z.string().nullable() })
    .strict(),
  z.object({ kind: z.literal('natural_person') }).strict(),
  z.object({ kind: z.literal('unknown') }).strict(),
]);

const contractSchema: z.ZodType<ContractRecord> = z
  .object({
    id: z.string().min(1),
    source: z.enum(['secop_i', 'secop_ii']),
    sourceUrl: z.url({ protocol: /^https$/ }).nullable(),
    description: z.string().min(1).nullable(),
    type: z.string().nullable(),
    isPublicWorks: z.boolean(),
    procurementMethod: z.string().nullable(),
    methodJustification: z.string().nullable(),
    status: z.enum(['not_started', 'active', 'suspended', 'finished', 'expired_unclosed']),
    sourceStatus: z.string().nullable(),
    provisional: z.boolean(),
    buyer: z.object({ name: z.string().min(1), taxId: z.string().nullable() }).strict(),
    supplier,
    location: z.object({ municipality: place(/^\d{5}$/), department: place(/^\d{2}$/) }).strict(),
    dates: z
      .object({
        signed: z.iso.date(),
        start: z.iso.date().nullable(),
        end: z.iso.date().nullable(),
        addedDays: z.number().int().positive().nullable(),
      })
      .strict(),
    amounts: z
      .object({
        currentCents: cents,
        initialCents: cents,
        changePct: z.number().nullable(),
        exceedsLegalAdditionLimit: z.boolean(),
        reliable: z.boolean(),
        paidCents: cents,
      })
      .strict(),
  })
  .strict();

/** The line of `id` in a group file, or null. Only that line is parsed, not the whole file. */
function lineOf(text: string, id: string): string | null {
  const prefix = `{"id":${JSON.stringify(id)},`;
  let start = 0;
  if (!text.startsWith(prefix)) {
    const found = text.indexOf(`\n${prefix}`);
    if (found === -1) return null;
    start = found + 1;
  }
  const end = text.indexOf('\n', start);
  return text.slice(start, end === -1 ? undefined : end);
}

export function contractsFromData(store: ObjectStore): ContractReader {
  return {
    async byId(cut, id) {
      const key = await contractKey(cut, id);
      const file = await store.get(key);
      if (!file) return null;
      const line = lineOf(await file.text(), id);
      if (line === null) return null;
      let raw: unknown;
      try {
        raw = JSON.parse(line);
      } catch {
        throw new ContractDataUnavailable(`${key} has a line that is not JSON`);
      }
      const result = contractSchema.safeParse(raw);
      // The key only: the content of the line never goes to the logs.
      if (!result.success) throw new ContractDataUnavailable(`${key} fails the contract`);
      return result.data;
    },
  };
}
