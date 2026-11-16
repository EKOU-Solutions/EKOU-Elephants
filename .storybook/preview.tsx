import '../src/styles/global.css';
import './styles.css';

import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { Decorator, Preview } from '@storybook/react-vite';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { themes } from 'storybook/theming';

type Theme = 'auto' | 'light' | 'dark';

const prefersDark = () => globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
const effectiveTheme = (theme: unknown): 'light' | 'dark' =>
  theme === 'light' || theme === 'dark' ? theme : prefersDark() ? 'dark' : 'light';

// Same as the app: without `data-theme` the device preference wins; with it, light or dark is forced.
function applyTheme(theme: unknown) {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
}

// Docs pages follow the same toolbar theme as the stories.
function ThemedDocsContainer({ context, children }: PropsWithChildren<DocsContainerProps>) {
  const initial = (
    context as unknown as { store?: { userGlobals?: { get(): { theme?: Theme } } } }
  ).store?.userGlobals?.get().theme;
  const [theme, setTheme] = useState<unknown>(initial ?? 'auto');
  useEffect(() => {
    const onChange = ({ globals }: { globals: { theme?: Theme } }) => setTheme(globals.theme);
    context.channel.on(GLOBALS_UPDATED, onChange);
    return () => context.channel.off(GLOBALS_UPDATED, onChange);
  }, [context]);
  useEffect(() => applyTheme(theme), [theme]);
  return (
    <DocsContainer
      context={context}
      theme={effectiveTheme(theme) === 'dark' ? themes.dark : themes.light}
    >
      {children}
    </DocsContainer>
  );
}

const withTheme: Decorator = (Story, context) => {
  applyTheme(context.globals.theme);
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Tema de las historias y de la documentación',
      toolbar: {
        title: 'Tema',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'auto', title: 'Según el dispositivo' },
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Oscuro' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'auto' },
  decorators: [withTheme],
  parameters: {
    layout: 'padded',
    // The table of contents ignores the blocks' inner headings (e.g. «Hacer» / «Evitar»).
    docs: {
      container: ThemedDocsContainer,
      toc: { ignoreSelector: '.docs-story *, .skip-toc, .sb-el *' },
    },
    a11y: { test: 'todo' },
    viewport: {
      options: {
        mobile320: { name: 'Celular mínimo · 320 px', styles: { width: '320px', height: '640px' } },
        mobile: { name: 'Celular · 390 px', styles: { width: '390px', height: '844px' } },
        laptop: { name: 'Portátil · 1280 px', styles: { width: '1280px', height: '800px' } },
      },
    },
    options: {
      storySort: {
        order: [
          'Introducción',
          'Cómo trabajamos',
          'Cómo usar la skill',
          'Principios',
          'Fundamentos',
          ['Color', 'Tipografía', 'Espacio y forma', 'Íconos', 'Voz y tono', 'Formato de datos'],
          'Accesibilidad',
          'Componentes',
          ['Catálogo', 'UI', 'Candidatos', '*'],
          'Módulos',
          'Historial',
        ],
      },
    },
  },
};

export default preview;
