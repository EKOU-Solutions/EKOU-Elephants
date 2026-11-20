import { ContractScreen } from '../modules/contracts/ui/ContractScreen';
import { MapScreen } from '../modules/mapa/ui/MapScreen';

/** One page per address: a contract at `/contratos/{id}` (TASK-12); everything else is the map (TASK-09). */
export function App() {
  return window.location.pathname.startsWith('/contratos') ? <ContractScreen /> : <MapScreen />;
}
