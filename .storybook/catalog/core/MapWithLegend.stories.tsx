import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs, TERRITORIES } from '../shared';
import { MapWithLegend } from './MapWithLegend';

const meta = {
  title: 'Componentes/Núcleo/Mapa con leyenda',
  component: MapWithLegend,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Map with legend',
    'Colorea cada territorio según la proporción de contratos con señales. La leyenda dice qué mide el color; la selección se marca con contorno y se detalla en una ficha. Bordes entre territorios del color de la superficie; sin análisis, trama gris. **Siempre** una tabla equivalente y un selector nativo de territorio; nunca depender del hover. En oscuro el orden claro→oscuro se invierte para que el riesgo alto sea el más visible.',
  ),
  args: { selected: 'CO-ANT' },
  argTypes: {
    selected: {
      control: 'select',
      options: TERRITORIES.map((t) => t.id),
      labels: Object.fromEntries(TERRITORIES.map((t) => [t.id, t.name])),
    },
  },
} satisfies Meta<typeof MapWithLegend>;

export default meta;
export const AntioquiaSelected: StoryObj<typeof meta> = { name: 'Antioquia seleccionado' };
