import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { SignalList } from './SignalList';

const meta = {
  title: 'Componentes/Candidatos/SignalList',
  component: SignalList,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Signal item',
    'Una señal numerada con un título corto y el hecho que la sustenta. **Una señal, no un veredicto**: nunca «corrupción», «robo» ni «sospechoso». Datos ficticios.',
  ),
  args: {
    signals: [
      {
        title: 'Solo una empresa se presentó',
        fact: 'Nadie más compitió por este contrato de $ 2.300 millones.',
      },
      {
        title: 'Ya cuesta 40% más de lo firmado',
        fact: 'Dos adiciones sumaron $ 920 millones en 10 meses.',
      },
      {
        title: 'Lleva 8 meses de retraso',
        fact: 'Debía entregarse en marzo de 2025 y sigue en ejecución.',
      },
    ],
  },
} satisfies Meta<typeof SignalList>;

export default meta;
export const ContractSignals: StoryObj<typeof meta> = { name: 'Señales de un contrato' };
