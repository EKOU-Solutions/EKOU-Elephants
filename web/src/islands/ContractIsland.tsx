import type { ContractDetailState } from '../../../src/modules/contracts/ui/ContractDetailPage/ContractDetailPage';
import { ContractScreen } from '../../../src/modules/contracts/ui/ContractScreen';

export interface ContractIslandProps {
  /** The state the server rendered, as JSON: Astro's own prop format tags every value. */
  state: string;
}

/**
 * The contract page as an island (ADR-0004): it hydrates what Astro rendered and adds what needs the
 * browser («Leer completo», copiar, compartir, volver, reintentar). The contract is not asked again.
 */
export function ContractIsland({ state }: ContractIslandProps) {
  return <ContractScreen initial={JSON.parse(state) as ContractDetailState} />;
}
