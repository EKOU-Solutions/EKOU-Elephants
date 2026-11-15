import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { ProgressVsExpected } from './ProgressVsExpected';

const meta = {
  title: 'Componentes/Candidatos/Avance frente a lo esperado',
  component: ProgressVsExpected,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Progress vs expected',
    'Porcentaje pagado o ejecutado frente a la marca de lo esperado. Los dos porcentajes se escriben en texto. La marca roja es una excepción registrada (revisión de la Ronda 05). _Marcado armado a partir de `components.css`: las pantallas de ejemplo no lo incluían._',
  ),
  args: { progress: 35, expected: 80, label: 'Avance del pago' },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 100 } },
    expected: { control: { type: 'range', min: 0, max: 100 } },
  },
} satisfies Meta<typeof ProgressVsExpected>;

export default meta;
export const Behind: StoryObj<typeof meta> = { name: 'Atrasado' };
