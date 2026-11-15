import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs, LEVELS, RiskTag } from '../shared';

const meta = {
  title: 'Componentes/Núcleo/Etiqueta de riesgo',
  component: RiskTag,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Risk tag',
    'Nombra la categoría de un territorio, entidad o contrato. Va rellena con el color de riesgo y lleva un indicador de nivel (1, 2 o 3 barras) para que se entienda sin distinguir colores. **La categoría la calcula la metodología (TASK-07), nunca se elige a mano.** Normal: junto al nombre en listas, tablas y paneles. Grande: una sola vez, arriba de una ficha. Nunca «Seguro» ni «Limpio»; no debe parecer un botón.',
  ),
  args: { level: 'high', large: false },
  argTypes: { level: { control: 'inline-radio', options: LEVELS } },
} satisfies Meta<typeof RiskTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const High: Story = { name: 'Alto' };
export const Medium: Story = { name: 'Intermedio', args: { level: 'medium' } };
export const Low: Story = { name: 'Bajo', args: { level: 'low' } };
export const Unknown: Story = { name: 'Sin datos', args: { level: 'unknown' } };

export const AllLevels: Story = {
  name: 'Todos los niveles',
  render: () => (
    <div className="sb-el-stack">
      <div className="sb-el-row">
        {LEVELS.map((n) => (
          <RiskTag key={n} level={n} />
        ))}
      </div>
      <div className="sb-el-row">
        {LEVELS.map((n) => (
          <RiskTag key={n} level={n} large />
        ))}
      </div>
    </div>
  ),
};
