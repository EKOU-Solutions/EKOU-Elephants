import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import type { IconName } from '../Icon/icons';
import styles from './Alert.module.css';

type Tone = 'info' | 'warning' | 'danger' | 'success';
const ICON = {
  info: 'info',
  warning: 'triangle-alert',
  danger: 'circle-alert',
  success: 'circle-check',
} as const satisfies Record<Tone, IconName>;

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
  /** Si la acción lleva a otro lugar: a dónde. Se muestra como enlace. */
  actionHref?: string;
  /** Si la acción ocurre en la pantalla actual: qué hace. Se muestra como botón. */
  onAction?: () => void;
};

/** Avisa algo sobre la interfaz o la información: qué pasó y qué puede hacer la persona. */
export function Alert({ variant, tone, title, message, action, actionHref, onAction }: Props) {
  const toneIcon = ICON[tone];
  // Inserted after load, an error is read at once (alert); the rest wait their turn (status).
  const liveRole = tone === 'danger' ? 'alert' : 'status';
  if (variant === 'note') {
    return (
      <span className={`${styles.note} ${styles[tone]}`}>
        <Icon name={toneIcon} size={16} />
        {title}
      </span>
    );
  }
  if (variant === 'banner') {
    return (
      <div className={`${styles.banner} ${styles[tone]}`} role={liveRole}>
        <Icon name={toneIcon} />
        <p className={styles.message}>
          <strong>{title}</strong> {message}
        </p>
        <AlertAction action={action} actionHref={actionHref} onAction={onAction} />
      </div>
    );
  }
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={liveRole}>
      <span className={styles.badge}>
        <Icon name={toneIcon} size={18} />
      </span>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {action && (actionHref || onAction) ? (
        <div className={styles.actions}>
          <AlertAction action={action} actionHref={actionHref} onAction={onAction} />
        </div>
      ) : null}
    </div>
  );
}

/** A link when the action goes somewhere, a button when it acts on this screen; nothing without either. */
function AlertAction({
  action,
  actionHref,
  onAction,
}: Pick<Props, 'action' | 'actionHref' | 'onAction'>) {
  if (!action) return null;
  if (actionHref) {
    return (
      <a className={styles.link} href={actionHref}>
        {action}
      </a>
    );
  }
  if (onAction) return <Button variant="secondary" label={action} onClick={onAction} />;
  return null;
}
