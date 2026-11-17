import type { ReactNode } from 'react';
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
  /** Encabezado de la fila (por ejemplo, el nombre del departamento); puede ser un enlace al territorio. */
  header: ReactNode;
  /** Cuadro de categoría junto al nombre; nunca fondo de color en la fila. */
  level?: Level;
  /** Valores ya formateados, en el mismo orden que las columnas que siguen a la primera. Un «Sin datos» puede llevar su clave (`LegendKey`). */
  cells: ReactNode[];
};

type Props = {
  /** Toda tabla lleva `caption`: qué compara y si los datos son ficticios. */
  caption: string;
  /** La primera columna es la del encabezado de cada fila. */
  columns: DataTableColumn[];
  rows: DataTableRow[];
  /** Fila del territorio elegido: se marca con peso y `aria-current`, nunca con color. */
  currentRowId?: string;
  /**
   * Encabezado fijo arriba mientras se desplaza el contenedor que la contiene (la ficha del mapa, v1.6.0).
   * Sin desplazamiento horizontal propio: solo para tablas de pocas columnas que caben a 320 px.
   */
  stickyHeader?: boolean;
};

/** Para comparar y verificar; la alternativa accesible a cada mapa o gráfico. */
export function DataTable({ caption, columns, rows, currentRowId, stickyHeader }: Props) {
  const [headerColumn, ...valueColumns] = columns;
  return (
    // A labelled <section> is a region landmark. It must be focusable so keyboard users can
    // scroll it horizontally (WCAG 2.1.1, axe scrollable-region-focusable). With a sticky header it
    // does not scroll: the scrolling ancestor takes the keyboard.
    <section
      aria-label={caption}
      tabIndex={stickyHeader ? undefined : 0}
      className={stickyHeader ? `${styles.scroll} ${styles.sticky}` : styles.scroll}
    >
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
            <tr
              key={row.id}
              className={row.id === currentRowId ? styles.current : undefined}
              aria-current={row.id === currentRowId ? 'true' : undefined}
            >
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
