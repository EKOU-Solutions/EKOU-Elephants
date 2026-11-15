import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { LegendKey, type LegendKeyKind } from './LegendKey';

const KINDS: [LegendKeyKind, string][] = [
  ['low', 'Riesgo bajo'],
  ['medium', 'Riesgo intermedio'],
  ['high', 'Riesgo alto'],
  ['unknown', 'Sin datos suficientes'],
  ['flagged', 'Con señales'],
  ['clean', 'Sin señales'],
];

const meta = {
  title: 'Componentes/UI/Clave de leyenda',
  component: LegendKey,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Legend key',
    'Cuadro de color que acompaña un texto en leyendas, tablas y contadores. Es decorativo: el texto lleva el significado. Los conteos de contratos con y sin señales van en tinta, nunca en el rojo de riesgo.',
    'src/components/ui/LegendKey/',
  ),
  args: { kind: 'high' },
  argTypes: { kind: { control: 'inline-radio', options: KINDS.map(([k]) => k) } },
} satisfies Meta<typeof LegendKey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const High: Story = { name: 'Riesgo alto' };
export const AllKinds: Story = {
  name: 'Todas las claves',
  render: () => (
    <ul className="sb-el-stack" style={{ listStyle: 'none', padding: 0 }}>
      {KINDS.map(([kind, label]) => (
        <li key={kind} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LegendKey kind={kind} />
          {label}
        </li>
      ))}
    </ul>
  ),
};
