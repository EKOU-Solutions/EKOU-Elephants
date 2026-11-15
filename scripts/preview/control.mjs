// Comentario de control del preview de un PR: lo publica el workflow, se fija en el PR
// y sus casillas deciden con qué base de datos y qué datos de R2 se despliega el preview.

export const MARCA = '<!-- ekou-preview-control -->';
// Misma estructura que publica el corte mensual (TASK-15): datos/latest.json y datos/AAAA-MM/.
export const PREFIJO_R2_ESTABLE = 'datos/';

const CASILLAS = {
  copiaBd: 'copia-bd',
  prefijoR2Propio: 'prefijo-r2-propio',
};

/** Lee las casillas marcadas del comentario. Sin comentario, todo queda en su valor por defecto. */
export function leerOpciones(cuerpo) {
  const marcada = (clave) =>
    new RegExp(`^\\s*[-*] \\[[xX]\\] .*<!-- ${clave} -->`, 'm').test(cuerpo ?? '');
  return {
    copiaBd: marcada(CASILLAS.copiaBd),
    prefijoR2Propio: marcada(CASILLAS.prefijoR2Propio),
  };
}

export function nombreRamaNeon(pr) {
  return `preview/pr-${pr}`;
}

export function prefijoR2(pr, opciones) {
  return opciones.prefijoR2Propio ? `previews/pr-${pr}/datos/` : PREFIJO_R2_ESTABLE;
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
export function renderizarComentario({ pr, sha, opciones, estado, url, motivo, ejecucion }) {
  const bd = opciones.copiaBd
    ? `copia propia \`${nombreRamaNeon(pr)}\` (rama de Neon desde \`dev\`, con las migraciones de este PR)`
    : 'compartida `dev` (sin migraciones del PR)';
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
    `| App y API | ${url ? `[${url}](${url})` : '—'} |`,
    `| Base de datos | ${bd} |`,
    `| Datos en R2 | prefijo \`${prefijoR2(pr, opciones)}\` |`,
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
      opciones.prefijoR2Propio,
      CASILLAS.prefijoR2Propio,
      `**Prefijo de R2 propio.** El preview lee \`previews/pr-${pr}/datos/\` en lugar de \`${PREFIJO_R2_ESTABLE}\`. Sube ahí tus archivos modificados con la misma estructura (\`latest.json\` y \`AAAA-MM/\`).`,
    ),
    '',
    '<sub>Comentario gestionado por el workflow `app-preview`. Al cerrar el PR se borran el preview y la rama de Neon. No edites el texto, solo las casillas.</sub>',
  );
  return lineas.join('\n');
}
