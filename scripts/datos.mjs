// Comandos locales para los datos del corte mensual (docs/ci-cd.md).
// Uso:
//   npm run datos:corte -- [AAAA-MM]          Lanza el workflow corte-mensual en GitHub Actions.
//   npm run datos:descargar -- [AAAA-MM]      Baja un corte publicado a datos-locales/ para editarlo.
//   npm run datos:preview -- <pr>             Sube datos-locales/ al Worker de datos de ese PR.
// Opciones: --carpeta <ruta> (por defecto datos-locales) y --forzar (reemplaza la carpeta al descargar).
// Requiere `gh` autenticado y, para `preview`, `wrangler login` en la cuenta de EKOU.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKER_DATOS } from './preview/control.mjs';

const WORKFLOW_CORTE = 'corte-mensual.yml';
const CORTE = /^\d{4}-(0[1-9]|1[0-2])$/;
// Archivos del Release que no consume la app (diagnóstico de la extracción).
const NO_PUBLICABLES = new Set(['reporte-extraccion.json']);

export function validarCorte(corte) {
  if (!CORTE.test(corte)) throw new Error(`El corte debe tener el formato AAAA-MM: '${corte}'`);
  return corte;
}

/** El corte más reciente entre las etiquetas `corte-AAAA-MM` de los Releases. */
export function ultimoCorte(etiquetas) {
  const cortes = etiquetas
    .map((e) => /^corte-(\d{4}-\d{2})$/.exec(e)?.[1])
    .filter((c) => c && CORTE.test(c))
    .sort();
  if (!cortes.length) throw new Error('No hay ningún Release corte-AAAA-MM publicado.');
  return cortes.at(-1);
}

// Los resúmenes por territorio (~1.150 JSON) van en un solo archivo: un Release admite 1.000 assets.
export const PAQUETE_RESUMEN = 'resumen.tar.gz';

/**
 * Baja de un Release los JSON y el paquete de resúmenes, y deja éste extraído en
 * `<destino>/resumen/` y `<destino>/resumen-departamento/`. Un corte anterior a los resúmenes no
 * trae el paquete: no es un error, esa ficha mostrará «sin información».
 */
export function descargarCorte(corte, destino, run = ejecutar) {
  mkdirSync(destino, { recursive: true });
  run('gh', [
    'release',
    'download',
    `corte-${corte}`,
    '--dir',
    destino,
    '--pattern',
    '*.json',
    '--pattern',
    PAQUETE_RESUMEN,
  ]);
  if (existsSync(join(destino, PAQUETE_RESUMEN))) {
    // Ruta relativa y con `cwd`: el tar de Git Bash en Windows toma `C:\...` por un host remoto.
    run('tar', ['-xzf', PAQUETE_RESUMEN], { cwd: destino });
    rmSync(join(destino, PAQUETE_RESUMEN), { force: true });
  }
  for (const archivo of NO_PUBLICABLES) rmSync(join(destino, archivo), { force: true });
}

/** Mismo formato que publica el corte mensual (TASK-15). */
export function punteroLatest(corte, archivos, publicado = new Date().toISOString()) {
  return {
    corte,
    publicado,
    archivos: Object.fromEntries(
      archivos
        .filter((a) => a.endsWith('.json') && !NO_PUBLICABLES.has(a))
        .sort()
        .map((a) => [a.replace(/\.json$/, ''), `datos/${corte}/${a}`]),
    ),
  };
}

/** Configuración del Worker de datos de un PR: solo archivos estáticos y sin URL pública. */
export function configWorkerPr(pr, directorio) {
  return {
    name: `${WORKER_DATOS}-pr-${pr}`,
    compatibility_date: '2026-11-01',
    workers_dev: false,
    preview_urls: false,
    assets: { directory: directorio },
  };
}

function leerArgs(argv) {
  const args = { posicionales: [], carpeta: 'datos-locales', forzar: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--carpeta') args.carpeta = argv[++i];
    else if (argv[i] === '--forzar') args.forzar = true;
    else args.posicionales.push(argv[i]);
  }
  return args;
}

function ejecutar(comando, args, opciones = {}) {
  return execFileSync(comando, args, { stdio: 'inherit', ...opciones });
}

export function lanzarCorte(corte, run = ejecutar) {
  const args = ['workflow', 'run', WORKFLOW_CORTE];
  if (corte) args.push('-f', `corte=${validarCorte(corte)}`);
  run('gh', args);
  console.log('Corte lanzado. Síguelo con: gh run list --workflow corte-mensual.yml');
}

export function descargar({ corte, carpeta, forzar }, run = ejecutar) {
  const raiz = resolve(carpeta);
  if (existsSync(raiz) && !forzar) {
    throw new Error(
      `${carpeta} ya existe y puede tener cambios tuyos. Usa --forzar para reemplazarla.`,
    );
  }
  const etiquetas = run(
    'gh',
    ['release', 'list', '--limit', '200', '--json', 'tagName', '--jq', '.[].tagName'],
    {
      stdio: 'pipe',
      encoding: 'utf8',
    },
  )
    .split('\n')
    .filter(Boolean);
  const elegido = corte ? validarCorte(corte) : ultimoCorte(etiquetas);
  if (!etiquetas.includes(`corte-${elegido}`))
    throw new Error(`No existe el Release corte-${elegido}.`);

  rmSync(raiz, { recursive: true, force: true });
  const destino = join(raiz, 'datos', elegido);
  descargarCorte(elegido, destino, run);
  const puntero = punteroLatest(elegido, readdirSync(destino));
  writeFileSync(join(raiz, 'datos', 'latest.json'), `${JSON.stringify(puntero, null, 2)}\n`);
  console.log(`Corte ${elegido} en ${carpeta}/datos/. Edita los JSON y súbelos con:`);
  console.log('  npm run datos:preview -- <número del PR>');
}

export function subirPreview({ pr, carpeta }, run = ejecutar) {
  if (!/^[1-9]\d*$/.test(pr ?? ''))
    throw new Error('Indica el número del PR: npm run datos:preview -- 123');
  const raiz = resolve(carpeta);
  if (!existsSync(join(raiz, 'datos', 'latest.json'))) {
    throw new Error(
      `Falta ${carpeta}/datos/latest.json. Descarga un corte con npm run datos:descargar.`,
    );
  }
  const temporal = mkdtempSync(join(tmpdir(), 'elephants-datos-'));
  try {
    const config = join(temporal, 'wrangler.json');
    writeFileSync(config, JSON.stringify(configWorkerPr(pr, raiz)));
    run(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', config]);
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
  console.log(`Datos subidos a ${WORKER_DATOS}-pr-${pr}.`);
  console.log(
    'Marca «Datos propios» en el comentario «Preview de este PR» (o desmárcala y vuelve a marcarla).',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [comando, ...resto] = process.argv.slice(2);
  const { posicionales, carpeta, forzar } = leerArgs(resto);
  try {
    if (comando === 'corte') lanzarCorte(posicionales[0]);
    else if (comando === 'descargar') descargar({ corte: posicionales[0], carpeta, forzar });
    else if (comando === 'preview') subirPreview({ pr: posicionales[0], carpeta });
    else throw new Error('Uso: node scripts/datos.mjs corte|descargar|preview');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
