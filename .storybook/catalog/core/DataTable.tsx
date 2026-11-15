import { formatNumber, levelOf, TERRITORIES } from '../shared';

type Props = {
  /** Toda tabla lleva `caption`: qué compara y si los datos son ficticios. */
  caption: string;
  /** Cuántas filas mostrar. */
  rows: number;
};

/** Para comparar y verificar; la alternativa accesible a cada mapa o gráfico. */
export function DataTable({ caption, rows }: Props) {
  const sorted = TERRITORIES.filter((t) => t.analyzed)
    .sort((a, b) => b.flagged / b.analyzed - a.flagged / a.analyzed)
    .slice(0, rows);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="el-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Departamento</th>
            <th scope="col" className="el-num">
              Con señales
            </th>
            <th scope="col" className="el-num">
              Contratos
            </th>
            <th scope="col" className="el-num">
              Cobertura
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr key={t.id}>
              <th scope="row">
                <span className={`el-key el-key-${levelOf(t)}`} aria-hidden="true" />
                {t.name}
              </th>
              <td className="el-num">{formatNumber((100 * t.flagged) / t.analyzed)}%</td>
              <td className="el-num">
                {t.flagged} de {t.analyzed}
              </td>
              <td className="el-num">{formatNumber((100 * t.analyzed) / t.available, 0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
