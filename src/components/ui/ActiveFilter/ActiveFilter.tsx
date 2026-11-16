import { Icon } from '../Icon/Icon';
import styles from './ActiveFilter.module.css';

type Props = {
  /** Valor visible del filtro. */
  value: string;
  /** Nombre accesible: dice qué se quita («Quitar filtro: Antioquia»). */
  accessibleName?: string;
  /** Quita el filtro. Anuncia el cambio al quitarlo. */
  onRemove?: () => void;
};

/** Muestra un filtro aplicado y permite quitarlo con un toque (área mínima de 44 px). */
export function ActiveFilter({ value, accessibleName, onRemove }: Props) {
  return (
    <button
      className={styles.chip}
      type="button"
      aria-label={accessibleName ?? `Quitar filtro: ${value}`}
      onClick={onRemove}
    >
      {value}
      <Icon name="x" size={18} />
    </button>
  );
}
