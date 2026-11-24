import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** What the pointer is over: «San Andrés». */
  title: string;
  /** The figure or fact under the name: «1.361 contratos» or «Sin datos». */
  detail?: string;
  /** Pointer position inside the positioned parent, in px. Without it the tooltip stays in flow (stories). */
  x?: number;
  y?: number;
  /** The width of the parent: the tooltip flips to the left of the pointer when it would overflow. */
  parentWidth?: number;
}

const OFFSET = 14;
const MAX_WIDTH = 240;

/**
 * Names what the pointer is over, right next to it. It is for pointer users only (`aria-hidden`):
 * the same figures are in the table that every map has as its accessible alternative.
 */
export function Tooltip({ title, detail, x, y, parentWidth }: TooltipProps) {
  const placed = x !== undefined && y !== undefined;
  const flip = placed && parentWidth !== undefined && x + OFFSET + MAX_WIDTH > parentWidth;
  // Flipped, it hangs from the pointer's left side (`right`), so it keeps its natural width.
  const style = placed
    ? flip
      ? { right: (parentWidth ?? 0) - x + OFFSET, top: y + OFFSET }
      : { left: x + OFFSET, top: y + OFFSET }
    : undefined;
  return (
    <div
      aria-hidden="true"
      className={`${styles.tooltip} ${placed ? styles.placed : ''}`}
      style={style}
    >
      <b className={styles.title}>{title}</b>
      {detail ? <span className={styles.detail}>{detail}</span> : null}
    </div>
  );
}
