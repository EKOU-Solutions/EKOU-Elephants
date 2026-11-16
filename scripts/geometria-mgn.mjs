// Builds the map geometry (TASK-09) from DANE's MGN 2025 municipalities.
//
//   node scripts/geometria-mgn.mjs <MGN_ADM_MPIO_GRAFICO.geojson> [salida-dir]
//
// Source: https://geoportal.dane.gov.co/descargas/mgn_2025/MGN2025_ADM_MPIO_GRAFICO_(geojson).zip
// (CC BY 4.0, "Departamento Administrativo Nacional de Estadística - DANE: www.dane.gov.co").
// Writes <salida-dir>/geometria/mgn-2025.topojson (default salida-dir: public, so the app serves it
// as a static file and it is committed: the MGN changes almost never) with
// two objects, both carrying only `codigo`: `municipios` (1,122) and `departamentos` (33, dissolved
// from the municipalities so borders match exactly). Fails if the size budget is exceeded or if the
// codes do not match the municipalities of the cuts exported in pipeline/data/publicacion. Contract:
// docs/design/pages/map/contract.md.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { brotliCompressSync } from 'node:zlib';

const VERSION = 'mgn-2025';
// Visvalingam (weighted) keeping 0.4% of vertices, and ~95 m quantisation: fits the budget while
// small municipalities keep their shape when zoomed (see contract.md, "Size budget").
const SIMPLIFICACION = '0.4%';
// The archipelago (department 88) is drawn alone in an inset at ~40x the scale of the mainland. At
// 0.4% each island collapses to a 6-point polygon, so it keeps 10% (135 points for San Andrés instead of 6; about 1.6 KB more).
const SIMPLIFICACION_ISLAS = process.env.EKOU_SIMPLIFICACION_ISLAS ?? '10%';
// Municipalities with several parts (sea and river islands: Islas del Rosario and San Bernardo,
// Isla Fuerte, Bahía Málaga…) keep 5%. At 0.4% the islands disappeared from the map; at 5% every
// island of 0.1 km² or more in the source survives. The map must not drop territory.
const SIMPLIFICACION_PARTES = process.env.EKOU_SIMPLIFICACION_PARTES ?? '5%';
const CUANTIZACION = '20000';
const PRESUPUESTO = { crudo: 380_000, brotli: 100_000 };
const ESPERADO = { municipios: 1122, departamentos: 33 };

const [entrada, salidaArg] = process.argv.slice(2);
if (!entrada || !existsSync(entrada)) {
  console.error('Uso: node scripts/geometria-mgn.mjs <MGN_ADM_MPIO_GRAFICO.geojson> [salida-dir]');
  process.exit(1);
}
const salidaDir = resolve(salidaArg ?? 'public');
const salida = join(salidaDir, 'geometria', `${VERSION}.topojson`);
mkdirSync(join(salidaDir, 'geometria'), { recursive: true });
// Cuts exported with `ekou-pipeline export-mapa`, to check the join.
const publicacion = resolve('pipeline', 'data', 'publicacion');

execFileSync(
  process.execPath,
  [
    '--max-old-space-size=8192',
    resolve('node_modules', 'mapshaper', 'bin', 'mapshaper'),
    '-i',
    entrada,
    'name=municipios',
    '-filter-fields',
    'mpio_cdpmp',
    '-rename-fields',
    'codigo=mpio_cdpmp',
    '-simplify',
    'visvalingam',
    'weighted',
    'keep-shapes',
    'variable',
    `percentage = codigo.slice(0, 2) === '88' ? '${SIMPLIFICACION_ISLAS}' : this.partCount > 1 ? '${SIMPLIFICACION_PARTES}' : '${SIMPLIFICACION}'`,
    '-clean',
    '-each',
    'dpto=codigo.slice(0,2)',
    '-dissolve',
    'dpto',
    '+',
    'name=departamentos',
    '-rename-fields',
    'codigo=dpto',
    'target=departamentos',
    '-filter-fields',
    'codigo',
    'target=municipios',
    '-o',
    'format=topojson',
    'bbox',
    `quantization=${CUANTIZACION}`,
    'target=municipios,departamentos',
    salida,
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
);

const errores = [];
const bytes = readFileSync(salida);
const brotli = brotliCompressSync(bytes).length;
if (bytes.length > PRESUPUESTO.crudo)
  errores.push(`pesa ${bytes.length} B (máximo ${PRESUPUESTO.crudo})`);
if (brotli > PRESUPUESTO.brotli)
  errores.push(`pesa ${brotli} B con Brotli (máximo ${PRESUPUESTO.brotli})`);

const topologia = JSON.parse(bytes.toString('utf-8'));
for (const [objeto, total] of Object.entries(ESPERADO)) {
  const geometrias = topologia.objects[objeto]?.geometries ?? [];
  if (geometrias.length !== total)
    errores.push(`${objeto}: ${geometrias.length} formas (esperadas ${total})`);
  if (geometrias.some((g) => g.type == null)) errores.push(`${objeto}: hay formas vacías`);
}
if (topologia.bbox?.length !== 4) errores.push('falta bbox');

// Join check: the shapes must match the municipalities of every exported cut, code by code.
const codigosMgn = new Set(topologia.objects.municipios.geometries.map((g) => g.properties.codigo));
const cortes = existsSync(publicacion)
  ? readdirSync(publicacion).filter((d) => /^\d{4}-\d{2}$/.test(d))
  : [];
for (const corte of cortes) {
  const archivo = join(publicacion, corte, 'municipios.json');
  if (!existsSync(archivo)) continue;
  const codigos = new Set(
    JSON.parse(readFileSync(archivo, 'utf-8')).municipios.map((m) => m.codigo),
  );
  const sinForma = [...codigos].filter((c) => !codigosMgn.has(c));
  const sobrantes = [...codigosMgn].filter((c) => !codigos.has(c));
  if (sinForma.length || sobrantes.length) {
    errores.push(
      `corte ${corte}: sin forma ${sinForma.join(',') || '-'}; formas sin municipio ${sobrantes.join(',') || '-'}`,
    );
  }
}

if (errores.length) {
  console.error(`✗ ${salida}\n  - ${errores.join('\n  - ')}`);
  process.exit(1);
}
console.log(
  `✓ ${salida}: ${bytes.length} B, ${brotli} B con Brotli; cruce con ${cortes.length} corte(s) correcto`,
);
