// Builds the web Worker (ADR-0004): Astro with every map page of the cut. Contract with the deploy
// script (scripts/despliegue.mjs in main, docs/ci-cd.md):
//   EKOU_PUBLICACION  folder with datos/latest.json and the cut's JSON (default: datos-locales)
//   EKOU_SITIO_URL    the site's URL: canonical, og:url and sitemap (default: the web's workers.dev)
//   EKOU_VERSION      the app version, part of cache keys (default: the git commit)
// Leaves Wrangler's configuration in web/dist/server/wrangler.json.
// Usage: npm run build:web [-- --solo /mapa,/mapa/05001]
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const publicacion = resolve(repo, process.env.EKOU_PUBLICACION ?? 'datos-locales');
if (!existsSync(join(publicacion, 'datos', 'latest.json')))
  throw new Error(
    `No hay datos/latest.json en ${publicacion}: baja un corte con npm run datos:descargar.`,
  );

const version = () => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repo }).toString().trim();
  } catch {
    return 'dev';
  }
};
const solo = process.argv.indexOf('--solo');
Object.assign(process.env, {
  EKOU_PUBLICACION: publicacion,
  EKOU_GEOMETRIA: join(repo, 'public', 'geometria'),
  EKOU_SITIO_URL:
    process.env.EKOU_SITIO_URL ?? 'https://ekou-elephants-web.ekousolutions.workers.dev',
  EKOU_VERSION: process.env.EKOU_VERSION || version(),
  ASTRO_TELEMETRY_DISABLED: '1',
});
if (solo > -1) process.env.EKOU_PAGINAS_SOLO = process.argv[solo + 1];
const start = performance.now();
const { build } = await import('astro');
await build({ root: join(repo, 'web'), logLevel: process.env.EKOU_ASTRO_LOG ?? 'warn' });
console.log(`web built in ${((performance.now() - start) / 1000).toFixed(1)} s`);
