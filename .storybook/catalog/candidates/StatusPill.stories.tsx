import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { StatusPill } from './StatusPill';

const meta = {
  title: 'Componentes/Candidatos/Estado',
  component: StatusPill,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Status pill',
    'Estado neutro del proceso de un contrato. **No es un nivel de riesgo**: no lleva color de riesgo.',
  ),
  args: { label: '8 meses de retraso' },
} satisfies Meta<typeof StatusPill>;

export default meta;
export const Delayed: StoryObj<typeof meta> = { name: 'Retraso' };
export const InProgress: StoryObj<typeof meta> = {
  name: 'En ejecución',
  args: { label: 'En ejecución' },
};
