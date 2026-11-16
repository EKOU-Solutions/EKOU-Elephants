import type { Level } from '../RiskTag/RiskTag';
import styles from './LegendKey.module.css';

export type LegendKeyKind = Level | 'flagged' | 'clean';

type Props = {
  /** Nivel de riesgo, o «flagged» / «clean» para conteos de contratos con y sin señales (en tinta, nunca en rojo). */
  kind: LegendKeyKind;
  /** Para que quien lo usa ajuste el espacio a su alrededor. */
  className?: string;
};

/** Cuadro de color de una leyenda. Es decorativo: el texto que lo acompaña lleva el significado. */
export function LegendKey({ kind, className }: Props) {
  return (
    <span
      className={`${styles.key} ${styles[kind]}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    />
  );
}
