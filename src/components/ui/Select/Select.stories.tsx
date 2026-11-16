import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Select } from './Select';

const meta = {
  title: 'Componentes/UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Select',
    'Lista: elige un valor de una lista corta y conocida (menos de ~15 opciones) para filtrar. Si son más, usa un buscador con sugerencias. Se construye sobre `FormField`.',
    'src/components/ui/Select/',
  ),
  args: {
    label: 'Departamento',
    options: [
      { value: '', label: 'Selecciona un departamento' },
      { value: '05', label: 'Antioquia' },
      { value: '81', label: 'Arauca' },
    ],
    help: 'El filtro se aplica a toda la consulta.',
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHelp: Story = { name: 'Con ayuda' };
export const WithError: Story = {
  name: 'Con error',
  args: { help: undefined, error: 'Elige un departamento para ver sus contratos.' },
};
