import { describe, expect, it } from 'vitest';
import { ContractNotFound, type ContractRecord } from '../domain/contract';
import { getContractDetail } from './get-contract-detail';

const contract = { id: 'CO1.PCCNTR.7954915' } as ContractRecord;

describe('getContractDetail', () => {
  it('returns the contract with the cut it was read from', async () => {
    const asked: string[] = [];
    const get = getContractDetail(
      {
        byId: async (cut, id) => {
          asked.push(`${cut}/${id}`);
          return contract;
        },
      },
      async () => '2026-11',
    );
    await expect(get(contract.id)).resolves.toEqual({ ...contract, cut: '2026-11' });
    expect(asked).toEqual(['2026-11/CO1.PCCNTR.7954915']);
  });

  it('throws ContractNotFound when the cut does not have it', async () => {
    const get = getContractDetail({ byId: async () => null }, async () => '2026-11');
    await expect(get('CO1.PCCNTR.1')).rejects.toBeInstanceOf(ContractNotFound);
  });
});
