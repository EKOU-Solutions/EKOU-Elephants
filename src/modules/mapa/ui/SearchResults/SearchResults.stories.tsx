import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
          'Lista hasta 8 lugares que coinciden con lo escrito en el campo de búsqueda, cada uno con su departamento, debajo del campo y en el flujo de la página (no flota). Nació en la página del Mapa (TASK-09, guía v1.3.0).',
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
