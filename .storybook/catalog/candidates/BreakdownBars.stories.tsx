import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { BreakdownBars } from './BreakdownBars';

const meta = {
  title: 'Componentes/Candidatos/Desglose en barras',
  component: BreakdownBars,
  tags: ['autodocs'],
  parameters: componentDocs('Breakdown bars', 'Ordena unos pocos conteos dentro de un panel. Datos y categorías de ejemplo.'),
  args: {
    items: [
      { label: 'Solo una empresa se presentó', value: 18 },
      { label: 'Costó más de lo firmado', value: 11 },
      { label: 'Obra con retraso', value: 9 },
    ],
  },
} satisfies Meta<typeof BreakdownBars>;

export default meta;
export const SignalsByType: StoryObj<typeof meta> = { name: 'Señales por tipo' };
