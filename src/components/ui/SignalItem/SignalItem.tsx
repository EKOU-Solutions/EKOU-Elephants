import type { Level } from '../RiskTag/RiskTag';
import styles from './SignalItem.module.css';

export type SignalLevel = Exclude<Level, 'unknown'>;

// The level grades the signal, not the contract: «gravedad», never «riesgo».
const LEVEL_TEXT: Record<SignalLevel, string> = {
  low: 'Gravedad baja',
  medium: 'Gravedad intermedia',
  high: 'Gravedad alta',
};

type Props = {
  /** Título corto con el hecho: «Ya cuesta 20,9 % más de lo firmado». Nunca un veredicto. */
  title: string;
  /** El hecho que la sustenta, con su número: «Pasó de $ 56,1 a $ 67,8 millones.» */
  fact: string;
  /** Nivel calculado por la metodología (TASK-07 y TASK-13); nunca se elige a mano. Colorea el número y se escribe en texto («Gravedad alta»): califica la señal, no el contrato. Sin nivel, la señal va neutra. */
  level?: SignalLevel;
};

/** Una señal numerada: un hecho que pide revisar, no un veredicto. Va dentro de una lista ordenada (`<ol>`), que pone el número. */
export function SignalItem({ title, fact, level }: Props) {
  return (
    <li className={`${styles.item}${level ? ` ${styles[level]}` : ''}`}>
      <strong className={styles.title}>{title}</strong>
      <p className={styles.fact}>{fact}</p>
      {level ? <p className={styles.level}>{LEVEL_TEXT[level]}</p> : null}
    </li>
  );
}
