import { X } from 'lucide-react';

type Props = {
  /** Valor visible del filtro. */
  value: string;
  /** Nombre accesible: dice qué se quita («Quitar filtro: Antioquia»). */
  accessibleName?: string;
};

/** Muestra un filtro aplicado y permite quitarlo con un toque (área mínima de 44 px). */
export function ActiveFilter({ value, accessibleName }: Props) {
  return (
    <button className="el-chip" type="button" aria-label={accessibleName ?? `Quitar filtro: ${value}`}>
      {value}
      <X aria-hidden="true" />
    </button>
  );
}
