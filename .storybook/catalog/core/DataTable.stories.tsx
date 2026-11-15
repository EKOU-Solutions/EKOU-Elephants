import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { DataTable } from './DataTable';

const meta = {
  title: 'Componentes/Núcleo/Tabla de datos',
  component: DataTable,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Data table',
    'Para comparar y verificar: el camino de periodistas y veedurías, y la alternativa accesible a cada mapa o gráfico. Números a la derecha con dígitos tabulares; cuadro de categoría junto al nombre, nunca fondo de color en la fila. En el celular se desplaza la tabla o se quitan columnas opcionales; nunca se encoge el texto.',
  ),
  args: { caption: 'Departamentos con mayor proporción de contratos con señales · datos ficticios', rows: 5 },
  argTypes: { rows: { control: { type: 'range', min: 1, max: 30 } } },
} satisfies Meta<typeof DataTable>;

export default meta;
export const Ranking: StoryObj<typeof meta> = {};
