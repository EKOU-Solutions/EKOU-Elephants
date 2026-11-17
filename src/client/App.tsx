import type { MapPageState } from '../modules/mapa/ui/MapPage/MapPage';
import { MapScreen } from '../modules/mapa/ui/MapScreen';

/** The app has one page for now: the map (TASK-09). */
export function App({ initial }: { initial?: MapPageState }) {
  return <MapScreen initial={initial} />;
}
