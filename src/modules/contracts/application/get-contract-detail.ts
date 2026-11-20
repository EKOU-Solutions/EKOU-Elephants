import { type ContractDetail, ContractNotFound } from '../domain/contract';
import type { ContractReader } from './ports/contract-reader';

/** `currentCut` answers which monthly cut is published ("AAAA-MM"); it rejects if there is none. */
export function getContractDetail(reader: ContractReader, currentCut: () => Promise<string>) {
  return async (id: string): Promise<ContractDetail> => {
    const cut = await currentCut();
    const contract = await reader.byId(cut, id);
    if (!contract) throw new ContractNotFound(id);
    return { ...contract, cut };
  };
}
