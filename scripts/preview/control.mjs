// Comentario de control del preview de un PR: lo publica y actualiza el workflow (uno por PR)
// y sus casillas deciden con qué base de datos y qué datos del corte se despliega el preview.

export const MARCA = '<!-- ekou-preview-control -->';
// Worker solo de archivos estáticos con los JSON del corte mensual (lo despliega TASK-15).
export const WORKER_DATOS = 'ekou-elephants-datos';

const CASILLAS = {
  copiaBd: 'copia-bd',
  datosPropios: 'datos-propios',
};

/** Lee las casillas marcadas del comentario. Sin comentario, todo queda en su valor por defecto. */
export function leerOpciones(cuerpo) {
  const marcada = (clave) =>
    new RegExp(`^\\s*[-*] \\[[xX]\\] .*<!-- ${clave} -->`, 'm').test(cuerpo ?? '');
  return {
    copiaBd: marcada(CASILLAS.copiaBd),
    datosPropios: marcada(CASILLAS.datosPropios),
  };
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

const casilla = (marcada, clave, texto) => `- [${marcada ? 'x' : ' '}] ${texto} <!-- ${clave} -->`;

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
  lineas.push(
    '',
    '| | |',
    '| --- | --- |',
    `| App | ${url ? `[${url}](${url})` : '—'} |`,
    `| API | ${api ? `[${api}](${api})` : '—'} |`,
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
    '',
    '<sub>Comentario gestionado por el workflow `app-preview`. Al cerrar el PR se borran el preview y la rama de Neon. No edites el texto, solo las casillas.</sub>',
  );
  return lineas.join('\n');
}
