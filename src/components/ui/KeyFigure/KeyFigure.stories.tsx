import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs, FIXTURE } from '../../../../.storybook/catalog/shared';
import { KeyFigure } from './KeyFigure';

const meta = {
  title: 'Componentes/UI/KeyFigure',
  component: KeyFigure,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Key figure',
    'Un número grande que se entiende solo: qué mide, de cuánto y de dónde sale. Muestra numerador y denominador («36 de 120») y la fuente debajo. No se pinta con el color de riesgo ni se presenta como probabilidad de corrupción. Las reglas de formato están en **Fundamentos › Formato de datos**.',
    'src/components/ui/KeyFigure/',
  ),
  args: {
    label: 'Contratos con señales',
    part: FIXTURE['flagged-contracts'],
    total: FIXTURE['analyzed-contracts'],
    context: '{part} de {total} contratos analizados tienen al menos una señal.',
    source: 'SECOP II · 2025 · datos ficticios',
  },
} satisfies Meta<typeof KeyFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FlaggedContracts: Story = { name: 'Contratos con señales' };
export const Coverage: Story = {
  name: 'Cobertura del análisis',
  args: {
    label: 'Cobertura del análisis',
    part: FIXTURE['analyzed-contracts'],
    total: FIXTURE['available-contracts'],
    context: 'Analizamos {part} de {total} contratos disponibles.',
  },
};
export const NoData: Story = {
  name: 'Sin datos (no es cero)',
  args: { part: 0, total: 0, context: 'Aún no hay contratos analizados en este periodo.' },
};
