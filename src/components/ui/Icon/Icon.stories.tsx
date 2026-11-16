import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Icon } from './Icon';
import { ICON_NAMES } from './icons';

const meta = {
  title: 'Componentes/UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Icon',
    'Dibuja un ícono del conjunto aprobado por su nombre: `<Icon name="search" />`. Nadie importa el proveedor de íconos: quién dibuja cada nombre (hoy Lucide 0.468.0, o un SVG propio) se decide solo en `src/components/ui/Icon/icons.ts`, así que cambiar de proveedor o agregar un ícono propio no obliga a tocar las pantallas. Trazo de 2 px. Acompaña una palabra: es decorativo por defecto (`aria-hidden`); si va solo, recibe `label`, que se vuelve su nombre accesible. El conjunto completo está en **Fundamentos/Íconos**.',
    'src/components/ui/Icon/',
  ),
  args: { name: 'search', size: 20 },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: 'inline-radio', options: [16, 18, 20, 24] },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  name: 'Decorativo (junto a texto)',
  render: (args) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--el-space-8)' }}>
      <Icon {...args} />
      Buscar contratos
    </span>
  ),
  parameters: {
    docs: {
      source: {
        code: '<Icon name="search" />\nBuscar contratos',
        language: 'tsx',
      },
    },
  },
};
export const InAlert: Story = {
  name: 'En una alerta · 24 px',
  args: { name: 'triangle-alert', size: 24 },
};
export const WithLabel: Story = {
  name: 'Solo, con nombre accesible',
  args: { name: 'x', label: 'Cerrar' },
};
