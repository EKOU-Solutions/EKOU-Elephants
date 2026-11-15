import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { CoverageBar } from './CoverageBar';

const meta = {
  title: 'Componentes/Candidatos/Barra de cobertura',
  component: CoverageBar,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Coverage bar',
    'Muestra con señales / analizados sin señales / sin analizar sobre el total, para que los datos faltantes se vean. Datos ficticios.',
  ),
  args: { flagged: 36, clean: 84, missing: 30 },
} satisfies Meta<typeof CoverageBar>;

export default meta;
export const Partial: StoryObj<typeof meta> = { name: 'Cobertura parcial' };
