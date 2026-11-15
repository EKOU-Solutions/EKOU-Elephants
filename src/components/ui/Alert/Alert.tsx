import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './Alert.module.css';

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
  /** En el banner la acción es un enlace: a dónde lleva. */
  actionHref?: string;
  /** En línea la acción es un botón: qué hace. */
  onAction?: () => void;
};

/** Avisa algo sobre la interfaz o la información: qué pasó y qué puede hacer la persona. */
export function Alert({ variant, tone, title, message, action, actionHref, onAction }: Props) {
  const Icon = ICON[tone];
  if (variant === 'note') {
    return (
      <span className={`${styles.note} ${styles[tone]}`}>
        <Icon aria-hidden="true" />
        {title}
      </span>
    );
  }
  if (variant === 'banner') {
    return (
      <div className={`${styles.banner} ${styles[tone]}`}>
        <Icon aria-hidden="true" />
        <p className={styles.message}>
          <strong>{title}</strong> {message}
        </p>
        {action ? <a href={actionHref}>{action}</a> : null}
      </div>
    );
  }
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'danger' ? 'alert' : undefined}>
      <span className={styles.badge}>
        <Icon aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {action ? (
        <div className={styles.actions}>
          <Button variant="secondary" label={action} onClick={onAction} />
        </div>
      ) : null}
    </div>
  );
}
