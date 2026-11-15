// Despliegue de la app (cliente + API) en Cloudflare Workers.
// Uso: node scripts/despliegue.mjs preview|produccion
//
// preview:    PREVIEW_NAME (pr-123), DATABASE_URL; MIGRAR=true exige DATABASE_URL_UNPOOLED.
//             DATOS_SERVICIO (opcional): Worker de datos del PR (casilla «Datos propios»).
// produccion: DATABASE_URL y DATABASE_URL_UNPOOLED de la rama `production` de Neon; siempre migra.
// Ambos:      CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID.
//             DATOS_CORTE_ENABLED=true activa el binding DATOS al Worker del corte y verifica que
//             exista (Cloudflare rechaza un binding a un Worker inexistente). Sin la bandera, la app
//             se despliega sin binding: el frontend no depende de los datos del corte.
//
// Las URL de base de datos nunca van en argumentos ni en la salida: el pooled se sube como
// secreto del Worker con un archivo temporal 0600 y la salida de las migraciones se descarta.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORYBOOK_PATH, WORKER_DATOS } from './preview/control.mjs';

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

/** Error con un motivo que se puede mostrar en el comentario del PR. */
class Bloqueo extends Error {}

export async function existeWorker(env, nombre, request = fetch) {
  const respuesta = await request(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${nombre}/settings`,
    {
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (respuesta.status === 200) return true;
  if (respuesta.status === 404) return false;
  throw new Error(`Cloudflare respondió ${respuesta.status} al buscar el Worker ${nombre}.`);
}

/**
 * Fija el binding DATOS en la configuración que generó `vite build`, para producción
 * (`services`) o para los previews (`previews.services`). Con `servicio` nulo, sin binding.
 */
export function apuntarDatos(destino, servicio, raiz = process.cwd()) {
  const redireccion = join(raiz, '.wrangler/deploy/config.json');
  const ruta = resolve(
    dirname(redireccion),
    JSON.parse(readFileSync(redireccion, 'utf8')).configPath,
  );
  const config = JSON.parse(readFileSync(ruta, 'utf8'));
  const services = servicio ? [{ binding: 'DATOS', service: servicio }] : [];
  if (destino === 'preview') config.previews = { ...config.previews, services };
  else config.services = services;
  writeFileSync(ruta, JSON.stringify(config));
}

const datosActivos = (env) => env.DATOS_CORTE_ENABLED === 'true';

/**
 * Wrangler puede escribir avisos antes del JSON (por ejemplo, «Using redirected Wrangler
 * configuration» cuando despliega la configuración que genera el build).
 */
export function leerJsonDeWrangler(salida) {
  const inicio = salida.search(/^\{/m);
  if (inicio === -1) throw new Error('Wrangler no devolvió JSON.');
  return JSON.parse(salida.slice(inicio));
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
  existe = existeWorker,
  apuntar = apuntarDatos,
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
  const propio = `${WORKER_DATOS}-${env.PREVIEW_NAME}`;
  if (env.DATOS_SERVICIO && env.DATOS_SERVICIO !== propio) {
    throw new Error(`DATOS_SERVICIO solo puede ser ${propio}.`);
  }
  if (env.DATOS_SERVICIO) {
    if (!(await existe(env, propio))) {
      throw new Bloqueo(
        `No existe \`${propio}\`. Sube tus datos con \`npm run datos:preview -- ${env.PREVIEW_NAME.slice(3)}\` y vuelve a marcar la casilla.`,
      );
    }
    apuntar('preview', propio);
  } else if (datosActivos(env)) {
    if (!(await existe(env, WORKER_DATOS))) throw new Error(`No existe el Worker ${WORKER_DATOS}.`);
    apuntar('preview', WORKER_DATOS);
  } else {
    apuntar('preview', null);
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

  const direccion = leerJsonDeWrangler(salida).preview_urls?.[0];
  if (typeof direccion !== 'string' || !direccion) {
    throw new Error('Cloudflare no devolvió la URL del preview.');
  }
  const url = new URL(direccion.startsWith('https://') ? direccion : `https://${direccion}`).href;
  console.log(`Preview: ${url}`);
  await verify(url);
  resumen(
    env,
    `### ${env.PREVIEW_NAME}\n\nApp y API: [abrir preview](${url}) · Storybook: [sistema de diseño](${new URL(STORYBOOK_PATH, url).href})`,
  );
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `url=${url}\n`);
  return url;
}

export async function desplegarProduccion({
  env = process.env,
  run = execFileSync,
  existe = existeWorker,
  apuntar = apuntarDatos,
} = {}) {
  exigir(env, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
  ]);
  if (datosActivos(env)) {
    // Verificación de los datos: sin el Worker del corte, Cloudflare rechazaría el binding.
    if (!(await existe(env, WORKER_DATOS))) {
      throw new Error(
        `No existe el Worker ${WORKER_DATOS}: publica primero un corte mensual (TASK-15). No se migró nada.`,
      );
    }
  } else {
    console.log('DATOS_CORTE_ENABLED no está activa: se despliega sin el binding DATOS.');
    apuntar('produccion', null);
  }
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
  resumen(
    env,
    `### Producción\n\nMigraciones aplicadas y Worker desplegado. Storybook en \`${STORYBOOK_PATH}\`.`,
  );
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
      if (error instanceof Bloqueo && process.env.GITHUB_OUTPUT) {
        appendFileSync(
          process.env.GITHUB_OUTPUT,
          `motivo=${error.message.replaceAll('\n', ' ')}\n`,
        );
      }
      process.exitCode = 1;
    });
}
