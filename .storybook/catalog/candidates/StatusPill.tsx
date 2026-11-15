import { Clock } from 'lucide-react';

type Props = {
  /** Estado del proceso del contrato, en palabras. No es un nivel de riesgo. */
  label: string;
};

/** Estado neutro del proceso de un contrato (por ejemplo, «En ejecución»). */
export function StatusPill({ label }: Props) {
  return (
    <span className="el-status">
      <Clock aria-hidden="true" />
      {label}
    </span>
  );
}
