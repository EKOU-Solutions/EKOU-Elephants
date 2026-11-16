import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

// Storybook is the living reference of the design system (guide v1.0 onwards).
// - `.storybook/docs`: human-facing guidelines in Spanish (principles, foundations, workflow, history).
// - `.storybook/catalog`: markup spec (`el-*` classes) of the candidate components that are not React components yet.
// - `src/**`: real React components (`src/components/ui/` and each module's `ui/`); each one ships its
//   `*.stories.tsx` next to it (`elephant-designer` flow).
const config: StorybookConfig = {
  stories: [
    '../.storybook/docs/**/*.mdx',
    '../.storybook/catalog/**/*.stories.@(ts|tsx)',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    {
      // remark-gfm: Markdown tables and strikethrough in MDX pages.
      name: '@storybook/addon-docs',
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-a11y',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    // vite.config.ts loads the Cloudflare plugin (Worker + API). Storybook only needs the React client,
    // so the Cloudflare plugins are removed to keep them from starting workerd.
    const withoutCloudflare = (plugins: unknown[]): unknown[] =>
      plugins
        .map((plugin) => (Array.isArray(plugin) ? withoutCloudflare(plugin) : plugin))
        .filter((plugin) => {
          const name = (plugin as { name?: unknown } | null)?.name;
          return !(typeof name === 'string' && name.includes('cloudflare'));
        });
    viteConfig.plugins = withoutCloudflare(viteConfig.plugins ?? []) as typeof viteConfig.plugins;
    return viteConfig;
  },
};

export default config;
