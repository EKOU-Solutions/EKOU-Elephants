import { existsSync } from 'node:fs';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Only in `npm run dev` and only with datos-locales/ (npm run datos:local or datos:descargar): also
// run a local data Worker, so the DATOS binding serves those files. Without it, the map API has no
// cut data. The build never includes it: production uses `ekou-elephants-datos`.
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    cloudflare(
      command === 'serve' && existsSync('datos-locales/datos/latest.json')
        ? { auxiliaryWorkers: [{ configPath: './scripts/datos-local.wrangler.jsonc' }] }
        : undefined,
    ),
  ],
}));
