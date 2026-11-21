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
};
// El valor «API» del comentario y, oculto, el que el workflow eligió solo la última vez.
const CAMPO_API = 'api';
const CAMPO_API_AUTO = 'api-auto';

/** Nombre de una API: `ekou-elephants-api` (producción) o `ekou-elephants-api-pr-<n>` (un preview). */
export function nombreApi(pr) {
  return pr ? `${WORKER_API}-pr-${pr}` : WORKER_API;
}

/**
 * Lee las opciones del comentario: las casillas marcadas, el valor de «API» y el que el workflow
 * eligió solo. Sin comentario, todo queda en su valor por defecto.
 */
export function leerOpciones(cuerpo) {
  const texto = cuerpo ?? '';
  const marcada = (clave) =>
    new RegExp(`^\\s*[-*] \\[[xX]\\] .*<!-- ${clave} -->`, 'm').test(texto);
  const api = new RegExp(`\\*\\*API:\\*\\*([^\\n]*?)<!-- ${CAMPO_API} -->`).exec(texto)?.[1];
  const apiAuto = new RegExp(`<!-- ${CAMPO_API_AUTO}: ([\\w-]+) -->`).exec(texto)?.[1];
  return {
    copiaBd: marcada(CASILLAS.copiaBd),
    datosPropios: marcada(CASILLAS.datosPropios),
    api: api?.replace(/[`\s]/g, '') || null,
    apiAuto: apiAuto ?? null,
  };
}

/**
 * El número de PR de un valor de «API», o null para producción. Acepta `ekou-elephants-api`,
 * `ekou-elephants-api-pr-57`, `pr-57`, `#57` o `57`; undefined si no es ninguno.
 */
export function interpretarApi(valor) {
  if (valor === WORKER_API || /^producci[oó]n$/i.test(valor)) return null;
  const pr = new RegExp(`^(?:${WORKER_API}-pr-|pr-|#)?([1-9]\\d*)$`).exec(valor)?.[1];
  return pr ? Number(pr) : undefined;
}

/**
 * Si el PR cambia la API: su servidor, su configuración, la lógica de un módulo (todo menos `ui/`) o
 * las migraciones. Entonces el preview usa, por defecto, un preview de la API con el código del PR.
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

/** La API que el workflow elige solo: la de este PR si cambia la API; si no, la de producción. */
export function apiAutomatica(pr, cambiosApi) {
  return nombreApi(cambiosApi ? pr : null);
}

/**
 * A qué API apunta la web del preview. Si la persona cambió el valor de «API», manda lo que escribió;
 * si no, la automática. `api` es '' (producción, por service binding), 'propia' (un preview con el
 * código de este PR) o 'pr-<n>' (el preview de la API de otro PR); `elegida`, el valor a mostrar.
 */
export function destinoApi({ pr, opciones, cambiosApi }) {
  const automatica = apiAutomatica(pr, cambiosApi);
  const manual = Boolean(opciones.api) && opciones.api !== opciones.apiAuto;
  // Lo que escribió una persona: sin caracteres que rompan el comentario o las salidas del workflow.
  const valor = manual ? opciones.api.replace(/[^\w#.-]/g, '').slice(0, 60) : automatica;
  const numero = interpretarApi(valor);
  if (numero === undefined) {
    return {
      api: '',
      elegida: valor,
      manual,
      bloqueo: `«${valor}» no es una API. En «API» escribe \`${WORKER_API}\` (producción) o \`${WORKER_API}-pr-<número>\` (el preview de un PR).`,
    };
  }
  const api = numero === null ? '' : numero === Number(pr) ? 'propia' : `pr-${numero}`;
  return { api, elegida: nombreApi(numero), manual, bloqueo: null };
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

/** «API»: el valor que usa el preview, por qué, y cómo cambiarlo. */
function lineaApi({ pr, elegida, manual, cambiosApi }) {
  const automatica = apiAutomatica(pr, cambiosApi);
  const valor = elegida || automatica;
  const motivo = manual
    ? 'Elegida a mano.'
    : cambiosApi
      ? 'La de este PR, porque cambia la API: se despliega su preview.'
      : 'La de producción, porque este PR no cambia la API.';
  return `- **API:** \`${valor}\` <!-- ${CAMPO_API} --> ${motivo} Para usar otra, cambia el valor: \`${WORKER_API}\` (producción) o \`${WORKER_API}-pr-<número>\` (el preview de la API de un PR abierto). <!-- ${CAMPO_API_AUTO}: ${automatica} -->`;
}

/**
 * Cuerpo del comentario. `estado` es 'desplegado', 'desplegando', 'bloqueado' o 'error'.
 */
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
  apiElegida,
  apiManual = false,
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
  // ADR-0004: la web y la API en Workers distintos. Cómo llega la web a la API: docs/arquitectura.md.
  const filas =
    arquitectura === 'web-api'
      ? [`| Web | ${enlace(url)} |`, `| API | ${enlace(apiUrl)} |`, storybook]
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
    lineaApi({ pr, elegida: apiElegida, manual: apiManual, cambiosApi }),
    '',
    '<sub>Comentario gestionado por el workflow `app-preview`. Al cerrar el PR se borran los previews y la rama de Neon. No edites el texto: solo las casillas y el valor de «API», que aplica a la web y la API en Workers distintos (ADR-0004).</sub>',
  );
  return lineas.join('\n');
}
