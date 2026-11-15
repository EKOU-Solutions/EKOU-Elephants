// Candidate spec: still the v1.0 markup with the shared el-* classes. When a page confirms it, it becomes a
// React component with its own CSS Module and this import goes away.
import '../../../docs/design/guide/components.css';
type Props = {
  /** Contratos analizados con al menos una señal. */
  flagged: number;
  /** Contratos analizados sin señales. */
  clean: number;
  /** Contratos disponibles que no se analizaron (trama gris). */
  missing: number;
};

/** Con señales / analizados sin señales / sin analizar, sobre el total: lo que falta se ve. */
export function CoverageBar({ flagged, clean, missing }: Props) {
  const total = flagged + clean + missing || 1;
  const width = (n: number) => `${(100 * n) / total}%`;
  return (
    <div>
      <div
        className="el-coverage"
        role="img"
        aria-label={`De ${total} contratos: ${flagged} con señales, ${clean} sin señales, ${missing} sin analizar`}
      >
        <span className="flagged" style={{ width: width(flagged) }} />
        <span className="clean" style={{ width: width(clean) }} />
        <span className="missing" style={{ width: width(missing) }} />
      </div>
      <div className="el-coverage-legend">
        <span>
          <span className="el-key el-key-flagged" aria-hidden="true" />
          {flagged} con señales
        </span>
        <span>
          <span className="el-key el-key-clean" aria-hidden="true" />
          {clean} sin señales
        </span>
        <span>
          <span className="el-key el-key-unknown" aria-hidden="true" />
          {missing} sin analizar
        </span>
      </div>
    </div>
  );
}
