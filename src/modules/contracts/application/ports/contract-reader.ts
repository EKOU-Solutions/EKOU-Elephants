import type { ContractRecord } from '../../domain/contract';

/** Output port: where the published contracts live (the data Worker in production). */
export interface ContractReader {
  /** The contract `id` of the cut `cut`, or null if that cut does not have it. */
  byId(cut: string, id: string): Promise<ContractRecord | null>;
}
