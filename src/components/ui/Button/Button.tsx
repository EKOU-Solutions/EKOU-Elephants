import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Button.module.css';

type Common = {
  /** Principal: la acción más importante del grupo (una sola). Secundario: acompaña. Texto: acciones de bajo peso. */
  variant: 'primary' | 'secondary' | 'text';
  /** Verbo concreto: «Consultar contratos», nunca «Enviar» u «OK». */
  label: string;
  /** Solo ícono (zoom de un mapa): `label` pasa a ser el nombre accesible y no se ve. Requiere `icon`. */
  hideLabel?: boolean;
  /** Ícono a la izquierda, por composición: `icon={<Icon name="search" />}`. Es decorativo: el texto ya dice la acción. Mientras carga, lo reemplaza el indicador de carga. */
  icon?: ReactNode;
};

type AsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'disabled' | 'type'> & {
    /** `disabled` real, no solo opacidad. Explica cerca por qué está deshabilitado y liga esa explicación con `aria-describedby`. */
    disabled?: boolean;
    /** Mientras carga, no responde a clics ni se puede enviar dos veces, pero conserva el foco (`aria-disabled` + `aria-busy`). */
    loading?: boolean;
    /** Texto mientras carga («Descargando CSV…»). Si no se da, se conserva `label`. */
    loadingLabel?: string;
    /**
     * Recorta la etiqueta con puntos suspensivos si no cabe (migas del mapa a 320 px, v1.6.0). El texto
     * entero sigue siendo el nombre accesible; úsalo solo si también está completo a la vista en otro lugar.
     */
    truncate?: boolean;
    /** `submit` solo dentro de un formulario; por defecto no envía nada. */
    type?: 'button' | 'submit' | 'reset';
    href?: never;
    external?: never;
  };

type AsLink = Common & {
  /** Con `href` es un enlace con forma de botón (`<a>`): lleva a otro lugar en vez de ejecutar una acción. */
  href: string;
  truncate?: never;
  /** Enlace a otro sitio: abre otra pestaña (`target="_blank"`, `rel="noopener"`), lleva el ícono de enlace externo y lo dice en su nombre accesible. */
  external?: boolean;
};

type Props = AsButton | AsLink;

const NEW_TAB = '(abre en otra pestaña)';

/**
 * Ejecuta una acción en la pantalla actual y acepta los atributos de un `button` nativo. Con `href`
 * es un enlace con la misma forma, para la acción principal que lleva a otro lugar.
 */
export function Button(props: Props) {
  const { variant, label, hideLabel, icon } = props;
  const shape = `${styles.button} ${styles[variant]}${hideLabel ? ` ${styles.iconOnly}` : ''}`;
  const decoration = icon ? (
    <span className={styles.icon} aria-hidden="true">
      {icon}
    </span>
  ) : null;

  if (props.href !== undefined) {
    const { href, external } = props;
    const name = external ? `${label} ${NEW_TAB}` : hideLabel ? label : undefined;
    return (
      <a
        className={shape}
        href={href}
        aria-label={name}
        {...(external ? { target: '_blank', rel: 'noopener' } : {})}
      >
        {decoration}
        {hideLabel ? null : label}
        {external ? <Icon name="external-link" /> : null}
      </a>
    );
  }

  const {
    variant: _variant,
    label: _label,
    hideLabel: _hideLabel,
    icon: _icon,
    href: _href,
    external: _external,
    disabled,
    loading,
    loadingLabel,
    truncate,
    type = 'button',
    onClick,
    ...button
  } = props;
  // A native `disabled` would drop keyboard focus the moment loading starts; aria-disabled keeps it.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  const current = loading ? (loadingLabel ?? label) : label;
  const text = truncate ? <span className={styles.label}>{current}</span> : current;
  return (
    <button
      aria-label={hideLabel ? label : undefined}
      {...button}
      className={truncate ? `${shape} ${styles.truncate}` : shape}
      type={type}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {loading ? <Icon name="loader-circle" /> : decoration}
      {hideLabel ? null : text}
    </button>
  );
}
