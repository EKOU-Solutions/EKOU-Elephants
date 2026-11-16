// Candidate spec: still the v1.0 markup with the shared el-* classes. When a page confirms it, it becomes a
// React component with its own CSS Module and this import goes away.
import '../../../docs/design/guide/components.css';
type Props = {
  /** Señales del contrato: título corto con el hecho y una frase con el número. */
  signals: { title: string; fact: string }[];
};

/** Lista numerada de señales: un hecho que pide revisar, no un veredicto. */
export function SignalList({ signals }: Props) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, maxWidth: 560 }}>
      {signals.map((s, i) => (
        <li key={s.title} className="el-signal">
          <span className="n">{i + 1}</span>
          <strong>{s.title}</strong>
          <p>{s.fact}</p>
        </li>
      ))}
    </ol>
  );
}
