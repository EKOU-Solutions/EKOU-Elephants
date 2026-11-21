// Despliegue con la web y la API en Workers distintos (ADR-0004): scripts/despliegue.mjs.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  arquitectura,
  CONFIG_WEB_BUILD,
  configurarApi,
  construirWeb,
  desplegarPreview,
  desplegarProduccion,
  leerJsonc,
} from './despliegue.mjs';

const API_JSONC = `// La API (ADR-0004)
{
  "name": "ekou-elephants-api",
  "main": "src/server/api.ts", // Hono
  /* bloque */
  "observability": { "enabled": true },
  "services": [{ "binding": "DATOS", "service": "ekou-elephants-datos" }],
}
`;

/** Un repositorio con la web y la API separadas. */
function repoWebApi() {
  const raiz = mkdtempSync(join(tmpdir(), 'elephants-web-api-'));
  mkdirSync(join(raiz, 'web'), { recursive: true });
  writeFileSync(join(raiz, 'web/wrangler.jsonc'), '{ "name": "ekou-elephants-web" }');
  writeFileSync(join(raiz, 'wrangler.api.jsonc'), API_JSONC);
  return raiz;
}

const base = {
  CLOUDFLARE_API_TOKEN: 'token',
  CLOUDFLARE_ACCOUNT_ID: 'cuenta',
  DATABASE_URL: 'postgres://u:secreto@host/db',
  DATABASE_URL_UNPOOLED: 'postgres://u:secreto@directo/db',
  PREVIEW_NAME: 'pr-12',
  SHA: 'abcdef1234',
};

// El subdominio de la cuenta, como lo devuelve la API de Cloudflare.
const request = vi.fn(async () => ({
  ok: true,
  json: async () => ({ result: { subdomain: 'ekou' } }),
}));
const respuesta = (url) => JSON.stringify({ preview: { urls: [url] }, deployment: { urls: [] } });

/** Despliegue falso: responde a cada `wrangler preview` según el Worker que despliega. */
function dobles({ verifyApi = vi.fn(async () => {}) } = {}) {
  const run = vi.fn((_node, args) => {
    if (!args.includes('preview')) return '';
    const config = args[args.indexOf('--config') + 1];
    return config.endsWith(CONFIG_WEB_BUILD)
      ? respuesta('pr-12-ekou-elephants-web.ekou.workers.dev')
      : respuesta('pr-12-ekou-elephants-api.ekou.workers.dev');
  });
  return {
    run,
    request,
    existe: vi.fn(async () => true),
    build: vi.fn(),
    verifyApi,
    verifyWeb: vi.fn(async () => {}),
  };
}

const despliegues = (run) =>
  run.mock.calls
    .map(([, args]) => args)
    .filter((args) => args[0]?.includes('wrangler') && !args.includes('up'));

describe('arquitectura y configuración', () => {
  it('reconoce la web y la API separadas solo si están las dos configuraciones', () => {
    const raiz = repoWebApi();
    expect(arquitectura(raiz)).toBe('web-api');
    expect(arquitectura(mkdtempSync(join(tmpdir(), 'elephants-app-')))).toBe('app');
  });

  it('lee JSONC sin tocar las URL de los textos', () => {
    expect(leerJsonc('{ "a": "https://x//y", /* c */ "b": [1,], // fin\n }')).toEqual({
      a: 'https://x//y',
      b: [1],
    });
  });

  it('fija el binding DATOS de la API para producción o para los previews', () => {
    const raiz = repoWebApi();
    const preview = JSON.parse(
      readFileSync(configurarApi('preview', 'ekou-elephants-datos-pr-12', raiz), 'utf8'),
    );
    expect(preview.previews.services).toEqual([
      { binding: 'DATOS', service: 'ekou-elephants-datos-pr-12' },
    ]);
    expect(preview.main).toBe('src/server/api.ts');
    const produccion = JSON.parse(readFileSync(configurarApi('produccion', null, raiz), 'utf8'));
    expect(produccion.services).toEqual([]);
  });
});

describe('construirWeb', () => {
  it('baja el corte y genera la web sin credenciales en su entorno', () => {
    const raiz = repoWebApi();
    mkdirSync(join(raiz, 'web/dist/server'), { recursive: true });
    writeFileSync(join(raiz, CONFIG_WEB_BUILD), '{}');
    const bajar = vi.fn();
    const run = vi.fn();
    construirWeb(base, { sitio: 'https://web', version: 'abc', raiz }, run, bajar);
    expect(bajar).toHaveBeenCalledWith(
      expect.objectContaining({ forzar: true }),
      expect.any(Function),
    );
    const [comando, args, { env }] = run.mock.calls[0];
    expect([comando, ...args]).toEqual(['npm', 'run', 'build:web']);
    expect(env).toMatchObject({ EKOU_SITIO_URL: 'https://web', EKOU_VERSION: 'abc' });
    expect(env.EKOU_PUBLICACION).toMatch(/publicacion$/);
    expect(env).not.toHaveProperty('DATABASE_URL');
    expect(env).not.toHaveProperty('CLOUDFLARE_API_TOKEN');
  });

  it('falla si el build no deja la configuración de Wrangler', () => {
    expect(() =>
      construirWeb(
        base,
        { sitio: 'https://web', version: 'abc', raiz: repoWebApi() },
        vi.fn(),
        vi.fn(),
      ),
    ).toThrow(CONFIG_WEB_BUILD);
  });
});

describe('desplegarPreview con la web y la API separadas', () => {
  it('por defecto solo despliega la web: usa la API de producción por el binding', async () => {
    const d = dobles();
    const r = await desplegarPreview({ ...d, env: base, raiz: repoWebApi() });
    const [web] = despliegues(d.run);
    expect(despliegues(d.run)).toHaveLength(1);
    expect(web).toEqual(
      expect.arrayContaining(['preview', '--name', 'pr-12', '--ignore-base-config']),
    );
    expect(web).not.toContain('--var');
    expect(d.build).toHaveBeenCalledWith(
      base,
      expect.objectContaining({
        sitio: 'https://pr-12-ekou-elephants-web.ekou.workers.dev',
        version: 'abcdef1',
      }),
      d.run,
    );
    expect(d.verifyWeb).toHaveBeenCalledWith('https://pr-12-ekou-elephants-web.ekou.workers.dev/');
    expect(r).toEqual({
      url: 'https://pr-12-ekou-elephants-web.ekou.workers.dev/',
      apiUrl: undefined,
    });
  });

  it('con «API de este PR» despliega primero la API y la web la usa por su URL', async () => {
    const d = dobles();
    const raiz = repoWebApi();
    const env = { ...base, API_DESTINO: 'propia', DATOS_CORTE_ENABLED: 'true' };
    const r = await desplegarPreview({ ...d, env, raiz });
    const [api, web] = despliegues(d.run);
    const config = JSON.parse(readFileSync(api[api.indexOf('--config') + 1], 'utf8'));
    expect(config.previews.services).toEqual([
      { binding: 'DATOS', service: 'ekou-elephants-datos' },
    ]);
    expect(api).toContain('--secrets-file');
    expect(api.join(' ')).not.toContain(base.DATABASE_URL);
    expect(d.verifyApi).toHaveBeenCalledWith('https://pr-12-ekou-elephants-api.ekou.workers.dev/');
    expect(web).toEqual(
      expect.arrayContaining([
        '--var',
        'API_URL:https://pr-12-ekou-elephants-api.ekou.workers.dev',
      ]),
    );
    expect(r.apiUrl).toBe('https://pr-12-ekou-elephants-api.ekou.workers.dev/');
  });

  it('con «API de otro PR» no despliega API: usa el preview de ese PR si responde', async () => {
    const d = dobles();
    await desplegarPreview({ ...d, env: { ...base, API_DESTINO: 'pr-57' }, raiz: repoWebApi() });
    expect(d.verifyApi).toHaveBeenCalledWith('https://pr-57-ekou-elephants-api.ekou.workers.dev/');
    const [web] = despliegues(d.run);
    expect(web).toContain('API_URL:https://pr-57-ekou-elephants-api.ekou.workers.dev');

    const sinApi = dobles({
      verifyApi: vi.fn(async () => {
        throw new Error('no responde');
      }),
    });
    await expect(
      desplegarPreview({ ...sinApi, env: { ...base, API_DESTINO: 'pr-57' }, raiz: repoWebApi() }),
    ).rejects.toThrow('#57 no tiene un preview de la API');
    expect(despliegues(sinApi.run)).toHaveLength(0);
  });

  it('una base migrada solo la usa la API del PR', async () => {
    const d = dobles();
    await expect(
      desplegarPreview({ ...d, env: { ...base, MIGRAR: 'true' }, raiz: repoWebApi() }),
    ).rejects.toThrow('API de este PR');
    expect(d.run).not.toHaveBeenCalled();
    await expect(
      desplegarPreview({ ...d, env: { ...base, API_DESTINO: 'otra' }, raiz: repoWebApi() }),
    ).rejects.toThrow('API_DESTINO');
  });
});

describe('desplegarProduccion con la web y la API separadas', () => {
  it('migra, despliega la API, genera y despliega la web, y verifica las dos', async () => {
    const d = dobles();
    const env = { ...base, DATOS_CORTE_ENABLED: 'true', GITHUB_SHA: '1234567890' };
    await desplegarProduccion({ ...d, env, raiz: repoWebApi() });
    const [api, web] = despliegues(d.run);
    expect(api).toEqual(expect.arrayContaining(['deploy', '--secrets-file']));
    const config = JSON.parse(readFileSync(api[api.indexOf('--config') + 1], 'utf8'));
    expect(config.services).toEqual([{ binding: 'DATOS', service: 'ekou-elephants-datos' }]);
    expect(web).toEqual(expect.arrayContaining(['deploy', '--config']));
    expect(web.at(-1)).toMatch(/web\/dist\/server\/wrangler\.json$/);
    expect(d.verifyApi).toHaveBeenCalledWith('https://ekou-elephants-api.ekou.workers.dev/');
    expect(d.verifyWeb).toHaveBeenCalledWith('https://ekou-elephants-web.ekou.workers.dev/');
    expect(d.build).toHaveBeenCalledWith(
      env,
      expect.objectContaining({
        sitio: 'https://ekou-elephants-web.ekou.workers.dev',
        version: '1234567',
      }),
      d.run,
    );
  });

  it('usa EKOU_SITIO_URL cuando existe el dominio propio', async () => {
    const d = dobles();
    const env = { ...base, EKOU_SITIO_URL: 'https://elephants.ekou.co' };
    await desplegarProduccion({ ...d, env, raiz: repoWebApi() });
    expect(d.build).toHaveBeenCalledWith(
      env,
      expect.objectContaining({ sitio: 'https://elephants.ekou.co' }),
      d.run,
    );
  });
});
