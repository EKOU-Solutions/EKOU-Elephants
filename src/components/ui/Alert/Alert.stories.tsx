import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Button } from '../Button/Button';
import { Alert, TOAST_DURATION_MS } from './Alert';

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
          'Confirma una acción que no cambia la página (copiar, compartir). Queda fija a la ventana, abajo y centrada; en celular ocupa el ancho menos el margen. No tiene sombra: la separa del contenido un borde fuerte. Una confirmación se cierra sola a los 5 segundos (`TOAST_DURATION_MS`); el tiempo se detiene mientras el puntero o el foco están sobre ella. Un error no se cierra solo: trae qué hacer, y la persona decide cuándo quitarlo. Siempre se cierra con «Cerrar» o con Escape, que no mueve el foco. Monta la región desde el inicio con `title` vacío para que el lector de pantalla anuncie el mensaje cuando llegue. Puede tapar lo que queda debajo: no se reserva espacio en blanco para ella, y Escape la quita si tapa algo.',
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

/** A page with one action that shows the floating alert, like copying a number. */
function ToastDemo({ tone }: { tone: 'success' | 'danger' }) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button variant="secondary" label="Copiar" onClick={() => setShown(true)} />
      <Alert
        variant="toast"
        tone={tone}
        title={shown ? (tone === 'danger' ? 'No se pudo copiar.' : 'Número copiado.') : ''}
        message={shown && tone === 'danger' ? 'Selecciona el número y cópialo.' : undefined}
        onDismiss={() => setShown(false)}
      />
    </>
  );
}
const behaviour = { docs: { story: { inline: false, iframeHeight: 200 } } };
const past = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ToastClosesItself: Story = {
  name: 'Flotante · la confirmación se cierra sola',
  render: () => <ToastDemo tone="success" />,
  parameters: behaviour,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('status');
    await expect(region).toBeEmptyDOMElement();
    await userEvent.click(canvas.getByRole('button', { name: 'Copiar' }));
    await expect(region).toHaveTextContent('Número copiado.');
    await waitFor(() => expect(region).toBeEmptyDOMElement(), {
      timeout: TOAST_DURATION_MS + 2000,
    });
  },
};
export const ToastErrorStays: Story = {
  name: 'Flotante · el error se queda; Escape lo cierra sin mover el foco',
  render: () => <ToastDemo tone="danger" />,
  parameters: behaviour,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const copy = canvas.getByRole('button', { name: 'Copiar' });
    await userEvent.click(copy);
    const region = canvas.getByRole('alert');
    await expect(region).toHaveTextContent('No se pudo copiar. Selecciona el número y cópialo.');
    await past(TOAST_DURATION_MS + 500);
    await expect(region).toHaveTextContent('No se pudo copiar.');
    await userEvent.keyboard('{Escape}');
    await expect(region).toBeEmptyDOMElement();
    await expect(copy).toHaveFocus();
  },
};
export const ToastHeld: Story = {
  name: 'Flotante · el tiempo se detiene con el foco encima',
  render: () => <ToastDemo tone="success" />,
  parameters: behaviour,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Copiar' }));
    const region = canvas.getByRole('status');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    await past(TOAST_DURATION_MS + 500);
    await expect(region).toHaveTextContent('Número copiado.');
    await userEvent.click(canvas.getByRole('button', { name: 'Cerrar' }));
    await expect(region).toBeEmptyDOMElement();
  },
};
