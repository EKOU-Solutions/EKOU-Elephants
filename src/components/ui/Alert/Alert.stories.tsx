import type { Meta, StoryObj } from '@storybook/react-vite';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Alert } from './Alert';

const meta = {
  title: 'Componentes/UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: componentDocs(
    'Alert',
    'Avisa algo sobre la interfaz o la información: qué pasó y qué puede hacer la persona. El color está en el ícono y el borde; el texto queda en tinta. **No califica territorios.** Título que dice qué pasó y frase que dice qué hacer; no apiles alertas, no pidas disculpas ni culpes a la persona.',
    'src/components/ui/Alert/',
  ),
  args: {
    variant: 'inline',
    tone: 'danger',
    title: 'No cargaron los contratos',
    message:
      'Revisa tu conexión y vuelve a intentarlo. El mapa se mostrará cuando lleguen los datos.',
    action: 'Volver a intentar',
    onAction: () => {},
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['banner', 'inline', 'note', 'toast'] },
    tone: { control: 'inline-radio', options: ['info', 'warning', 'danger', 'success'] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InlineError: Story = { name: 'En línea · error' };
export const InlineSuccess: Story = {
  name: 'En línea · confirmación',
  args: {
    tone: 'success',
    title: 'Filtro aplicado: Antioquia',
    message: 'Todo lo que ves ahora es de Antioquia.',
    action: undefined,
  },
};
export const InlineInfo: Story = {
  name: 'En línea · explicación',
  args: {
    tone: 'info',
    title: 'Así contamos',
    message: 'Un contrato con varias señales cuenta una sola vez.',
    action: undefined,
  },
};
export const CoverageBanner: Story = {
  name: 'Banner · cobertura parcial',
  args: {
    variant: 'banner',
    tone: 'warning',
    title: 'Faltan 30 contratos por analizar.',
    message: 'Analizamos 120 de 150; las cifras pueden cambiar.',
    action: 'Ver cobertura',
    actionHref: '#cobertura',
  },
};
export const RetryBanner: Story = {
  name: 'Banner · error con reintento',
  args: {
    variant: 'banner',
    tone: 'danger',
    title: 'No cargó el mapa.',
    message: 'Revisa tu conexión.',
    action: 'Volver a intentar',
    onAction: () => {},
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
  args: {
    variant: 'note',
    tone: 'warning',
    title: 'Cobertura parcial: 120 de 150',
    message: undefined,
    action: undefined,
  },
};
export const ToastSuccess: Story = {
  name: 'Flotante · confirmación',
  args: {
    variant: 'toast',
    tone: 'success',
    title: 'Enlace copiado.',
    message: undefined,
    action: undefined,
    onDismiss: () => {},
  },
  parameters: {
    docs: {
      // Fixed to the window: in the docs page it lives in its own frame, not over the text.
      story: { inline: false, iframeHeight: 160 },
      description: {
        story:
          'Confirma una acción que no cambia la página (copiar, compartir). Queda fija a la ventana, abajo y centrada; en celular ocupa el ancho menos el margen. No tiene sombra: la separa del contenido un borde fuerte. Quien la usa la cierra sola a los 5 segundos (`TOAST_DURATION_MS`), sea confirmación o error; «Cerrar» la quita antes. Monta la región desde el inicio con `title` vacío para que el lector de pantalla anuncie el mensaje cuando llegue. Puede tapar por unos segundos lo que queda debajo: no se reserva espacio en blanco para ella.',
      },
    },
  },
};
export const ToastError: Story = {
  name: 'Flotante · error',
  args: {
    variant: 'toast',
    tone: 'danger',
    title: 'No se pudo copiar.',
    message: 'Selecciona el número y cópialo.',
    action: undefined,
    onDismiss: () => {},
  },
  parameters: { docs: { story: { inline: false, iframeHeight: 160 } } },
};
