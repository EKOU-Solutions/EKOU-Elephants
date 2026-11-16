import type { ReactNode } from 'react';
import { formatNumber } from '../format';
import { LegendKey } from '../LegendKey/LegendKey';
import styles from './KeyFigure.module.css';

type Common = {
  /** Frase de contexto. En porcentaje, `{part}` y `{total}` se reemplazan. */
  context: string;
  /** Fuente y periodo, siempre presentes. */
  source: string;
};

/** Proporción: `part` de `total`, en porcentaje. */
type Share = Common & {
  /** Qué mide. */
  label: string;
  /** Numerador. */
  part: number;
  /** Denominador. Si es 0, la cifra es «Sin datos», nunca 0%. */
  total: number;
  value?: never;
};

/** Cantidad: un conteo con su frase debajo (v1.3.0, página del Mapa). */
type Count = Common & {
  /** Opcional: si la frase de contexto ya nombra lo que se cuenta, la cifra va sin etiqueta. */
  label?: string;
  /** Conteo. `null` es «Sin datos» con la trama gris, nunca 0. */
  value: number | null;
  part?: never;
  total?: never;
};

type Props = Share | Count;

/** Un número grande que se entiende solo, incluso en una captura compartida. */
export function KeyFigure(props: Props) {
  const { label, context, source } = props;
  const count = props.value !== undefined;
  const noData = count ? props.value === null : props.total === 0;
  let figure: ReactNode;
  if (noData) {
    figure = count ? (
      <span className={styles.noData}>
        <LegendKey kind="unknown" className={styles.noDataKey} />
        Sin datos
      </span>
    ) : (
      'Sin datos'
    );
  } else if (count) {
    figure = formatNumber(props.value ?? 0, 0);
  } else {
    figure = (
      <>
        {formatNumber((100 * props.part) / props.total)}
        <span className={styles.unit}>%</span>
      </>
    );
  }
  const text = count
    ? context
    : context
        .replaceAll('{part}', formatNumber(props.part, 0))
        .replaceAll('{total}', formatNumber(props.total, 0));
  return (
    <div className={styles.figure}>
      {label ? <p className={styles.label}>{label}</p> : null}
      <p className={styles.value}>{figure}</p>
      <p className={styles.context}>{text}</p>
      <p className={styles.source}>{source}</p>
    </div>
  );
}
