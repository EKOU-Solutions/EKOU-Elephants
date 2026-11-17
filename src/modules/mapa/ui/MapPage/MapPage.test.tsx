import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { type MapRoute, parseRoute } from '../mapModel';
import { sampleMap } from '../sample';
import { MapPage, type MapPageState } from './MapPage';

/** The page as HTML, with the real sample (cut 2026-11) unless another state is given. */
function page(route: MapRoute, state: MapPageState = { status: 'ready', map: sampleMap }) {
  return renderToStaticMarkup(
    <MapPage state={state} route={route} onNavigate={() => {}} onRetry={() => {}} />,
  );
}
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const h1 = (html: string) => /<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1];
/** Row names of the table, in order. */
const rowNames = (html: string) =>
  [...html.matchAll(/<th scope="row"[^>]*>.*?<a [^>]*>(.*?)<\/a>/g)].map((m) => m[1]);

describe('MapPage states', () => {
  it('loading: says it is loading and draws no data yet', () => {
    const html = page({ view: 'country' }, { status: 'loading' });
    expect(text(html)).toContain('Cargando el mapa');
    expect(html).not.toContain('<table');
  });

  it('error: the cut is unavailable, with a way to retry', () => {
    const html = page({ view: 'country' }, { status: 'unavailable' });
    expect(text(html)).toContain('Reintentar');
    expect(html).not.toContain('<table');
  });

  it('invalid link: says the place does not exist instead of an empty map', () => {
    expect(h1(page({ view: 'municipality', code: '99999' }))).toBe('No encontramos ese lugar');
    expect(h1(page(parseRoute('/mapa/hola')))).toBe('No encontramos ese lugar');
  });

  it('empty: a municipality without located contracts shows «Sin datos», never 0', () => {
    const html = text(page({ view: 'municipality', code: '94884' }));
    expect(html).toContain('Sin datos');
    expect(html).toContain('No encontramos contratos ubicados con certeza');
  });
});

describe('MapPage views', () => {
  it('country: the national total, with source and cut date', () => {
    const html = page({ view: 'country' });
    expect(h1(html)).toBe('7.456.749 contratos públicos firmados en Colombia');
    expect(text(html)).toContain('7 nov 2026');
    expect(text(html)).toContain('SECOP II');
  });

  it('municipality: identifies the place by name and DIVIPOLA code', () => {
    const html = page({ view: 'municipality', code: '05001' });
    expect(h1(html)).toBe('Medellín');
    expect(text(html)).toContain('Código DANE 05001');
    expect(text(html)).toContain('356.935');
  });

  it('Bogotá: the department link opens the municipality 11001', () => {
    expect(h1(page(parseRoute('/mapa/departamento/11')))).toBe('Bogotá, D.C.');
  });

  it('tables go in Spanish alphabetical order, not DANE code order', () => {
    const departments = rowNames(page({ view: 'country' }));
    expect(departments[0]).toBe('Amazonas');
    expect(departments).toEqual(
      [...departments].sort((a = '', b = '') => a.localeCompare(b, 'es')),
    );
    const municipalities = rowNames(page({ view: 'department', code: '05' }));
    expect(municipalities[0]).toBe('Abejorral');
    expect(municipalities).toHaveLength(125);
  });

  it('has no selects: the search is the only way to jump to a place by name', () => {
    expect(page({ view: 'department', code: '94' })).not.toContain('<select');
  });
});
