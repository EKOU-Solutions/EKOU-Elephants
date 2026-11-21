import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: [
            'src/**/*.test.{ts,tsx}',
            'tests/**/*.test.ts',
            'scripts/**/*.test.mjs',
            'pages-site/src/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        // Every story runs in a real browser and its `play` function is the test (npm run test:stories).
        // Not part of `npm test`: it needs a Playwright browser. CI runs it as its own step (app-ci.yml).
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'stories',
          // Some stories wait for a floating alert to close by itself (5 seconds).
          testTimeout: 20_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
