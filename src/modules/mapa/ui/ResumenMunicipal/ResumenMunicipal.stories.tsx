import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  anioCerradoParcial,
  anioEnCurso,
  anioSinCuipo,
  medellin,
  pagadoMayorQueObligado,
  sanAndres,
  sanBenito,
  sinNingunDato,
} from './muestra';
import { ResumenMunicipal, type ResumenMunicipalProps } from './ResumenMunicipal';
import type { ResumenMunicipalDatos } from './resumenModel';

const ANIOS = sanBenito.anios;
const noop = () => {};

/** One story per state; the year selector works inside the story but each one starts on its own state. */
function Interactivo(
  props: Omit<ResumenMunicipalProps, 'onAnioChange' | 'anios' | 'anio'> & { anio: number },
) {
  const [anio, setAnio] = useState(props.anio);
  return <ResumenMunicipal {...props} anio={anio} anios={ANIOS} onAnioChange={setAnio} />;
}

const listo = (datos: ResumenMunicipalDatos) => ({
  status: 'ready' as const,
  nivel: 'municipio' as const,
  datos,
  anio: datos.anio,
  anios: ANIOS,
  onAnioChange: noop,
});

const meta = {
  title: 'Módulos/Mapa/ResumenMunicipal',
  component: ResumenMunicipal,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Resumen de gasto público de un municipio, en la ficha del mapa: cuánto recibió, en qué lo gastó por rubro, hasta dónde llegó (comprometido, por pagar, pagado), lo que arrastra de años anteriores y, aparte, los contratos de SECOP. Datos de muestra con las cifras reales de San Benito Abad (CUIPO, corte 30 jun 2026). Especificación: docs/design/pages/resumen-municipal/spec.md.',
      },
    },
  },
  args: listo(sanBenito),
} satisfies Meta<typeof ResumenMunicipal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: 'Normal (2025 completo)',
  render: () => <Interactivo {...listo(sanBenito)} />,
};

export const TablaAbierta: Story = {
  name: 'Recorrido del dinero abierto',
  args: { ...listo(sanBenito), detalleAbierto: true },
};

export const Cargando: Story = {
  name: 'Cargando',
  args: { status: 'loading', datos: undefined, anio: 2024, nivel: 'municipio' },
};

export const AnioSinCuipo: Story = {
  name: 'Año sin CUIPO (2022)',
  args: listo(anioSinCuipo),
};

export const AnioEnCurso: Story = {
  name: 'Año en curso (2026)',
  args: listo(anioEnCurso),
};

export const AnioCerradoParcial: Story = {
  name: 'Año cerrado con datos parciales (hasta sep 2024)',
  args: listo(anioCerradoParcial),
};

export const Gobernacion: Story = {
  name: 'Gobernación (departamento)',
  args: {
    ...listo({ ...sanBenito, codigo: '70', nombre: 'Sucre' }),
    nivel: 'departamento',
  },
};

export const GobernacionSinContratos: Story = {
  name: 'Gobernación: ningún contrato ubicado con certeza',
  args: {
    ...listo({
      ...sanBenito,
      codigo: '70',
      nombre: 'Sucre',
      contratado: { valor: null, contratos: 0 },
    }),
    nivel: 'departamento',
  },
};

export const GastoMayorQueLoRecibido: Story = {
  name: 'Gasto mayor que lo recibido',
  args: listo({
    ...sanBenito,
    gastoPublico: {
      ...(sanBenito.gastoPublico as NonNullable<typeof sanBenito.gastoPublico>),
      recibido: 52_000_000_000,
    },
  }),
};

export const PagadoMayorQueObligado: Story = {
  name: 'Pagado mayor que lo recibido en bienes (dato de la fuente)',
  args: listo(pagadoMayorQueObligado),
};

export const SinNingunDato: Story = {
  name: 'Sin información (ningún dato del año)',
  args: listo(sinNingunDato),
};

export const SinRecibido: Story = {
  name: 'Sin información de lo recibido',
  args: listo({
    ...sanBenito,
    gastoPublico: {
      ...(sanBenito.gastoPublico as NonNullable<typeof sanBenito.gastoPublico>),
      recibido: null,
    },
  }),
};

export const Arrastre: Story = {
  name: 'Sin reservas ni cuentas por pagar (No reportó)',
  args: listo({
    ...sanBenito,
    gastoPublico: {
      ...(sanBenito.gastoPublico as NonNullable<typeof sanBenito.gastoPublico>),
      reservas: null,
      cuentasPorPagar: null,
    },
  }),
};

export const SanAndres: Story = {
  name: 'San Andrés (departamento-isla)',
  args: listo(sanAndres),
};

export const CifrasMasGrandes: Story = {
  name: 'Cifras más grandes (Medellín)',
  args: listo(medellin),
};

export const ContratosSinUbicar: Story = {
  name: 'Contratos: ninguno ubicado con certeza',
  args: listo({ ...sanBenito, contratado: { valor: null, contratos: 0 } }),
};

export const ErrorDeRed: Story = {
  name: 'Error de red',
  args: { status: 'error', datos: undefined, anio: 2025, nivel: 'municipio', onReintentar: noop },
};
