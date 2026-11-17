// Referencia al corte vigente y publicación del Worker de datos (ADR 0003, «Publicación del corte
// con PR y preview»). El corte mensual ya no despliega en producción: abre un PR que solo cambia
// `pipeline/worker-datos/corte-vigente.json`. El preview de ese PR y el despliegue de `main` arman la
// publicación desde los Releases a partir de ese archivo, con el mismo comando.
// Uso:
//   node scripts/corte.mjs referencia <AAAA-MM> --publicado <ISO>
//       Pone ese corte como vigente (conserva el anterior). --publicado es el `publicadoEn` del
//       corte.json de su Release: cambia también al reprocesar el mismo mes.
//   node scripts/corte.mjs armar [--carpeta <ruta>]
//       Baja de los Releases los JSON de los cortes de la referencia y escribe datos/latest.json.
//       Por defecto en pipeline/worker-datos/publicacion (la carpeta que despliega el Worker de datos).
// Opción común: --referencia <ruta> (por defecto pipeline/worker-datos/corte-vigente.json).
// `armar` requiere `gh` autenticado (GH_TOKEN en Actions).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { punteroLatest, validarCorte } from './datos.mjs';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
export const REFERENCIA = 'pipeline/worker-datos/corte-vigente.json';
export const PUBLICACION = 'pipeline/worker-datos/publicacion';
// El vigente y el anterior: una petición que leyó el latest.json previo encuentra aún sus archivos.
export const CORTES_PUBLICADOS = 2;
// Diagnóstico de la extracción: está en el Release, pero el Worker de datos no lo publica.
const NO_PUBLICABLES = ['reporte-extraccion.json'];
// Los que lee la API del mapa (`ekou-pipeline export-mapa`).
const DEL_MAPA = ['corte.json', 'departamentos.json', 'municipios.json'];

/**
 * `{ corte, publicado, cortes }`: el corte vigente, el `publicadoEn` de su corte.json (el Release que
 * se revisó) y los cortes que publica el Worker de datos, del más reciente al más viejo.
 */
export function validarReferencia(ref) {
  if (!ref || typeof ref !== 'object') throw new Error('La referencia del corte no es un objeto.');
  validarCorte(ref.corte);
  if (typeof ref.publicado !== 'string' || Number.isNaN(Date.parse(ref.publicado)))
    throw new Error('La referencia necesita `publicado` (fecha ISO del corte.json del Release).');
  if (!Array.isArray(ref.cortes) || !ref.cortes.length)
    throw new Error('La referencia necesita la lista `cortes`.');
  for (const c of ref.cortes) validarCorte(c);
  const ordenados = [...new Set(ref.cortes)].sort().reverse();
  if (ordenados.join() !== ref.cortes.join())
    throw new Error('`cortes` debe ir del más reciente al más viejo, sin repetidos.');
  if (ref.cortes[0] !== ref.corte)
    throw new Error('El corte vigente debe ser el primero de `cortes`.');
  if (ref.cortes.length > CORTES_PUBLICADOS)
    throw new Error(`El Worker de datos publica a lo sumo ${CORTES_PUBLICADOS} cortes.`);
  return { corte: ref.corte, publicado: ref.publicado, cortes: ref.cortes };
}

export function leerReferencia(ruta = join(RAIZ_REPO, REFERENCIA)) {
  return validarReferencia(JSON.parse(readFileSync(ruta, 'utf8')));
}

/**
 * La referencia con `corte` como vigente, o `null` si no cambia: un corte anterior al vigente (un
 * reproceso de un mes viejo) solo actualiza su Release, como antes. Reprocesar el vigente cambia
 * `publicado`, así que también abre su PR.
 */
export function actualizarReferencia(ref, corte, publicado) {
  validarCorte(corte);
  if (typeof publicado !== 'string' || Number.isNaN(Date.parse(publicado)))
    throw new Error('Falta --publicado: el publicadoEn del corte.json del Release.');
  if (ref && corte < ref.corte) return null;
  const cortes = [...new Set([corte, ...(ref?.cortes ?? [])])]
    .sort()
    .reverse()
    .slice(0, CORTES_PUBLICADOS);
  const nueva = { corte, publicado, cortes };
  return ref && JSON.stringify(ref) === JSON.stringify(nueva) ? null : nueva;
}

const ejecutar = (comando, args, opciones = {}) =>
  execFileSync(comando, args, { stdio: 'inherit', ...opciones });

/**
 * Arma la carpeta del Worker de datos desde los Releases: `datos/<corte>/*.json` de cada corte de la
 * referencia y `datos/latest.json` del vigente. Borra la carpeta antes (también sus páginas).
 */
export function armarPublicacion({ referencia, carpeta }, run = ejecutar) {
  const ref = validarReferencia(referencia);
  const raiz = resolve(RAIZ_REPO, carpeta);
  rmSync(raiz, { recursive: true, force: true });
  for (const corte of ref.cortes) {
    const destino = join(raiz, 'datos', corte);
    mkdirSync(destino, { recursive: true });
    run('gh', ['release', 'download', `corte-${corte}`, '--dir', destino, '--pattern', '*.json']);
    for (const archivo of NO_PUBLICABLES) rmSync(join(destino, archivo), { force: true });
  }
  const vigente = join(raiz, 'datos', ref.corte);
  // Sin los JSON del mapa (`export-mapa`), la API y las páginas no tendrían de dónde leer.
  const faltan = DEL_MAPA.filter((a) => !existsSync(join(vigente, a)));
  if (faltan.length)
    throw new Error(
      `El Release corte-${ref.corte} no trae ${faltan.join(', ')}: reprocesa ese corte con el workflow corte-mensual.`,
    );
  // Solo se publica el Release que se revisó en el PR: si se reprocesó después, hace falta otro PR.
  const publicado = JSON.parse(readFileSync(join(vigente, 'corte.json'), 'utf8')).publicadoEn;
  if (publicado !== ref.publicado)
    throw new Error(
      `El Release corte-${ref.corte} es del ${publicado} y la referencia aprobada, del ${ref.publicado}: el corte se reprocesó después de la revisión.`,
    );
  const puntero = punteroLatest(ref.corte, readdirSync(vigente), publicado);
  writeFileSync(join(raiz, 'datos', 'latest.json'), `${JSON.stringify(puntero, null, 2)}\n`);
  return { raiz, puntero };
}

function leerArgs(argv) {
  const args = { posicionales: [], carpeta: PUBLICACION, referencia: REFERENCIA, publicado: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--carpeta') args.carpeta = argv[++i];
    else if (argv[i] === '--referencia') args.referencia = argv[++i];
    else if (argv[i] === '--publicado') args.publicado = argv[++i];
    else args.posicionales.push(argv[i]);
  }
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [comando, ...resto] = process.argv.slice(2);
  const { posicionales, carpeta, referencia, publicado } = leerArgs(resto);
  const rutaReferencia = resolve(RAIZ_REPO, referencia);
  try {
    if (comando === 'referencia') {
      const actual = existsSync(rutaReferencia) ? leerReferencia(rutaReferencia) : null;
      const nueva = actualizarReferencia(actual, posicionales[0], publicado);
      if (!nueva) {
        console.log(
          `El corte ${posicionales[0]} no cambia la referencia (vigente: ${actual?.corte}).`,
        );
      } else {
        writeFileSync(rutaReferencia, `${JSON.stringify(nueva, null, 2)}\n`);
        console.log(`Corte vigente: ${nueva.corte}; publicados: ${nueva.cortes.join(', ')}.`);
      }
    } else if (comando === 'armar') {
      const { raiz, puntero } = armarPublicacion({
        referencia: leerReferencia(rutaReferencia),
        carpeta,
      });
      console.log(`Publicación en ${raiz}: latest.json → ${puntero.corte}.`);
    } else {
      throw new Error(
        'Uso: node scripts/corte.mjs referencia <AAAA-MM> --publicado <ISO> | armar [--carpeta <ruta>]',
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
