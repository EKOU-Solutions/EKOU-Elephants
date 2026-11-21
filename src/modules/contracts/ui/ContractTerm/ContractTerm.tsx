import type { ContractDetail } from '../../domain/contract';
import { STATUS_TEXT, shortDate, termSegments } from '../contractText';
import styles from './ContractTerm.module.css';

type Props = {
  /** Fechas del contrato, tal como las entrega la API. Solo se muestran las que haya. */
  dates: ContractDetail['dates'];
  /** Estado del contrato: se dice en una frase, nunca con una etiqueta de color. */
  status: ContractDetail['status'];
};

/** Cuánto dura un contrato: sus fechas o, si al plazo se le agregaron días, el plazo inicial y lo agregado después. */
export function ContractTerm({ dates, status }: Props) {
  const segments = termSegments(dates);
  if (!segments) {
    const known = [
      { label: 'Firma', date: dates.signed },
      { label: 'Inicio', date: dates.start },
      { label: 'Fin', date: dates.end },
    ].filter((item): item is { label: string; date: string } => item.date !== null);
    return (
      <div className={styles.term}>
        <dl className={styles.dates}>
          {known.map(({ label, date }) => (
            <div key={label} className={styles.date}>
              <dt>{label}</dt>
              <dd>{shortDate(date)}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.status}>
          {dates.start === null ? 'SECOP no trae la fecha de inicio. ' : null}
          {dates.end === null ? 'SECOP no trae la fecha de fin. ' : null}
          {STATUS_TEXT[status]}
        </p>
      </div>
    );
  }
  const { initial, added } = segments;
  return (
    <div className={styles.term}>
      {/* Decorative: the same days and dates are written in the list below. On a phone, one bar
          above the list with a key per label; from 768 px each label sits under its own span. */}
      <div className={styles.bar} aria-hidden="true">
        <span className={styles.initial} style={{ flexGrow: initial.days }} />
        <span className={styles.added} style={{ flexGrow: added.days }} />
      </div>
      <ul className={styles.segments}>
        <li style={{ flexGrow: initial.days }}>
          <span className={`${styles.span} ${styles.initial}`} aria-hidden="true" />
          <span className={`${styles.key} ${styles.initial}`} aria-hidden="true" />
          <strong>Plazo inicial · {initial.days} días</strong>
          <span className={styles.range}>
            {shortDate(initial.start)} a {shortDate(initial.end)}
          </span>
        </li>
        <li style={{ flexGrow: added.days }}>
          <span className={`${styles.span} ${styles.added}`} aria-hidden="true" />
          <span className={`${styles.key} ${styles.added}`} aria-hidden="true" />
          <strong>Agregado después · {added.days} días</strong>
          <span className={styles.range}>hasta el {shortDate(added.end)}</span>
        </li>
      </ul>
      <p className={styles.status}>
        Se firmó el {shortDate(dates.signed)}. {STATUS_TEXT[status]}
      </p>
    </div>
  );
}
