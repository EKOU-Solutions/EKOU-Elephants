import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { formatNumber } from '../format';
import { LegendKey } from '../LegendKey/LegendKey';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Componentes/UI/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Progress bar',
    'Barra horizontal que se llena por tramos: cuánto llena cada tramo y de qué color. Es la misma barra del desglose (un tramo) y de la cobertura (con señales / sin señales / sin analizar). No trae leyenda ni números: quien la usa los escribe en texto al lado, con `LegendKey` si hace falta. Las señales van en tinta, nunca en el rojo de riesgo; lo que falta va con la trama gris. Datos ficticios.',
    'src/components/ui/ProgressBar/',
  ),
  args: { segments: [{ value: 11, tone: 'ink' }], max: 18 },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = { name: 'Un tramo (desglose)' };
export const Segments: Story = {
  name: 'Varios tramos (cobertura)',
  args: {
    size: 'thick',
    max: undefined,
    segments: [
      { value: 36, tone: 'ink' },
      { value: 84, tone: 'line' },
      { value: 30, tone: 'unknown' },
    ],
    label: 'De 150 contratos: 36 con señales, 84 sin señales, 30 sin analizar',
  },
};
export const Empty: Story = {
  name: 'Vacía',
  args: { segments: [{ value: 0, tone: 'ink' }], max: 0 },
};

const coverage = { flagged: 36, clean: 84, missing: 30 };
/** How a page composes the bar with its own legend; the legend is not part of the component. */
export const WithLegend: Story = {
  name: 'Uso: cobertura con su leyenda',
  args: Segments.args,
  render: (args) => (
    <div>
      <ProgressBar {...args} />
      <p
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 14px',
          marginTop: 'var(--el-space-8)',
        }}
      >
        <span>
          <LegendKey kind="flagged" /> {formatNumber(coverage.flagged, 0)} con señales
        </span>
        <span>
          <LegendKey kind="clean" /> {formatNumber(coverage.clean, 0)} sin señales
        </span>
        <span>
          <LegendKey kind="unknown" /> {formatNumber(coverage.missing, 0)} sin analizar
        </span>
      </p>
    </div>
  ),
};
