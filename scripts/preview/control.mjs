// Comentario de control del preview de un PR: lo publica y actualiza el workflow (uno por PR)
// y sus casillas deciden con qué base de datos y qué datos del corte se despliega el preview.

export const MARCA = '<!-- ekou-preview-control -->';
// Worker solo de archivos estáticos con los JSON del corte mensual (lo despliega TASK-15).
export const WORKER_DATOS = 'ekou-elephants-datos';
// Arquitectura del ADR-0004: la web (Astro) y la API (Hono), cada una en su Worker.
export const WORKER_WEB = 'ekou-elephants-web';
export const WORKER_API = 'ekou-elephants-api';

const CASILLAS = {
  copiaBd: 'copia-bd',
  datosPropios: 'datos-propios',
  apiPropia: 'api-propia',
};
const CAMPO_API_PR = 'api-pr';

/**
 * Lee las opciones del comentario: las casillas marcadas y el número de «API de otro PR».
 * Sin comentario, todo queda en su valor por defecto.
 */
export function leerOpciones(cuerpo) {
  const marcada = (clave) =>
    new RegExp(`^\\s*[-*] \\[[xX]\\] .*<!-- ${clave} -->`, 'm').test(cuerpo ?? '');
  const apiPr = new RegExp(`API de otro PR:\\**\\s*#?\\s*(\\d*)\\s*<!-- ${CAMPO_API_PR} -->`).exec(
    cuerpo ?? '',
  )?.[1];
  return {
    copiaBd: marcada(CASILLAS.copiaBd),
    datosPropios: marcada(CASILLAS.datosPropios),
    apiPropia: marcada(CASILLAS.apiPropia),
    apiPr: apiPr ? Number(apiPr) : null,
  };
}

/**
 * Si el PR cambia la API: su servidor, su configuración, la lógica de un módulo (todo menos `ui/`) o
 * las migraciones. Entonces el preview despliega también la API del PR, aunque nadie marque la casilla.
 */
export function apiCambiada(archivos) {
  return archivos.some(
    (ruta) =>
      ruta === 'wrangler.api.jsonc' ||
      ruta.startsWith('src/server/') ||
      ruta.startsWith('migrations/') ||
      /^src\/modules\/[^/]+\/(?!ui\/)/.test(ruta),
  );
}

/**
 * A qué API apunta la web del preview: '' (la de producción, por service binding), 'propia' (un
 * preview de la API con el código de este PR) o 'pr-<n>' (el preview de la API de otro PR).
 */
export function destinoApi({ pr, opciones, cambiosApi }) {
  const otro = opciones.apiPr && opciones.apiPr !== Number(pr) ? opciones.apiPr : null;
  const propia = opciones.apiPropia || cambiosApi || opciones.apiPr === Number(pr);
  if (otro && propia) {
    return {
      api: '',
      bloqueo: cambiosApi
        ? `Este PR cambia la API, así que su preview usa la API del PR. Borra el número de «API de otro PR» (#${otro}).`
        : `Elige una sola API: desmarca «API de este PR» o borra el número de «API de otro PR» (#${otro}).`,
    };
  }
  if (propia) return { api: 'propia', bloqueo: null };
  if (otro) return { api: `pr-${otro}`, bloqueo: null };
  return { api: '', bloqueo: null };
}

export function nombreRamaNeon(pr) {
  return `preview/pr-${pr}`;
}

/** Worker de datos que lee el preview: el de producción o el que se subió para este PR. */
export function workerDatos(pr, opciones) {
  return opciones.datosPropios ? `${WORKER_DATOS}-pr-${pr}` : WORKER_DATOS;
}

/** Una migración nueva o modificada nunca se aplica a la base compartida `dev` desde un PR. */
export function bloqueoPorMigraciones({ opciones, migracionesCambiadas }) {
  if (migracionesCambiadas && !opciones.copiaBd) {
    return 'Este PR cambia `migrations/`. Marca «Copia propia de la base de datos» para desplegar el preview: las migraciones de un PR no se aplican a la base compartida `dev`.';
  }
  return null;
}

/** Static Storybook served by the same Worker (`npm run build` writes it to dist/client). */
export const STORYBOOK_PATH = '/storybook/';

const casilla = (marcada, clave, texto) => `- [${marcada ? 'x' : ' '}] ${texto} <!-- ${clave} -->`;

/**
 * Cuerpo del comentario. `estado` es 'desplegado', 'desplegando', 'bloqueado' o 'error'.
 */
/**
 * Which API the web uses (ADR-0004): the API's own preview, another PR's, or production. Shown in
 * one row: the web always calls it at its own /api, which forwards to that API.
 */
function origenApi(apiUrl, pr, enlace) {
  if (!apiUrl) return `de producción \`${WORKER_API}\` (service binding)`;
  const otro = /\/\/pr-(\d+)-/.exec(apiUrl)?.[1];
  const deQuien = otro && Number(otro) !== Number(pr) ? `del PR #${otro}` : 'de este PR';
  return `${enlace(apiUrl)} (preview ${deQuien})`;
}

export function renderizarComentario({
  pr,
  sha,
  opciones,
  estado,
  url,
  motivo,
  ejecucion,
  datosCorte,
  arquitectura,
  apiUrl,
  cambiosApi = false,
}) {
  const bd = opciones.copiaBd
    ? `copia propia \`${nombreRamaNeon(pr)}\` (rama de Neon desde \`dev\`, con las migraciones de este PR)`
    : 'compartida `dev` (sin migraciones del PR)';
  const datos = opciones.datosPropios
    ? `propios \`${workerDatos(pr, opciones)}\` (subidos con \`npm run datos:preview -- ${pr}\`)`
    : datosCorte
      ? `de producción \`${WORKER_DATOS}\` (solo lectura)`
      : 'sin datos del corte (`DATOS_CORTE_ENABLED` apagada)';
  // La API vive en el mismo Worker bajo `/api`.
  const api = url ? new URL('api', url).href : undefined;
  const estados = {
    desplegado: `✅ Desplegado desde \`${sha.slice(0, 7)}\``,
    desplegando: `⏳ Desplegando \`${sha.slice(0, 7)}\`…`,
    bloqueado: '⛔ No se desplegó',
    error: '❌ Falló el despliegue',
  };
  const lineas = [
    MARCA,
    '## Preview de este PR',
    '',
    `**Estado:** ${estados[estado]}${ejecucion ? ` · [ver ejecución](${ejecucion})` : ''}`,
  ];
  if (motivo) lineas.push('', `> ${motivo}`);
  const enlace = (href) => (href ? `[${href}](${href})` : '—');
  const storybook = `| Storybook (sistema de diseño) | ${url ? enlace(new URL(STORYBOOK_PATH, url).href) : '—'} |`;
  // ADR-0004: la web y la API en Workers distintos. La web sigue sirviendo /api por la API elegida.
  const filas =
    arquitectura === 'web-api'
      ? [
          `| Web | ${enlace(url)} |`,
          `| API | ${origenApi(apiUrl, pr, enlace)}${api ? ` · la web la llama en ${enlace(api)}` : ''} |`,
          storybook,
        ]
      : [`| App | ${enlace(url)} |`, `| API | ${enlace(api)} |`, storybook];
  lineas.push(
    '',
    '| | |',
    '| --- | --- |',
    ...filas,
    `| Base de datos | ${bd} |`,
    `| Datos del corte | ${datos} |`,
    '',
    '### Opciones',
    '',
    'Marca o desmarca una casilla y el preview se vuelve a desplegar con esa configuración.',
    '',
    casilla(
      opciones.copiaBd,
      CASILLAS.copiaBd,
      '**Copia propia de la base de datos.** Crea la rama de Neon `' +
        nombreRamaNeon(pr) +
        '` desde `dev` y aplica las migraciones del PR. Al desmarcarla se borra la rama y se vuelve a la compartida.',
    ),
    casilla(
      opciones.datosPropios,
      CASILLAS.datosPropios,
      `**Datos propios.** El preview lee \`${WORKER_DATOS}-pr-${pr}\` en lugar de los datos de producción. Antes, súbelos desde tu máquina: \`npm run datos:descargar\`, edita los JSON y \`npm run datos:preview -- ${pr}\`.`,
    ),
    casilla(
      opciones.apiPropia,
      CASILLAS.apiPropia,
      `**API de este PR.** Despliega un preview de \`${WORKER_API}\` con el código del PR y la web lo usa en lugar de la API de producción.${cambiosApi ? ' Este PR cambia la API: se despliega aunque no esté marcada.' : ''}`,
    ),
    `- **API de otro PR:** #${opciones.apiPr ?? ''} <!-- ${CAMPO_API_PR} --> Escribe el número de un PR abierto para que la web use el preview de su API.`,
    '',
    '<sub>Comentario gestionado por el workflow `app-preview`. Al cerrar el PR se borran los previews y la rama de Neon. No edites el texto: solo las casillas y el número de «API de otro PR». Las opciones de la API aplican a la arquitectura del ADR-0004 (web y API en Workers distintos).</sub>',
  );
  return lineas.join('\n');
}
