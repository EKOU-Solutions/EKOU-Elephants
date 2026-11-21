// The web Worker (ADR-0004): Astro is the site's entry. Map pages are prerendered at build (static
// assets, no Worker call); a contract page is rendered on demand from the API and cached.
// Spike: built with web/spike/build.mjs, which passes the cut's folders as environment variables.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cloudflare from '@astrojs/cloudflare';
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

const publication = process.env.EKOU_PUBLICACION;
// The cut and the app version go into the build: together they are the contract cache key, so a new
// cut (a PR that changes the current cut, ADR-0003) or new code always means fresh pages.
const cut = publication
  ? JSON.parse(readFileSync(join(publication, 'datos', 'latest.json'), 'utf8')).corte
  : 'sin-corte';

export default defineConfig({
  output: 'static',
  // Map pages are prerendered in Node: they read the cut's files from disk (pages-site/src/lib/cut.ts).
  // No images to transform: without it the adapter adds an IMAGES binding.
  adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'passthrough' }),
  // No sessions: without this the adapter adds a SESSION KV binding and provisions it on deploy.
  session: false,
  // Preact runs the React components as they are (preact/compat).
  integrations: [preact({ compat: true })],
  publicDir: '../public',
  build: { format: 'file' },
  trailingSlash: 'never',
  // What the SPA did in the browser, now as real redirects: the home is the map, and Bogotá, D.C.
  // as a department is its one municipality (canonicalPath, spec decision 4).
  redirects: {
    '/': '/mapa',
    '/mapa/departamento/11': '/mapa/11001',
  },
  devToolbar: { enabled: false },
  vite: {
    // React libraries must go through Vite so they get preact/compat instead of the real React.
    resolve: { noExternal: ['lucide-react'] },
    define: {
      'import.meta.env.EKOU_CORTE': JSON.stringify(cut),
      'import.meta.env.EKOU_VERSION': JSON.stringify(process.env.EKOU_VERSION ?? 'dev'),
    },
  },
});
