import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  apuntarDatos,
  desplegarPreview,
  desplegarProduccion,
  existeWorker,
  verificar,
} from './despliegue.mjs';

const base = {
  CLOUDFLARE_API_TOKEN: 'token',
  CLOUDFLARE_ACCOUNT_ID: 'cuenta',
  DATABASE_URL: 'postgres://u:secreto%24@host/db',
  DATABASE_URL_UNPOOLED: 'postgres://u:secreto@host-directo/db',
  PREVIEW_NAME: 'pr-12',
};
// Sin llamadas reales a Cloudflare: el Worker de datos existe y el binding no toca disco.
const cf = (existe = true) => ({ existe: vi.fn(async () => existe), apuntar: vi.fn() });
const respuestaPreview = JSON.stringify({ preview_urls: ['pr-12.ekou.workers.dev'] });

describe('desplegarPreview', () => {
  it('rechaza configuración faltante o nombres inválidos sin ejecutar nada', async () => {
    const run = vi.fn();
    await expect(desplegarPreview({ ...cf(), env: {}, run })).rejects.toThrow(
      'Falta configuración',
    );
    await expect(
      desplegarPreview({ ...cf(), env: { ...base, PREVIEW_NAME: 'main' }, run }),
    ).rejects.toThrow('PREVIEW_NAME');
    const { DATABASE_URL_UNPOOLED: _, ...sinDirecta } = base;
    await expect(
      desplegarPreview({ ...cf(), env: { ...sinDirecta, MIGRAR: 'true' }, run }),
    ).rejects.toThrow('DATABASE_URL_UNPOOLED');
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
      return respuestaPreview;
    });
    const verify = vi.fn();
    const url = await desplegarPreview({ ...cf(), env: base, run, verify });
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
    await desplegarPreview({ ...cf(), env: { ...base, MIGRAR: 'true' }, run, verify: vi.fn() });
    expect(run.mock.calls[0][1][0]).toContain('node-pg-migrate');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('una migración fallida detiene el despliegue sin filtrar credenciales', async () => {
    const run = vi.fn(() => {
      throw new Error(base.DATABASE_URL_UNPOOLED);
    });
    const error = await desplegarPreview({ ...cf(), env: { ...base, MIGRAR: 'true' }, run }).catch(
      (e) => e,
    );
    expect(error.message).toBe('Las migraciones fallaron; no se inició el despliegue.');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('borra el archivo de secretos aunque falle Cloudflare', async () => {
    let archivo;
    const run = vi.fn((_node, args) => {
      archivo = args[args.indexOf('--secrets-file') + 1];
      throw new Error('fallo');
    });
    await expect(desplegarPreview({ ...cf(), env: base, run })).rejects.toThrow(
      'Falló el despliegue',
    );
    expect(existsSync(archivo)).toBe(false);
  });
});

describe('datos del corte en el preview', () => {
  const run = () => respuestaPreview;
  const verify = vi.fn();

  it('sin DATOS_CORTE_ENABLED sale sin binding y no consulta Cloudflare', async () => {
    const deps = cf();
    await desplegarPreview({ ...deps, env: base, run, verify });
    expect(deps.existe).not.toHaveBeenCalled();
    expect(deps.apuntar).toHaveBeenCalledWith('preview', null);
  });

  it('con DATOS_CORTE_ENABLED apunta al Worker de producción', async () => {
    const deps = cf();
    await desplegarPreview({ ...deps, env: { ...base, DATOS_CORTE_ENABLED: 'true' }, run, verify });
    expect(deps.apuntar).toHaveBeenCalledWith('preview', 'ekou-elephants-datos');
  });

  it('con datos propios apunta al Worker del PR, aunque la bandera esté apagada', async () => {
    const deps = cf();
    const env = { ...base, DATOS_SERVICIO: 'ekou-elephants-datos-pr-12' };
    await desplegarPreview({ ...deps, env, run, verify });
    expect(deps.existe).toHaveBeenCalledWith(env, 'ekou-elephants-datos-pr-12');
    expect(deps.apuntar).toHaveBeenCalledWith('preview', 'ekou-elephants-datos-pr-12');
  });

  it('bloquea con instrucciones si no se subieron los datos propios', async () => {
    const deps = cf(false);
    const env = { ...base, DATOS_SERVICIO: 'ekou-elephants-datos-pr-12' };
    await expect(desplegarPreview({ ...deps, env, run, verify })).rejects.toThrow(
      'npm run datos:preview -- 12',
    );
    expect(deps.apuntar).not.toHaveBeenCalled();
  });

  it('no acepta el Worker de datos de otro PR', async () => {
    const env = { ...base, DATOS_SERVICIO: 'ekou-elephants-datos-pr-99' };
    await expect(desplegarPreview({ ...cf(), env, run, verify })).rejects.toThrow('DATOS_SERVICIO');
  });
});

describe('desplegarProduccion', () => {
  it('sin DATOS_CORTE_ENABLED despliega sin binding ni verificación', async () => {
    const deps = cf(false);
    await desplegarProduccion({ ...deps, env: base, run: vi.fn(() => '') });
    expect(deps.existe).not.toHaveBeenCalled();
    expect(deps.apuntar).toHaveBeenCalledWith('produccion', null);
  });

  it('con DATOS_CORTE_ENABLED y sin Worker de datos falla antes de migrar', async () => {
    const run = vi.fn();
    const env = { ...base, DATOS_CORTE_ENABLED: 'true' };
    await expect(desplegarProduccion({ ...cf(false), env, run })).rejects.toThrow(
      'ekou-elephants-datos',
    );
    expect(run).not.toHaveBeenCalled();
  });

  it('migra y luego despliega con wrangler deploy', async () => {
    const run = vi.fn(() => '');
    await desplegarProduccion({ ...cf(), env: base, run });
    expect(run.mock.calls[0][1][0]).toContain('node-pg-migrate');
    expect(run.mock.calls[1][1]).toContain('deploy');
  });

  it('exige la URL directa para migrar', async () => {
    const run = vi.fn();
    const { DATABASE_URL_UNPOOLED: _, ...env } = base;
    await expect(desplegarProduccion({ ...cf(), env, run })).rejects.toThrow(
      'DATABASE_URL_UNPOOLED',
    );
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

describe('existeWorker y apuntarDatos', () => {
  it('distingue 200, 404 y otros errores de Cloudflare', async () => {
    const env = { CLOUDFLARE_ACCOUNT_ID: 'c', CLOUDFLARE_API_TOKEN: 't' };
    const con = (status) => vi.fn(async () => new Response('{}', { status }));
    expect(await existeWorker(env, 'w', con(200))).toBe(true);
    expect(await existeWorker(env, 'w', con(404))).toBe(false);
    await expect(existeWorker(env, 'w', con(403))).rejects.toThrow('403');
  });

  it('cambia el binding en la configuración que generó el build', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'apuntar-'));
    try {
      mkdirSync(join(raiz, '.wrangler/deploy'), { recursive: true });
      mkdirSync(join(raiz, 'dist/app'), { recursive: true });
      writeFileSync(
        join(raiz, '.wrangler/deploy/config.json'),
        JSON.stringify({ configPath: '../../dist/app/wrangler.json' }),
      );
      const ruta = join(raiz, 'dist/app/wrangler.json');
      const original = {
        services: [{ binding: 'DATOS', service: 'ekou-elephants-datos' }],
        previews: { observability: { enabled: true }, services: [] },
      };
      writeFileSync(ruta, JSON.stringify(original));
      apuntarDatos('preview', 'ekou-elephants-datos-pr-3', raiz);
      apuntarDatos('produccion', null, raiz);
      expect(JSON.parse(readFileSync(ruta, 'utf8'))).toEqual({
        services: [],
        previews: {
          observability: { enabled: true },
          services: [{ binding: 'DATOS', service: 'ekou-elephants-datos-pr-3' }],
        },
      });
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
});
