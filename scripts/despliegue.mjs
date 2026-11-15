// Despliegue de la app (cliente + API) en Cloudflare Workers.
// Uso: node scripts/despliegue.mjs preview|produccion
//
// preview:    PREVIEW_NAME (pr-123), DATABASE_URL; MIGRAR=true exige DATABASE_URL_UNPOOLED.
// produccion: DATABASE_URL y DATABASE_URL_UNPOOLED de la rama `production` de Neon; siempre migra.
// Ambos:      CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID.
//
// Las URL de base de datos nunca van en argumentos ni en la salida: el pooled se sube como
// secreto del Worker con un archivo temporal 0600 y la salida de las migraciones se descarta.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WRANGLER = 'node_modules/wrangler/bin/wrangler.js';
const MIGRADOR = 'node_modules/node-pg-migrate/bin/node-pg-migrate.js';

export async function verificar(url, request = fetch, esperar = 2_000) {
  const rutas = ['/', '/api/salud', '/api/mapa/territorios/00/resumen'];
  for (const ruta of rutas) {
    let ok = false;
    for (let intento = 0; intento < 5 && !ok; intento++) {
      if (intento > 0) await new Promise((listo) => setTimeout(listo, esperar));
      try {
        const respuesta = await request(new URL(ruta, url), {
          signal: AbortSignal.timeout(15_000),
        });
        if (ruta === '/') {
          ok = respuesta.ok && (await respuesta.text()).includes('<div id="root">');
        } else if (ruta === '/api/salud') {
          ok = respuesta.ok && (await respuesta.json()).ok === true;
        } else {
          // Un territorio guardado o un 404 de dominio demuestran que la API llega a la base.
          const cuerpo = await respuesta.json();
          ok =
            (respuesta.status === 200 && cuerpo.codigo === '00') ||
            (respuesta.status === 404 && cuerpo.error === 'territorio_no_encontrado');
        }
      } catch {
        ok = false;
      }
    }
    if (!ok) throw new Error(`La verificación del despliegue falló en ${ruta}`);
  }
}

function exigir(env, nombres) {
  const faltantes = nombres.filter((n) => !env[n]?.trim());
  if (faltantes.length) throw new Error(`Falta configuración: ${faltantes.join(', ')}`);
}

function migrar(env, run) {
  try {
    run(
      process.execPath,
      [
        MIGRADOR,
        '--migrations-dir',
        'migrations',
        '--migration-file-language',
        'sql',
        '--database-url-var',
        'DATABASE_URL_UNPOOLED',
        'up',
      ],
      { env, stdio: 'pipe' },
    );
  } catch {
    // La salida del driver puede contener credenciales: no se muestra en logs públicos.
    throw new Error('Las migraciones fallaron; no se inició el despliegue.');
  }
}

function conSecretos(env, accion) {
  const carpeta = mkdtempSync(join(tmpdir(), 'elephants-despliegue-'));
  try {
    // JSON conserva literales como `$`. Los secretos nunca van en argumentos.
    const archivo = join(carpeta, 'secretos.json');
    writeFileSync(archivo, JSON.stringify({ DATABASE_URL: env.DATABASE_URL }), { mode: 0o600 });
    return accion(archivo);
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
}

function resumen(env, texto) {
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${texto}\n`);
}

export async function desplegarPreview({
  env = process.env,
  run = execFileSync,
  verify = verificar,
} = {}) {
  const migra = env.MIGRAR === 'true';
  exigir(env, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'DATABASE_URL',
    'PREVIEW_NAME',
    ...(migra ? ['DATABASE_URL_UNPOOLED'] : []),
  ]);
  if (!/^pr-[1-9]\d*$/.test(env.PREVIEW_NAME)) {
    throw new Error('PREVIEW_NAME debe identificar un PR (pr-123).');
  }
  if (migra) migrar(env, run);

  const salida = conSecretos(env, (archivo) => {
    const args = [WRANGLER, 'preview', '--name', env.PREVIEW_NAME, '--ignore-base-config'];
    args.push('--secrets-file', archivo, '--json');
    try {
      return run(process.execPath, args, { env, encoding: 'utf8', stdio: 'pipe' });
    } catch {
      throw new Error('Falló el despliegue del preview en Cloudflare; revisa su estado.');
    }
  });

  const direccion = JSON.parse(salida).preview_urls?.[0];
  if (typeof direccion !== 'string' || !direccion) {
    throw new Error('Cloudflare no devolvió la URL del preview.');
  }
  const url = new URL(direccion.startsWith('https://') ? direccion : `https://${direccion}`).href;
  console.log(`Preview: ${url}`);
  await verify(url);
  resumen(env, `### ${env.PREVIEW_NAME}\n\nApp y API: [abrir preview](${url})`);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `url=${url}\n`);
  return url;
}

export async function desplegarProduccion({ env = process.env, run = execFileSync } = {}) {
  exigir(env, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
  ]);
  migrar(env, run);
  conSecretos(env, (archivo) => {
    try {
      run(process.execPath, [WRANGLER, 'deploy', '--secrets-file', archivo], {
        env,
        stdio: 'pipe',
      });
    } catch {
      // Las migraciones ya aplicadas no se revierten: deben ser compatibles hacia atrás.
      throw new Error('Falló el despliegue a producción; las migraciones aplicadas se mantienen.');
    }
  });
  resumen(env, '### Producción\n\nMigraciones aplicadas y Worker desplegado.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const modos = { preview: desplegarPreview, produccion: desplegarProduccion };
  const modo = modos[process.argv[2]];
  Promise.resolve()
    .then(() => {
      if (!modo) throw new Error('Uso: node scripts/despliegue.mjs preview|produccion');
      return modo();
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
