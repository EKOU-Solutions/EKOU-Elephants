import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { SignalItem } from './SignalItem';

const meta = {
  title: 'Componentes/UI/SignalItem',
  component: SignalItem,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Signal item',
    'Una señal numerada: un título corto y el hecho que la sustenta. **Una señal, no un veredicto**: nunca «corrupción», «robo» ni «sospechoso». Va siempre dentro de una lista ordenada (`<ol>`), que pone el número. Con `level`, el número toma el color de riesgo y la gravedad de la señal se escribe debajo («Gravedad alta», «Gravedad intermedia», «Gravedad baja»): califica la señal, no el contrato; **el nivel lo calcula la metodología (TASK-07 y TASK-13), nunca se elige a mano**. Sin `level`, la señal va neutra. Los ejemplos usan un contrato real del corte 2026-11 (datos al 7 nov 2026, SECOP II); los niveles son de ejemplo.',
    'src/components/ui/SignalItem/',
  ),
  args: {
    title: 'Ya cuesta 20,9 % más de lo firmado',
    fact: 'Pasó de $ 56,1 a $ 67,8 millones.',
  },
  argTypes: {
    level: { control: 'inline-radio', options: [undefined, 'low', 'medium', 'high'] },
  },
  decorators: [
    (Story) => (
      <ol style={{ margin: 0, padding: 0, maxWidth: '72ch' }}>
        <Story />
      </ol>
    ),
  ],
} satisfies Meta<typeof SignalItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoLevel: Story = { name: 'Sin nivel' };
export const High: Story = { name: 'Gravedad alta (de ejemplo)', args: { level: 'high' } };
export const Medium: Story = {
  name: 'Gravedad intermedia (de ejemplo)',
  args: { level: 'medium' },
};
export const Low: Story = { name: 'Gravedad baja (de ejemplo)', args: { level: 'low' } };

export const List: Story = {
  name: 'Lista de varias señales (niveles de ejemplo)',
  render: () => (
    <>
      <SignalItem
        level="high"
        title="Ya cuesta 20,9 % más de lo firmado"
        fact="Pasó de $ 56,1 a $ 67,8 millones."
      />
      <SignalItem
        level="medium"
        title="Al plazo se le agregaron 273 días"
        fact="Terminaba el 31 dic 2025; ahora, el 30 sep 2026."
      />
      <SignalItem
        level="low"
        title="La entidad no ha reportado pagos"
        fact="SECOP II no trae pagos de este contrato."
      />
      <SignalItem
        title="El contrato no trae fecha de inicio"
        fact="SECOP solo registra la firma y el fin."
      />
    </>
  ),
};

export const LongTitle: Story = {
  name: 'Título largo',
  args: {
    level: 'medium',
    title:
      'Al plazo del contrato se le agregaron 273 días después de la firma, más de lo que duraba el plazo inicial de 175 días',
    fact: 'Terminaba el 31 dic 2025; ahora, el 30 sep 2026. El plazo inicial iba del 9 jul 2025 al 31 dic 2025.',
  },
};
