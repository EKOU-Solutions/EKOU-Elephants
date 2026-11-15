import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { ActiveFilter } from './ActiveFilter';

const meta = {
  title: 'Componentes/UI/Filtro activo',
  component: ActiveFilter,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Active filter',
    'Muestra un filtro aplicado y permite quitarlo con un toque. Anuncia el cambio al quitarlo.',
    'src/components/ui/ActiveFilter/',
  ),
  args: { value: 'Antioquia' },
} satisfies Meta<typeof ActiveFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Department: Story = { name: 'Departamento' };
export const Group: Story = {
  name: 'Grupo',
  render: () => (
    <div className="sb-el-row">
      <ActiveFilter value="Antioquia" />
      <ActiveFilter value="2025" accessibleName="Quitar filtro: año 2025" />
    </div>
  ),
};
