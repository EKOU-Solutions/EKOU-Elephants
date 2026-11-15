import { CircleAlert } from 'lucide-react';
import { useId } from 'react';

type Props = {
  /** Etiqueta siempre visible; el placeholder nunca reemplaza la etiqueta. */
  label: string;
  /** Lista (`select`) si las opciones son conocidas y menos de ~15; si son más, buscador con sugerencias. */
  kind: 'input' | 'select';
  value?: string;
  options?: string[];
  /** Ayuda breve debajo del control. */
  help?: string;
  /** El error dice cómo corregir, en el mismo lugar que la ayuda. */
  error?: string;
};

/** Recoge un dato para filtrar o buscar. Siempre con etiqueta visible. */
export function Field({ label, kind, value, options = [], help, error }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="el-field">
      <label htmlFor={id}>{label}</label>
      {kind === 'select' ? (
        <select id={id} defaultValue={value}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          inputMode="numeric"
          defaultValue={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      )}
      {error ? (
        <span className="error" id={errorId}>
          <CircleAlert aria-hidden="true" />
          {error}
        </span>
      ) : help ? (
        <span className="help">{help}</span>
      ) : null}
    </div>
  );
}
