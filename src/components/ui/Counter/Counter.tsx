type Count = { value: number; label: string; withKey?: boolean };
type Props = {
  /** Máximo 4 contadores seguidos. Nombra siempre lo que se cuenta. */
  counts: Count[];
};

/** Un número grande con su nombre debajo. Resume una consulta en una sola línea. */
export function Counter({ counts }: Props) {
  return (
    <div className="el-counts">
      {counts.map((c) => (
        <div key={c.label} className={`el-count${c.withKey ? ' el-count-risk' : ''}`}>
          <strong>{new Intl.NumberFormat('es-CO').format(c.value)}</strong>
          <span>
            {c.withKey ? <span className="el-key el-key-flagged" aria-hidden="true" style={{ margin: 0 }} /> : null}
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
