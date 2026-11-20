import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Input } from '../../../../components/ui/Input/Input';
import { routePath, searchPlaces } from '../mapModel';
import { sampleMap } from '../sample';
import { SearchResults, type SearchResultsProps } from './SearchResults';

/** The field and its results, searching the real sample (cut 2026-11). */
function Search({ initial }: { initial: string }) {
  const [query, setQuery] = useState(initial);
  const [chosen, setChosen] = useState('');
  const found = searchPlaces(sampleMap, query);
  return (
    <search style={{ display: 'grid', maxWidth: 320 }}>
      <Input
        label="Busca tu municipio o departamento"
        type="search"
        autoComplete="off"
        placeholder="Ej.: Medellín"
        aria-controls="results"
        help={query.trim().length < 2 ? 'Escribe al menos 2 letras.' : undefined}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <SearchResults
        id="results"
        query={query}
        results={found.map((e) => ({ id: routePath(e.route), name: e.name, context: e.context }))}
        onChoose={setChosen}
      />
      {chosen ? <p style={{ marginTop: 12 }}>Ir a: {chosen}</p> : null}
    </search>
  );
}

const meta = {
  title: 'Componentes/Mapa/SearchResults',
  component: SearchResults,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Lista hasta 8 lugares que coinciden con lo escrito en el campo de búsqueda, cada uno con su departamento, debajo del campo. Nació en la página del Mapa (TASK-09, guía v1.3.0).',
          '',
          '**Dos formas:** `inline` (por defecto), en el flujo de la página, con la ayuda de 2 letras en el campo. `floating` (v1.6.0), para el buscador que flota sobre el mapa: una caja a todo el ancho del campo, sobre el mapa, con altura máxima y su propio desplazamiento, que también dice «Escribe al menos 2 letras.». Con `floating`, el contenedor del campo y la lista va posicionado.',
          '',
          '**Cuándo usarlo:** buscar un lugar por su nombre cuando la lista es larga (1.122 municipios). Para listas cortas, una `Select`.',
          '',
          '**Accesibilidad:** botones nativos de 44 px; una región `status` anuncia solo la cantidad, no la lista. Al elegir, la página anuncia el lugar y lleva el foco a su título. Con menos de 2 letras no lista nada y el campo muestra la ayuda.',
          '',
          '**Evita:** más de 8 resultados, nombres repetidos sin su departamento, «Sin resultados» sin decir qué hacer. Muestra real del corte 2026-11.',
        ].join('\n'),
      },
    },
  },
  args: { id: 'results', query: '', results: [], onChoose: () => {} },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<SearchResultsProps>;

/** The map's search: hidden label with a magnifier, results floating over what is below (a stand-in map). */
function FloatingSearch({ initial }: { initial: string }) {
  const [query, setQuery] = useState(initial);
  const found = searchPlaces(sampleMap, query);
  return (
    <div
      style={{
        position: 'relative',
        maxWidth: 390,
        height: 520,
        padding: 'var(--el-space-12)',
        background: 'var(--el-color-surface-subtle)',
      }}
    >
      <search style={{ position: 'relative' }}>
        <Input
          label="Busca tu municipio o departamento"
          hideLabel
          icon={<Icon name="search" />}
          fullWidth
          type="search"
          autoComplete="off"
          placeholder="Busca municipio o departamento"
          aria-controls="floating-results"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SearchResults
          id="floating-results"
          variant="floating"
          query={query}
          results={found.map((e) => ({ id: routePath(e.route), name: e.name, context: e.context }))}
          onChoose={() => setQuery('')}
        />
      </search>
    </div>
  );
}

export const RepeatedNames: Story = {
  name: 'Nombres repetidos (el departamento los distingue)',
  render: () => <Search initial="granada" />,
};
export const BogotaOnce: Story = {
  name: 'Bogotá aparece una vez',
  render: () => <Search initial="bogota" />,
};
export const Empty: Story = {
  name: 'Sin resultados',
  render: () => <Search initial="zzq" />,
};
export const TooShort: Story = {
  name: 'Menos de 2 letras',
  render: () => <Search initial="m" />,
};
export const Floating: Story = {
  name: 'Flotante sobre el mapa',
  render: () => <FloatingSearch initial="granada" />,
};
export const FloatingTooShort: Story = {
  name: 'Flotante · menos de 2 letras',
  render: () => <FloatingSearch initial="m" />,
};
export const FloatingEmpty: Story = {
  name: 'Flotante · sin resultados',
  render: () => <FloatingSearch initial="medelin" />,
};
