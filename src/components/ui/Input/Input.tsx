import type { InputHTMLAttributes } from 'react';
import { type ControlProps, FormField, type FormFieldProps } from '../FormField/FormField';

type Props = FormFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'id' | 'className' | 'aria-invalid' | 'aria-describedby'
  >;

/**
 * Recoge un dato escrito para filtrar o buscar. Acepta los atributos de un `input` nativo
 * (`value`, `onChange`, `inputMode`, `autoComplete`…); `inputMode="numeric"` solo si el dato es un número.
 * Un buscador sobre un mapa puede ocultar la etiqueta con `hideLabel`, siempre con un ícono visible (`icon`).
 */
export function Input({ label, help, error, fullWidth, hideLabel, icon, ...input }: Props) {
  const field = { label, help, error, fullWidth, icon };
  const control = (props: ControlProps) => <input {...input} {...props} />;
  return hideLabel ? (
    <FormField {...field} hideLabel>
      {control}
    </FormField>
  ) : (
    <FormField {...field}>{control}</FormField>
  );
}
