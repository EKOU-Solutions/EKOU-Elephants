import { describe, expect, it } from 'vitest';
import type { ContractDetail } from '../domain/contract';
import {
  noValueContract,
  pastoContract,
  providenciaContract,
  unreliableValueContract,
  zeroValueContract,
} from './ContractDetailPage/ContractDetailPage.fixtures';
import {
  cutLabel,
  exactPesos,
  headline,
  methodText,
  pageDescription,
  pageTitle,
  paymentText,
  percent,
  STATUS_TEXT,
  shortDate,
  shortPesos,
  termSegments,
  valueText,
} from './contractText';

const amounts = (over: Partial<ContractDetail['amounts']>): ContractDetail['amounts'] => ({
  currentCents: 6781538313,
  initialCents: 5609556600,
  changePct: 0.2089,
  exceedsLegalAdditionLimit: false,
  reliable: true,
  paidCents: null,
  ...over,
});

describe('money', () => {
  it('writes exact pesos from cents', () => {
    expect(exactPesos(6781538313)).toBe('$ 67.815.383');
    expect(exactPesos(0)).toBe('$ 0');
  });

  it('shortens from a million and from a billion (10^12), with one decimal', () => {
    expect(shortPesos(6781538313)).toBe('$ 67,8 millones');
    expect(shortPesos(1092000000)).toBe('$ 10,9 millones');
    expect(shortPesos(880_000_000_000_000)).toBe('$ 8,8 billones');
    expect(shortPesos(218520866700)).toBe('$ 2.185,2 millones');
  });

  it('keeps the exact value under a million', () => {
    expect(shortPesos(85000000)).toBe('$ 850.000');
  });

  it('says one «millón» and one «billón», and never «1.000.000 millones»', () => {
    expect(shortPesos(100000000)).toBe('$ 1 millón');
    expect(shortPesos(99_999_996_000_000)).toBe('$ 1 billón');
  });
});

describe('dates and percentages', () => {
  it('writes the date as text says it, in any time zone', () => {
    expect(shortDate('2025-06-09')).toBe('9 jun 2025');
    expect(shortDate('2025-12-31T23:59:59-05:00')).toBe('31 dic 2025');
  });

  it('writes the percentage with a comma, a space and no sign', () => {
    expect(percent(0.2089)).toBe('20,9 %');
    expect(percent(-0.1978)).toBe('19,8 %');
  });

  it('dates the data with the cut day, or with the month when the day is unknown', () => {
    expect(cutLabel('2026-11', '2026-11-07')).toBe('datos al 7 nov 2026');
    expect(cutLabel('2026-11')).toBe('datos de nov 2026');
  });
});

describe('headline', () => {
  it('names the common types, whatever their capitals', () => {
    expect(headline('Obra')).toBe('Contrato de obra');
    expect(headline('Prestación de Servicios')).toBe('Contrato de prestación de servicios');
    expect(headline('SUMINISTROS')).toBe('Contrato de suministro');
    expect(headline('Arrendamiento de inmuebles')).toBe('Contrato de arrendamiento');
  });

  it('falls back to «Contrato» for any other type, «Otro» or null', () => {
    expect(headline('Decreto 092 de 2017')).toBe('Contrato');
    expect(headline('Otro')).toBe('Contrato');
    expect(headline(null)).toBe('Contrato');
  });

  it('builds the tab title', () => {
    expect(pageTitle({ type: 'Obra', buyer: { name: 'ALCALDIA DE PASTO', taxId: null } })).toBe(
      'Contrato de obra · ALCALDIA DE PASTO · EKOU Elephants',
    );
  });
});

describe('methodText', () => {
  it('recognises the same method as SECOP I and SECOP II write it, with its law', () => {
    const direct = 'Contratación directa (Ley 1150 de 2007)';
    expect(methodText('Contratación directa').name).toBe(direct);
    expect(methodText('Contratación Directa (Ley 1150 de 2007)').name).toBe(direct);
    expect(methodText('Contratación directa (con ofertas)').name).toBe(direct);
    expect(methodText('Mínima cuantía').name).toBe('Mínima cuantía (Ley 1474 de 2011)');
    expect(methodText('Licitación pública Obra Publica').name).toBe(
      'Licitación pública (Ley 80 de 1993)',
    );
    expect(methodText('Selección Abreviada de Menor Cuantía').name).toBe(
      'Selección abreviada (Ley 1150 de 2007)',
    );
    expect(methodText('Subasta').name).toBe('Selección abreviada (Ley 1150 de 2007)');
    expect(methodText('Concurso de méritos abierto').name).toBe(
      'Concurso de méritos (Ley 1150 de 2007)',
    );
    expect(methodText('Contratación régimen especial').name).toBe('Régimen especial');
    expect(methodText('Contratación directa').explanation).toContain('sin concurso');
  });

  it('shows any other text as SECOP writes it, without explanation', () => {
    expect(methodText('Asociación Público Privada')).toEqual({
      name: 'Asociación Público Privada',
      explanation: null,
    });
  });
});

describe('valueText', () => {
  it('went up', () => {
    expect(valueText(amounts({}))).toEqual({
      figure: '$ 67,8 millones',
      noData: false,
      unreliable: false,
      sentence: 'Se firmó por $ 56.095.566: subió $ 11,7 millones (20,9 %). Hoy vale $ 67.815.383.',
    });
  });

  it('went down', () => {
    const text = valueText(amounts({ currentCents: 4500000000, changePct: -0.1978 }));
    expect(text.figure).toBe('$ 45 millones');
    expect(text.sentence).toBe(
      'Se firmó por $ 56.095.566: bajó $ 11,1 millones (19,8 %). Hoy vale $ 45.000.000.',
    );
  });

  it('did not change', () => {
    const text = valueText(
      amounts({ currentCents: 1092000000, initialCents: 1092000000, changePct: 0 }),
    );
    expect(text.figure).toBe('$ 10,9 millones');
    expect(text.sentence).toBe('$ 10.920.000. No ha cambiado desde la firma.');
  });

  it('has no value when signed', () => {
    const text = valueText(amounts({ initialCents: null, changePct: null }));
    expect(text.figure).toBe('$ 67,8 millones');
    expect(text.sentence).toBe('$ 67.815.383. Sin datos del valor al firmar.');
  });

  it('reads a signed value of $ 0 as unknown, never «Se firmó por $ 0»', () => {
    expect(valueText(amounts({ initialCents: 0, changePct: null })).sentence).toBe(
      '$ 67.815.383. Sin datos del valor al firmar.',
    );
  });

  it('leaves the percentage out when it cannot be computed', () => {
    expect(valueText(amounts({ changePct: null })).sentence).toBe(
      'Se firmó por $ 56.095.566: subió $ 11,7 millones. Hoy vale $ 67.815.383.',
    );
  });

  it('is $ 0: no big figure', () => {
    expect(valueText(amounts({ currentCents: 0, initialCents: 0, changePct: null }))).toEqual({
      figure: null,
      noData: false,
      unreliable: false,
      sentence: 'SECOP lo registra sin valor.',
    });
  });

  it('is not reliable: no big figure, and the signed value when there is one', () => {
    const text = valueText(
      amounts({ currentCents: 218520866700, initialCents: 146467700, reliable: false }),
    );
    expect(text).toMatchObject({ figure: null, unreliable: true, noData: false });
    expect(text.sentence).toBe('SECOP registra $ 2.185.208.667. Se firmó por $ 1.464.677.');
    expect(
      valueText(amounts({ currentCents: 218520866700, initialCents: null, reliable: false }))
        .sentence,
    ).toBe('SECOP registra $ 2.185.208.667.');
  });

  it('has no value: «Sin datos», never 0', () => {
    expect(valueText(amounts({ currentCents: null, reliable: false }))).toEqual({
      figure: null,
      noData: true,
      unreliable: false,
      sentence: 'SECOP no trae un valor que podamos mostrar.',
    });
  });
});

describe('paymentText', () => {
  it('says the payment, or why there is none: never $ 0', () => {
    expect(paymentText('secop_ii', 2000000000)).toBe('Pagado según SECOP: $ 20.000.000');
    expect(paymentText('secop_ii', null)).toBe('La entidad no ha reportado pagos en SECOP.');
    expect(paymentText('secop_i', null)).toBe('SECOP I no publica cuánto se ha pagado.');
  });
});

describe('status', () => {
  it('has a sentence for each status, and none is a verdict', () => {
    expect(Object.keys(STATUS_TEXT)).toHaveLength(5);
    expect(STATUS_TEXT.expired_unclosed).toContain('Es común');
    for (const text of Object.values(STATUS_TEXT)) expect(text).not.toMatch(/incumpl|irregular/i);
  });
});

describe('termSegments', () => {
  const dates = (over: Partial<ContractDetail['dates']>): ContractDetail['dates'] => ({
    signed: '2025-06-09',
    start: '2025-07-09',
    end: '2026-09-30',
    addedDays: 273,
    ...over,
  });

  it('splits the term: the initial end is the end minus the added days', () => {
    expect(termSegments(dates({}))).toEqual({
      initial: { days: 175, start: '2025-07-09', end: '2025-12-31' },
      added: { days: 273, end: '2026-09-30' },
    });
  });

  it('draws nothing without added days, a start or an end', () => {
    expect(termSegments(dates({ addedDays: null }))).toBeNull();
    expect(termSegments(dates({ addedDays: 0 }))).toBeNull();
    expect(termSegments(dates({ start: null }))).toBeNull();
    expect(termSegments(dates({ end: null }))).toBeNull();
  });

  it('draws nothing when the dates contradict each other', () => {
    expect(termSegments(dates({ end: '2025-07-01' }))).toBeNull();
    expect(termSegments(dates({ addedDays: 448 }))).toBeNull();
    expect(termSegments(dates({ addedDays: 900 }))).toBeNull();
  });
});

describe('pageDescription', () => {
  it('puts the value first with its source and date, and the entity last', () => {
    expect(pageDescription(pastoContract, '2026-11-07')).toBe(
      'Valor: $ 67,8 millones (SECOP II, datos al 7 nov 2026). Contrato de obra en Pasto, Nariño. Entidad: ALCALDIA DE PASTO.',
    );
    expect(pageDescription(pastoContract)).toContain('(SECOP II, datos de nov 2026)');
  });

  it('says «Sin datos» only when the value is missing, and leaves out an uncertain or $ 0 one', () => {
    expect(pageDescription(noValueContract)).toMatch(/^Valor: Sin datos \(/);
    for (const contract of [unreliableValueContract, zeroValueContract]) {
      const text = pageDescription(contract, '2026-11-07');
      expect(text).not.toContain('Valor:');
      expect(text).toMatch(/Fuente: SECOP I{1,2}, datos al 7 nov 2026\.$/);
    }
  });

  it('never names the supplier', () => {
    expect(pageDescription(providenciaContract)).not.toMatch(/persona|contratista/i);
  });
});
