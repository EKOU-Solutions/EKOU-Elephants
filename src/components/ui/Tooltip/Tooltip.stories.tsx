import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Componentes/UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Tooltip',
    'Nombra lo que señala el puntero, pegado a él: el nombre y, debajo, la cifra. Solo para mouse y sin nada que solo él diga: las mismas cifras están en la tabla del mapa. Se voltea a la izquierda cerca del borde.',
    'src/components/ui/Tooltip/',
  ),
  args: { title: 'San Andrés', detail: '1.361 contratos' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

function Frame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 170,
        maxWidth: width,
        background: 'var(--el-color-surface-subtle)',
        border: '1px solid var(--el-color-line)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

const shape = (left: number) => (
  <div
    style={{
      position: 'absolute',
      left,
      top: 40,
      width: 110,
      height: 70,
      background: 'var(--el-color-unknown-surface)',
      border: '2px solid var(--el-color-text)',
    }}
  />
);

export const Default: Story = {
  name: 'Nombre y cifra',
  render: (args) => (
    <Frame width={520}>
      {shape(40)}
      <Tooltip {...args} x={110} y={80} parentWidth={520} />
    </Frame>
  ),
};

export const NoData: Story = {
  name: 'Sin datos',
  args: { title: 'Ariguaní', detail: 'Sin datos' },
  render: (args) => (
    <Frame width={520}>
      {shape(40)}
      <Tooltip {...args} x={110} y={80} parentWidth={520} />
    </Frame>
  ),
};

export const NameOnly: Story = {
  name: 'Solo nombre (departamento)',
  args: { title: 'Magdalena', detail: undefined },
  render: (args) => (
    <Frame width={520}>
      {shape(40)}
      <Tooltip {...args} x={110} y={80} parentWidth={520} />
    </Frame>
  ),
};

export const NearEdge: Story = {
  name: 'Cerca del borde (se voltea)',
  args: { title: 'San Sebastián de Buenavista', detail: '2.530 contratos' },
  render: (args) => (
    <Frame width={280}>
      {shape(150)}
      <Tooltip {...args} x={220} y={80} parentWidth={280} />
    </Frame>
  ),
};
