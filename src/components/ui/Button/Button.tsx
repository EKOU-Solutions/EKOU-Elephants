import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Button.module.css';

type Props = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'disabled' | 'type'
> & {
  /** Principal: la acción más importante del grupo (una sola). Secundario: acompaña. Texto: acciones de bajo peso. */
  variant: 'primary' | 'secondary' | 'text';
  /** Verbo concreto: «Consultar contratos», nunca «Enviar» u «OK». */
  label: string;
  /** Ícono a la izquierda, por composición: `icon={<Icon name="search" />}`. Es decorativo: el texto ya dice la acción. Mientras carga, lo reemplaza el indicador de carga. */
  icon?: ReactNode;
  /** `disabled` real, no solo opacidad. Explica cerca por qué está deshabilitado y liga esa explicación con `aria-describedby`. */
  disabled?: boolean;
  /** Mientras carga, no responde a clics ni se puede enviar dos veces, pero conserva el foco (`aria-disabled` + `aria-busy`). */
  loading?: boolean;
  /** Texto mientras carga («Descargando CSV…»). Si no se da, se conserva `label`. */
  loadingLabel?: string;
  /** `submit` solo dentro de un formulario; por defecto no envía nada. */
  type?: 'button' | 'submit' | 'reset';
};

/** Ejecuta una acción en la pantalla actual. Para ir a otra página se usa un enlace. Acepta los atributos de un `button` nativo. */
export function Button({
  variant,
  label,
  icon,
  disabled,
  loading,
  loadingLabel,
  type = 'button',
  onClick,
  ...button
}: Props) {
  // A native `disabled` would drop keyboard focus the moment loading starts; aria-disabled keeps it.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...button}
      className={`${styles.button} ${styles[variant]}`}
      type={type}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {loading ? (
        <Icon name="loader-circle" />
      ) : icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {loading ? (loadingLabel ?? label) : label}
    </button>
  );
}
