import { formatNumber } from '../format';
import styles from './KeyFigure.module.css';

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
    <div className={styles.figure}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>
        {noData ? (
          'Sin datos'
        ) : (
          <>
            {formatNumber((100 * part) / total)}
            <span className={styles.unit}>%</span>
          </>
        )}
      </p>
      <p className={styles.context}>
        {context.replace('{part}', String(part)).replace('{total}', String(total))}
      </p>
      <p className={styles.source}>{source}</p>
    </div>
  );
}
