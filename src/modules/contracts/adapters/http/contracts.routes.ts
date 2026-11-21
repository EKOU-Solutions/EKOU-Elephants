import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { CONTRACT_ID, type ContractDetail } from '../../domain/contract';

const params = z.object({ id: z.string().max(40).regex(CONTRACT_ID) });

// Cut data changes once a month: short cache, long revalidation (contract.md).
const CACHE_CUT = 'public, max-age=300, stale-while-revalidate=86400';

export interface ContractUseCases {
  getContractDetail: (id: string) => Promise<ContractDetail>;
}

export function contractsRoutes(useCases: ContractUseCases) {
  return new Hono().get(
    '/:id',
    zValidator('param', params, (result, c) => {
      if (!result.success) return c.json({ error: 'invalid_contract_id' }, 400);
    }),
    async (c) => {
      const contract = await useCases.getContractDetail(c.req.valid('param').id);
      c.header('Cache-Control', CACHE_CUT);
      return c.json(contract);
    },
  );
}
