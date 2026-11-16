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

export type FormFieldProps = {
  /** Etiqueta siempre visible; el placeholder nunca reemplaza la etiqueta. */
  label: string;
  /** Ayuda breve debajo del control. */
  help?: string;
  /** El error dice cómo corregir, en el mismo lugar que la ayuda. */
  error?: string;
};

type Props = FormFieldProps & {
  /** El control, por composición: recibe `id`, la clase y los atributos `aria-*` y los pasa al elemento nativo. */
  children: (control: ControlProps) => ReactNode;
};

/** Base de todos los campos: etiqueta, control y mensaje de ayuda o de error, ligados entre sí. */
export function FormField({ label, help, error, children }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  // The error replaces the help text, so only one of them is ever shown and described.
  const describedBy = error ? errorId : help ? helpId : undefined;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        className: styles.control,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
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
