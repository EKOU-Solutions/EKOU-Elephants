import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { Button } from './Button';

const meta = {
  title: 'Componentes/Núcleo/Botón',
  component: Button,
  tags: ['autodocs'],
  parameters: componentDocs('Button', 'Ejecuta una acción en la pantalla actual. Para ir a otra página usa un enlace.'),
  args: { variant: 'primary', label: 'Consultar contratos', withIcon: true },
  argTypes: { variant: { control: 'inline-radio', options: ['primary', 'secondary', 'text'] } },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { name: 'Principal' };
export const Secondary: Story = { name: 'Secundario', args: { variant: 'secondary', label: 'Limpiar filtros', withIcon: false } };
export const Text: Story = { name: 'Texto', args: { variant: 'text', label: 'Cómo se calcula', withIcon: false } };
export const Disabled: Story = { name: 'Deshabilitado', args: { disabled: true, withIcon: false } };
export const Loading: Story = { name: 'Cargando', args: { loading: true } };
