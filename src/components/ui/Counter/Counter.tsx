import { formatNumber } from '../format';
import { LegendKey } from '../LegendKey/LegendKey';
import styles from './Counter.module.css';

type Count = {
  value: number;
  label: string;
  /** Glosa de una línea bajo el nombre («sabemos en qué municipio se firmaron»). */
  note?: string;
  withKey?: boolean;
};
type Props = {
  /** Máximo 4 contadores seguidos. Nombra siempre lo que se cuenta. */
  counts: Count[];
  /**
   * `row` (por defecto): en fila. `adaptive`: apilados con líneas horizontales cuando su espacio mide
   * menos de 600 px (celular o columna lateral) y en fila desde ahí, sin divisiones verticales al apilar.
   */
  layout?: 'row' | 'adaptive';
};

/** Un número grande con su nombre debajo. Resume una consulta en una sola línea. */
export function Counter({ counts, layout = 'row' }: Props) {
  const list = (
    <div className={styles.counts}>
      {counts.map((c) => (
        <div key={c.label} className={`${styles.count}${c.withKey ? ` ${styles.withKey}` : ''}`}>
          <strong className={styles.value}>{formatNumber(c.value)}</strong>
          <span className={styles.label}>
            {c.withKey ? <LegendKey kind="flagged" /> : null}
            {c.label}
          </span>
          {c.note ? <span className={styles.note}>{c.note}</span> : null}
        </div>
      ))}
    </div>
  );
  return layout === 'adaptive' ? <div className={styles.adaptive}>{list}</div> : list;
}
