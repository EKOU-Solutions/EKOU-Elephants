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
export const Count: Story = {
  name: 'Cantidad (municipio)',
  args: {
    label: undefined,
    part: undefined,
    total: undefined,
    value: 356935,
    context: 'contratos firmados del 1 ene 2021 al 7 nov 2026 y ubicados en Medellín',
    source:
      'Fuentes: SECOP II y SECOP I (Colombia Compra Eficiente), DIVIPOLA y Marco Geoestadístico 2025 (DANE). Datos al 7 nov 2026.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Un conteo sin etiqueta encima: la frase de abajo nombra lo que se cuenta. Corte 2026-11, datos reales.',
      },
    },
  },
};
export const CountNoData: Story = {
  name: 'Cantidad sin datos',
  args: {
    label: undefined,
    part: undefined,
    total: undefined,
    value: null,
    context:
      'No encontramos contratos ubicados con certeza en este lugar del 1 ene 2021 al 7 nov 2026.',
    source: 'Fuentes: SECOP II y SECOP I, DIVIPOLA y MGN 2025 (DANE). Datos al 7 nov 2026.',
  },
  parameters: {
    docs: {
      description: { story: '`null` es «Sin datos» con la trama gris, nunca 0.' },
    },
  },
};
