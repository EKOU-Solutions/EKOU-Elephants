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
export const Split: Story = {
  name: 'Reparto en tres partes (rubros)',
  args: {
    size: 'thick',
    separated: true,
    max: undefined,
    segments: [
      { value: 60910, tone: 'ink' },
      { value: 5688, tone: 'mid' },
      { value: 4422, tone: 'light' },
    ],
    label: 'Comprometido por rubro: inversión 86 %, deuda 8 %, funcionamiento 6 %',
  },
};
export const SplitWithLegend: Story = {
  name: 'Reparto con leyenda',
  render: () => (
    <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <ProgressBar
        size="thick"
        separated
        segments={[
          { value: 60910, tone: 'ink' },
          { value: 5688, tone: 'mid' },
          { value: 4422, tone: 'light' },
        ]}
        label="Comprometido por rubro: inversión 86 %, deuda 8 %, funcionamiento 6 %"
      />
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', margin: 0, fontSize: 14 }}>
        <span>
          <LegendKey kind="ink" /> Inversión · 86 %
        </span>
        <span>
          <LegendKey kind="inkMid" /> Pago de deuda · 8 %
        </span>
        <span>
          <LegendKey kind="inkLight" /> Funcionamiento · 6 %
        </span>
      </p>
    </div>
  ),
};
export const CommonScale: Story = {
  name: 'Escala común (pagado mayor que por pagar)',
  render: () => (
    <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <ProgressBar
        max={71020}
        segments={[{ value: 71020, tone: 'ink' }]}
        label="Comprometido: 71.020 millones"
      />
      <ProgressBar
        max={71020}
        segments={[{ value: 60000, tone: 'ink' }]}
        label="Por pagar: 60.000 millones"
      />
      <ProgressBar
        max={71020}
        segments={[{ value: 62801, tone: 'ink' }]}
        label="Pagado: 62.801 millones, más que por pagar; se muestra tal cual"
      />
    </div>
  ),
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
