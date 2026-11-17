import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs, levelOf, TERRITORIES } from '../../../../.storybook/catalog/shared';
import { formatNumber } from '../format';
import { LegendKey } from '../LegendKey/LegendKey';
import { DataTable, type DataTableRow } from './DataTable';

const percent = (part: number, total: number, decimals = 1) =>
  `${formatNumber((100 * part) / total, decimals)}%`;

/** Fictional ranking: departments with the highest share of flagged contracts. */
const analyzed = TERRITORIES.flatMap((t) =>
  t.analyzed && t.flagged !== null ? [{ ...t, flagged: t.flagged }] : [],
);

const rankingRows = (count: number): DataTableRow[] =>
  analyzed
    .sort((a, b) => b.flagged / b.analyzed - a.flagged / a.analyzed)
    .slice(0, count)
    .map((t) => ({
      id: t.id,
      header: t.name,
      level: levelOf(t),
      cells: [
        percent(t.flagged, t.analyzed),
        `${t.flagged} de ${t.analyzed}`,
        percent(t.analyzed, t.available, 0),
      ],
    }));

const meta = {
  title: 'Componentes/UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Data table',
    'Para comparar y verificar: el camino de periodistas y veedurías, y la alternativa accesible a cada mapa o gráfico. Números a la derecha con dígitos tabulares; cuadro de categoría junto al nombre, nunca fondo de color en la fila. En el celular se desplaza la tabla o se quitan columnas opcionales; nunca se encoge el texto. Recibe las filas ya formateadas: no calcula ni clasifica.',
    'src/components/ui/DataTable/',
  ),
  args: {
    caption: 'Departamentos con mayor proporción de contratos con señales · datos ficticios',
    columns: [
      { label: 'Departamento' },
      { label: 'Con señales', numeric: true },
      { label: 'Contratos', numeric: true },
      { label: 'Cobertura', numeric: true },
    ],
    rows: rankingRows(5),
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ranking: Story = {};
export const WithUnknown: Story = {
  name: 'Con una fila sin datos',
  args: {
    caption: 'Departamentos seleccionados · datos ficticios',
    rows: [
      ...rankingRows(2),
      {
        id: 'CO-VAU',
        header: 'Vaupés',
        level: 'unknown',
        cells: ['Sin datos', '0 analizados', '0% de 80'],
      },
    ],
  },
};
export const CurrentRow: Story = {
  name: 'Fila del territorio elegido',
  args: {
    caption: 'Contratos por municipio en Guainía, 2021 – 7 nov 2026',
    columns: [
      { label: 'Municipio' },
      { label: 'Código DANE' },
      { label: 'Contratos', numeric: true },
    ],
    currentRowId: '94001',
    rows: [
      { id: '94001', header: 'Inírida', cells: ['94001', '17.632'] },
      { id: '94343', header: 'Barrancominas', cells: ['94343', '1.577'] },
      {
        id: '94884',
        header: 'Puerto Colombia',
        cells: [
          '94884',
          <span key="sd" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <LegendKey kind="unknown" />
            Sin datos
          </span>,
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'La fila elegida va en negrita y con `aria-current`, nunca con color. «Sin datos» lleva su clave rayada en la celda, nunca 0. Corte 2026-11, datos reales al 7 nov 2026.',
      },
    },
  },
};
