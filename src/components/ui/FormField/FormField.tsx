import { Icon } from '../Icon/Icon';
import { type ReactNode, useId } from 'react';
import styles from './FormField.module.css';

/** What the base hands to the control it wraps: id, shared styles and the ARIA wiring to the messages. */
export type ControlProps = {
  id: string;
  className?: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

type Common = {
  /** Etiqueta: es el nombre accesible del campo. Visible salvo con `hideLabel`. */
  label: string;
  /** Ayuda breve debajo del control. */
  help?: string;
  /** El error dice cómo corregir, en el mismo lugar que la ayuda. */
  error?: string;
  /** Ocupa todo el ancho de su contenedor, sin el tope de 320 px (el buscador sobre el mapa, v1.6.0). */
  fullWidth?: boolean;
};

/** Con la etiqueta a la vista; el ícono es opcional. */
type WithLabel = Common & {
  hideLabel?: false;
  /** Ícono visible dentro del campo, al inicio (una lupa en un buscador). Decorativo: la etiqueta dice qué es. */
  icon?: ReactNode;
};

/**
 * Excepción a «etiqueta siempre visible» (v1.6.0, decisión 30 del Mapa): la etiqueta queda solo como
 * nombre accesible y un ícono visible dice para qué es el campo. Úsala solo donde no cabe una etiqueta
 * (sobre un mapa) y siempre con un placeholder que diga qué escribir.
 */
type WithHiddenLabel = Common & {
  hideLabel: true;
  /** Obligatorio con `hideLabel`: sin etiqueta a la vista, el ícono dice qué es el campo. */
  icon: ReactNode;
};

export type FormFieldProps = WithLabel | WithHiddenLabel;

type Props = FormFieldProps & {
  /** El control, por composición: recibe `id`, la clase y los atributos `aria-*` y los pasa al elemento nativo. */
  children: (control: ControlProps) => ReactNode;
};

/** Base de todos los campos: etiqueta, control y mensaje de ayuda o de error, ligados entre sí. */
export function FormField({ label, help, error, fullWidth, hideLabel, icon, children }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  // The error replaces the help text, so only one of them is ever shown and described.
  const describedBy = error ? errorId : help ? helpId : undefined;
  const control = children({
    id,
    className: icon ? `${styles.control} ${styles.withIcon}` : styles.control,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  });
  return (
    <div className={fullWidth ? `${styles.field} ${styles.fullWidth}` : styles.field}>
      <label className={hideLabel ? styles.hiddenLabel : styles.label} htmlFor={id}>
        {label}
      </label>
      {icon ? (
        <div className={styles.box}>
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
      {error ? (
        <span className={styles.error} id={errorId}>
          <Icon name="circle-alert" size={16} />
          {error}
        </span>
      ) : help ? (
        <span className={styles.help} id={helpId}>
          {help}
        </span>
      ) : null}
    </div>
  );
}
