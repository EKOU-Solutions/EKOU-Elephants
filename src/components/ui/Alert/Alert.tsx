import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

type Tone = 'info' | 'warning' | 'danger' | 'success';
const ICON = { info: Info, warning: TriangleAlert, danger: CircleAlert, success: CircleCheck } as const;

type Props = {
  /** Banner: afecta toda la vista (uno a la vez, arriba). En línea: afecta una sección. Nota: matiza una cifra. */
  variant: 'banner' | 'inline' | 'note';
  /** Tono del mensaje de la interfaz. Nunca se usa para calificar el riesgo de un territorio. */
  tone: Tone;
  /** Qué pasó. */
  title: string;
  /** Qué puede hacer la persona. */
  message?: string;
  /** Una salida en cada error: reintentar o seguir. */
  action?: string;
};

/** Avisa algo sobre la interfaz o la información: qué pasó y qué puede hacer la persona. */
export function Alert({ variant, tone, title, message, action }: Props) {
  const Icon = ICON[tone];
  if (variant === 'note') {
    return (
      <span className={`el-inline-note el-alert-${tone}`}>
        <Icon aria-hidden="true" />
        {title}
      </span>
    );
  }
  if (variant === 'banner') {
    return (
      <div className={`el-banner el-alert-${tone}`}>
        <Icon aria-hidden="true" />
        <p className="msg">
          <strong>{title}</strong> {message}
        </p>
        {action ? <a href="#cobertura">{action}</a> : null}
      </div>
    );
  }
  return (
    <div className={`el-alert el-alert-${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="badge">
        <Icon aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {action ? (
        <div className="actions">
          <button className="el-btn el-btn-secondary" type="button">
            {action}
          </button>
        </div>
      ) : null}
    </div>
  );
}
