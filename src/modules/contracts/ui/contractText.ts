// Wording and formats of the contract detail page (docs/design/pages/contract-detail/spec.md §2 and §6).
import { formatNumber } from '../../../components/ui/format';
import type { ContractDetail, ContractSource, ContractStatus } from '../domain/contract';

const CENTS = 100;
const MILLION = 1_000_000;
const DAY_MS = 86_400_000;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const SOURCE_NAME: Record<ContractSource, string> = {
  secop_i: 'SECOP I',
  secop_ii: 'SECOP II',
};

/** Cents → «$ 67.815.383». */
export function exactPesos(cents: number): string {
  return `$ ${formatNumber(Math.round(cents / CENTS), 0)}`;
}

/** Cents → «$ 67,8 millones», «$ 8,8 billones»; under a million, the exact value. */
export function shortPesos(cents: number): string {
  const pesos = Math.round(cents / CENTS);
  if (Math.abs(pesos) < MILLION) return exactPesos(cents);
  // Rounded first, so 999.999,96 millions reads «1 billón» and not «1.000.000 millones».
  const millions = Math.round(pesos / (MILLION / 10)) / 10;
  const [amount, one, many] =
    Math.abs(millions) >= MILLION
      ? [millions / MILLION, 'billón', 'billones']
      : [millions, 'millón', 'millones'];
  const text = formatNumber(amount, 1);
  return `$ ${text} ${text === '1' ? one : many}`;
}

/** «2025-06-09» → «9 jun 2025». Reads the text, so no time zone can move the day. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** 0.2089 → «20,9 %». The sign is said in words («subió», «bajó»). */
export function percent(ratio: number): string {
  return `${formatNumber(Math.abs(ratio) * 100, 1)} %`;
}

/** «datos al 7 nov 2026»; without the cut date, only the month of the cut: «datos de nov 2026». */
export function cutLabel(cut: string, cutDate?: string): string {
  if (cutDate) return `datos al ${shortDate(cutDate)}`;
  const [y, m] = cut.split('-').map(Number);
  return `datos de ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** Lower case and without accents: SECOP I and II write the same word differently. */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const HEADLINE: Record<string, string> = {
  'prestacion de servicios': 'Contrato de prestación de servicios',
  obra: 'Contrato de obra',
  suministro: 'Contrato de suministro',
  suministros: 'Contrato de suministro',
  compraventa: 'Contrato de compraventa',
  interventoria: 'Contrato de interventoría',
  consultoria: 'Contrato de consultoría',
  'arrendamiento de inmuebles': 'Contrato de arrendamiento',
  'arrendamiento de muebles': 'Contrato de arrendamiento',
  seguros: 'Contrato de seguros',
  comodato: 'Contrato de comodato',
};

/** The `h1`: the contract type in common words; «Contrato» for any other, «Otro» or null. */
export function headline(type: string | null): string {
  return (type && HEADLINE[fold(type)]) || 'Contrato';
}

/** «{titular} · {entidad} · EKOU Elephants». */
export function pageTitle(contract: Pick<ContractDetail, 'type' | 'buyer'>): string {
  return `${headline(contract.type)} · ${contract.buyer.name} · EKOU Elephants`;
}

export interface MethodText {
  /** The method with its law. */
  name: string;
  explanation: string | null;
}

/** In the order of the spec: the first word found wins. */
const METHODS: { words: string[]; text: MethodText }[] = [
  {
    words: ['directa'],
    text: {
      name: 'Contratación directa (Ley 1150 de 2007)',
      explanation: 'La entidad contrata sin concurso; la ley lo permite en ciertos casos.',
    },
  },
  {
    words: ['minima cuantia'],
    text: {
      name: 'Mínima cuantía (Ley 1474 de 2011)',
      explanation:
        'Compra de bajo valor: la entidad invita a ofertar y elige el menor precio que cumpla.',
    },
  },
  {
    words: ['licitacion'],
    text: {
      name: 'Licitación pública (Ley 80 de 1993)',
      explanation: 'Concurso abierto: cualquiera que cumpla los requisitos puede ofertar.',
    },
  },
  {
    words: ['abreviada', 'subasta'],
    text: {
      name: 'Selección abreviada (Ley 1150 de 2007)',
      explanation: 'Concurso más corto que la licitación, para ciertos bienes, servicios y montos.',
    },
  },
  {
    words: ['concurso de meritos'],
    text: {
      name: 'Concurso de méritos (Ley 1150 de 2007)',
      explanation: 'Concurso para consultorías: se elige por experiencia y calidad, no por precio.',
    },
  },
  {
    words: ['regimen especial'],
    text: {
      name: 'Régimen especial',
      explanation: 'La entidad contrata con reglas propias, distintas de las generales.',
    },
  },
];

/** The procurement method with its law and a one-sentence explanation; unknown text goes as SECOP writes it. */
export function methodText(procurementMethod: string): MethodText {
  const folded = fold(procurementMethod);
  const known = METHODS.find((m) => m.words.some((word) => folded.includes(word)));
  return known?.text ?? { name: procurementMethod, explanation: null };
}

export interface ValueText {
  /** The big figure; null when the page shows none. */
  figure: string | null;
  /** No value at all: «Sin datos» with the hatch, never 0. */
  noData: boolean;
  sentence: string;
  /** The value has a magnitude alert: the page warns before anyone quotes it. */
  unreliable: boolean;
}

/** Every variant of «¿Cuánto vale?» (spec, «Variantes del valor»). */
export function valueText(amounts: ContractDetail['amounts']): ValueText {
  const { currentCents: current, initialCents: initial, changePct, reliable } = amounts;
  const plain = { noData: false, unreliable: false };
  if (current === null)
    return {
      ...plain,
      figure: null,
      noData: true,
      sentence: 'SECOP no trae un valor que podamos mostrar.',
    };
  if (!reliable)
    return {
      figure: null,
      noData: false,
      unreliable: true,
      sentence: `SECOP registra ${exactPesos(current)}.${
        initial === null ? '' : ` Se firmó por ${exactPesos(initial)}.`
      }`,
    };
  if (current === 0) return { ...plain, figure: null, sentence: 'SECOP lo registra sin valor.' };
  const figure = shortPesos(current);
  const now = exactPesos(current);
  // A signed value of $ 0 is a gap of the record, not a price: it reads as unknown.
  if (initial === null || initial === 0)
    return { ...plain, figure, sentence: `${now}. Sin datos del valor al firmar.` };
  if (current === initial)
    return { ...plain, figure, sentence: `${now}. No ha cambiado desde la firma.` };
  const verb = current > initial ? 'subió' : 'bajó';
  const share = changePct === null ? '' : ` (${percent(changePct)})`;
  return {
    ...plain,
    figure,
    sentence: `Se firmó por ${exactPesos(initial)}: ${verb} ${shortPesos(
      Math.abs(current - initial),
    )}${share}. Hoy vale ${now}.`,
  };
}

/** What SECOP says about payments; an unreported payment is never «$ 0». */
export function paymentText(source: ContractSource, paidCents: number | null): string {
  if (paidCents !== null) return `Pagado según SECOP: ${exactPesos(paidCents)}`;
  return source === 'secop_i'
    ? 'SECOP I no publica cuánto se ha pagado.'
    : 'La entidad no ha reportado pagos en SECOP.';
}

/** The status is a sentence, never a coloured tag: «plazo vencido sin cierre» is not a signal. */
export const STATUS_TEXT: Record<ContractStatus, string> = {
  not_started: 'Todavía no empieza.',
  active: 'Está en ejecución.',
  suspended: 'Está suspendido, según SECOP.',
  finished: 'Ya terminó.',
  expired_unclosed:
    'Ya pasó la fecha de fin y SECOP no registra el cierre. Es común: muchas entidades no registran el cierre.',
};

export interface TermSegments {
  /** From the start to the end the contract had when signed (end minus the added days). */
  initial: { days: number; start: string; end: string };
  /** The days added afterwards, up to the current end. */
  added: { days: number; end: string };
}

const utcDay = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
};

/**
 * The two spans of the term, or null when they must not be drawn: no added days, no start or end,
 * an end before the start, or as many added days as the whole term.
 */
export function termSegments(dates: ContractDetail['dates']): TermSegments | null {
  const { start, end, addedDays } = dates;
  if (!start || !end || !addedDays || addedDays <= 0) return null;
  const total = Math.round((utcDay(end) - utcDay(start)) / DAY_MS);
  if (total < 0 || addedDays >= total) return null;
  const initialEnd = new Date(utcDay(end) - addedDays * DAY_MS).toISOString().slice(0, 10);
  return {
    initial: { days: total - addedDays, start: start.slice(0, 10), end: initialEnd },
    added: { days: addedDays, end: end.slice(0, 10) },
  };
}
