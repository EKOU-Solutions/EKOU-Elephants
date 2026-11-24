// Copies a cut exported on this machine to datos-locales/, with the same layout that the monthly
// cut deploys to the data Worker from the Release (docs/ci-cd.md):
//
//   cd pipeline && uv run ekou-pipeline export && uv run ekou-pipeline export-mapa
//   npm run datos:local -- [AAAA-MM]      (default: the most recent cut in pipeline/data/publicacion)
//
// `npm run dev` serves datos-locales/ as the DATOS Worker (vite.config.ts), and
// `npm run datos:preview -- <pr>` uploads it to the PR's data Worker. Nothing leaves this machine.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PAQUETE_RESUMEN, punteroLatest, validarCorte } from './datos.mjs';

const ORIGEN = resolve('pipeline', 'data', 'publicacion');
const DESTINO = resolve('datos-locales');
// Diagnostic files of the Release that the app does not read.
const NO_PUBLICABLES = new Set(['reporte-extraccion.json']);

const cortes = existsSync(ORIGEN)
  ? readdirSync(ORIGEN)
      .filter((d) => /^\d{4}-(0[1-9]|1[0-2])$/.test(d))
      .sort()
  : [];
const corte = process.argv[2] ? validarCorte(process.argv[2]) : cortes.at(-1);
if (!corte || !cortes.includes(corte)) {
  console.error(
    `No hay un corte exportado en ${ORIGEN}. Corre primero: ekou-pipeline export-mapa --corte AAAA-MM`,
  );
  process.exit(1);
}

const archivos = readdirSync(join(ORIGEN, corte)).filter(
  (a) => a.endsWith('.json') && !NO_PUBLICABLES.has(a),
);
rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(join(DESTINO, 'datos', corte), { recursive: true });
for (const archivo of archivos) {
  copyFileSync(join(ORIGEN, corte, archivo), join(DESTINO, 'datos', corte, archivo));
  console.log(`✓ datos/${corte}/${archivo}`);
}
// The per-territory summaries travel in one package (a Release holds at most 1,000 assets).
const paquete = join(ORIGEN, corte, PAQUETE_RESUMEN);
if (existsSync(paquete)) {
  // Relative path and cwd: Git Bash's tar on Windows reads `C:\...` as a remote host.
  const destino = join(DESTINO, 'datos', corte);
  copyFileSync(paquete, join(destino, PAQUETE_RESUMEN));
  execFileSync('tar', ['-xzf', PAQUETE_RESUMEN], { cwd: destino });
  rmSync(join(destino, PAQUETE_RESUMEN));
  console.log(`✓ datos/${corte}/resumen*/ (from ${PAQUETE_RESUMEN})`);
}
// The pointer goes last, so it never points to a cut whose files are not copied yet.
writeFileSync(
  join(DESTINO, 'datos', 'latest.json'),
  `${JSON.stringify(punteroLatest(corte, archivos), null, 2)}\n`,
);
console.log('✓ datos/latest.json');
