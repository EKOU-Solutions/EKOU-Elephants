// Astro only builds the static pages of each place (ADR 0003, `npm run paginas`). The app is still
// React + Vite (ADR 0001): this config is separate and never part of `npm run build`.
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  // `/mapa/05001` → `mapa/05001.html`: the data Worker serves it at `/paginas/mapa/05001`.
  build: { format: 'file', inlineStylesheets: 'never' },
  trailingSlash: 'never',
  // No CSS of its own: scripts/pages.mjs removes Astro's copy and the app Worker links the app's
  // stylesheet. Both use Vite's default CSS Modules names (from the file's content), so they match
  // while the components' CSS is the same as in the deployed app.
  devToolbar: { enabled: false },
});
