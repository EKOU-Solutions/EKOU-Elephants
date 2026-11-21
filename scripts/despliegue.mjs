// Despliegue de la app (cliente + API) en Cloudflare Workers.
// Uso: node scripts/despliegue.mjs preview|produccion
//
// Dos arquitecturas, según lo que traiga el código desplegado (corre siempre desde `main`):
// - La de hoy (ADR 0001): un solo Worker con la app y la API.
// - La del ADR-0004, si existen `web/wrangler.jsonc` y `wrangler.api.jsonc`: la web (Astro) y la API
//   (Hono) en Workers distintos. Ver «Arquitectura web + API» más abajo y docs/ci-cd.md.
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
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { descargar } from './datos.mjs';
import { STORYBOOK_PATH, WORKER_API, WORKER_DATOS, WORKER_WEB } from './preview/control.mjs';

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

async function desplegarPreviewApp({
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

  // Forma de `wrangler preview --json` (4.158.0): { preview: { urls }, deployment: { urls } }.
  const { preview, deployment } = leerJsonDeWrangler(salida);
  const direccion = preview?.urls?.[0] ?? deployment?.urls?.[0];
  if (typeof direccion !== 'string' || !direccion) {
    throw new Error('Cloudflare no devolvió la URL del preview.');
  }
  const url = new URL(direccion.startsWith('https://') ? direccion : `https://${direccion}`).href;
  console.log(`Preview: ${url}`);
  await verify(url);
  resumen(
    env,
    `### ${env.PREVIEW_NAME}\n\n- App: [abrir preview](${url})\n- API: [${url}api](${url}api)\n- Storybook: [sistema de diseño](${new URL(STORYBOOK_PATH, url).href})`,
  );
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `url=${url}\n`);
  return url;
}

async function desplegarProduccionApp({
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

// ── Arquitectura web + API (ADR-0004) ─────────────────────────────────────────────────────────────
//
// Contrato con el código del PR:
// - `wrangler.api.jsonc`: el Worker de la API (`ekou-elephants-api`).
// - `npm run build:web`: genera la web con el corte de `EKOU_PUBLICACION`, para `EKOU_SITIO_URL`, con
//   Storybook en /storybook/, y deja la configuración de Wrangler en `web/dist/server/wrangler.json`.
//   Su bloque `previews` trae el binding API a la API de producción.
// - La web usa `API_URL` (variable) si existe; si no, el binding API.

export const CONFIG_API = 'wrangler.api.jsonc';
export const CONFIG_WEB = 'web/wrangler.jsonc';
export const CONFIG_WEB_BUILD = 'web/dist/server/wrangler.json';
// Configuración de la API con el binding DATOS que corresponde; se escribe junto a la original para
// que `main` siga resolviendo igual.
const CONFIG_API_GENERADA = 'wrangler.api.generado.json';

/** 'web-api' si el código trae la web y la API por separado (ADR-0004); si no, 'app'. */
export function arquitectura(raiz = process.cwd()) {
  return existsSync(join(raiz, CONFIG_WEB)) && existsSync(join(raiz, CONFIG_API))
    ? 'web-api'
    : 'app';
}

/** JSON con comentarios de línea o de bloque y comas finales, como los `wrangler.jsonc`. */
export function leerJsonc(texto) {
  let limpio = '';
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      const inicio = i;
      for (i++; i < texto.length && texto[i] !== '"'; i++) if (texto[i] === '\\') i++;
      limpio += texto.slice(inicio, i + 1);
    } else if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i++;
      limpio += '\n';
    } else if (c === '/' && texto[i + 1] === '*') {
      i = texto.indexOf('*/', i + 2);
      if (i === -1) break;
      i++;
    } else limpio += c;
  }
  return JSON.parse(limpio.replace(/,(\s*[}\]])/g, '$1'));
}

/**
 * Escribe la configuración de la API con el binding DATOS: en producción (`services`) o en los
 * previews (`previews.services`). Devuelve su ruta.
 */
export function configurarApi(destino, servicio, raiz = process.cwd()) {
  const config = leerJsonc(readFileSync(join(raiz, CONFIG_API), 'utf8'));
  const services = servicio ? [{ binding: 'DATOS', service: servicio }] : [];
  if (destino === 'preview') config.previews = { ...config.previews, services };
  else config.services = services;
  const ruta = join(raiz, CONFIG_API_GENERADA);
  writeFileSync(ruta, JSON.stringify(config, null, 2));
  return ruta;
}

/** El subdominio `<cuenta>.workers.dev` de la cuenta: arma las URL antes de desplegar. */
export async function subdominio(env, request = fetch) {
  const respuesta = await request(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/subdomain`,
    {
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!respuesta.ok)
    throw new Error(`Cloudflare respondió ${respuesta.status} al leer el subdominio.`);
  const sub = (await respuesta.json())?.result?.subdomain;
  if (typeof sub !== 'string' || !/^[a-z0-9-]+$/.test(sub))
    throw new Error('Cloudflare no devolvió el subdominio de workers.dev.');
  return sub;
}

export const urlPreview = (preview, worker, sub) =>
  `https://${preview}-${worker}.${sub}.workers.dev/`;
export const urlProduccion = (worker, sub) => `https://${worker}.${sub}.workers.dev/`;

/** El entorno del build de la web: sin credenciales de base de datos ni de Cloudflare. */
function entornoBuild(env, extra) {
  const { DATABASE_URL: _a, DATABASE_URL_UNPOOLED: _b, CLOUDFLARE_API_TOKEN: _c, ...resto } = env;
  return { ...resto, ...extra };
}

/**
 * Baja el corte vigente del Release (los JSON que lee la web al generarse) y genera la web.
 * Las páginas del mapa salen de ese corte; la API lee el Worker de datos que le toque.
 */
export function construirWeb(
  env,
  { sitio, version, raiz = process.cwd() },
  run = execFileSync,
  bajar = descargar,
) {
  const carpeta = mkdtempSync(join(tmpdir(), 'elephants-corte-'));
  try {
    const publicacion = join(carpeta, 'publicacion');
    bajar({ carpeta: publicacion, forzar: true }, (comando, args, opciones) =>
      run(comando, args, { env, ...opciones }),
    );
    try {
      run('npm', ['run', 'build:web'], {
        env: entornoBuild(env, {
          EKOU_PUBLICACION: publicacion,
          EKOU_SITIO_URL: sitio,
          EKOU_VERSION: version,
        }),
        stdio: 'inherit',
      });
    } catch {
      throw new Error('Falló el build de la web (npm run build:web).');
    }
    if (!existsSync(join(raiz, CONFIG_WEB_BUILD)))
      throw new Error(`El build de la web no dejó ${CONFIG_WEB_BUILD}.`);
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
}

/** La API responde y llega a sus datos: `/api/salud` y el corte vigente del mapa. */
export async function verificarApi(url, request = fetch, esperar = 2_000) {
  await reintentar(
    new URL('api/salud', url),
    esperar,
    request,
    async (r) => r.ok && (await r.json()).ok === true,
  );
}

/** La web sirve el mapa generado (una isla de Astro), Storybook, y su /api llega a la API. */
export async function verificarWeb(url, request = fetch, esperar = 2_000) {
  await reintentar(
    new URL('mapa', url),
    esperar,
    request,
    async (r) => r.ok && (await r.text()).includes('<astro-island'),
  );
  await reintentar(
    new URL('api/salud', url),
    esperar,
    request,
    async (r) => r.ok && (await r.json()).ok === true,
  );
  await reintentar(
    new URL(STORYBOOK_PATH.slice(1), url),
    esperar,
    request,
    async (r) => r.ok && (await r.text()).includes('storybook'),
  );
}

async function reintentar(url, esperar, request, valida) {
  for (let intento = 0; intento < 5; intento++) {
    if (intento > 0) await new Promise((listo) => setTimeout(listo, esperar));
    try {
      if (await valida(await request(url, { signal: AbortSignal.timeout(15_000) }))) return;
    } catch {
      // Se reintenta: un Worker recién desplegado puede tardar en responder.
    }
  }
  throw new Error(`La verificación del despliegue falló en ${url.pathname}`);
}

function urlDeWrangler(salida) {
  const { preview, deployment } = leerJsonDeWrangler(salida);
  const direccion = preview?.urls?.[0] ?? deployment?.urls?.[0];
  if (typeof direccion !== 'string' || !direccion)
    throw new Error('Cloudflare no devolvió la URL del preview.');
  return new URL(direccion.startsWith('https://') ? direccion : `https://${direccion}`).href;
}

/** El Worker de datos que lee la API (igual que en la arquitectura de hoy). */
async function datosDelPreview(env, existe) {
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
    return propio;
  }
  if (datosActivos(env)) {
    if (!(await existe(env, WORKER_DATOS))) throw new Error(`No existe el Worker ${WORKER_DATOS}.`);
    return WORKER_DATOS;
  }
  return null;
}

/**
 * Preview con la web y la API separadas. La web es siempre un Preview de `ekou-elephants-web`. Su API:
 * - por defecto, la de producción por el service binding (un Preview siempre llama a la producción
 *   del Worker enlazado: developers.cloudflare.com/workers/previews/);
 * - API_DESTINO=propia: un Preview de `ekou-elephants-api` con el código del PR;
 * - API_DESTINO=pr-<n>: el Preview de la API de otro PR.
 * En los dos últimos casos la web llama a la API por su URL pública (`API_URL`): una petición más,
 * solo en pruebas.
 */
async function desplegarPreviewWebApi({
  env,
  run,
  existe,
  request,
  verifyApi,
  verifyWeb,
  build,
  raiz,
}) {
  const destino = env.API_DESTINO ?? '';
  if (destino && destino !== 'propia' && !/^pr-[1-9]\d*$/.test(destino)) {
    throw new Error('API_DESTINO debe ser vacío, «propia» o «pr-<número>».');
  }
  const migra = env.MIGRAR === 'true';
  if (migra && destino !== 'propia') {
    throw new Bloqueo(
      'Este PR migra su propia base, pero la web usaría otra API. Marca «API de este PR» para que use la base migrada.',
    );
  }
  const sub = await subdominio(env, request);
  let apiUrl;
  if (destino === 'propia') {
    const config = configurarApi('preview', await datosDelPreview(env, existe), raiz);
    if (migra) migrar(env, run);
    const salida = conSecretos(env, (archivo) => {
      const args = [WRANGLER, 'preview', '--name', env.PREVIEW_NAME, '--config', config];
      args.push('--ignore-base-config', '--secrets-file', archivo, '--json');
      try {
        return run(process.execPath, args, { env, encoding: 'utf8', stdio: 'pipe' });
      } catch {
        throw new Error(
          'Falló el despliegue del preview de la API en Cloudflare; revisa su estado.',
        );
      }
    });
    apiUrl = urlDeWrangler(salida);
    await verifyApi(apiUrl);
  } else if (destino) {
    apiUrl = urlPreview(destino, WORKER_API, sub);
    try {
      await verifyApi(apiUrl);
    } catch {
      throw new Bloqueo(
        `El PR #${destino.slice(3)} no tiene un preview de la API que responda. Despliégalo marcando «API de este PR» en ese PR.`,
      );
    }
  }

  const esperada = urlPreview(env.PREVIEW_NAME, WORKER_WEB, sub);
  build(
    env,
    {
      sitio: esperada.replace(/\/$/, ''),
      version: (env.SHA ?? '').slice(0, 7) || env.PREVIEW_NAME,
      raiz,
    },
    run,
  );
  const args = [
    WRANGLER,
    'preview',
    '--name',
    env.PREVIEW_NAME,
    '--config',
    join(raiz, CONFIG_WEB_BUILD),
  ];
  args.push('--ignore-base-config', '--json');
  if (apiUrl) args.push('--var', `API_URL:${apiUrl.replace(/\/$/, '')}`);
  let salida;
  try {
    salida = run(process.execPath, args, { env, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    throw new Error('Falló el despliegue del preview de la web en Cloudflare; revisa su estado.');
  }
  const url = urlDeWrangler(salida);
  console.log(`Preview de la web: ${url}`);
  await verifyWeb(url);
  resumen(
    env,
    `### ${env.PREVIEW_NAME}\n\n- Web: [abrir preview](${url})\n- Storybook: [abrir](${new URL(STORYBOOK_PATH, url).href})\n- API: ${apiUrl ? `[preview](${apiUrl}api)` : `producción (\`${WORKER_API}\`)`}`,
  );
  if (env.GITHUB_OUTPUT)
    appendFileSync(
      env.GITHUB_OUTPUT,
      `url=${url}\narquitectura=web-api\napi_url=${apiUrl ?? ''}\n`,
    );
  return { url, apiUrl };
}

/** Producción con la web y la API separadas: primero la API (la web la necesita), luego la web. */
async function desplegarProduccionWebApi({
  env,
  run,
  existe,
  request,
  verifyApi,
  verifyWeb,
  build,
  raiz,
}) {
  let datos = null;
  if (datosActivos(env)) {
    if (!(await existe(env, WORKER_DATOS))) {
      throw new Error(
        `No existe el Worker ${WORKER_DATOS}: publica primero un corte mensual (TASK-15). No se migró nada.`,
      );
    }
    datos = WORKER_DATOS;
  } else {
    console.log('DATOS_CORTE_ENABLED no está activa: la API se despliega sin el binding DATOS.');
  }
  const sub = await subdominio(env, request);
  const config = configurarApi('produccion', datos, raiz);
  migrar(env, run);
  conSecretos(env, (archivo) => {
    try {
      run(process.execPath, [WRANGLER, 'deploy', '--config', config, '--secrets-file', archivo], {
        env,
        stdio: 'pipe',
      });
    } catch {
      throw new Error(
        'Falló el despliegue de la API a producción; las migraciones aplicadas se mantienen.',
      );
    }
  });
  await verifyApi(urlProduccion(WORKER_API, sub));
  const sitio = env.EKOU_SITIO_URL?.trim() || urlProduccion(WORKER_WEB, sub).replace(/\/$/, '');
  build(env, { sitio, version: (env.GITHUB_SHA ?? '').slice(0, 7) || 'produccion', raiz }, run);
  try {
    run(process.execPath, [WRANGLER, 'deploy', '--config', join(raiz, CONFIG_WEB_BUILD)], {
      env,
      stdio: 'pipe',
    });
  } catch {
    throw new Error('Falló el despliegue de la web a producción; la API ya quedó desplegada.');
  }
  await verifyWeb(urlProduccion(WORKER_WEB, sub));
  resumen(
    env,
    `### Producción\n\nMigraciones aplicadas. API: \`${WORKER_API}\`. Web: \`${WORKER_WEB}\` (${sitio}).`,
  );
}

const depsWebApi = (deps) => ({
  request: fetch,
  verifyApi: verificarApi,
  verifyWeb: verificarWeb,
  build: construirWeb,
  ...deps,
});

export async function desplegarPreview({
  env = process.env,
  run = execFileSync,
  verify = verificar,
  existe = existeWorker,
  apuntar = apuntarDatos,
  raiz = process.cwd(),
  ...deps
} = {}) {
  if (arquitectura(raiz) === 'app')
    return desplegarPreviewApp({ env, run, verify, existe, apuntar });
  exigir(env, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'DATABASE_URL',
    'PREVIEW_NAME',
    ...(env.MIGRAR === 'true' ? ['DATABASE_URL_UNPOOLED'] : []),
  ]);
  if (!/^pr-[1-9]\d*$/.test(env.PREVIEW_NAME)) {
    throw new Error('PREVIEW_NAME debe identificar un PR (pr-123).');
  }
  return desplegarPreviewWebApi({ env, run, existe, raiz, ...depsWebApi(deps) });
}

export async function desplegarProduccion({
  env = process.env,
  run = execFileSync,
  existe = existeWorker,
  apuntar = apuntarDatos,
  raiz = process.cwd(),
  ...deps
} = {}) {
  if (arquitectura(raiz) === 'app') return desplegarProduccionApp({ env, run, existe, apuntar });
  exigir(env, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
  ]);
  return desplegarProduccionWebApi({ env, run, existe, raiz, ...depsWebApi(deps) });
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
