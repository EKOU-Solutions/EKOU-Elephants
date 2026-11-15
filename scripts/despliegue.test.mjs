import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { desplegarPreview, desplegarProduccion, verificar } from './despliegue.mjs';

const base = {
  CLOUDFLARE_API_TOKEN: 'token',
  CLOUDFLARE_ACCOUNT_ID: 'cuenta',
  DATABASE_URL: 'postgres://u:secreto%24@host/db',
  DATABASE_URL_UNPOOLED: 'postgres://u:secreto@host-directo/db',
  PREVIEW_NAME: 'pr-12',
};
const respuestaPreview = JSON.stringify({ preview_urls: ['pr-12.ekou.workers.dev'] });

describe('desplegarPreview', () => {
  it('rechaza configuración faltante o nombres inválidos sin ejecutar nada', async () => {
    const run = vi.fn();
    await expect(desplegarPreview({ env: {}, run })).rejects.toThrow('Falta configuración');
    await expect(desplegarPreview({ env: { ...base, PREVIEW_NAME: 'main' }, run })).rejects.toThrow(
      'PREVIEW_NAME',
    );
    await expect(
      desplegarPreview({ env: { ...base, DATOS_R2_PREFIJO: '../otro' }, run }),
    ).rejects.toThrow('DATOS_R2_PREFIJO');
    const { DATABASE_URL_UNPOOLED: _, ...sinDirecta } = base;
    await expect(desplegarPreview({ env: { ...sinDirecta, MIGRAR: 'true' }, run })).rejects.toThrow(
      'DATABASE_URL_UNPOOLED',
    );
    expect(run).not.toHaveBeenCalled();
  });

  it('con la base compartida no migra y sube el secreto con un archivo temporal', async () => {
    let archivo;
    const run = vi.fn((_node, args) => {
      expect(args.join(' ')).not.toContain(base.DATABASE_URL);
      expect(args[0]).toContain('wrangler');
      archivo = args[args.indexOf('--secrets-file') + 1];
      expect(JSON.parse(readFileSync(archivo, 'utf8'))).toEqual({
        DATABASE_URL: base.DATABASE_URL,
      });
      expect(statSync(archivo).mode & 0o777).toBe(0o600);
      expect(args).toContain('DATOS_R2_PREFIJO:previews/pr-12/datos/');
      return respuestaPreview;
    });
    const verify = vi.fn();
    const url = await desplegarPreview({
      env: { ...base, DATOS_R2_PREFIJO: 'previews/pr-12/datos/' },
      run,
      verify,
    });
    expect(url).toBe('https://pr-12.ekou.workers.dev/');
    expect(run).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith(url);
    expect(existsSync(archivo)).toBe(false);
  });

  it('con copia propia migra antes de desplegar', async () => {
    const run = vi.fn((_node, args, opciones) => {
      if (args[0].includes('node-pg-migrate')) {
        expect(opciones.env.DATABASE_URL_UNPOOLED).toBe(base.DATABASE_URL_UNPOOLED);
        return '';
      }
      return respuestaPreview;
    });
    await desplegarPreview({ env: { ...base, MIGRAR: 'true' }, run, verify: vi.fn() });
    expect(run.mock.calls[0][1][0]).toContain('node-pg-migrate');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('una migración fallida detiene el despliegue sin filtrar credenciales', async () => {
    const run = vi.fn(() => {
      throw new Error(base.DATABASE_URL_UNPOOLED);
    });
    const error = await desplegarPreview({ env: { ...base, MIGRAR: 'true' }, run }).catch((e) => e);
    expect(error.message).toBe('Las migraciones fallaron; no se inició el despliegue.');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('borra el archivo de secretos aunque falle Cloudflare', async () => {
    let archivo;
    const run = vi.fn((_node, args) => {
      archivo = args[args.indexOf('--secrets-file') + 1];
      throw new Error('fallo');
    });
    await expect(desplegarPreview({ env: base, run })).rejects.toThrow('Falló el despliegue');
    expect(existsSync(archivo)).toBe(false);
  });
});

describe('desplegarProduccion', () => {
  it('migra y luego despliega con wrangler deploy', async () => {
    const run = vi.fn(() => '');
    await desplegarProduccion({ env: base, run });
    expect(run.mock.calls[0][1][0]).toContain('node-pg-migrate');
    expect(run.mock.calls[1][1]).toContain('deploy');
  });

  it('exige la URL directa para migrar', async () => {
    const run = vi.fn();
    const { DATABASE_URL_UNPOOLED: _, ...env } = base;
    await expect(desplegarProduccion({ env, run })).rejects.toThrow('DATABASE_URL_UNPOOLED');
    expect(run).not.toHaveBeenCalled();
  });
});

describe('verificar', () => {
  const ok = (cuerpo, status = 200) =>
    new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status });

  it('acepta SPA, salud y un 404 de dominio', async () => {
    const request = vi.fn(async (url) => {
      const ruta = new URL(url).pathname;
      if (ruta === '/') return ok('<div id="root"></div>');
      if (ruta === '/api/salud') return ok({ ok: true });
      return ok({ error: 'territorio_no_encontrado' }, 404);
    });
    await expect(verificar('https://x.dev/', request, 0)).resolves.toBeUndefined();
  });

  it('falla si la API no llega a la base', async () => {
    const request = vi.fn(async (url) =>
      new URL(url).pathname === '/' ? ok('<div id="root"></div>') : ok({ error: 'interno' }, 500),
    );
    await expect(verificar('https://x.dev/', request, 0)).rejects.toThrow('/api/salud');
  });
});
