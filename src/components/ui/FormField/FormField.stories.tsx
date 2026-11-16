import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { FormField } from './FormField';

const meta = {
  title: 'Componentes/UI/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: componentDocs(
    'FormField',
    'Base de los campos (`Input`, `Select`): pone la etiqueta, la ayuda o el error y los liga al control con `aria-describedby` y `aria-invalid`. No se usa sola en las páginas: sirve para crear un campo nuevo (por ejemplo, un área de texto) sin repetir esa lógica. El control llega por composición y recibe `id`, la clase y los atributos `aria-*`.',
    'src/components/ui/FormField/',
  ),
  args: {
    label: 'Comentario',
    help: 'Ejemplo de un campo nuevo construido sobre la base.',
    children: (control) => <textarea rows={3} {...control} />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomControl: Story = { name: 'Con un control propio' };
export const WithError: Story = {
  name: 'Con error',
  args: { help: undefined, error: 'Escribe al menos 10 caracteres.' },
};
