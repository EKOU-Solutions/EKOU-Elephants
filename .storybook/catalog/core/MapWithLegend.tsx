import { FictionalNote, formatNumber, LEVEL_LABEL, LEVELS, RiskMap, TERRITORIES } from '../shared';

type Props = {
  /** Código del territorio seleccionado (contorno de 2,5 px; el relleno no cambia). */
  selected: string;
};

/** Colorea cada territorio según la proporción de contratos con señales, con leyenda y ficha. */
export function MapWithLegend({ selected }: Props) {
  const t = TERRITORIES.find((x) => x.id === selected);
  return (
    <div className="mapcard">
      <figure>
        <RiskMap
          selected={selected}
          title={`Mapa de ejemplo: proporción de contratos con señales por departamento. ${t?.name ?? 'Ninguno'} seleccionado. Datos ficticios.`}
        />
      </figure>
      <div>
        <div className="el-legend">
          <h3>Contratos analizados con al menos una señal</h3>
          <ul>
            {LEVELS.map((n) => (
              <li key={n}>
                <span className={`el-key el-key-${n}`} aria-hidden="true" />
                {n === 'unknown' ? 'Sin datos suficientes' : LEVEL_LABEL[n]}
              </li>
            ))}
          </ul>
          <p className="note">Rangos por definir (TASK-07). Reparto de ejemplo, datos ficticios.</p>
        </div>
        {t ? (
          <dl className="readout">
            <div>
              <dt>Seleccionado</dt>
              <dd>{t.name}</dd>
            </div>
            <div>
              <dt>Con señales</dt>
              <dd className="el-num">
                {t.analyzed ? `${t.flagged} de ${t.analyzed} (${formatNumber((100 * t.flagged) / t.analyzed)}%)` : 'Sin datos'}
              </dd>
            </div>
            <div>
              <dt>Cobertura</dt>
              <dd className="el-num">
                {t.analyzed} de {t.available} ({formatNumber((100 * t.analyzed) / t.available, 0)}%)
              </dd>
            </div>
            <div>
              <dt>Fuente</dt>
              <dd>SECOP II · 2025</dd>
            </div>
          </dl>
        ) : null}
        <FictionalNote>Una señal es motivo para revisar, no prueba de corrupción.</FictionalNote>
      </div>
    </div>
  );
}
