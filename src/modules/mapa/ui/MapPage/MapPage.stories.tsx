import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { type MapRoute, parseRoute } from '../mapModel';
import {
  anioCerradoParcial,
  anioEnCurso,
  anioSinCuipo,
  sanBenito,
  sinNingunDato,
} from '../ResumenMunicipal/muestra';
import type { ResumenMunicipalDatos } from '../ResumenMunicipal/resumenModel';
import { sampleMap } from '../sample';
import type { ResumenState } from '../useResumen';
import { MapPage, type MapPageProps } from './MapPage';

/** The page with the real sample; choosing a place changes it in place, as in the app. */
function Page({
  initial,
  screen,
  ...props
}: {
  initial: MapRoute;
  /** A phone screen of this size (px) instead of the whole window: the short-screen cases. */
  screen?: { width: number; height: number };
} & Partial<MapPageProps>) {
  const [route, setRoute] = useState(initial);
  const page = (
    <MapPage
      state={{ status: 'ready', map: sampleMap }}
      onRetry={() => {}}
      {...props}
      route={route}
      onNavigate={setRoute}
    />
  );
  if (!screen) return page;
  // A sized container named «screen»: the page fills it instead of the window (MapPage.module.css).
  return (
    <div style={{ ...screen, containerType: 'size', containerName: 'screen', overflow: 'hidden' }}>
      {page}
    </div>
  );
}

/** Sample figures of the summary (ResumenMunicipal/muestra.ts), with the name of the place on screen. */
function muestraDe(anio: number, route: MapRoute): ResumenMunicipalDatos {
  const porAnio: Record<number, ResumenMunicipalDatos> = {
    2022: anioSinCuipo,
    2024: anioCerradoParcial,
    2025: sanBenito,
    2026: anioEnCurso,
  };
  const base = porAnio[anio] ?? { ...sinNingunDato, anio };
  const code = 'code' in route ? route.code : '';
  const nombre =
    (route.view === 'municipality' ? sampleMap.municipalities : sampleMap.departments).get(code)
      ?.nombre ?? base.nombre;
  return { ...base, codigo: code, nombre };
}

/** The page with the summary of sample figures; the year selector changes the year, as in the app. */
function ConResumen({
  initial,
  anio: first = '2025',
  estado,
  anioInvalido,
  ...props
}: {
  initial: MapRoute;
  anio?: string;
  /** A state other than «ready with the sample». */
  estado?: ResumenState;
  anioInvalido?: string;
} & Partial<MapPageProps>) {
  const [anio, setAnio] = useState(first);
  const resumen: ResumenState = estado ?? {
    status: 'ready',
    datos: muestraDe(Number(anio), initial),
    anioInvalido,
  };
  return (
    <Page
      initial={initial}
      resumen={resumen}
      anio={anio}
      onAnioChange={(n) => setAnio(String(n))}
      onRetryResumen={() => {}}
      {...props}
    />
  );
}

const SHORT_PHONE = { width: 320, height: 640 };

const meta = {
  title: 'Módulos/Mapa/MapPage',
  component: MapPage,
  // Each story on its own page: in a Docs page the full-screen map would catch the wheel.
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Página del Mapa (TASK-09) en una sola pantalla, según la especificación aprobada el 2026-11-17 (boceto A): el mapa a pantalla completa, el buscador y las migas arriba, y la ficha deslizable con el lugar. Desde 1024 px la ficha es un panel fijo de 400 px a la derecha. Tres estados del mismo mapa: Colombia (`/mapa`), un departamento (`/mapa/departamento/05`) y un municipio (`/mapa/05001`).',
          '',
          '**Datos de muestra:** el corte real 2026-11 (datos al 7 nov 2026) con la forma del contrato de la API, de `docs/design/pages/map/sample/` (`sample.ts`). Especificación: `docs/design/pages/map/spec.md`.',
        ].join('\n'),
      },
    },
  },
  args: { state: { status: 'loading' }, route: { view: 'country' }, onNavigate: () => {} },
} satisfies Meta<typeof MapPage>;

export default meta;
type Story = StoryObj<MapPageProps>;

export const Country: Story = {
  name: 'Colombia',
  render: () => <Page initial={{ view: 'country' }} />,
};
export const Department: Story = {
  name: 'Departamento (Antioquia)',
  render: () => <Page initial={{ view: 'department', code: '05' }} />,
};
export const Municipality: Story = {
  name: 'Municipio (Medellín)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} />,
};
export const Bogota: Story = {
  name: 'Bogotá, D.C. (enlace del departamento 11)',
  render: () => <Page initial={parseRoute('/mapa/departamento/11')} />,
};
export const BogotaFullSheet: Story = {
  name: 'Bogotá, D.C. · ficha completa sin tabla',
  render: () => <Page initial={{ view: 'municipality', code: '11001' }} defaultDetent="full" />,
};
export const Archipelago: Story = {
  name: 'San Andrés y Providencia',
  render: () => <Page initial={{ view: 'department', code: '88' }} />,
};
export const NoData: Story = {
  name: '«Sin datos» (Puerto Colombia, Guainía)',
  render: () => <Page initial={{ view: 'municipality', code: '94884' }} />,
};
export const NoDataDepartment: Story = {
  name: 'Departamento con «Sin datos» (Guainía)',
  render: () => <Page initial={{ view: 'department', code: '94' }} />,
};
export const Loading: Story = {
  name: 'Cargando',
  render: () => <Page initial={{ view: 'country' }} state={{ status: 'loading' }} />,
};
export const Unavailable: Story = {
  name: 'Error: datos no disponibles (Reintentar)',
  render: () => <Page initial={{ view: 'country' }} state={{ status: 'unavailable' }} />,
};
export const InvalidLink: Story = {
  name: 'Enlace que no corresponde a un municipio',
  render: () => <Page initial={{ view: 'municipality', code: '99999' }} />,
};
export const SearchResults: Story = {
  name: 'Búsqueda con resultados («granada»)',
  render: () => <Page initial={{ view: 'country' }} defaultQuery="granada" />,
};
export const SearchEmpty: Story = {
  name: 'Búsqueda sin resultados («medelin»)',
  render: () => <Page initial={{ view: 'country' }} defaultQuery="medelin" />,
};
export const SearchTooShort: Story = {
  name: 'Búsqueda con una letra',
  render: () => <Page initial={{ view: 'department', code: '05' }} defaultQuery="m" />,
};
export const Peek: Story = {
  name: 'Ficha recogida (Medellín)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} defaultDetent="peek" />,
};
export const FullSheet: Story = {
  name: 'Ficha completa con la tabla (Medellín)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} defaultDetent="full" />,
};
export const FullSheetCountry: Story = {
  name: 'Ficha completa con la tabla (Colombia)',
  render: () => <Page initial={{ view: 'country' }} defaultDetent="full" />,
};
export const ShortScreenMunicipality: Story = {
  name: 'Pantalla baja 320 × 640: llega recogida (Medellín)',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} screen={SHORT_PHONE} />,
};
export const ShortScreenBogota: Story = {
  name: 'Pantalla baja 320 × 640: llega recogida (Bogotá, D.C.)',
  render: () => <Page initial={{ view: 'municipality', code: '11001' }} screen={SHORT_PHONE} />,
};
export const LongestName: Story = {
  name: 'Caso extremo: nombre más largo (Villa de San Diego de Ubaté)',
  render: () => <Page initial={{ view: 'municipality', code: '25843' }} />,
};
export const LongestDepartment: Story = {
  name: 'Caso extremo: departamento de nombre más largo (Providencia)',
  render: () => <Page initial={{ view: 'municipality', code: '88564' }} />,
};

const status = (canvas: HTMLElement) =>
  canvas.querySelector('main > [role="status"]')?.textContent ?? '';

export const CopyRefused: Story = {
  name: '«Copiar enlace» rechazado: el enlace en un campo',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} />,
  // The browser refuses the clipboard (no permission): the link shows in a field, selected.
  beforeEach: () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Permiso denegado')) },
    });
    return () => {
      Reflect.deleteProperty(navigator, 'clipboard');
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Copiar enlace' }));
    const field = await canvas.findByRole('textbox', { name: 'Enlace para compartir' });
    await waitFor(() => expect(field).toHaveFocus());
  },
};

export const FocusAfterSearch: Story = {
  name: 'Foco: elegir en el buscador lleva al título y lo anuncia',
  render: () => <Page initial={{ view: 'country' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole('searchbox', { name: 'Busca tu municipio o departamento' }),
      'medell',
    );
    await userEvent.click(await canvas.findByRole('button', { name: 'Medellín, Antioquia' }));
    await waitFor(() =>
      expect(canvas.getByRole('heading', { level: 1, name: 'Medellín' })).toHaveFocus(),
    );
    await waitFor(() => expect(status(canvasElement)).toBe('Seleccionado: Medellín, Antioquia'));
  },
};

export const FocusAfterCrumb: Story = {
  name: 'Foco: la miga que desaparece deja el foco en «← Colombia»',
  render: () => <Page initial={{ view: 'municipality', code: '05001' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Antioquia' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Colombia' })).toHaveFocus());
    await waitFor(() => expect(status(canvasElement)).toBe('Seleccionado: Antioquia'));
  },
};

const MEDELLIN: MapRoute = { view: 'municipality', code: '05001' };
const ANTIOQUIA: MapRoute = { view: 'department', code: '05' };

export const ResumenFichaMedia: Story = {
  name: 'Resumen: cifra clave en la ficha media (Medellín, datos de muestra)',
  render: () => <ConResumen initial={MEDELLIN} />,
};
export const ResumenMunicipio: Story = {
  name: 'Resumen: ficha completa de un municipio (datos de muestra)',
  render: () => <ConResumen initial={MEDELLIN} defaultDetent="full" />,
};
export const ResumenDepartamento: Story = {
  name: 'Resumen: ficha completa de un departamento, la gobernación (datos de muestra)',
  render: () => <ConResumen initial={ANTIOQUIA} defaultDetent="full" />,
};
export const ResumenCargando: Story = {
  name: 'Resumen: cargando',
  render: () => (
    <ConResumen initial={MEDELLIN} defaultDetent="full" estado={{ status: 'loading' }} />
  ),
};
export const ResumenError: Story = {
  name: 'Resumen: error con «Intentar de nuevo»',
  render: () => <ConResumen initial={MEDELLIN} defaultDetent="full" estado={{ status: 'error' }} />,
};
export const ResumenAnioInvalido: Story = {
  name: 'Resumen: el enlace pedía un año que no existe',
  render: () => <ConResumen initial={MEDELLIN} anioInvalido="1999" defaultDetent="full" />,
};
export const ResumenAnioParcial: Story = {
  name: 'Resumen: año cerrado con cifras hasta septiembre (2024)',
  render: () => <ConResumen initial={MEDELLIN} anio="2024" defaultDetent="full" />,
};

export const FocusAfterYear: Story = {
  name: 'Foco: cambiar de año deja el foco en el selector y anuncia «Mostrando 2024»',
  render: () => <ConResumen initial={MEDELLIN} defaultDetent="full" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = await canvas.findByRole('combobox', { name: 'Año' });
    await userEvent.selectOptions(select, '2024');
    await waitFor(() => expect(select).toHaveFocus());
    await waitFor(() =>
      expect(canvasElement.querySelector('[aria-live="polite"]')?.textContent).toBe(
        'Mostrando 2024',
      ),
    );
  },
};
