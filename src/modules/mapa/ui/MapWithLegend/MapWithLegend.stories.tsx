import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { departmentRoute, type MapRoute, mapView } from '../mapModel';
import { fictionalLevel, sampleMap } from '../sample';
import { MapLegend, MapWithLegend, type MapWithLegendProps } from './MapWithLegend';

const NEUTRAL_NOTE = 'Todavía no hay color por riesgo. Gris no quiere decir «sin problemas».';
const FICTIONAL_NOTE =
  'Vista previa de la fase 2: los niveles de riesgo son inventados para mostrar el diseño. Las cifras de contratos sí son reales. El dato de riesgo llegará con la metodología (TASK-07).';
const ARCHIPELAGO_NOTE =
  'San Andrés y Providencia están a unos 90 km. En el mapa se acercan para verlas juntas a la misma escala, sin cambiar su forma.';

function legendFor(risk: boolean, withUnknown: boolean, extra: string[] = []) {
  return risk ? (
    <MapLegend
      title="Contratos con señales · datos ficticios"
      items={[
        { fill: 'low', label: 'Bajo' },
        { fill: 'medium', label: 'Intermedio' },
        { fill: 'high', label: 'Alto' },
        ...(withUnknown ? [{ fill: 'unknown' as const, label: 'Sin datos' }] : []),
      ]}
      notes={[FICTIONAL_NOTE, ...extra]}
    />
  ) : (
    <MapLegend
      title="Qué muestra el mapa"
      items={[
        { fill: 'neutral', label: 'Territorio con contratos ubicados' },
        ...(withUnknown
          ? [
              {
                fill: 'unknown' as const,
                label: 'Sin datos: no hay contratos ubicados con certeza',
              },
            ]
          : []),
      ]}
      notes={[NEUTRAL_NOTE, ...extra]}
    />
  );
}

/** A map view built like the page builds it, from the real sample. */
function View({ route, risk }: { route: MapRoute; risk: boolean }) {
  const [current, setCurrent] = useState(route);
  const view = mapView(sampleMap, current, risk ? fictionalLevel : undefined);
  const onSelect = (code: string) =>
    setCurrent(current.view === 'country' ? departmentRoute(code) : { view: 'municipality', code });
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <MapWithLegend {...view} onSelect={onSelect} />
      {legendFor(risk, view.withUnknown, view.archipelago ? [ARCHIPELAGO_NOTE] : [])}
    </div>
  );
}

const meta = {
  title: 'Componentes/Mapa/MapWithLegend',
  component: MapWithLegend,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Mapa de territorios con su leyenda (`MapLegend`). **Para qué sirve:** ubicar un lugar y elegirlo; en la fase 2, ver dónde se concentran las señales. Nació en la página del Mapa (TASK-09, guía v1.3.0).',
          '',
          '**Variantes.** *Neutra:* un solo relleno (`--el-color-line`) que ubica sin medir nada; es la de hoy, porque el corte todavía no trae riesgo. *Riesgo:* rellenos bajo / intermedio / alto de la guía; aquí solo con niveles **ficticios** hasta TASK-07. *Sin datos:* trama gris, nunca 0 ni riesgo bajo.',
          '',
          '**Cómo se usa.** Zoom con + y − (44 px, con nombre accesible); «Ver todo» aparece solo cuando el mapa está acercado o movido, y al usarlo el foco pasa a «Acercar», Ctrl + rueda o pellizco. Con mouse se arrastra a cualquier zoom; un clic sin mover elige. Con un dedo, a vista completa, la página sigue desplazándose. El territorio bajo el puntero se dibuja encima para que su borde no quede cortado; el elegido lleva contorno de 2,5 px en el color del texto.',
          '',
          '**Accesibilidad.** Es un `<svg role="img">` con un título que dice dónde están los valores: **siempre** va con una tabla de datos, que es la ruta de teclado a cada territorio. Nada depende del hover ni del color solo.',
          '',
          '**Evita:** pintar el riesgo sin metodología, usar opacidad para el hover, nombres de departamento sobre el mapa (solo el elegido, el recuadro y Bogotá). Muestra real del corte 2026-11.',
        ].join('\n'),
      },
    },
  },
  args: { title: '', territories: [], box: [0, 0, 1, 1] },
} satisfies Meta<typeof MapWithLegend>;

export default meta;
type Story = StoryObj<MapWithLegendProps>;

export const CountryNeutral: Story = {
  name: 'Nacional · neutro',
  render: () => <View route={{ view: 'country' }} risk={false} />,
};
export const CountryFictionalRisk: Story = {
  name: 'Nacional · riesgo ficticio',
  render: () => <View route={{ view: 'country' }} risk />,
};
export const DepartmentNoData: Story = {
  name: 'Departamento con «Sin datos» (Guainía)',
  render: () => <View route={{ view: 'department', code: '94' }} risk={false} />,
};
export const MunicipalitySelected: Story = {
  name: 'Municipio elegido (Medellín)',
  render: () => <View route={{ view: 'municipality', code: '05001' }} risk={false} />,
};
export const BogotaInItsGap: Story = {
  name: 'Cundinamarca con Bogotá en su hueco',
  render: () => <View route={{ view: 'department', code: '25' }} risk={false} />,
};
export const Archipelago: Story = {
  name: 'Archipiélago en un panel a la misma escala',
  render: () => <View route={{ view: 'department', code: '88' }} risk={false} />,
};
export const MunicipalitiesFictionalRisk: Story = {
  name: 'Municipios · riesgo ficticio (Antioquia)',
  render: () => <View route={{ view: 'municipality', code: '05001' }} risk />,
};
export const Narrow: Story = {
  name: 'Celular de 320 px',
  render: () => (
    <div style={{ width: 288 }}>
      <View route={{ view: 'municipality', code: '05001' }} risk={false} />
    </div>
  ),
};
