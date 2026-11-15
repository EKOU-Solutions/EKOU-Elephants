import { LoaderCircle, Search } from 'lucide-react';

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
};

/** Ejecuta una acción en la pantalla actual. Para ir a otra página se usa un enlace. */
export function Button({ variant, label, withIcon, disabled, loading }: Props) {
  return (
    <button
      className={`el-btn el-btn-${variant}`}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <LoaderCircle aria-hidden="true" /> : withIcon ? <Search aria-hidden="true" /> : null}
      {loading ? 'Consultando…' : label}
    </button>
  );
}
