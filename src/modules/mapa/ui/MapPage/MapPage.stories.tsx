import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { MapRoute } from '../mapModel';
import { fictionalLevel, sampleMap } from '../sample';
import { MapPage, type MapPageProps } from './MapPage';

/** The page with the real sample; navigating changes the view in place, as in the app. */
function Page({
  initial,
  fictional = false,
  state,
}: {
  initial: MapRoute;
  fictional?: boolean;
  state?: MapPageProps['state'];
}) {
  const [route, setRoute] = useState(initial);
  return (
    <MapPage
      state={state ?? { status: 'ready', map: sampleMap }}
      route={route}
      onNavigate={setRoute}
      onRetry={() => {}}
      fictionalLevel={fictional ? fictionalLevel : undefined}
    />
  );
}

const meta = {
  title: 'Pantallas/MapPage',
  component: MapPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Página del Mapa (TASK-09), aprobada el 2026-11-15. Responde «¿Dónde se firmaron los contratos públicos de Colombia, y cuántos hay en mi departamento o municipio?». Tres vistas: Colombia (`/mapa`), un departamento (`/mapa/departamento/05`) y un municipio (`/mapa/05001`).',
          '',
          'Datos: muestra real del corte 2026-11 (datos al 7 nov 2026), con la forma del contrato de la API (`docs/design/pages/map/contract.md`). Especificación: `docs/design/pages/map/spec.md`.',
          '',
          'La vista real es neutra: el corte no trae riesgo. La historia «Vista previa de la fase 2» pinta niveles **ficticios** y lo dice en cada lugar; la app nunca la muestra hasta que exista la metodología (TASK-07).',
        ].join('\n'),
      },
    },
  },
  args: { state: { status: 'loading' }, route: { view: 'country' }, onNavigate: () => {} },
} satisfies Meta<typeof MapPage>;

export default meta;
type Story = StoryObj<MapPageProps>;

export const Country: Story = {
  name: 'Colombia',
  render: () => <Page initial={{ view: 'country' }} />,
};
export const Department: Story = {
  name: 'Departamento con «Sin datos» (Guainía)',
  render: () => <Page initial={{ view: 'department', code: '94' }} />,
};
export const Municipality: Story = {
  name: 'Municipio (Medellín)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} />,
};
export const MunicipalityNoData: Story = {
  name: 'Municipio sin datos (Puerto Colombia, Guainía)',
  render: () => <Page initial={{ view: 'municipality', code: '94884' }} />,
};
export const Bogota: Story = {
  name: 'Bogotá, D.C.',
  render: () => <Page initial={{ view: 'municipality', code: '11001' }} />,
};
export const Archipelago: Story = {
  name: 'San Andrés y Providencia',
  render: () => <Page initial={{ view: 'department', code: '88' }} />,
};
export const Loading: Story = {
  name: 'Cargando',
  render: () => <Page initial={{ view: 'country' }} state={{ status: 'loading' }} />,
};
export const Unavailable: Story = {
  name: 'Datos no disponibles (503)',
  render: () => <Page initial={{ view: 'country' }} state={{ status: 'unavailable' }} />,
};
export const InvalidLink: Story = {
  name: 'Enlace que no corresponde a un municipio',
  render: () => <Page initial={{ view: 'municipality', code: '99999' }} />,
};
export const FictionalPreview: Story = {
  name: 'Vista previa de la fase 2 (riesgo ficticio)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} fictional />,
};
export const Phone: Story = {
  name: 'Celular (390 px)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} />,
  globals: { viewport: { value: 'mobile2' } },
};
