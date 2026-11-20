import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { punteroLatest } from './datos.mjs';
import { parseArgs, cleanHtml } from './pages.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const MUESTRA = join(RAIZ, 'docs/design/pages/map/sample');

describe('parseArgs', () => {
  it('the site URL is required, from --sitio or EKOU_SITIO_URL', () => {
    expect(() => parseArgs([], {})).toThrow('Falta la URL del sitio');
    expect(parseArgs([], { EKOU_SITIO_URL: 'https://a.co' })).toMatchObject({
      carpeta: 'datos-locales',
      sitio: 'https://a.co',
    });
    expect(parseArgs(['--carpeta', 'x', '--sitio', 'https://b.co'], {})).toMatchObject({
      carpeta: 'x',
      sitio: 'https://b.co',
    });
    expect(() => parseArgs(['--otro'], {})).toThrow('Argumento desconocido');
  });
});

describe('cleanHtml', () => {
  it("drops Astro's stylesheets and refuses a script that runs", () => {
    expect(
      cleanHtml(
        '<head><link rel="stylesheet" href="/_astro/a.css"><style>a{}</style><script type="application/ld+json">{}</script></head>',
      ),
    ).toBe('<head><script type="application/ld+json">{}</script></head>');
    expect(() => cleanHtml('<script type="module" src="/x.js"></script>')).toThrow('script propio');
  });
});

// The real Astro build, with the sample of cut 2026-11 as a publication folder: four places plus
// Colombia (always built), and the sitemap of all 1.155.
describe('npm run paginas', () => {
  let carpeta;
  const leer = (ruta) => readFileSync(join(carpeta, 'paginas', ruta), 'utf8');
  const texto = (html) =>
    html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
  const meta = (html, atributo) =>
    new RegExp(`<meta ${atributo} content="([^"]*)"`).exec(html)?.[1];

  beforeAll(() => {
    carpeta = mkdtempSync(join(tmpdir(), 'ekou-paginas-'));
    const corte = join(carpeta, 'datos', '2026-11');
    mkdirSync(corte, { recursive: true });
    const archivos = ['corte.json', 'departamentos.json', 'municipios.json'];
    for (const archivo of archivos) copyFileSync(join(MUESTRA, archivo), join(corte, archivo));
    writeFileSync(
      join(carpeta, 'datos', 'latest.json'),
      JSON.stringify(punteroLatest('2026-11', archivos)),
    );
    execFileSync(
      process.execPath,
      [
        join(RAIZ, 'scripts/pages.mjs'),
        ...['--carpeta', carpeta, '--sitio', 'https://ejemplo.co/'],
        ...['--solo', '/mapa/05001,/mapa/departamento/05,/mapa/11001,/mapa/94884'],
      ],
      { cwd: RAIZ, stdio: 'pipe' },
    );
  }, 180_000);

  afterAll(() => {
    if (carpeta) rmSync(carpeta, { recursive: true, force: true });
  });

  it('writes one HTML per place, where the data Worker serves it, and nothing else', () => {
    for (const ruta of [
      'mapa.html',
      'mapa/05001.html',
      'mapa/departamento/05.html',
      'mapa/11001.html',
      'mapa/94884.html',
      'sitemap.xml',
    ])
      expect(existsSync(join(carpeta, 'paginas', ruta)), ruta).toBe(true);
    expect(existsSync(join(carpeta, 'paginas', '_astro'))).toBe(false);
    expect(existsSync(join(carpeta, 'paginas', 'mapa', 'departamento', '11.html'))).toBe(false);
  });

  it('a municipality: name, figure, source, date and table with links, readable without JS', () => {
    const html = leer('mapa/05001.html');
    expect(html).toMatch(/^<!DOCTYPE html><html lang="es-CO">/i);
    expect(html).toContain(
      '<title>Medellín, Antioquia: contratos públicos · EKOU Elephants</title>',
    );
    expect(meta(html, 'name="description"')).toContain('356.935 contratos públicos firmados');
    expect(html).toContain('<link rel="canonical" href="https://ejemplo.co/mapa/05001">');
    expect(meta(html, 'property="og:url"')).toBe('https://ejemplo.co/mapa/05001');
    expect(meta(html, 'property="og:locale"')).toBe('es_CO');
    expect(meta(html, 'property="og:title"')).toContain('Medellín, Antioquia');
    expect(html).not.toContain('og:image');
    const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)[1]);
    expect(ld).toMatchObject({ '@type': 'Dataset', dateModified: '2026-11-07' });
    // The content of the approved screen, inside the app's root.
    const root = html.slice(html.indexOf('<div id="root">'));
    expect(root).toMatch(/<h1[^>]*>Medellín<\/h1>/);
    expect(texto(root)).toContain('356.935');
    expect(texto(root)).toContain('Fuentes: SECOP II y SECOP I, DANE. Datos al 7 nov 2026.');
    expect(root).toContain('href="/mapa/05002"');
    expect(root).toContain('<table');
    // No scripts of its own (only the JSON-LD): the app brings them. The static map carries the
    // simplified outlines of the place's department (ADR 0003), so it looks like the mounted map.
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).not.toMatch(/<link rel="stylesheet"/);
    expect(html.match(/ d="M[^"]{20,}"/g)?.length).toBeGreaterThan(0);
  });

  it('a department: its figures and the table of its municipalities', () => {
    const html = leer('mapa/departamento/05.html');
    expect(html).toContain('<title>Antioquia: contratos públicos por municipio · EKOU Elephants');
    expect(html).toContain('href="https://ejemplo.co/mapa/departamento/05"');
    expect(html).toMatch(/<h1[^>]*>Antioquia<\/h1>/);
    expect(texto(html)).toContain('819.086');
    expect(html.match(/<th scope="row"/g)?.length).toBeGreaterThan(100);
  });

  it('Bogotá, D.C.: its own canonical and no table (decision 31)', () => {
    const html = leer('mapa/11001.html');
    expect(html).toContain('<link rel="canonical" href="https://ejemplo.co/mapa/11001">');
    expect(html).toMatch(/<h1[^>]*>Bogotá, D\.C\.<\/h1>/);
    expect(html).not.toContain('<table');
  });

  it('«Sin datos»: never 0', () => {
    const html = texto(leer('mapa/94884.html'));
    expect(html).toContain('Sin datos');
    expect(html).toContain('No encontramos contratos ubicados con certeza');
    expect(html).not.toMatch(/\b0 contratos/);
  });

  it('Colombia', () => {
    const html = leer('mapa.html');
    expect(html).toContain('<link rel="canonical" href="https://ejemplo.co/mapa">');
    expect(texto(html)).toContain('7.456.749 contratos públicos firmados en Colombia');
  });

  it('sitemap.xml: the 1.155 pages with the cut date', () => {
    const xml = leer('sitemap.xml');
    expect(xml.match(/<url>/g)).toHaveLength(1155);
    expect(xml.match(/<lastmod>2026-11-07<\/lastmod>/g)).toHaveLength(1155);
    expect(xml).toContain('<loc>https://ejemplo.co/mapa/departamento/05</loc>');
  });
});
