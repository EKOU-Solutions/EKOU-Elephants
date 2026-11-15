import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../shared';
import { Alert } from './Alert';

const meta = {
  title: 'Componentes/Núcleo/Alerta',
  component: Alert,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Alert',
    'Avisa algo sobre la interfaz o la información: qué pasó y qué puede hacer la persona. El color está en el ícono y el borde; el texto queda en tinta. **No califica territorios.** Título que dice qué pasó y frase que dice qué hacer; no apiles alertas, no pidas disculpas ni culpes a la persona.',
  ),
  args: {
    variant: 'inline',
    tone: 'danger',
    title: 'No cargaron los contratos',
    message: 'Revisa tu conexión y vuelve a intentarlo. El mapa se mostrará cuando lleguen los datos.',
    action: 'Volver a intentar',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['banner', 'inline', 'note'] },
    tone: { control: 'inline-radio', options: ['info', 'warning', 'danger', 'success'] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InlineError: Story = { name: 'En línea · error' };
export const InlineSuccess: Story = {
  name: 'En línea · confirmación',
  args: { tone: 'success', title: 'Filtro aplicado: Antioquia', message: 'Todo lo que ves ahora es de Antioquia.', action: undefined },
};
export const InlineInfo: Story = {
  name: 'En línea · explicación',
  args: { tone: 'info', title: 'Así contamos', message: 'Un contrato con varias señales cuenta una sola vez.', action: undefined },
};
export const CoverageBanner: Story = {
  name: 'Banner · cobertura parcial',
  args: {
    variant: 'banner',
    tone: 'warning',
    title: 'Faltan 30 contratos por analizar.',
    message: 'Analizamos 120 de 150; las cifras pueden cambiar.',
    action: 'Ver cobertura',
  },
};
export const SampleDataBanner: Story = {
  name: 'Banner · datos de ejemplo',
  args: {
    variant: 'banner',
    tone: 'info',
    title: 'Estás viendo datos de ejemplo.',
    message: 'Ningún contrato de esta guía es real.',
    action: undefined,
  },
};
export const Note: Story = {
  name: 'Nota compacta',
  args: { variant: 'note', tone: 'warning', title: 'Cobertura parcial: 120 de 150', message: undefined, action: undefined },
};
