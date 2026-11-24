import { createContext, useContext, useId, useState } from 'react';
import { Alert } from '../../../../components/ui/Alert/Alert';
import { Button } from '../../../../components/ui/Button/Button';
import { Counter } from '../../../../components/ui/Counter/Counter';
import { LegendKey } from '../../../../components/ui/LegendKey/LegendKey';
import { ProgressBar } from '../../../../components/ui/ProgressBar/ProgressBar';
import { Select } from '../../../../components/ui/Select/Select';
import styles from './ResumenMunicipal.module.css';
import {
  escalaComun,
  formatDinero,
  formatFecha,
  formatPeriodo,
  formatPorcentaje,
  type GastoPublico,
  LLAVE_RUBRO,
  type Nivel,
  NIVEL,
  motivoSinGasto,
  NOMBRE_RUBRO,
  PRIMER_ANIO_CUIPO,
  type ResumenMunicipalDatos,
  quedaLibre,
  repartoPorRubro,
  superaLoRecibido,
  TONO_RUBRO,
} from './resumenModel';

export type ResumenMunicipalProps = {
  /** `loading` keeps the structure with empty hatched bars; `error` offers a retry. */
  status: 'loading' | 'error' | 'ready';
  /** The summary of the chosen year; required when `status` is `ready`. */
  datos?: ResumenMunicipalDatos;
  /** Municipality or department: the noun of the texts (alcaldía / gobernación). */
  nivel: Nivel;
  /** Name of the place, for the title while the first answer has not arrived. */
  nombre?: string;
  /** Year being loaded or shown; missing while the first answer, which says it, has not arrived. */
  anio?: number;
  /** The years of the window; empty until the first answer, so the selector waits for it. */
  anios: number[];
  onAnioChange: (anio: number) => void;
  onReintentar?: () => void;
  /** Starts with the exact-figures table open (the button opens it). */
  detalleAbierto?: boolean;
};

/**
 * True when the summary lives in the side panel (desktop): the header above already shows the year
 * selector and the figure «recibió», so the section does not say them twice.
 */
export const EnPanel = createContext(false);

/** The year selector: in the panel it is in the header, under the title; in the sheet, in the section. */
export function SelectorAnio({
  anio,
  anios,
  onAnioChange,
}: {
  anio: number;
  anios: number[];
  onAnioChange: (anio: number) => void;
}) {
  return (
    <Select
      label="Año"
      hideLabel
      value={String(anio)}
      onChange={(e) => onAnioChange(Number(e.target.value))}
      options={anios.map((a) => ({
        value: String(a),
        label: a < PRIMER_ANIO_CUIPO ? `${a} · sin detalle de gasto` : String(a),
      }))}
    />
  );
}

/** «Gasto público de un municipio»: how much it received, where it went, how far it got. */
export function ResumenMunicipal({
  status,
  datos,
  nivel,
  nombre: nombreDelLugar,
  anio,
  anios,
  onAnioChange,
  onReintentar,
  detalleAbierto = false,
}: ResumenMunicipalProps) {
  const titleId = useId();
  const enPanel = useContext(EnPanel);
  const nombre = datos?.nombre ?? nombreDelLugar;
  return (
    <section className={styles.resumen} aria-labelledby={titleId}>
      {/* In the panel the place's title and the selector are already in the header: the heading stays for screen readers. */}
      <h2 id={titleId} className={enPanel ? styles.srOnly : undefined}>
        Gasto público{nombre ? ` de ${nombre}` : ''}
      </h2>
      {!enPanel && anio !== undefined && anios.length > 0 ? (
        <SelectorAnio anio={anio} anios={anios} onAnioChange={onAnioChange} />
      ) : null}
      <p className={styles.srOnly} aria-live="polite">
        {anunciar(status, datos)}
      </p>
      {status === 'loading' ? <Cargando anio={anio} /> : null}
      {status === 'error' ? (
        <Alert
          variant="inline"
          tone="danger"
          title="No pudimos cargar el resumen"
          message="Revisa tu conexión. El resto de la ficha sigue funcionando."
          action="Intentar de nuevo"
          onAction={onReintentar}
        />
      ) : null}
      {status === 'ready' && datos ? (
        <Listo
          datos={datos}
          nivel={nivel}
          detalleAbierto={detalleAbierto}
          anios={anios}
          onAnioChange={onAnioChange}
        />
      ) : null}
    </section>
  );
}

/** What the screen reader hears when the section changes: the year, the empty state or the error. */
function anunciar(
  status: ResumenMunicipalProps['status'],
  datos: ResumenMunicipalDatos | undefined,
) {
  if (status === 'error') return 'No pudimos cargar el resumen';
  if (status !== 'ready' || !datos) return '';
  if (!datos.gastoPublico && !datos.contratado)
    return `Sin información de ${datos.nombre} en ${datos.anio}`;
  return `Mostrando ${datos.anio}`;
}

function Cargando({ anio }: { anio?: number }) {
  return (
    <div className={styles.cargando} aria-busy="true">
      <p className={styles.suave}>Cargando el resumen{anio === undefined ? '' : ` de ${anio}`}</p>
      <ProgressBar size="thick" segments={[{ value: 1, tone: 'unknown' }]} />
      <ProgressBar segments={[{ value: 1, tone: 'unknown' }]} />
      <ProgressBar segments={[{ value: 1, tone: 'unknown' }]} />
    </div>
  );
}

/** «En 2025 la alcaldía recibió» and the figure: also the key figure of the half-height sheet. */
export function Recibido({ datos, nivel }: { datos: ResumenMunicipalDatos; nivel: Nivel }) {
  const recibido = datos.gastoPublico?.recibido ?? null;
  const cuipo = datos.fuentes.find((f) => f.usadoPara === 'gastoPublico');
  return (
    <>
      <p>
        En {datos.anio} {NIVEL[nivel].entidad} recibió
      </p>
      {recibido === null ? (
        <SinInformacion>Sin información</SinInformacion>
      ) : (
        <p className={styles.cifra}>{formatDinero(recibido, true)}</p>
      )}
      <p className={styles.pequeno}>
        Lo que ingresó a la caja de {NIVEL[nivel].entidad} en el año
        {/* A year still open (or closed with less than 4 quarters) is not a full year: say it in the same sentence. */}
        {datos.gastoPublico && !datos.gastoPublico.completo
          ? ` hasta ${formatPeriodo(datos.gastoPublico.periodo)}`
          : ''}
        .
      </p>
      {cuipo ? (
        <p className={`${styles.pequeno} ${styles.suave}`}>
          Gasto: CUIPO, {cuipo.entidad.replace(/ \(CUIPO\)$/, '')}, corte{' '}
          {formatFecha(cuipo.fechaCorte)}
        </p>
      ) : null}
    </>
  );
}

function SinInformacion({ children }: { children: string }) {
  return (
    <p className={styles.sinInfo}>
      <LegendKey kind="unknown" />
      {children}
    </p>
  );
}

function Listo({
  datos,
  nivel,
  detalleAbierto,
  anios,
  onAnioChange,
}: {
  datos: ResumenMunicipalDatos;
  nivel: Nivel;
  detalleAbierto: boolean;
  anios: number[];
  onAnioChange: (anio: number) => void;
}) {
  const g = datos.gastoPublico;
  const motivo = motivoSinGasto(datos);
  // The detail opens and closes in place: the button stays, focus stays, the page does not jump.
  const [abierto, setAbierto] = useState(detalleAbierto);
  if (!g && !datos.contratado) {
    const otro = [...anios].reverse().find((a) => a !== datos.anio && a >= PRIMER_ANIO_CUIPO);
    return (
      <div className={styles.bloque}>
        <SinInformacion>{`Sin información de ${datos.nombre} en ${datos.anio}`}</SinInformacion>
        <p>
          {datos.anio < PRIMER_ANIO_CUIPO
            ? 'La Contaduría publica este detalle desde 2023.'
            : `Puede que el año aún no tenga reporte o que ${NIVEL[nivel].entidad} no lo haya enviado.`}
        </p>
        {otro ? (
          <Button variant="secondary" label={`Ver ${otro}`} onClick={() => onAnioChange(otro)} />
        ) : null}
      </div>
    );
  }
  return (
    <>
      {g ? (
        <Gasto
          datos={datos}
          nivel={nivel}
          g={g}
          abierto={abierto}
          onAlternar={() => setAbierto((a) => !a)}
        />
      ) : null}
      {motivo ? (
        <div className={styles.bloque}>
          <h3>¿En qué se gastó?</h3>
          <SinInformacion>
            {motivo === 'anio-sin-cuipo'
              ? 'Sin información: la Contaduría publica este detalle desde 2023'
              : `Sin información de gasto de ${datos.nombre} en ${datos.anio}`}
          </SinInformacion>
        </div>
      ) : null}
      <Contratos datos={datos} nivel={nivel} />
      <Fuentes datos={datos} />
    </>
  );
}

function Gasto({
  datos,
  nivel,
  g,
  abierto,
  onAlternar,
}: {
  datos: ResumenMunicipalDatos;
  nivel: Nivel;
  g: GastoPublico;
  abierto: boolean;
  onAlternar: () => void;
}) {
  const idDetalle = useId();
  const enPanel = useContext(EnPanel);
  // With what was received known, the bar is that 100 % and what is left uncommitted is its empty part.
  const libre = quedaLibre(g);
  const reparto = repartoPorRubro(g.rubros, libre === null ? undefined : (g.recibido ?? undefined));
  const porcentajeLibre = libre !== null && g.recibido ? (100 * libre) / g.recibido : 0;
  const escala = escalaComun(g.total);
  const etapas = [
    {
      clave: 'comprometido',
      nombre: 'Comprometido',
      glosa: 'contratos y órdenes ya firmados',
      valor: g.total.comprometido,
    },
    {
      clave: 'obligado',
      nombre: 'Recibido',
      glosa: 'bienes y servicios ya llegaron, estén pagados o no',
      valor: g.total.obligado,
    },
    { clave: 'pagado', nombre: 'Pagado', glosa: 'plata que ya salió', valor: g.total.pagado },
  ] as const;
  return (
    <>
      {g.alcance === 'departamento-isla' ? (
        <Alert
          variant="inline"
          tone="info"
          title="Cifras de todo el departamento"
          message="Son las de San Andrés, Providencia y Santa Catalina como un solo departamento."
        />
      ) : null}
      {enPanel ? null : (
        <div className={styles.bloque}>
          <Recibido datos={datos} nivel={nivel} />
        </div>
      )}
      <div className={styles.bloque}>
        <h3>Y se comprometió a gastar</h3>
        <p className={styles.cifraSecundaria}>{formatDinero(g.total.comprometido, true)}</p>
        <ProgressBar
          size="thick"
          separated
          max={libre === null ? undefined : (g.recibido ?? undefined)}
          segments={reparto
            .filter((r) => r.valor > 0)
            .map((r) => ({ value: r.valor, tone: TONO_RUBRO[r.clave] }))}
          label={`Comprometido por rubro: ${reparto
            .map(
              (r) =>
                `${NOMBRE_RUBRO[r.clave].nombre.toLowerCase()} ${formatPorcentaje(r.porcentaje)}`,
            )
            .join(
              ', ',
            )}${libre === null ? '' : `, queda libre ${formatPorcentaje(porcentajeLibre)}`}`}
        />
        <ul className={styles.leyenda}>
          {reparto.map((r) => (
            <li key={r.clave}>
              <LegendKey kind={LLAVE_RUBRO[r.clave]} />
              <span>
                {NOMBRE_RUBRO[r.clave].nombre} · {formatDinero(r.valor)}
              </span>
              <b>{formatPorcentaje(r.porcentaje)}</b>
              <span className={styles.glosa}>{NOMBRE_RUBRO[r.clave].glosa}</span>
            </li>
          ))}
          {libre === null ? null : (
            <li>
              <LegendKey kind="neutral" />
              <span>Queda libre · {formatDinero(libre)}</span>
              <b>{formatPorcentaje(porcentajeLibre)}</b>
              <span className={styles.glosa}>lo que entró y todavía no está comprometido</span>
            </li>
          )}
        </ul>
        {superaLoRecibido(g) ? (
          <div className={styles.aviso}>
            <Alert
              variant="note"
              tone="info"
              title="El gasto puede superar lo recibido en el año porque el presupuesto también usa saldos de años anteriores y crédito."
            />
          </div>
        ) : null}
      </div>
      <Button
        variant="secondary"
        label={abierto ? 'Ver menos' : 'Ver hasta dónde llegó el dinero'}
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-controls={idDetalle}
      />
      <div className={abierto ? `${styles.desplegable} ${styles.abierto}` : styles.desplegable}>
        <div id={idDetalle} className={styles.desplegableInterior} inert={!abierto}>
          <Recorrido g={g} anio={datos.anio} escala={escala} etapas={etapas} />
        </div>
      </div>
    </>
  );
}

type EtapaFila = { clave: string; nombre: string; glosa: string; valor: number };

/** The three stages as bars on one scale; the plain-words gloss only where asked (once is enough). */
function BarrasEtapas({
  etapas,
  escala,
  conGlosa,
}: {
  etapas: readonly EtapaFila[];
  escala: number;
  conGlosa: boolean;
}) {
  return (
    <div className={styles.barras}>
      {etapas.map((et) => (
        <div key={et.clave} className={styles.barraConCifra}>
          <span>
            <span>{et.nombre}</span>
            <b>{formatDinero(et.valor)}</b>
          </span>
          {conGlosa ? (
            <span className={`${styles.pequeno} ${styles.suave}`}>{et.glosa}</span>
          ) : null}
          <ProgressBar
            max={escala}
            segments={[{ value: et.valor, tone: 'ink' }]}
            label={`${et.nombre}: ${formatDinero(et.valor)}`}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Only when the person asks for detail: how far the money went, in three clearly separated parts
 * (this year, reservas, cuentas por pagar), each said in one plain sentence and drawn as bars.
 */
function Recorrido({
  g,
  anio,
  escala,
  etapas,
}: {
  g: GastoPublico;
  anio: number;
  escala: number;
  etapas: readonly EtapaFila[];
}) {
  const anteriores = [
    {
      id: 'reservas',
      nombre: 'Reservas',
      glosa:
        'Compromisos de años anteriores que no alcanzaron a recibirse o pagarse y se terminan este año.',
      d: g.reservas,
    },
    {
      id: 'cuentas',
      nombre: 'Cuentas por pagar',
      glosa:
        'Bienes y servicios que llegaron en años anteriores y todavía no se habían pagado; se saldan este año.',
      d: g.cuentasPorPagar,
    },
  ];
  return (
    <div className={styles.bloque}>
      <h3>¿Hasta dónde llegó ese dinero?</h3>
      <p className={`${styles.pequeno} ${styles.suave}`}>
        Cada peso pasa por tres pasos: se compromete (se firma), se recibe (llega el bien o el
        servicio) y se paga.
      </p>
      <div className={styles.seccion}>
        <h4>Gasto de {anio}</h4>
        <p className={`${styles.pequeno} ${styles.suave}`}>
          Lo que se comprometió, recibió y pagó con el presupuesto de este año.
        </p>
        <BarrasEtapas etapas={etapas} escala={escala} conGlosa />
      </div>
      {anteriores.map((b) => (
        <div key={b.id} className={styles.seccion}>
          <h4>{b.nombre} · de años anteriores</h4>
          <p className={`${styles.pequeno} ${styles.suave}`}>{b.glosa}</p>
          {b.d === null ? (
            <p>No reportó</p>
          ) : (
            <BarrasEtapas
              etapas={[
                { clave: 'c', nombre: 'Comprometido', glosa: '', valor: b.d.total.comprometido },
                { clave: 'o', nombre: 'Recibido', glosa: '', valor: b.d.total.obligado },
                { clave: 'p', nombre: 'Pagado', glosa: '', valor: b.d.total.pagado },
              ]}
              escala={escalaComun(b.d.total)}
              conGlosa={false}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Contratos({ datos, nivel }: { datos: ResumenMunicipalDatos; nivel: Nivel }) {
  // In the panel a municipality's count is already the key figure under the title: not said twice.
  const cifraArriba = useContext(EnPanel) && nivel === 'municipio';
  const c = datos.contratado;
  const sinUbicar = c !== null && c.valor === null && c.contratos === 0;
  return (
    <div className={styles.bloque}>
      <h3>Contratos firmados (SECOP)</h3>
      {c === null ? <SinInformacion>Sin información</SinInformacion> : null}
      {c !== null ? (
        <p className={styles.aclaracion}>
          Lo contratado no es lo gastado: es lo prometido en contratos firmados en el año.
        </p>
      ) : null}
      {sinUbicar ? (
        <p>
          No encontramos contratos ubicados con certeza en este {NIVEL[nivel].lugar} en {datos.anio}
          .
        </p>
      ) : null}
      {c !== null && !sinUbicar && !cifraArriba ? (
        <Counter
          layout="adaptive"
          counts={[{ value: c.contratos, label: `contratos firmados en ${datos.anio}` }]}
        />
      ) : null}
      {c?.valor != null ? (
        <p>
          <b className={styles.cifraSecundaria}>{formatDinero(c.valor)}</b>
          <br />
          <span className={styles.pequeno}>en contratos firmados en {datos.anio}</span>
        </p>
      ) : null}
      {c !== null && c.valor === null && c.contratos > 0 ? (
        <SinInformacion>Sin información del valor</SinInformacion>
      ) : null}
    </div>
  );
}

/** The spending source and its cut are said once, under the figure «recibió»; here, the contracts'. */
function Fuentes({ datos }: { datos: ResumenMunicipalDatos }) {
  const secop = datos.fuentes.find((f) => f.usadoPara === 'contratado');
  if (!secop) return null;
  return (
    <div className={styles.pie}>
      <p>Contratos: SECOP II, corte {formatFecha(secop.fechaCorte)}</p>
    </div>
  );
}
