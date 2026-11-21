import { useEffect, useRef, useState } from 'react';
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

/** How long a floating confirmation stays before it closes by itself. An error never closes by itself. */
export const TOAST_DURATION_MS = 5000;

/** How a floating alert was closed: its button, the Escape key, or its time ran out. */
export type ToastDismissal = 'close' | 'escape' | 'timeout';

type Props = {
  /** Banner: afecta toda la vista (uno a la vez, arriba). En línea: afecta una sección. Nota: matiza una cifra. Flotante (`toast`): confirma una acción que no cambia la página («Enlace copiado.»); queda fija abajo, sobre el contenido. */
  variant: 'banner' | 'inline' | 'note' | 'toast';
  /** Tono del mensaje de la interfaz. Nunca se usa para calificar el riesgo de un territorio. */
  tone: Tone;
  /** Qué pasó. En la flotante, vacío deja solo la región viva: móntala así desde el inicio para que el lector de pantalla anuncie el mensaje cuando llegue. */
  title: string;
  /** Qué puede hacer la persona. */
  message?: string;
  /** Una salida en cada error: reintentar o seguir. */
  action?: string;
  /** Si la acción lleva a otro lugar: a dónde. Se muestra como enlace. */
  actionHref?: string;
  /** Si la acción ocurre en la pantalla actual: qué hace. Se muestra como botón. */
  onAction?: () => void;
  /**
   * Solo en la flotante: avisa que hay que quitarla y cómo se cerró. Se cierra con «Cerrar», con Escape y,
   * si no es un error, sola a los `TOAST_DURATION_MS` (5 segundos; el tiempo se detiene mientras el puntero
   * o el foco están sobre ella). Un error se queda hasta que la persona lo cierre.
   */
  onDismiss?: (how: ToastDismissal) => void;
};

/** Avisa algo sobre la interfaz o la información: qué pasó y qué puede hacer la persona. */
export function Alert({
  variant,
  tone,
  title,
  message,
  action,
  actionHref,
  onAction,
  onDismiss,
}: Props) {
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
  if (variant === 'toast') {
    return <Toast tone={tone} title={title} message={message} onDismiss={onDismiss} />;
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

type ToastProps = Pick<Props, 'tone' | 'title' | 'message' | 'onDismiss'>;

function Toast({ tone, title, message, onDismiss }: ToastProps) {
  // The pointer or the focus is on it: the person is reading or about to act, so time stops.
  const [held, setHeld] = useState(false);
  // The latest callback, so an inline function does not restart the timer on every render.
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  // Escape removes it without moving focus, so it never keeps a focused control hidden (WCAG 2.4.11).
  useEffect(() => {
    if (!title) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss.current?.('escape');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [title]);

  // An error says what to do next: it stays until the person closes it (WCAG 2.2.1).
  useEffect(() => {
    if (!title || tone === 'danger' || held) return;
    const timer = setTimeout(() => dismiss.current?.('timeout'), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [title, tone, held]);

  // The live region stays mounted, even empty: a region that arrives with its text is not announced.
  return (
    <div className={styles.toastRegion} role={tone === 'danger' ? 'alert' : 'status'}>
      {title ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the timer; the control is «Cerrar»
        <div
          className={`${styles.toast} ${styles[tone]}`}
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          <span className={styles.badge}>
            <Icon name={ICON[tone]} size={18} />
          </span>
          <p className={styles.message}>
            <strong>{title}</strong> {message}
          </p>
          {onDismiss ? (
            <Button
              variant="text"
              label="Cerrar"
              hideLabel
              icon={<Icon name="x" />}
              onClick={() => onDismiss('close')}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
