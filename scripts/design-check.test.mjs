import { describe, expect, it } from 'vitest';
import {
  isMissingBrowser,
  parseArgs,
  selectStories,
  storyUrl,
  summarize,
} from './design-check.mjs';

const index = {
  entries: {
    'intro--docs': { id: 'intro--docs', type: 'docs', title: 'Introducción', name: 'Docs' },
    'componentes-ui-button--primary': {
      id: 'componentes-ui-button--primary',
      type: 'story',
      title: 'Componentes/UI/Button',
      name: 'Principal',
    },
    'modulos-mapa-mappage--no-data': {
      id: 'modulos-mapa-mappage--no-data',
      type: 'story',
      title: 'Módulos/Mapa/MapPage',
      name: 'Sin datos',
    },
  },
};

describe('parseArgs', () => {
  it('uses the full check by default', () => {
    expect(parseArgs([])).toEqual({
      filters: [],
      build: true,
      url: null,
      html: null,
      screenshots: true,
      list: false,
    });
  });

  it('reads filters, the published URL and the switches', () => {
    const options = parseArgs([
      '--filter',
      'mapa',
      '--filter',
      'button',
      '--url',
      'https://example.test/storybook/',
      '--no-build',
      '--no-screenshots',
    ]);
    expect(options.filters).toEqual(['mapa', 'button']);
    expect(options.url).toBe('https://example.test/storybook');
    expect(options.build).toBe(false);
    expect(options.screenshots).toBe(false);
  });

  it('rejects unknown options and missing values', () => {
    expect(() => parseArgs(['--nope'])).toThrow('Opción desconocida');
    expect(() => parseArgs(['--filter'])).toThrow('Falta el valor');
    expect(() => parseArgs(['--filter', '--no-build'])).toThrow('Falta el valor');
  });
});

describe('isMissingBrowser', () => {
  it('recognises the missing-browser error and nothing else', () => {
    expect(isMissingBrowser(new Error("browserType.launch: Executable doesn't exist at /x"))).toBe(
      true,
    );
    expect(isMissingBrowser(new Error('net::ERR_CONNECTION_REFUSED'))).toBe(false);
  });

  it('reads the sketch file option', () => {
    expect(parseArgs(['--html', 'docs/design/pages/mapa/bocetos.html']).html).toBe(
      'docs/design/pages/mapa/bocetos.html',
    );
  });
});

describe('selectStories', () => {
  it('keeps stories and drops docs pages', () => {
    expect(selectStories(index).map((story) => story.id)).toEqual([
      'componentes-ui-button--primary',
      'modulos-mapa-mappage--no-data',
    ]);
  });

  it('filters by id or title, ignoring case and accents', () => {
    expect(selectStories(index, ['Módulos/Mapa']).map((story) => story.id)).toEqual([
      'modulos-mapa-mappage--no-data',
    ]);
    expect(selectStories(index, ['modulos-mapa']).map((story) => story.id)).toEqual([
      'modulos-mapa-mappage--no-data',
    ]);
    expect(selectStories(index, ['BUTTON', 'mapa'])).toHaveLength(2);
    expect(selectStories(index, ['contrato'])).toEqual([]);
  });
});

describe('storyUrl', () => {
  it('builds the iframe URL with the theme global', () => {
    expect(storyUrl('http://host', 'a--b', 'dark')).toBe(
      'http://host/iframe.html?id=a--b&viewMode=story&globals=theme:dark;a11y.manual:!true',
    );
  });
});

describe('summarize', () => {
  it('passes clean renders and counts incomplete checks', () => {
    const summary = summarize([
      { id: 'a--b', theme: 'light', width: 320, overflow: 0, violations: [], incomplete: [{}] },
    ]);
    expect(summary).toEqual({ renders: 1, failures: [], incomplete: 1 });
  });

  it('reports overflow, axe violations and render errors', () => {
    const { failures } = summarize([
      { id: 'a--b', theme: 'dark', width: 320, overflow: 12, violations: [], incomplete: [] },
      {
        id: 'a--c',
        theme: 'light',
        width: 390,
        overflow: 0,
        violations: [
          { id: 'color-contrast', impact: 'serious', help: 'Contraste', targets: ['.x'] },
        ],
        incomplete: [],
      },
      { id: 'a--d', theme: 'light', width: 768, error: 'la historia no se renderizó' },
    ]);
    expect(failures).toEqual([
      'a--b · dark · 320 px: desplazamiento horizontal de 12 px',
      'a--c · light · 390 px: axe color-contrast [serious] Contraste (.x)',
      'a--d · light · 768 px: no se pudo revisar (la historia no se renderizó)',
    ]);
  });
});
