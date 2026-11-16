// CLI que usa el workflow `app-preview` para leer y actualizar el comentario de control.
// Uso: node scripts/preview/github.mjs opciones|comentar
// Variables: GITHUB_TOKEN, GITHUB_REPOSITORY, PR, y para `comentar`: SHA, ESTADO, URL, MOTIVO,
// COPIA_BD, DATOS_PROPIOS, DATOS_CORTE_ENABLED, EJECUCION.
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bloqueoPorMigraciones, leerOpciones, MARCA, renderizarComentario } from './control.mjs';

const AUTOR_BOT = 'github-actions[bot]';

export function crearCliente({ token, repo, request = fetch }) {
  return async (metodo, ruta, cuerpo) => {
    const respuesta = await request(`https://api.github.com/repos/${repo}${ruta}`, {
      method: metodo,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        ...(cuerpo ? { 'content-type': 'application/json' } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    if (!respuesta.ok) {
      const error = new Error(`GitHub ${metodo} ${ruta} respondió ${respuesta.status}`);
      error.status = respuesta.status;
      throw error;
    }
    return respuesta.status === 204 ? null : respuesta.json();
  };
}

async function paginar(api, ruta) {
  const todos = [];
  for (let pagina = 1; ; pagina++) {
    const separador = ruta.includes('?') ? '&' : '?';
    const lote = await api('GET', `${ruta}${separador}per_page=100&page=${pagina}`);
    todos.push(...lote);
    if (lote.length < 100) return todos;
  }
}

export async function buscarComentario(api, pr) {
  const comentarios = await paginar(api, `/issues/${pr}/comments`);
  return comentarios.find((c) => c.user?.login === AUTOR_BOT && c.body?.startsWith(MARCA)) ?? null;
}

export async function migracionesCambiadas(api, pr) {
  const archivos = await paginar(api, `/pulls/${pr}/files`);
  return archivos.some(
    (a) => a.filename.startsWith('migrations/') || a.previous_filename?.startsWith('migrations/'),
  );
}

export async function calcularOpciones(api, pr) {
  const comentario = await buscarComentario(api, pr);
  const opciones = leerOpciones(comentario?.body);
  const migraciones = await migracionesCambiadas(api, pr);
  return {
    comentarioId: comentario?.id ?? '',
    opciones,
    migraciones,
    bloqueo: bloqueoPorMigraciones({ opciones, migracionesCambiadas: migraciones }) ?? '',
  };
}

/**
 * Crea o actualiza el único comentario de control del PR. No se fija: GitHub solo permite
 * fijar comentarios en issues («issue cannot be a pull request», verificado el 2026-11-15).
 */
export async function publicarComentario(api, pr, datos) {
  const cuerpo = renderizarComentario({ pr, ...datos });
  const existente = await buscarComentario(api, pr);
  const comentario = existente
    ? await api('PATCH', `/issues/comments/${existente.id}`, { body: cuerpo })
    : await api('POST', `/issues/${pr}/comments`, { body: cuerpo });
  return comentario.id;
}

function salida(variables) {
  const lineas = Object.entries(variables).map(([clave, valor]) => `${clave}=${valor}`);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${lineas.join('\n')}\n`);
  else console.log(lineas.join('\n'));
}

async function main(comando, env = process.env) {
  const faltantes = ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'PR'].filter((v) => !env[v]?.trim());
  if (faltantes.length) throw new Error(`Falta configuración: ${faltantes.join(', ')}`);
  if (!/^[1-9]\d*$/.test(env.PR)) throw new Error('PR debe ser un número.');
  const api = crearCliente({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY });

  if (comando === 'opciones') {
    const r = await calcularOpciones(api, env.PR);
    salida({
      comentario_id: r.comentarioId,
      copia_bd: r.opciones.copiaBd,
      datos_propios: r.opciones.datosPropios,
      migraciones: r.migraciones,
      bloqueo: r.bloqueo,
    });
    return;
  }
  if (comando === 'comentar') {
    await publicarComentario(api, env.PR, {
      sha: env.SHA ?? '',
      estado: env.ESTADO,
      url: env.URL || undefined,
      motivo: env.MOTIVO || undefined,
      ejecucion: env.EJECUCION || undefined,
      opciones: {
        copiaBd: env.COPIA_BD === 'true',
        datosPropios: env.DATOS_PROPIOS === 'true',
      },
      datosCorte: env.DATOS_CORTE_ENABLED === 'true',
    });
    return;
  }
  throw new Error(`Comando desconocido: ${comando}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
