import styles from './ProgressBar.module.css';

/**
 * Ink for counts (signals included: red means «riesgo alto» only), line grey for the rest, grey hatch for
 * missing data. `mid` and `light` are two more tones of ink for splits of a whole into 3 parts (v1.7.0).
 */
export type ProgressTone = 'ink' | 'mid' | 'light' | 'line' | 'unknown';

export type ProgressSegment = {
  /** Cuánto llena este tramo, en la misma unidad que `max`. */
  value: number;
  /** Color del tramo. */
  tone: ProgressTone;
};

type Props = {
  /** Tramos en orden, de izquierda a derecha. Un solo tramo para una barra simple. */
  segments: ProgressSegment[];
  /**
   * Valor que llena la barra completa. Por defecto, la suma de los tramos. Para barras en escala común
   * pasa el mayor de los valores: un tramo nunca se recorta (un valor mayor se vería igual al máximo).
   */
  max?: number;
  /** Deja 2 px entre tramos (reparto de un todo en varias partes). Sin esto, los tramos van pegados. */
  separated?: boolean;
  /** Delgada (8 px) para listas y desgloses; gruesa (12 px) cuando la barra es el dato principal. */
  size?: 'thin' | 'thick';
  /**
   * Lo que dice la barra, para lectores de pantalla («De 150 contratos: 36 con señales…»).
   * Sin `label` es decorativa: úsala así solo si los números ya están en texto al lado.
   */
  label?: string;
};

/** Barra horizontal que se llena por tramos. No trae leyenda ni números: quien la usa los pone en texto. */
export function ProgressBar({ segments, max, size = 'thin', separated = false, label }: Props) {
  const total = max ?? segments.reduce((sum, s) => sum + s.value, 0);
  // Guard the division only; an empty bar shows the bare track. A value above `max` overflows the track
  // (hidden by it) rather than being clipped silently, so callers must pass the true maximum.
  const width = (v: number) => `${total > 0 ? (100 * v) / total : 0}%`;
  return (
    <div
      className={`${styles.track} ${styles[size]}${separated ? ` ${styles.separated}` : ''}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {segments.map((s, i) => (
        // Segments have no identity of their own; their position is their key.
        // biome-ignore lint/suspicious/noArrayIndexKey: static, ordered segments
        <span key={i} className={styles[s.tone]} style={{ width: width(s.value) }} />
      ))}
    </div>
  );
}
