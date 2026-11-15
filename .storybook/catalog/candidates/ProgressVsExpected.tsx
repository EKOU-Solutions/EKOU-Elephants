type Props = {
  /** Porcentaje pagado o ejecutado. */
  progress: number;
  /** Porcentaje esperado a la fecha (marca roja, decidida en la revisión de la Ronda 05). */
  expected: number;
  /** Qué mide la barra. */
  label: string;
};

/** Avance pagado o ejecutado frente a la marca de lo esperado. */
export function ProgressVsExpected({ progress, expected, label }: Props) {
  return (
    <div className="sb-el-stack" style={{ maxWidth: 420 }}>
      <p>
        <strong>{label}</strong>
      </p>
      <div className="el-progress" aria-hidden="true">
        <div className="done" style={{ width: `${progress}%` }} />
        <span className="expected" style={{ left: `${expected}%` }} />
      </div>
      <p style={{ fontSize: 15 }}>
        Pagado: {progress}% · Esperado a hoy: {expected}%
      </p>
    </div>
  );
}
