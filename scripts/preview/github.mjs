// CLI que usa el workflow `app-preview` para leer y actualizar el comentario de control.
// Uso: node scripts/preview/github.mjs opciones|comentar
// Variables: GITHUB_TOKEN, GITHUB_REPOSITORY, PR, y para `comentar`: SHA, ESTADO, URL, MOTIVO,
// COPIA_BD, DATOS_PROPIOS, API_PROPIA, API_PR, API_CAMBIADA, DATOS_CORTE_ENABLED, EJECUCION y, con
// la arquitectura del ADR-0004, ARQUITECTURA y API_URL.
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  apiCambiada,
  bloqueoPorMigraciones,
  destinoApi,
  leerOpciones,
  MARCA,
  renderizarComentario,
} from './control.mjs';

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

/** Las rutas que cambia el PR, también las de antes de un renombre. */
export async function archivosCambiados(api, pr) {
  const archivos = await paginar(api, `/pulls/${pr}/files`);
  return archivos.flatMap((a) => [
    a.filename,
    ...(a.previous_filename ? [a.previous_filename] : []),
  ]);
}

export async function migracionesCambiadas(api, pr) {
  return (await archivosCambiados(api, pr)).some((ruta) => ruta.startsWith('migrations/'));
}

/** Un PR de otro número sirve de API solo si está abierto y es de este repositorio (no de un fork). */
export async function bloqueoPorOtroPr(api, otro) {
  let datos;
  try {
    datos = await api('GET', `/pulls/${otro}`);
  } catch (error) {
    if (error.status === 404) return `No existe el PR #${otro} de «API de otro PR».`;
    throw error;
  }
  if (datos.state !== 'open') return `El PR #${otro} de «API de otro PR» no está abierto.`;
  if (datos.head?.repo?.full_name !== datos.base?.repo?.full_name)
    return `El PR #${otro} viene de un fork: su API no tiene preview.`;
  return null;
}

export async function calcularOpciones(api, pr) {
  const comentario = await buscarComentario(api, pr);
  const opciones = leerOpciones(comentario?.body);
  const archivos = await archivosCambiados(api, pr);
  const migraciones = archivos.some((ruta) => ruta.startsWith('migrations/'));
  const cambiosApi = apiCambiada(archivos);
  const destino = destinoApi({ pr, opciones, cambiosApi });
  const otro = destino.api.startsWith('pr-') ? Number(destino.api.slice(3)) : null;
  const bloqueo =
    bloqueoPorMigraciones({ opciones, migracionesCambiadas: migraciones }) ??
    destino.bloqueo ??
    (otro ? await bloqueoPorOtroPr(api, otro) : null);
  return {
    comentarioId: comentario?.id ?? '',
    opciones,
    migraciones,
    cambiosApi,
    api: destino.api,
    bloqueo: bloqueo ?? '',
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
      api_propia: r.opciones.apiPropia,
      api_pr: r.opciones.apiPr ?? '',
      api_cambiada: r.cambiosApi,
      api: r.api,
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
        apiPropia: env.API_PROPIA === 'true',
        apiPr: /^[1-9]\d*$/.test(env.API_PR ?? '') ? Number(env.API_PR) : null,
      },
      cambiosApi: env.API_CAMBIADA === 'true',
      datosCorte: env.DATOS_CORTE_ENABLED === 'true',
      arquitectura: env.ARQUITECTURA || undefined,
      apiUrl: env.API_URL || undefined,
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
