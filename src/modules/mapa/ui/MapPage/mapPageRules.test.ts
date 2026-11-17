import { describe, expect, it } from 'vitest';
import { type MapRoute, parseRoute } from '../mapModel';
import { sampleMap } from '../sample';
import {
  arrivalDetent,
  crumbFocus,
  crumbsFor,
  lowered,
  mapTap,
  selectedText,
} from './mapPageRules';

const keys = (route: MapRoute) => crumbsFor(sampleMap, route).map((c) => `${c.key}:${c.label}`);

describe('crumbs and their focus (spec §3)', () => {
  it('«← Colombia» outside Colombia, plus the department in a municipality', () => {
    expect(keys({ view: 'country' })).toEqual([]);
    expect(keys({ view: 'department', code: '05' })).toEqual(['country:Colombia']);
    expect(keys({ view: 'municipality', code: '05001' })).toEqual([
      'country:Colombia',
      '05:Antioquia',
    ]);
    expect(keys(parseRoute('/mapa/departamento/11'))).toEqual(['country:Colombia']);
    expect(keys({ view: 'municipality', code: '99999' })).toEqual([]);
  });

  it('focus stays on the crumb; if it is gone, on «← Colombia»; with none left, on the h1', () => {
    const department = crumbsFor(sampleMap, { view: 'department', code: '05' });
    expect(crumbFocus(department, 'country')).toBe('country');
    expect(crumbFocus(department, '05')).toBe('country');
    expect(crumbFocus([], 'country')).toBe('title');
  });
});

describe('a tap on the map (spec §3)', () => {
  const half = { shown: 'half', isPanel: false, height: 300 } as const;
  const full = { shown: 'full', isPanel: false, height: 600 } as const;

  it('chooses a department or a municipality', () => {
    expect(mapTap('05', half, 'half')).toEqual({ route: { view: 'department', code: '05' } });
    expect(mapTap('11', half, 'half')).toEqual({
      route: { view: 'municipality', code: '11001' },
    });
    expect(mapTap('05001', undefined, 'half')).toEqual({
      route: { view: 'municipality', code: '05001' },
    });
  });

  it('with the full sheet only lowers it, to half or to collapsed if half already looks full', () => {
    expect(mapTap('05', full, 'full')).toEqual({ detent: 'half' });
    expect(mapTap('05', full, 'half')).toEqual({ detent: 'peek' });
    expect(lowered('full')).toBe('half');
    expect(lowered('half')).toBe('peek');
  });

  it('in the desktop panel always chooses', () => {
    expect(mapTap('05', { shown: 'full', isPanel: true, height: 0 }, 'full')).toEqual({
      route: { view: 'department', code: '05' },
    });
  });
});

describe('arrival height (decision 32)', () => {
  it('collapsed when the map keeps under 160 px free over the half sheet (320 × 640)', () => {
    expect(arrivalDetent({ shown: 'half', isPanel: false, height: 400 }, 320, 640)).toBe('peek');
  });

  it('half on a 390 × 844 phone, and always in the desktop panel', () => {
    expect(arrivalDetent({ shown: 'half', isPanel: false, height: 400 }, 390, 844)).toBe('half');
    expect(arrivalDetent({ shown: 'half', isPanel: true, height: 0 }, 1280, 500)).toBe('half');
  });

  it('collapsed when the header does not even fit at half', () => {
    expect(arrivalDetent({ shown: 'full', isPanel: false, height: 700 }, 390, 844)).toBe('peek');
  });
});

describe('announcements (spec §3)', () => {
  it('says the place chosen, with its department', () => {
    expect(selectedText(sampleMap, { view: 'municipality', code: '05001' })).toBe(
      'Seleccionado: Medellín, Antioquia',
    );
    expect(selectedText(sampleMap, { view: 'municipality', code: '11001' })).toBe(
      'Seleccionado: Bogotá, D.C.',
    );
    expect(selectedText(sampleMap, { view: 'department', code: '05' })).toBe(
      'Seleccionado: Antioquia',
    );
    expect(selectedText(sampleMap, { view: 'country' })).toBe('Seleccionado: Colombia');
  });
});
