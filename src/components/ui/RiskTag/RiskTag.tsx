import styles from './RiskTag.module.css';

export type Level = 'low' | 'medium' | 'high' | 'unknown';

export const LEVELS: Level[] = ['low', 'medium', 'high', 'unknown'];

export const LEVEL_LABEL: Record<Level, string> = {
  low: 'Riesgo bajo',
  medium: 'Riesgo intermedio',
  high: 'Riesgo alto',
  unknown: 'Sin datos',
};

const FILLED_BARS: Record<Level, number> = { low: 1, medium: 2, high: 3, unknown: 0 };

/** Three rising bars: the filled ones encode the level, so the tag reads without color. */
export function LevelGlyph({ level }: { level: Level }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true">
      {(
        [
          [1, 6],
          [6, 10],
          [11, 14],
        ] as const
      ).map(([x, h], i) =>
        level === 'unknown' ? (
          <rect
            key={x}
            x={x + 0.5}
            y={15 - h + 0.5}
            width={3}
            height={h - 1}
            rx={0.5}
            fill="none"
            stroke="currentColor"
            strokeDasharray="2 1.5"
          />
        ) : (
          <rect
            key={x}
            x={x}
            y={15 - h}
            width={4}
            height={h}
            rx={1}
            fill="currentColor"
            opacity={i < FILLED_BARS[level] ? undefined : 0.35}
          />
        ),
      )}
    </svg>
  );
}

type Props = {
  /** Nivel calculado por la metodología (TASK-07); nunca se elige a mano. */
  level: Level;
  /** Grande: una sola vez, arriba de una ficha. */
  large?: boolean;
};

/** Nombra la categoría de riesgo de un territorio, entidad o contrato. */
export function RiskTag({ level, large = false }: Props) {
  return (
    <span className={`${styles.tag} ${styles[level]}${large ? ` ${styles.large}` : ''}`}>
      <LevelGlyph level={level} />
      {LEVEL_LABEL[level]}
    </span>
  );
}
