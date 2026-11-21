// Spike (ADR-0004): builds the web Worker with every map page of the cut in datos-locales/.
// Usage: node web/spike/build.mjs [--solo /mapa,/mapa/05001]
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const solo = process.argv.indexOf('--solo');
Object.assign(process.env, {
  EKOU_PUBLICACION: resolve(repo, 'datos-locales'),
  EKOU_GEOMETRIA: join(repo, 'public', 'geometria'),
  EKOU_SITIO_URL: process.env.EKOU_SITIO_URL ?? 'https://elephants.ekou.co',
  EKOU_VERSION: execSync('git rev-parse --short HEAD', { cwd: repo }).toString().trim(),
  ASTRO_TELEMETRY_DISABLED: '1',
});
if (solo > -1) process.env.EKOU_PAGINAS_SOLO = process.argv[solo + 1];
const start = performance.now();
const { build } = await import('astro');
await build({ root: join(repo, 'web'), logLevel: process.env.EKOU_ASTRO_LOG ?? 'warn' });
console.log(`web built in ${((performance.now() - start) / 1000).toFixed(1)} s`);
