import { type ReactNode, type Ref, useRef, useState } from 'react';
import { Alert } from '../../../../components/ui/Alert/Alert';
import { Button } from '../../../../components/ui/Button/Button';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { LegendKey } from '../../../../components/ui/LegendKey/LegendKey';
import { SignalItem, type SignalLevel } from '../../../../components/ui/SignalItem/SignalItem';
import type { ContractDetail } from '../../domain/contract';
import { ContractTerm } from '../ContractTerm/ContractTerm';
import {
  cutLabel,
  headline,
  methodText,
  paymentText,
  SOURCE_NAME,
  valueText,
} from '../contractText';
import styles from './ContractDetailPage.module.css';

export type ContractDetailState =
  | { status: 'loading' }
  /** La ficha. `cutDate`: fecha ISO del corte («datos al…»); sin ella, la página dice solo el mes del corte. */
  | { status: 'ready'; contract: ContractDetail; cutDate?: string }
  /** 404 o id con forma inválida. `origin`: llegó por un enlace (`link`) o venía de otra página de Elephants (`app`). */
  | { status: 'not_found'; origin: 'link' | 'app' }
  /** 503 o falla de red: se ofrece «Reintentar». */
  | { status: 'unavailable' };

/** En qué terminó compartir: lo hizo el menú del sistema (o la persona lo cerró), se copió el enlace, o falló. */
export type ShareOutcome = 'done' | 'copied' | 'failed';

export interface PreviewSignal {
  /** Título corto de la señal, con el hecho. */
  title: string;
  /** El hecho que la sustenta, con su número. */
  fact: string;
  /** Gravedad de ejemplo; la real saldrá de la metodología (TASK-07 y TASK-13). */
  level?: SignalLevel;
}

export interface ContractDetailPageProps {
  /** Qué muestra la página: carga, la ficha, «no existe» o «datos no disponibles». */
  state: ContractDetailState;
  /** Recibe el `h1`, para que quien usa la página ponga el foco en él al llegar. */
  titleRef?: Ref<HTMLHeadingElement>;
  /** «Reintentar» del estado «datos no disponibles». */
  onRetry?: () => void;
  /** «Volver» del estado «no existe» cuando la persona venía de Elephants: el «atrás» del navegador. */
  onBack?: () => void;
  /** «Compartir esta ficha»: abre el menú de compartir del sistema o, si no hay, copia el enlace. Devuelve en qué terminó. */
  onShare: () => Promise<ShareOutcome>;
  /** «Copiar»: recibe el número en SECOP y devuelve si llegó al portapapeles. */
  onCopy: (text: string) => Promise<boolean>;
  /**
   * SOLO para la vista previa de Storybook: la API no entrega señales hasta TASK-13. La página dice
   * que son señales de ejemplo. La aplicación nunca la pasa.
   */
  previewSignals?: PreviewSignal[];
}

const MAP_PATH = '/mapa';
/** «Leer completo» only appears past this length; shorter objects are shown whole. */
const LONG_DESCRIPTION = 220;
type Notice = { tone: 'success' | 'danger'; title: string; message?: string };
const SHARE_NOTICE: Record<ShareOutcome, Notice | undefined> = {
  done: undefined,
  copied: { tone: 'success', title: 'Enlace copiado.' },
  failed: {
    tone: 'danger',
    title: 'No se pudo compartir.',
    message: 'Copia la dirección de la página.',
  },
};
const COPIED: Notice = { tone: 'success', title: 'Número copiado.' };
const NOT_COPIED: Notice = {
  tone: 'danger',
  title: 'No se pudo copiar.',
  message: 'Selecciona el número y cópialo.',
};

/** Contract detail (TASK-12): what was contracted, between whom, for how much and how to check it. */
export function ContractDetailPage({
  state,
  titleRef,
  onRetry,
  onBack,
  onShare,
  onCopy,
  previewSignals,
}: ContractDetailPageProps) {
  const [notice, setNotice] = useState<Notice>();
  // The button that caused the notice: focus returns to it when the person closes the notice.
  const trigger = useRef<HTMLElement>(null);
  /** Empties the notice first, so a repeated message is announced and seen again. */
  const announce = async (from: HTMLElement, result: Promise<Notice | undefined>) => {
    trigger.current = from;
    setNotice(undefined);
    setNotice(await result);
  };

  if (state.status === 'loading') {
    return (
      <main className={styles.page} aria-busy="true">
        <div className={styles.top}>
          <BackLink href={MAP_PATH} label="Mapa" />
        </div>
        <Title titleRef={titleRef}>Contrato</Title>
        <div className={styles.recover}>
          <Alert variant="inline" tone="info" title="Cargando el contrato…" />
        </div>
      </main>
    );
  }
  if (state.status === 'unavailable') {
    return (
      <main className={styles.page}>
        <Title titleRef={titleRef}>Contrato</Title>
        <div className={styles.recover}>
          <Alert
            variant="inline"
            tone="danger"
            title="No pudimos cargar este contrato"
            message="Vuelve a intentarlo en un momento."
            action={onRetry ? 'Reintentar' : undefined}
            onAction={onRetry}
          />
          <Button variant="secondary" label="Ir al mapa" href={MAP_PATH} />
        </div>
      </main>
    );
  }
  if (state.status === 'not_found') {
    return (
      <main className={styles.page}>
        <Title titleRef={titleRef}>No encontramos ese contrato</Title>
        <div className={styles.recover}>
          <p className={styles.text}>
            Puede que el enlace esté incompleto, o que el contrato no esté entre los que tenemos:
            los firmados desde 2021 y ubicados en un municipio.
          </p>
          {state.origin === 'app' && onBack ? (
            <Button
              variant="primary"
              label="Volver"
              icon={<Icon name="arrow-left" />}
              onClick={onBack}
            />
          ) : (
            <Button variant="primary" label="Ir al mapa" href={MAP_PATH} />
          )}
        </div>
      </main>
    );
  }

  const { contract, cutDate } = state;
  const { location, buyer, supplier, amounts } = contract;
  const source = SOURCE_NAME[contract.source];
  const dataDate = cutLabel(contract.cut, cutDate);
  const value = valueText(amounts);
  const method = contract.procurementMethod ? methodText(contract.procurementMethod) : undefined;
  const signals = previewSignals?.length ? previewSignals : undefined;

  const actions = (at: 'top' | 'end') => (
    <>
      <Button
        variant="secondary"
        label="Compartir esta ficha"
        icon={<Icon name="share-2" />}
        onClick={(event) =>
          announce(
            event.currentTarget,
            onShare().then((outcome) => SHARE_NOTICE[outcome]),
          )
        }
      />
      {contract.sourceUrl ? (
        <Button
          variant="primary"
          label={`Ver el registro en ${source}`}
          href={contract.sourceUrl}
          external
        />
      ) : at === 'end' ? (
        <p className={styles.small}>
          SECOP no trae el enlace a este contrato. Búscalo en SECOP con el número.
        </p>
      ) : null}
    </>
  );

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <BackLink
          href={`${MAP_PATH}/${location.municipality.code}`}
          label={location.municipality.name}
        />
        <div className={styles.topActions}>{actions('top')}</div>
      </div>

      <header className={styles.head}>
        <p className={styles.kicker}>
          {/* Bogotá, D.C. is its own department: said once. */}
          {location.municipality.name === location.department.name
            ? location.municipality.name
            : `${location.municipality.name}, ${location.department.name}`}
        </p>
        <Title titleRef={titleRef}>{headline(contract.type)}</Title>
        <p>{buyer.name}</p>
      </header>

      {contract.provisional || signals ? (
        <div className={styles.notices}>
          {contract.provisional ? (
            <Alert
              variant="inline"
              tone="info"
              title="Contrato reciente."
              message="SECOP puede no haberlo cargado completo todavía."
            />
          ) : null}
          {signals ? (
            <>
              <Alert
                variant="inline"
                tone="warning"
                title="Señales de ejemplo."
                message="Todavía no se calculan: están aquí para mostrar el diseño. Los datos del contrato son reales."
              />
              <p className={styles.flag}>
                {signals.length === 1
                  ? 'Tiene 1 señal para revisar'
                  : `Tiene ${signals.length} señales para revisar`}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      <Step id="contract-value" question="¿Cuánto vale?" main>
        {value.figure ? <p className={styles.figure}>{value.figure}</p> : null}
        {value.noData ? (
          <p className={`${styles.figure} ${styles.noData}`}>
            <LegendKey kind="unknown" className={styles.noDataKey} />
            Sin datos
          </p>
        ) : null}
        <p className={styles.text}>{value.sentence}</p>
        {value.unreliable ? (
          <Alert
            variant="inline"
            tone="warning"
            title="Esta cifra puede tener un error de registro en SECOP"
            message="Revisa el contrato en la fuente antes de citarla."
          />
        ) : null}
        <p className={styles.small}>{paymentText(contract.source, amounts.paidCents)}</p>
        <p className={styles.small}>
          Según {source} · {dataDate}
        </p>
      </Step>

      {signals ? (
        <Step id="contract-signals" question="¿Por qué tiene señales?" mark="Ejemplo" main>
          <ol className={styles.signals}>
            {signals.map((signal) => (
              <SignalItem key={signal.title} {...signal} />
            ))}
          </ol>
          <p className={styles.note}>
            Una señal pide revisar. No prueba nada irregular: puede tener una explicación.
          </p>
        </Step>
      ) : null}

      <Step id="contract-object" question="¿Qué se contrató?">
        {contract.description === null ? (
          <p className={styles.text}>SECOP no trae el objeto de este contrato.</p>
        ) : (
          <Description text={contract.description} />
        )}
      </Step>

      <Step id="contract-parties" question="¿Entre quiénes?">
        <dl className={styles.parties}>
          <div>
            <dt>Entidad que contrata</dt>
            <dd>
              <strong>{withTaxId(buyer.name, buyer.taxId)}</strong>
            </dd>
          </div>
          <div>
            <dt>Contratista</dt>
            <SupplierAnswer supplier={supplier} />
          </div>
        </dl>
      </Step>

      <Step id="contract-term" question="¿Cuánto dura?">
        <ContractTerm dates={contract.dates} status={contract.status} />
      </Step>

      {method ? (
        <Step id="contract-method" question="¿Cómo se eligió al contratista?">
          <p className={styles.text}>
            <strong>
              {method.name}
              {method.explanation ? '.' : ''}
            </strong>{' '}
            {method.explanation}
          </p>
          {contract.methodJustification ? (
            <p className={styles.small}>Motivo registrado: {contract.methodJustification}</p>
          ) : null}
        </Step>
      ) : null}

      <footer className={styles.end}>
        <div className={styles.endInfo}>
          <p>
            Fuente: {source}, Colombia Compra Eficiente · {dataDate}
          </p>
          <p>
            Número en SECOP: {/* The number and its «Copiar» wrap together, never apart. */}
            <span className={styles.idLine}>
              {contract.id}
              <Button
                variant="text"
                label="Copiar"
                aria-label="Copiar el número en SECOP"
                onClick={(event) =>
                  announce(
                    event.currentTarget,
                    onCopy(contract.id).then((copied) => (copied ? COPIED : NOT_COPIED)),
                  )
                }
              />
            </span>
          </p>
          <p>SECOP es el registro público de los contratos del Estado.</p>
          <p>Elephants, de EKOU</p>
        </div>
        <div className={styles.endActions}>{actions('end')}</div>
      </footer>

      <Alert
        variant="toast"
        tone={notice?.tone ?? 'success'}
        title={notice?.title ?? ''}
        message={notice?.message}
        onDismiss={(how) => {
          setNotice(undefined);
          // «Cerrar» disappears with the notice: focus goes back to what the person had touched.
          if (how === 'close') trigger.current?.focus();
        }}
      />
    </main>
  );
}

const withTaxId = (name: string, taxId: string | null) => (taxId ? `${name} · NIT ${taxId}` : name);

/** Only a company is named; a natural person and a missing document each have their own words. */
function SupplierAnswer({ supplier }: { supplier: ContractDetail['supplier'] }) {
  if (supplier.kind === 'company') {
    return (
      <dd>
        <strong>{withTaxId(supplier.name, supplier.taxId)}</strong>
      </dd>
    );
  }
  if (supplier.kind === 'natural_person') {
    return (
      <dd>
        <strong>Persona natural</strong>
        No mostramos nombres de personas para proteger sus datos. El registro oficial está en SECOP.
      </dd>
    );
  }
  return (
    <dd>
      <strong>Sin datos del contratista</strong>
      SECOP no trae su documento.
    </dd>
  );
}

/** The one `h1` of the page. Focus lands here on arrival; it is not a control. */
function Title({ titleRef, children }: { titleRef?: Ref<HTMLHeadingElement>; children: string }) {
  return (
    <h1 className={styles.title} ref={titleRef} tabIndex={-1}>
      {children}
    </h1>
  );
}

/** The «Volver» pattern: always a fixed destination, named; never the browser history. */
function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <nav aria-label="Volver">
      <Button variant="secondary" label={label} icon={<Icon name="arrow-left" />} href={href} />
    </nav>
  );
}

/** A band of the page: its question (`h2`) and the answer. `main` bands have the strong rule. */
function Step({
  id,
  question,
  mark,
  main = false,
  children,
}: {
  id: string;
  question: string;
  /** A small word beside the question: «Ejemplo» on the signals preview. */
  mark?: string;
  main?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.step}${main ? ` ${styles.main}` : ''}`} aria-labelledby={id}>
      <div className={styles.question}>
        <h2 id={id}>{question}</h2>
        {mark ? <p className={styles.mark}>{mark}</p> : null}
      </div>
      <div className={styles.answer}>{children}</div>
    </section>
  );
}

/** The object as SECOP writes it; a long one is cut to about three lines and opens in place. */
function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LONG_DESCRIPTION;
  return (
    <>
      <p className={styles.small}>Objeto, según SECOP</p>
      <p
        id="contract-object-text"
        className={`${styles.text}${long && !open ? ` ${styles.clamped}` : ''}`}
      >
        {text}
      </p>
      {long ? (
        <div>
          <Button
            variant="text"
            label={open ? 'Leer menos' : 'Leer completo'}
            aria-expanded={open}
            aria-controls="contract-object-text"
            onClick={() => setOpen(!open)}
          />
        </div>
      ) : null}
    </>
  );
}
