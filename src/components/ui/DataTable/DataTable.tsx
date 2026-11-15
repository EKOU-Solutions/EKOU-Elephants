import { LegendKey } from '../LegendKey/LegendKey';
import type { Level } from '../RiskTag/RiskTag';
import styles from './DataTable.module.css';

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
    // A labelled <section> is a region landmark. It must be focusable so keyboard users can
    // scroll it horizontally (WCAG 2.1.1, axe scrollable-region-focusable).
    // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region needs keyboard focus.
    <section aria-label={caption} tabIndex={0} className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{headerColumn?.label}</th>
            {valueColumns.map((c) => (
              <th key={c.label} scope="col" className={c.numeric ? styles.numeric : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.level ? <LegendKey kind={row.level} className={styles.key} /> : null}
                {row.header}
              </th>
              {row.cells.map((value, i) => (
                <td
                  key={valueColumns[i]?.label ?? i}
                  className={valueColumns[i]?.numeric ? styles.numeric : undefined}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
