import type { InputHTMLAttributes } from 'react';
import { FormField, type FormFieldProps } from '../FormField/FormField';

type Props = FormFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'id' | 'className' | 'aria-invalid' | 'aria-describedby'
  >;

/**
 * Recoge un dato escrito para filtrar o buscar. Acepta los atributos de un `input` nativo
 * (`value`, `onChange`, `inputMode`, `autoComplete`…); `inputMode="numeric"` solo si el dato es un número.
 */
export function Input({ label, help, error, ...input }: Props) {
  return (
    <FormField label={label} help={help} error={error}>
      {(control) => <input {...input} {...control} />}
    </FormField>
  );
}
