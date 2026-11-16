import { formatNumber } from '../format';
import { LegendKey } from '../LegendKey/LegendKey';
import styles from './Counter.module.css';

type Count = { value: number; label: string; withKey?: boolean };
type Props = {
  /** Máximo 4 contadores seguidos. Nombra siempre lo que se cuenta. */
  counts: Count[];
};

/** Un número grande con su nombre debajo. Resume una consulta en una sola línea. */
export function Counter({ counts }: Props) {
  return (
    <div className={styles.counts}>
      {counts.map((c) => (
        <div key={c.label} className={`${styles.count}${c.withKey ? ` ${styles.withKey}` : ''}`}>
          <strong className={styles.value}>{formatNumber(c.value)}</strong>
          <span className={styles.label}>
            {c.withKey ? <LegendKey kind="flagged" /> : null}
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
