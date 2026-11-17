import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { CACHE_PAGINA, clavePagina, etiquetasDeLaApp, servirPagina } from './paginas';

/**
 * Node has no HTMLRewriter: a small stand-in with the part of its API these routes use (selectors
 * `tag`, `tag[attr="value"]` and lists of them; `attributes`, `tagName`, `append` and script text).
 * The real one runs in `npm run dev` and in Workers (docs/desarrollo.md, how to check it).
 */
type Handlers = {
  element?: (e: FakeElement) => void;
  text?: (t: { text: string }) => void;
};
interface FakeElement {
  tagName: string;
  attributes: IterableIterator<string[]>;
  append: (content: string) => void;
}

class FakeHTMLRewriter {
  private handlers: {
    matches: (tag: string, attrs: Map<string, string>) => boolean;
    h: Handlers;
  }[] = [];

  on(selector: string, h: Handlers) {
    const parts = selector.split(',').map((s) => {
      const m = /^\s*([a-z]+)(?:\[([a-z]+)="([^"]*)"\])?\s*$/.exec(s);
      if (!m) throw new Error(`selector not supported: ${s}`);
      return { tag: m[1], attr: m[2], value: m[3] };
    });
    this.handlers.push({
      matches: (tag, attrs) =>
        parts.some((p) => p.tag === tag && (!p.attr || attrs.get(p.attr) === p.value)),
      h,
    });
    return this;
  }

  private run(html: string): string {
    const appends = new Map<number, string>();
    for (const m of html.matchAll(/<([a-z]+)((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*>/g)) {
      const tag = m[1] ?? '';
      const attrs = new Map(
        [...(m[2] ?? '').matchAll(/([a-z-]+)(?:="([^"]*)")?/g)].map((a) => [
          a[1] ?? '',
          a[2] ?? '',
        ]),
      );
      const end = html.indexOf(`</${tag}>`, m.index);
      for (const { matches, h } of this.handlers) {
        if (!matches(tag, attrs)) continue;
        h.element?.({
          tagName: tag,
          attributes: [...attrs].map(([k, v]) => [k, v])[Symbol.iterator](),
          append: (content) => appends.set(end, (appends.get(end) ?? '') + content),
        });
        if (tag === 'script' && end > 0) h.text?.({ text: html.slice(m.index + m[0].length, end) });
      }
    }
    let out = html;
    for (const [at, content] of [...appends].sort((a, b) => b[0] - a[0]))
      out = out.slice(0, at) + content + out.slice(at);
    return out;
  }

  transform(res: Response) {
    const run = (html: string) => this.run(html);
    const body = new ReadableStream({
      async start(c) {
        c.enqueue(new TextEncoder().encode(run(await res.text())));
        c.close();
      },
    });
    return new Response(body, { status: res.status, headers: res.headers });
  }
}

beforeEach(() => {
  vi.stubGlobal('HTMLRewriter', FakeHTMLRewriter);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const INDICE = `<!doctype html><html lang="es"><head><meta charset="UTF-8" /><title>EKOU Elephants</title>
<script type="module" crossorigin src="/assets/index-abc.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-def.js">
<link rel="stylesheet" crossorigin href="/assets/index-ghi.css">
<script>window.other = 1</script>
</head><body><div id="root"></div></body></html>`;
const PAGINA =
  '<!DOCTYPE html><html lang="es-CO"><head><title>Medellín, Antioquia</title></head><body><div id="root"><h1>Medellín</h1></div></body></html>';
const SITEMAP = '<?xml version="1.0"?><urlset></urlset>';

const fetcher = (fn: (url: string) => Response | Promise<Response>) => {
  const fetch = vi.fn(async (input: RequestInfo | URL) =>
    fn(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url),
  );
  return { fetcher: { fetch } as unknown as Fetcher, fetch };
};

/** ASSETS: index.html at `/`; anything else is the SPA's answer (as `not_found_handling` does). */
function assets(indice = INDICE) {
  return fetcher((url) =>
    new URL(url).pathname === '/'
      ? new Response(indice, { headers: { 'Content-Type': 'text/html' } })
      : new Response('SPA', { headers: { 'Content-Type': 'text/html' } }),
  );
}

/** DATOS with the generated files it has. */
function datos(archivos: Record<string, string> = { 'paginas/mapa/05001': PAGINA }) {
  return fetcher((url) => {
    const texto = archivos[new URL(url).pathname.slice(1)];
    return texto === undefined
      ? new Response('no', { status: 404 })
      : new Response(texto, { status: 200 });
  });
}

const pedir = (ruta: string, init?: RequestInit) => new Request(`https://ekou.test${ruta}`, init);

describe('clavePagina', () => {
  it('one generated file per place, as the app links it', () => {
    expect(clavePagina('/mapa')).toBe('paginas/mapa');
    expect(clavePagina('/mapa/')).toBe('paginas/mapa');
    expect(clavePagina('/mapa/05001')).toBe('paginas/mapa/05001');
    expect(clavePagina('/mapa/05001/')).toBe('paginas/mapa/05001');
    expect(clavePagina('/mapa/departamento/05')).toBe('paginas/mapa/departamento/05');
    expect(clavePagina('/mapa/departamento/11')).toBe('paginas/mapa/11001');
    expect(clavePagina('/sitemap.xml')).toBe('paginas/sitemap.xml');
  });

  it('nothing else', () => {
    for (const ruta of ['/', '/mapa/hola', '/mapa/123', '/mapas', '/api/mapa/corte', '/x.xml'])
      expect(clavePagina(ruta), ruta).toBeUndefined();
  });
});

describe('etiquetasDeLaApp', () => {
  it("copies the app's module scripts, preloads and stylesheets in order, nothing else", async () => {
    expect(await etiquetasDeLaApp(new Response(INDICE))).toBe(
      '<script type="module" crossorigin src="/assets/index-abc.js"></script>' +
        '<link rel="modulepreload" crossorigin href="/assets/vendor-def.js">' +
        '<link rel="stylesheet" crossorigin href="/assets/index-ghi.css">',
    );
  });

  it('keeps an inline module script (Vite in `npm run dev`)', async () => {
    expect(
      await etiquetasDeLaApp(
        new Response('<head><script type="module">import "/@vite/client"</script></head>'),
      ),
    ).toBe('<script type="module">import "/@vite/client"</script>');
  });
});

describe('servirPagina', () => {
  it('found: the generated page with the app scripts in its head and a short cache', async () => {
    const a = assets();
    const d = datos();
    const res = await servirPagina(pedir('/mapa/05001'), { ASSETS: a.fetcher, DATOS: d.fetcher });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe(CACHE_PAGINA);
    expect(CACHE_PAGINA).toMatch(/max-age=60, s-maxage=\d+, stale-while-revalidate=\d+/);
    const html = await res.text();
    expect(html).toContain(
      '<title>Medellín, Antioquia</title><script type="module" crossorigin src="/assets/index-abc.js"></script>' +
        '<link rel="modulepreload" crossorigin href="/assets/vendor-def.js">' +
        '<link rel="stylesheet" crossorigin href="/assets/index-ghi.css"></head>',
    );
    expect(html).toContain('<div id="root"><h1>Medellín</h1></div>');
    expect(html).not.toContain('window.other');
    // Server to server, through the binding: the page without extension, never a redirect.
    expect(d.fetch).toHaveBeenCalledWith('https://datos/paginas/mapa/05001', {
      redirect: 'manual',
    });
  });

  it('/mapa/departamento/11 is the page of 11001', async () => {
    const d = datos({ 'paginas/mapa/11001': PAGINA });
    const res = await servirPagina(pedir('/mapa/departamento/11'), {
      ASSETS: assets().fetcher,
      DATOS: d.fetcher,
    });
    expect(await res.text()).toContain('<h1>Medellín</h1>');
  });

  it('not found: the SPA as always', async () => {
    const a = assets();
    const res = await servirPagina(pedir('/mapa/05002'), {
      ASSETS: a.fetcher,
      DATOS: datos().fetcher,
    });
    expect(await res.text()).toBe('SPA');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  it('the data Worker fails or answers an error: the SPA', async () => {
    for (const falla of [
      () => {
        throw new Error('red');
      },
      () => new Response('error', { status: 500 }),
      () => new Response(null, { status: 307, headers: { Location: '/x' } }),
    ]) {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await servirPagina(pedir('/mapa/05001'), {
        ASSETS: assets().fetcher,
        DATOS: fetcher(falla).fetcher,
      });
      expect(await res.text()).toBe('SPA');
      error.mockRestore();
    }
  });

  it('without the DATOS binding, or an index without scripts: the SPA', async () => {
    const sinDatos = await servirPagina(pedir('/mapa/05001'), { ASSETS: assets().fetcher });
    expect(await sinDatos.text()).toBe('SPA');
    const sinScripts = await servirPagina(pedir('/mapa/05001'), {
      ASSETS: assets('<html><head></head></html>').fetcher,
      DATOS: datos().fetcher,
    });
    expect(await sinScripts.text()).toBe('SPA');
  });

  it('an unknown place or another method: the SPA, without asking DATOS', async () => {
    const d = datos();
    for (const req of [pedir('/mapa/hola'), pedir('/mapa/05001', { method: 'POST' })]) {
      const res = await servirPagina(req, { ASSETS: assets().fetcher, DATOS: d.fetcher });
      expect(await res.text()).toBe('SPA');
    }
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it('HEAD: the same headers, no body', async () => {
    const res = await servirPagina(pedir('/mapa/05001', { method: 'HEAD' }), {
      ASSETS: assets().fetcher,
      DATOS: datos().fetcher,
    });
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('');
  });

  it('sitemap.xml: as generated, as XML; the SPA if there is none', async () => {
    const a = assets();
    const res = await servirPagina(pedir('/sitemap.xml'), {
      ASSETS: a.fetcher,
      DATOS: datos({ 'paginas/sitemap.xml': SITEMAP }).fetcher,
    });
    expect(res.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(await res.text()).toBe(SITEMAP);
    expect(a.fetch).not.toHaveBeenCalled();
    const sin = await servirPagina(pedir('/sitemap.xml'), {
      ASSETS: assets().fetcher,
      DATOS: datos({}).fetcher,
    });
    expect(await sin.text()).toBe('SPA');
  });
});

describe('Worker', () => {
  const ctx = {} as ExecutionContext;

  it('/mapa… goes to the generated page', async () => {
    const res = await worker.fetch(
      pedir('/mapa/05001'),
      { ASSETS: assets().fetcher, DATOS: datos().fetcher },
      ctx,
    );
    expect(await res.text()).toContain('/assets/index-abc.js');
  });

  it('the API stays the same: it never reads pages or assets', async () => {
    const a = assets();
    const d = datos();
    const salud = await worker.fetch(
      pedir('/api/salud'),
      { ASSETS: a.fetcher, DATOS: d.fetcher },
      ctx,
    );
    expect(await salud.json()).toEqual({ ok: true });
    const raiz = await worker.fetch(pedir('/api'), { ASSETS: a.fetcher, DATOS: d.fetcher }, ctx);
    expect(raiz.headers.get('Content-Type')).toContain('application/json');
    expect(a.fetch).not.toHaveBeenCalled();
    expect(d.fetch).not.toHaveBeenCalled();
  });
});
