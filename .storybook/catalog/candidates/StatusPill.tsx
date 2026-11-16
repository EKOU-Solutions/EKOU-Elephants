// Candidate spec: still the v1.0 markup with the shared el-* classes. When a page confirms it, it becomes a
// React component with its own CSS Module and this import goes away.
import '../../../docs/design/guide/components.css';
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
