import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { Field } from './Field';

const meta = {
  title: 'Componentes/Núcleo/Campo de formulario',
  component: Field,
  tags: ['autodocs'],
  parameters: componentDocs('Field', 'Recoge un dato para filtrar o buscar. Siempre con etiqueta visible. Evita «Dato inválido» sin explicación.'),
  args: {
    label: 'Departamento',
    kind: 'select',
    options: ['Selecciona un departamento', 'Antioquia', 'Arauca'],
    help: 'El filtro se aplica a toda la consulta.',
  },
  argTypes: { kind: { control: 'inline-radio', options: ['input', 'select'] } },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectWithHelp: Story = { name: 'Lista con ayuda' };
export const WithError: Story = {
  name: 'Con error',
  args: { label: 'Año', kind: 'input', value: '20255', help: undefined, error: 'Escribe un año de 4 dígitos, por ejemplo 2025.' },
};
