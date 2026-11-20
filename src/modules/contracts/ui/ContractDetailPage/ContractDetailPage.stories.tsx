import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { ContractDetail } from '../../domain/contract';
import { ContractDetailPage, type ContractDetailPageProps } from './ContractDetailPage';
import {
  activeContract,
  extremeContract,
  finishedContract,
  loweredValueContract,
  noDescriptionContract,
  noInitialValueContract,
  noMethodContract,
  noValueContract,
  paidContract,
  pastoContract,
  previewSignals,
  providenciaContract,
  recentContract,
  SAMPLE_CUT_DATE,
  suspendedContract,
  unknownMethodContract,
  unknownSupplierContract,
  unreliableValueContract,
  zeroValueContract,
} from './ContractDetailPage.fixtures';

const ready = (contract: ContractDetail): ContractDetailPageProps['state'] => ({
  status: 'ready',
  contract,
  cutDate: SAMPLE_CUT_DATE,
});

const meta = {
  title: 'Módulos/Contracts/ContractDetailPage',
  component: ContractDetailPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Detalle de contrato (TASK-12). Responde «¿Qué se contrató aquí, entre quiénes, por cuánto y cómo lo compruebo?». Dirección: `/contratos/{id}`, con el id de SECOP tal cual. Una sola bajada, en preguntas: en celular las acciones van solo al cierre; desde 900 px también arriba; desde 1100 px cada pregunta queda a la izquierda de su respuesta.',
          '',
          'Datos: muestra del corte 2026-11 (datos al 7 nov 2026), con la forma del contrato de la API (`docs/design/pages/contract-detail/contract.md`). Dos contratos son reales (Pasto y Providencia); las historias que dicen «variante de muestra» derivan de ellos para mostrar un estado. No aparece ningún nombre de persona natural. Especificación: `docs/design/pages/contract-detail/spec.md`.',
          '',
          'El estado del contrato es una frase, nunca una etiqueta de color: «plazo vencido sin cierre» no es una señal. La historia «Vista previa: señales de ejemplo» muestra dos señales con **gravedad de ejemplo** y lo dice en la página; la app no la muestra hasta que existan las señales (TASK-13).',
          '',
          'En estas historias, «Compartir esta ficha» y «Copiar» solo muestran su mensaje flotante: no abren el menú del sistema ni tocan el portapapeles.',
        ].join('\n'),
      },
    },
  },
  args: {
    state: ready(providenciaContract),
    onRetry: () => {},
    onBack: () => {},
    onShare: async () => 'copied',
    onCopy: async () => true,
  },
} satisfies Meta<typeof ContractDetailPage>;

export default meta;
type Story = StoryObj<ContractDetailPageProps>;

export const Typical: Story = {
  name: 'Caso típico: persona natural, SECOP I, entidad de nombre largo',
};
export const CompanyRaised: Story = {
  name: 'Empresa: el valor subió y se agregaron días',
  args: { state: ready(pastoContract) },
};
export const ReadMore: Story = {
  name: '«Leer completo»: abre el objeto en su lugar',
  args: { state: ready(pastoContract) },
  parameters: {
    docs: {
      description: {
        story:
          'El objeto pasa de 220 caracteres: se recorta a unas tres líneas. «Leer completo» lo abre en su lugar, el botón pasa a «Leer menos» y el foco se queda en él. La historia lo abre sola y lo comprueba; tócalo para recogerlo.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = canvas.getByRole('button', { name: 'Leer completo' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);
    const less = canvas.getByRole('button', { name: 'Leer menos' });
    await expect(less).toHaveAttribute('aria-expanded', 'true');
    await expect(less).toHaveFocus();
    await expect(canvas.getByText(/\(SRC-0005-062\)$/)).toBeVisible();
  },
};
export const Recent: Story = {
  name: 'Contrato reciente (variante de muestra)',
  args: { state: ready(recentContract) },
};
export const LoweredValue: Story = {
  name: 'El valor bajó (variante de muestra)',
  args: { state: ready(loweredValueContract) },
};
export const UnreliableValue: Story = {
  name: 'Valor no confiable',
  args: { state: ready(unreliableValueContract) },
};
export const ZeroValue: Story = {
  name: 'Valor $ 0 (variante de muestra)',
  args: { state: ready(zeroValueContract) },
};
export const NoInitialValue: Story = {
  name: 'Sin valor al firmar (variante de muestra)',
  args: { state: ready(noInitialValueContract) },
};
export const NoValue: Story = {
  name: 'Sin datos del valor (variante de muestra)',
  args: { state: ready(noValueContract) },
};
export const UnknownSupplier: Story = {
  name: 'Contratista sin documento (variante de muestra)',
  args: { state: ready(unknownSupplierContract) },
};
export const NoDescription: Story = {
  name: 'Sin objeto ni enlace a SECOP (variante de muestra)',
  args: { state: ready(noDescriptionContract) },
};
export const Paid: Story = {
  name: 'Pago reportado (variante de muestra)',
  args: { state: ready(paidContract) },
};
export const Active: Story = {
  name: 'Contrato en ejecución (variante de muestra)',
  args: { state: ready(activeContract) },
};
export const Suspended: Story = {
  name: 'Contrato suspendido (variante de muestra)',
  args: { state: ready(suspendedContract) },
};
export const Finished: Story = {
  name: 'Contrato terminado (variante de muestra)',
  args: { state: ready(finishedContract) },
};
export const UnknownMethod: Story = {
  name: 'Modalidad con un texto no reconocido (variante de muestra)',
  args: { state: ready(unknownMethodContract) },
};
export const NoMethod: Story = {
  name: 'Sin modalidad: la franja no se muestra (variante de muestra)',
  args: { state: ready(noMethodContract) },
};
/** The closing «Compartir esta ficha»: from 900 px there is another one at the top. */
const closingShare = (canvas: ReturnType<typeof within>) => {
  const share = canvas.getAllByRole('button', { name: 'Compartir esta ficha' }).at(-1);
  if (!share) throw new Error('«Compartir esta ficha» is missing');
  return share;
};

export const CopyAndShare: Story = {
  name: 'Copiar y compartir: mensaje flotante de confirmación',
  args: { state: ready(pastoContract) },
  parameters: {
    docs: {
      description: {
        story:
          'La historia toca «Compartir esta ficha» (aquí sin menú del sistema: copia el enlace) y luego «Copiar», y comprueba cada mensaje en la alerta flotante (`role="status"`). El foco se queda en el botón tocado. La confirmación se cierra sola a los 5 segundos, o antes con «Cerrar» o Escape. Al repetir la acción, el mensaje se vuelve a anunciar.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notice = canvas.getByRole('status');
    await expect(notice).toBeEmptyDOMElement();
    await userEvent.click(closingShare(canvas));
    await waitFor(() => expect(notice).toHaveTextContent('Enlace copiado.'));
    const copy = canvas.getByRole('button', { name: 'Copiar el número en SECOP' });
    await userEvent.click(copy);
    await waitFor(() => expect(notice).toHaveTextContent('Número copiado.'));
    await expect(copy).toHaveFocus();
    // The same message again: the region empties first, so it is announced and seen again.
    const seen: string[] = [];
    const observer = new MutationObserver(() => seen.push(notice.textContent ?? ''));
    observer.observe(notice, { childList: true, subtree: true, characterData: true });
    await userEvent.click(copy);
    await waitFor(() => expect(seen.at(-1)).toContain('Número copiado.'));
    observer.disconnect();
    await expect(seen).toContain('');
    await expect(canvas.getByRole('button', { name: 'Cerrar' })).toBeVisible();
  },
};
export const CopyAndShareFail: Story = {
  name: 'Copiar y compartir: mensaje flotante cuando fallan',
  args: {
    state: ready(pastoContract),
    onCopy: async () => false,
    onShare: async () => 'failed',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cuando falla, la alerta flotante es de error (`role="alert"`) y no se cierra sola. La historia comprueba los dos mensajes, que «Cerrar» devuelve el foco al botón tocado y que Escape la quita sin mover el foco.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(closingShare(canvas));
    await waitFor(() =>
      expect(canvas.getByRole('alert')).toHaveTextContent(
        'No se pudo compartir. Copia la dirección de la página.',
      ),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Cerrar' }));
    await expect(closingShare(canvas)).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Copiar el número en SECOP' }));
    await waitFor(() =>
      expect(canvas.getByRole('alert')).toHaveTextContent(
        'No se pudo copiar. Selecciona el número y cópialo.',
      ),
    );
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Copiar el número en SECOP' })).toHaveFocus();
  },
};
export const KeyboardWalk: Story = {
  name: 'Con teclado: orden de lectura y foco visible',
  args: { state: ready(pastoContract) },
  parameters: {
    docs: {
      description: {
        story:
          'La historia recorre la ficha con Tab y comprueba que el foco sigue el orden de lectura, que cada control enfocado se ve (anillo de foco) y que todos tienen nombre.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const visited: HTMLElement[] = [];
    for (let i = 0; i < 20; i += 1) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      if (!canvasElement.contains(focused) || visited.includes(focused)) break;
      visited.push(focused);
      await expect(getComputedStyle(focused).outlineStyle).not.toBe('none');
      await expect(focused).toHaveAccessibleName();
    }
    // Volver, read more, copy, and at least share and the SECOP link.
    await expect(visited.length).toBeGreaterThanOrEqual(5);
    for (const [i, element] of visited.entries()) {
      const next = visited[i + 1];
      if (next)
        await expect(
          element.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    }
  },
};
export const CutDateUnknown: Story = {
  name: 'Sin la fecha del corte: solo el mes',
  args: { state: { status: 'ready', contract: providenciaContract } },
};
export const Loading: Story = { name: 'Cargando', args: { state: { status: 'loading' } } };
export const NotFoundFromLink: Story = {
  name: 'No existe, llegando por un enlace: «Ir al mapa»',
  args: { state: { status: 'not_found', origin: 'link' } },
};
export const NotFoundFromApp: Story = {
  name: 'No existe, viniendo de Elephants: «Volver»',
  args: { state: { status: 'not_found', origin: 'app' } },
};
export const Unavailable: Story = {
  name: 'Datos no disponibles, con «Reintentar»',
  args: { state: { status: 'unavailable' } },
};
export const SignalsPreview: Story = {
  name: 'Vista previa: señales de ejemplo por gravedad (TASK-13)',
  args: { state: ready(pastoContract), previewSignals },
  parameters: {
    docs: {
      description: {
        story:
          'Vista previa: la API todavía no entrega señales (TASK-13). Los hechos salen del contrato real de Pasto; **los niveles son de ejemplo**, no un resultado de la metodología (TASK-07). La página lo dice arriba.',
      },
    },
  },
};
export const Extreme: Story = {
  name: 'Caso extremo: entidad de ~161 caracteres y objeto de 1.450 (variante de muestra)',
  args: { state: ready(extremeContract) },
};
