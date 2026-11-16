// Generates src/server/docs/openapi.json and llms.txt from the registered Hono routes, so the
// Worker serves them as text without bundling hono-openapi or the Markdown converter.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const dir = new URL('../src/server/docs/', import.meta.url);
const rutaJson = new URL('openapi.json', dir);
const rutaLlms = new URL('llms.txt', dir);

// app.ts imports these files through docs/index.ts; create placeholders on a fresh checkout.
if (!existsSync(rutaJson)) writeFileSync(rutaJson, '{}\n');
if (!existsSync(rutaLlms)) writeFileSync(rutaLlms, '');

const { module } = await runnerImport('/src/server/docs/openapi.ts', {
  configFile: false,
  logLevel: 'error',
});
const { openApi, llms } = await module.generarDocumentos();
writeFileSync(rutaJson, `${JSON.stringify(openApi, null, 2)}\n`);
writeFileSync(rutaLlms, llms);
// Same formatting as the repo, so a build leaves the versioned file untouched.
execFileSync('npx', ['biome', 'format', '--write', fileURLToPath(rutaJson)], { stdio: 'ignore' });
console.log(`OpenAPI y llms.txt generados: ${Object.keys(openApi.paths).length} rutas.`);
