// Candidate spec: still the v1.0 markup with the shared el-* classes. When a page confirms it, it becomes a
// React component with its own CSS Module and this import goes away.
import '../../../docs/design/guide/components.css';
type Props = {
  /** Pocos conteos, de mayor a menor. El valor va en texto; la barra es decorativa. */
  items: { label: string; value: number }[];
};

/** Ordena unos pocos conteos (por ejemplo, señales por tipo) dentro de un panel. */
export function BreakdownBars({ items }: Props) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="el-bars">
      {items.map((i) => (
        <li key={i.label}>
          <span>{i.label}</span>
          <strong>{i.value}</strong>
          <span className="bar" aria-hidden="true">
            <i style={{ width: `${(100 * i.value) / max}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
