// Stories only: the real sample of the map contract (cut 2026-11, data to 7 Nov 2026), versioned with
// the page design in docs/design/pages/map/sample/. The app reads the same shapes from the API.
import cutText from '../../../../docs/design/pages/map/sample/corte.json?raw';
import departmentsText from '../../../../docs/design/pages/map/sample/departamentos.json?raw';
import topologyText from '../../../../docs/design/pages/map/sample/mgn-2025.topojson?raw';
import municipalitiesText from '../../../../docs/design/pages/map/sample/municipios.json?raw';
import type { TopoJson } from './geometry';
import { type MapData, prepareMap } from './mapModel';

export const sampleData: MapData = {
  cut: JSON.parse(cutText),
  departments: JSON.parse(departmentsText),
  municipalities: JSON.parse(municipalitiesText),
  topology: JSON.parse(topologyText) as TopoJson,
};

export const sampleMap = prepareMap(sampleData);

/**
 * INVENTED risk level, stable per code: only to show the phase 2 design (no risk data exists until
 * TASK-07). Every place that shows it must say «(ficticio)».
 */
export function fictionalLevel(code: string): 'low' | 'medium' | 'high' {
  let h = 7;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return (['low', 'medium', 'high'] as const)[h % 3] ?? 'low';
}
