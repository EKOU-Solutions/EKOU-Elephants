import type { SelectHTMLAttributes } from 'react';
import { FormField, type FormFieldProps } from '../FormField/FormField';

export type SelectOption = string | { value: string; label: string };

type Props = FormFieldProps &
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'id' | 'className' | 'aria-invalid' | 'aria-describedby' | 'children'
  > & {
    /** Opciones conocidas y pocas (menos de ~15); si son más, se usa un buscador con sugerencias. */
    options: SelectOption[];
  };

/** Elige un valor de una lista corta y conocida para filtrar. Acepta los atributos de un `select` nativo. */
export function Select({
  label,
  help,
  error,
  fullWidth,
  hideLabel,
  icon,
  options,
  ...select
}: Props) {
  return (
    <FormField {...({ label, help, error, fullWidth, hideLabel, icon } as FormFieldProps)}>
      {(control) => (
        <select {...select} {...control}>
          {options.map((o) => {
            const { value, label: text } = typeof o === 'string' ? { value: o, label: o } : o;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
      )}
    </FormField>
  );
}
