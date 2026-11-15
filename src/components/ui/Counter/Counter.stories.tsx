import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Counter } from './Counter';

const meta = {
  title: 'Componentes/UI/Contador',
  component: Counter,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Counter',
    'Un número grande con su nombre debajo. Distingue tipos de señal de contratos: un contrato puede tener varias. Evita un número suelto en un círculo de color. Datos ficticios.',
    'src/components/ui/Counter/',
  ),
  args: {
    counts: [
      { value: 120, label: 'Contratos analizados' },
      { value: 36, label: 'Con señales', withKey: true },
      { value: 3, label: 'Tipos de señal' },
      { value: 30, label: 'Sin analizar' },
    ],
  },
} satisfies Meta<typeof Counter>;

export default meta;
export const Summary: StoryObj<typeof meta> = { name: 'Resumen' };
