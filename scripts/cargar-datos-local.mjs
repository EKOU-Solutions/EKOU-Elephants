// Loads the pipeline's map export into the local R2 that `wrangler dev` emulates.
//
//   cd pipeline && uv run ekou-pipeline export-mapa --corte 2026-11
//   npm run datos:local
//
// Reads pipeline/data/r2/datos (or the folder given as argument) and writes every file under the
// same key, prefixed with "datos/", into the DATOS bucket from wrangler.jsonc. Nothing leaves this
// machine: `--local` writes to .wrangler/state.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const BUCKET = 'ekou-datos';
const origen = resolve(process.argv[2] ?? 'pipeline/data/r2/datos');

function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

const lista = archivos(origen);
if (lista.length === 0) {
  console.error(`No hay archivos en ${origen}. Corre primero: ekou-pipeline export-mapa`);
  process.exit(1);
}

// The pointer goes last, so it never points to a cut whose files are not loaded yet.
lista.sort((a, b) => Number(a.endsWith('latest.json')) - Number(b.endsWith('latest.json')));

const wrangler = resolve('node_modules', 'wrangler', 'bin', 'wrangler.js');
for (const archivo of lista) {
  const clave = `datos/${relative(origen, archivo).split(sep).join('/')}`;
  execFileSync(
    process.execPath,
    [wrangler, 'r2', 'object', 'put', `${BUCKET}/${clave}`, '--file', archivo, '--content-type', 'application/json', '--local'],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  console.log(`✓ ${clave}`);
}
