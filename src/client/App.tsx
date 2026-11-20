import { ContractScreen } from '../modules/contracts/ui/ContractScreen';
import type { MapPageState } from '../modules/mapa/ui/MapPage/MapPage';
import { MapScreen } from '../modules/mapa/ui/MapScreen';

/** One page per address: a contract at `/contratos/{id}` (TASK-12); everything else is the map (TASK-09). */
export function App({ initial, query }: { initial?: MapPageState; query?: string }) {
  if (window.location.pathname.startsWith('/contratos')) return <ContractScreen />;
  return <MapScreen initial={initial} initialQuery={query} />;
}
