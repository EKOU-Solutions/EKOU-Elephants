import { formatNumber } from '../shared';

type Props = {
  /** Qué mide. */
  label: string;
  /** Numerador. */
  part: number;
  /** Denominador. Si es 0, la cifra es «Sin datos», nunca 0%. */
  total: number;
  /** Frase de contexto; `{part}` y `{total}` se reemplazan. */
  context: string;
  /** Fuente y periodo, siempre presentes. */
  source: string;
};

/** Un número grande que se entiende solo, incluso en una captura compartida. */
export function KeyFigure({ label, part, total, context, source }: Props) {
  const noData = total === 0;
  return (
    <div className="el-figure">
      <p className="label">{label}</p>
      <p className="value">
        {noData ? (
          'Sin datos'
        ) : (
          <>
            {formatNumber((100 * part) / total)}
            <span>%</span>
          </>
        )}
      </p>
      <p className="context">{context.replace('{part}', String(part)).replace('{total}', String(total))}</p>
      <p className="source">{source}</p>
    </div>
  );
}
