// Comentario de control del preview de un PR: lo publica el workflow, se fija en el PR
// y su casilla decide con qué base de datos se despliega el preview.

export const MARCA = '<!-- ekou-preview-control -->';

const CASILLAS = {
  copiaBd: 'copia-bd',
};

/** Lee las casillas marcadas del comentario. Sin comentario, todo queda en su valor por defecto. */
export function leerOpciones(cuerpo) {
  const marcada = (clave) =>
    new RegExp(`^\\s*[-*] \\[[xX]\\] .*<!-- ${clave} -->`, 'm').test(cuerpo ?? '');
  return {
    copiaBd: marcada(CASILLAS.copiaBd),
  };
}

export function nombreRamaNeon(pr) {
  return `preview/pr-${pr}`;
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
    '',
    '### Opciones',
    '',
    'Marca o desmarca la casilla y el preview se vuelve a desplegar con esa configuración.',
    '',
    casilla(
      opciones.copiaBd,
      CASILLAS.copiaBd,
      '**Copia propia de la base de datos.** Crea la rama de Neon `' +
        nombreRamaNeon(pr) +
        '` desde `dev` y aplica las migraciones del PR. Al desmarcarla se borra la rama y se vuelve a la compartida.',
    ),
    '',
    '<sub>Comentario gestionado por el workflow `app-preview`. Al cerrar el PR se borran el preview y la rama de Neon. No edites el texto, solo la casilla.</sub>',
  );
  return lineas.join('\n');
}
