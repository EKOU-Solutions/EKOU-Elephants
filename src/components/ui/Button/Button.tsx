import { LoaderCircle, Search } from 'lucide-react';
import styles from './Button.module.css';

type Props = {
  /** Principal: la acción más importante del grupo (una sola). Secundario: acompaña. Texto: acciones de bajo peso. */
  variant: 'primary' | 'secondary' | 'text';
  /** Verbo concreto: «Consultar contratos», nunca «Enviar» u «OK». */
  label: string;
  /** Ícono de búsqueda a la izquierda (decorativo). */
  withIcon?: boolean;
  /** `disabled` real, no solo opacidad. Explica cerca por qué está deshabilitado. */
  disabled?: boolean;
  /** Mientras carga: `disabled` + `aria-busy` para evitar dobles envíos. */
  loading?: boolean;
  /** Acción al presionar. */
  onClick?: () => void;
};

/** Ejecuta una acción en la pantalla actual. Para ir a otra página se usa un enlace. */
export function Button({ variant, label, withIcon, disabled, loading, onClick }: Props) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" />
      ) : withIcon ? (
        <Search aria-hidden="true" />
      ) : null}
      {loading ? 'Consultando…' : label}
    </button>
  );
}
