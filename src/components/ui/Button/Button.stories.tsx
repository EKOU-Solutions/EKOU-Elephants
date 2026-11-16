import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon/Icon';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Button } from './Button';

const meta = {
  title: 'Componentes/UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Button',
    'Ejecuta una acción en la pantalla actual. Para ir a otra página usa un enlace.',
    'src/components/ui/Button/',
  ),
  args: { variant: 'primary', label: 'Consultar contratos', icon: <Icon name="search" /> },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'text'] },
    // The icon is a React element; the control offers a few Lucide examples by name.
    icon: {
      control: 'select',
      options: ['Ninguno', 'Search', 'Download'],
      mapping: {
        Ninguno: undefined,
        Search: <Icon name="search" />,
        Download: <Icon name="download" />,
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { name: 'Principal' };
export const Secondary: Story = {
  name: 'Secundario',
  args: { variant: 'secondary', label: 'Limpiar filtros', icon: undefined },
};
export const Text: Story = {
  name: 'Texto',
  args: { variant: 'text', label: 'Cómo se calcula', icon: undefined },
};
export const WithDownloadIcon: Story = {
  name: 'Con otro ícono',
  args: { variant: 'secondary', label: 'Descargar CSV', icon: <Icon name="download" /> },
};
export const Disabled: Story = {
  name: 'Deshabilitado, con el motivo',
  args: { disabled: true, icon: undefined, 'aria-describedby': 'consultar-motivo' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--el-space-8)', justifyItems: 'start' }}>
      <Button {...args} />
      <p id="consultar-motivo" style={{ fontSize: 14, color: 'var(--el-color-text-muted)' }}>
        Elige un departamento para consultar.
      </p>
    </div>
  ),
};
export const Loading: Story = {
  name: 'Cargando',
  args: { loading: true, loadingLabel: 'Consultando contratos…' },
};
export const LoadingDownload: Story = {
  name: 'Cargando · descarga',
  args: {
    variant: 'secondary',
    label: 'Descargar CSV',
    loading: true,
    loadingLabel: 'Descargando CSV…',
    icon: undefined,
  },
};
