import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContractDetail } from '../../domain/contract';
import {
  ContractDetailPage,
  type ContractDetailPageProps,
  type ContractDetailState,
} from './ContractDetailPage';
import * as fixtures from './ContractDetailPage.fixtures';

const { pastoContract, providenciaContract, SAMPLE_CUT_DATE } = fixtures;

/** The page as HTML. */
function page(state: ContractDetailState, props: Partial<ContractDetailPageProps> = {}) {
  return renderToStaticMarkup(
    <ContractDetailPage
      state={state}
      onRetry={() => {}}
      onBack={() => {}}
      onShare={async () => 'done'}
      onCopy={async () => true}
      {...props}
    />,
  );
}
const ready = (contract: ContractDetail) =>
  page({ status: 'ready', contract, cutDate: SAMPLE_CUT_DATE });
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const h1 = (html: string) => [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/g)].map((m) => m[1]);
const h2 = (html: string) => [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1]);

describe('ContractDetailPage states', () => {
  it('loading: the generic back, the message and a busy page', () => {
    const html = page({ status: 'loading' });
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('href="/mapa"');
    expect(text(html)).toContain('Cargando el contrato…');
    expect(h2(html)).toEqual([]);
  });

  it('not found from a link: «Ir al mapa»', () => {
    const html = page({ status: 'not_found', origin: 'link' });
    expect(h1(html)).toEqual(['No encontramos ese contrato']);
    expect(html).toMatch(/<a [^>]*href="\/mapa"[^>]*>Ir al mapa<\/a>/);
    expect(html).not.toContain('<button');
  });

  it('not found coming from Elephants: «Volver», the browser back', () => {
    const html = page({ status: 'not_found', origin: 'app' });
    expect(html).toMatch(/<button[^>]*>.*Volver<\/button>/);
    expect(html).not.toContain('Ir al mapa');
  });

  it('unavailable: a way to retry and a way out', () => {
    const html = text(page({ status: 'unavailable' }));
    expect(html).toContain('No pudimos cargar este contrato');
    expect(html).toContain('Reintentar');
    expect(html).toContain('Ir al mapa');
  });
});

describe('ContractDetailPage contract', () => {
  it('has one h1 and the questions as h2, in the order of the spec', () => {
    const html = ready(pastoContract);
    expect(h1(html)).toEqual(['Contrato de obra']);
    expect(h2(html)).toEqual([
      '¿Cuánto vale?',
      '¿Qué se contrató?',
      '¿Entre quiénes?',
      '¿Cuánto dura?',
      '¿Cómo se eligió al contratista?',
    ]);
  });

  it('gives every figure its source and date, and goes back to the municipality', () => {
    const html = ready(pastoContract);
    expect(text(html)).toContain('$ 67,8 millones');
    expect(text(html)).toContain('Según SECOP II · datos al 7 nov 2026');
    expect(text(html)).toContain(
      'Fuente: SECOP II, Colombia Compra Eficiente · datos al 7 nov 2026',
    );
    expect(text(html)).toContain('Número en SECOP: CO1.PCCNTR.7954915');
    expect(html).toMatch(/<nav aria-label="Volver"><a [^>]*href="\/mapa\/52001"/);
  });

  it('links to SECOP in another tab, and says so', () => {
    const html = ready(providenciaContract);
    expect(html).toContain('aria-label="Ver el registro en SECOP I (abre en otra pestaña)"');
    expect(html).toContain('target="_blank" rel="noopener"');
    const noLink = ready(fixtures.noDescriptionContract);
    expect(noLink).not.toContain('Ver el registro en');
    expect(text(noLink).match(/SECOP no trae el enlace a este contrato/g)).toHaveLength(1);
  });

  it('never names a natural person', () => {
    const html = text(ready(providenciaContract));
    expect(html).toContain('Persona natural');
    expect(html).toContain('No mostramos nombres de personas');
  });

  it('missing data has its own words, never 0', () => {
    expect(text(ready(fixtures.noValueContract))).toContain('Sin datos');
    expect(text(ready(fixtures.noValueContract))).not.toContain('$ 0');
    expect(text(ready(fixtures.unknownSupplierContract))).toContain('Sin datos del contratista');
    expect(text(ready(fixtures.noDescriptionContract))).toContain(
      'SECOP no trae el objeto de este contrato.',
    );
    expect(text(ready(pastoContract))).toContain('La entidad no ha reportado pagos en SECOP.');
  });

  it('an unreliable value has no big figure and warns before it is quoted', () => {
    const html = text(ready(fixtures.unreliableValueContract));
    expect(html).toContain('SECOP registra $ 2.185.208.667.');
    expect(html).toContain('Esta cifra puede tener un error de registro en SECOP');
    expect(html).not.toContain('millones');
  });

  it('offers «Leer completo» only for an object past 220 characters', () => {
    expect(ready(pastoContract)).toMatch(/aria-expanded="false"[^>]*>Leer completo/);
    expect(ready(fixtures.unreliableValueContract)).not.toContain('Leer completo');
  });

  it('hides the method band without a method, and says a recent contract is recent', () => {
    expect(h2(ready({ ...pastoContract, procurementMethod: null }))).not.toContain(
      '¿Cómo se eligió al contratista?',
    );
    expect(text(ready(fixtures.recentContract))).toContain('Contrato reciente.');
  });

  it('says what SECOP is, once, and keeps «Copiar» next to the number', () => {
    const html = ready(pastoContract);
    expect(
      text(html).match(/SECOP es el registro público de los contratos del Estado\./g),
    ).toHaveLength(1);
    expect(html).toMatch(/CO1\.PCCNTR\.7954915<button[^>]*aria-label="Copiar el número en SECOP"/);
  });

  it('says which date SECOP does not bring', () => {
    expect(text(ready(fixtures.suspendedContract))).toContain('SECOP no trae la fecha de fin.');
  });

  it('keeps one live region in the page from the start, empty, for the floating notice', () => {
    expect(ready(pastoContract).match(/<div[^>]*role="status"><\/div>/g)).toHaveLength(1);
  });

  it('without the cut date, says only the month', () => {
    const html = text(page({ status: 'ready', contract: providenciaContract }));
    expect(html).toContain('Según SECOP I · datos de nov 2026');
  });

  it('shows signals only as a preview that says its levels are examples', () => {
    expect(h2(ready(pastoContract))).not.toContain('¿Por qué tiene señales?');
    const html = page(
      { status: 'ready', contract: pastoContract, cutDate: SAMPLE_CUT_DATE },
      { previewSignals: fixtures.previewSignals },
    );
    expect(h2(html)[1]).toBe('¿Por qué tiene señales?');
    expect(text(html)).toContain('Tiene 2 señales para revisar');
    expect(text(html)).toContain('Señales de ejemplo.');
    expect(html).toMatch(/señales\?<\/h2><p[^>]*>Ejemplo<\/p>/);
    expect(text(html)).not.toMatch(/fase 2|TASK-13/);
  });
});

describe('sample data and wording', () => {
  const contracts = Object.values(fixtures).filter(
    (value): value is ContractDetail => typeof value === 'object' && 'buyer' in value,
  );

  it('never uses a verdict word, in any state', () => {
    for (const contract of contracts)
      expect(text(ready(contract))).not.toMatch(/corrup|robo|sospech|incumpl/i);
  });

  it('the extreme case has the lengths of the cut', () => {
    expect(fixtures.extremeContract.description).toHaveLength(1450);
    expect(fixtures.extremeContract.buyer.name.length).toBeGreaterThan(155);
  });
});
