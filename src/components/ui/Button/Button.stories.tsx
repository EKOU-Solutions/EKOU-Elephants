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
    'Ejecuta una acción en la pantalla actual. Para ir a otra página usa un enlace; si ese enlace es la acción principal de la vista (ver el registro en la fuente, volver a un destino), usa `href`: se renderiza como `<a>` con la misma forma. Con `external` abre otra pestaña y lo dice.',
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
export const IconOnly: Story = {
  name: 'Solo ícono (zoom del mapa)',
  args: { variant: 'secondary', label: 'Acercar', icon: <Icon name="plus" />, hideLabel: true },
  parameters: {
    docs: {
      description: {
        story:
          'Un cuadrado de 44 px sin texto visible: `label` pasa a ser el nombre accesible (`aria-label`). Úsalo solo cuando el ícono se entiende por su lugar, como el zoom de un mapa; si no, el texto va visible.',
      },
    },
  },
};
export const LinkExternal: Story = {
  name: 'Enlace externo con forma de botón',
  args: {
    label: 'Ver el registro en SECOP II',
    icon: undefined,
    href: 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index',
    external: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Con `href` es un `<a>`: lleva a otro lugar. `external` abre otra pestaña con `rel="noopener"`, agrega el ícono de enlace externo y el nombre accesible termina en «(abre en otra pestaña)».',
      },
    },
  },
};
export const LinkBack: Story = {
  name: 'Enlace interno (volver a un destino)',
  args: {
    variant: 'secondary',
    label: 'Pasto',
    icon: <Icon name="arrow-left" />,
    href: '/mapa/52001',
  },
  render: (args) => (
    <nav aria-label="Volver">
      <Button {...args} />
    </nav>
  ),
};
export const Truncated: Story = {
  name: 'Etiqueta recortada (miga del mapa a 320 px)',
  args: {
    variant: 'secondary',
    icon: undefined,
    truncate: true,
    label: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
  },
  render: (args) => (
    <div style={{ display: 'flex', maxWidth: 200 }}>
      <Button {...args} />
    </div>
  ),
};
