import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.ts',
      'scripts/**/*.test.mjs',
      'pages-site/src/**/*.test.ts',
      'web/src/**/*.test.ts',
    ],
    environment: 'node',
  },
});
