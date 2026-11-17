import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Counter } from './Counter';

const meta = {
  title: 'Componentes/UI/Counter',
  component: Counter,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Counter',
    'Un número grande con su nombre debajo. Distingue tipos de señal de contratos: un contrato puede tener varias. Evita un número suelto en un círculo de color. Datos ficticios.',
    'src/components/ui/Counter/',
  ),
  args: {
    counts: [
      { value: 120, label: 'Contratos analizados' },
      { value: 36, label: 'Con señales', withKey: true },
      { value: 3, label: 'Tipos de señal' },
      { value: 30, label: 'Sin analizar' },
    ],
  },
} satisfies Meta<typeof Counter>;

export default meta;
export const Summary: StoryObj<typeof meta> = { name: 'Resumen' };
export const WithNotes: StoryObj<typeof meta> = {
  name: 'Con glosa (dónde quedó cada contrato)',
  args: {
    layout: 'adaptive',
    counts: [
      { value: 6771167, label: 'en un municipio', note: 'sabemos en qué municipio se firmaron' },
      {
        value: 626277,
        label: 'solo en un departamento',
        note: 'sabemos el departamento, no el municipio',
      },
      { value: 59305, label: 'sin lugar identificado', note: 'no sabemos dónde' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Página del Mapa, corte 2026-11 (datos reales al 7 nov 2026). La glosa explica en una línea qué significa cada conteo. Con `layout="adaptive"` se apilan con líneas horizontales si su espacio mide menos de 600 px (prueba el visor de celular).',
      },
    },
  },
};
