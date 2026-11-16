import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Input } from './Input';

const meta = {
  title: 'Componentes/UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Input',
    'Campo de texto: recoge un dato escrito para filtrar o buscar. Siempre con etiqueta visible. Evita «Dato inválido» sin explicación. Se construye sobre `FormField`.',
    'src/components/ui/Input/',
  ),
  args: {
    label: 'Entidad',
    help: 'Escribe el nombre o parte de él, por ejemplo «Gobernación».',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHelp: Story = { name: 'Con ayuda' };
export const Numeric: Story = {
  name: 'Numérico',
  args: { label: 'Año', inputMode: 'numeric', help: 'Por ejemplo, 2025.' },
};
export const WithError: Story = {
  name: 'Con error',
  args: {
    label: 'Año',
    defaultValue: '20255',
    inputMode: 'numeric',
    help: undefined,
    error: 'Escribe un año de 4 dígitos, por ejemplo 2025.',
  },
};
