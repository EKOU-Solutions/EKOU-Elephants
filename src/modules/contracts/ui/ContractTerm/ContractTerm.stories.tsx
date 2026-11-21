import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContractTerm } from './ContractTerm';

const meta = {
  title: 'Módulos/Contracts/ContractTerm',
  component: ContractTerm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Responde «¿Cuánto dura?» en el detalle de contrato (TASK-12): las fechas de firma, inicio y fin, y la frase del estado. Si al plazo se le agregaron días, lo parte en dos tramos rotulados: **lleno = plazo inicial**, **contorno = agregado después**. El fin inicial es el fin menos los días agregados.',
          '',
          'En celular la barra va arriba y los dos rótulos en lista, cada uno con su clave; desde 768 px cada rótulo va debajo de su tramo. Si SECOP no trae la fecha de inicio o la de fin, lo dice.',
          '',
          'No dibuja tramos si falta el inicio o el fin, si el fin es anterior al inicio o si los días agregados igualan o superan la duración: quedan las fechas. La barra es decorativa: los días y las fechas están siempre en texto. No usa color de riesgo ni pinta el tiempo posterior al fin: el atraso entra con las señales (TASK-13).',
          '',
          'Datos: contratos reales del corte 2026-11 (datos al 7 nov 2026, SECOP I y II); las variantes derivadas lo dicen en su nombre.',
        ].join('\n'),
      },
    },
  },
  args: {
    dates: { signed: '2025-02-17', start: '2025-03-05', end: '2025-09-05', addedDays: null },
    status: 'expired_unclosed',
  },
} satisfies Meta<typeof ContractTerm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dates: Story = { name: 'Fechas (sin días agregados)' };

export const AddedDays: Story = {
  name: 'Dos tramos: plazo inicial y agregado',
  args: {
    dates: { signed: '2025-06-09', start: '2025-07-09', end: '2026-09-30', addedDays: 273 },
  },
};

export const FewAddedDays: Story = {
  name: 'Caso extremo: pocos días agregados (variante de muestra)',
  args: {
    dates: { signed: '2025-06-09', start: '2025-07-09', end: '2026-09-30', addedDays: 5 },
    status: 'active',
  },
};

export const NoEnd: Story = {
  name: 'Sin datos de la fecha de fin (variante de muestra)',
  args: {
    dates: { signed: '2025-02-17', start: '2025-03-05', end: null, addedDays: null },
    status: 'active',
  },
};

export const OnlySigned: Story = {
  name: 'Solo la firma (variante de muestra)',
  args: {
    dates: { signed: '2026-10-28', start: null, end: null, addedDays: null },
    status: 'not_started',
  },
};

export const InconsistentDates: Story = {
  name: 'Fechas que no cuadran: sin tramos (variante de muestra)',
  args: {
    dates: { signed: '2025-06-09', start: '2025-07-09', end: '2025-08-30', addedDays: 273 },
    status: 'suspended',
  },
};
