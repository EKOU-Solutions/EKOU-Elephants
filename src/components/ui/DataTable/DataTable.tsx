import type { Level } from '../RiskTag/RiskTag';

export type DataTableColumn = {
  /** Encabezado visible de la columna. */
  label: string;
  /** Números: alineados a la derecha con dígitos tabulares. */
  numeric?: boolean;
};

export type DataTableRow = {
  /** Identificador estable de la fila. */
  id: string;
  /** Encabezado de la fila (por ejemplo, el nombre del departamento). */
  header: string;
  /** Cuadro de categoría junto al nombre; nunca fondo de color en la fila. */
  level?: Level;
  /** Valores ya formateados, en el mismo orden que las columnas que siguen a la primera. */
  cells: string[];
};

type Props = {
  /** Toda tabla lleva `caption`: qué compara y si los datos son ficticios. */
  caption: string;
  /** La primera columna es la del encabezado de cada fila. */
  columns: DataTableColumn[];
  rows: DataTableRow[];
};

/** Para comparar y verificar; la alternativa accesible a cada mapa o gráfico. */
export function DataTable({ caption, columns, rows }: Props) {
  const [headerColumn, ...valueColumns] = columns;
  return (
    // A scrollable region must be focusable so keyboard users can scroll it (WCAG 2.1.1).
    <div role="region" aria-label={caption} tabIndex={0} className="el-table-scroll" style={{ overflowX: 'auto' }}>
      <table className="el-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{headerColumn?.label}</th>
            {valueColumns.map((c) => (
              <th key={c.label} scope="col" className={c.numeric ? 'el-num' : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.level ? <span className={`el-key el-key-${row.level}`} aria-hidden="true" /> : null}
                {row.header}
              </th>
              {row.cells.map((value, i) => (
                <td key={valueColumns[i]?.label ?? i} className={valueColumns[i]?.numeric ? 'el-num' : undefined}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
