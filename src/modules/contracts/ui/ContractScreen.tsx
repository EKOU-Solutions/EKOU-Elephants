import { useEffect, useRef, useState } from 'react';
import type { ContractDetail } from '../domain/contract';
import {
  ContractDetailPage,
  type ContractDetailState,
  type ShareOutcome,
} from './ContractDetailPage/ContractDetailPage';
import { pageTitle } from './contractText';

type Fetch = (url: string, init: { signal: AbortSignal }) => Promise<Response>;

const CONTRACT_PATH = /^\/contratos\/([^/]+)\/?$/;

/** «/contratos/CO1.PCCNTR.7954915» → the SECOP id as it is; null when the path names no contract. */
export function contractIdFromPath(pathname: string): string | null {
  const id = CONTRACT_PATH.exec(pathname)?.[1];
  if (!id) return null;
  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}

/**
 * 'app' when the person came from another page of Elephants and there is a page to go back to;
 * 'link' for a shared link or a new tab, where «Volver» would lead nowhere.
 */
export function arrivalOrigin(
  referrer: string,
  origin: string,
  historyLength: number,
): 'app' | 'link' {
  return referrer.startsWith(`${origin}/`) && historyLength > 1 ? 'app' : 'link';
}

/**
 * Reads a contract from our API (contract: docs/design/pages/contract-detail/contract.md) and the
 * date of its cut. 400 and 404 mean the contract does not exist; any other failure is «no
 * disponible». A missing cut date never fails the page: it says only the month of the cut.
 */
export async function loadContract(
  id: string | null,
  origin: 'app' | 'link',
  signal: AbortSignal,
  fetcher: Fetch = fetch,
): Promise<ContractDetailState> {
  if (id === null) return { status: 'not_found', origin };
  const cutDate = fetcher('/api/mapa/corte', { signal })
    .then(async (response) =>
      response.ok ? ((await response.json()) as { corte: string; fechaCorte: string }) : undefined,
    )
    .catch(() => undefined);
  try {
    const response = await fetcher(`/api/contracts/${encodeURIComponent(id)}`, { signal });
    if (response.status === 400 || response.status === 404) return { status: 'not_found', origin };
    if (!response.ok) return { status: 'unavailable' };
    const contract = (await response.json()) as ContractDetail;
    const cut = await cutDate;
    // Right after a new cut the two answers can belong to different cuts: never date one with the other.
    return {
      status: 'ready',
      contract,
      cutDate: cut?.corte === contract.cut ? cut.fechaCorte : undefined,
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    return { status: 'unavailable' };
  }
}

/** What the page needs from the browser to share and copy; both can be missing. */
type Sharing = Partial<Pick<Navigator, 'share' | 'clipboard'>>;

/** The system share menu; without one, the link is copied instead. */
export async function share(
  data: { title: string; url: string },
  browser: Sharing = navigator,
): Promise<ShareOutcome> {
  try {
    if (browser.share) {
      await browser.share(data);
      return 'done';
    }
    return (await copy(data.url, browser)) ? 'copied' : 'failed';
  } catch (error) {
    // Closing the share menu is not a failure.
    return (error as Error).name === 'AbortError' ? 'done' : 'failed';
  }
}

/** Whether the text reached the clipboard; never throws (no clipboard on http or in old browsers). */
export async function copy(text: string, browser: Sharing = navigator): Promise<boolean> {
  try {
    if (!browser.clipboard) return false;
    await browser.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const TITLE: Record<Exclude<ContractDetailState['status'], 'ready'>, string> = {
  loading: 'Contrato',
  unavailable: 'Contrato',
  not_found: 'No encontramos ese contrato',
};

/** The tab says what the page is: «{titular} · {entidad} · EKOU Elephants». */
export function tabTitle(state: ContractDetailState): string {
  return state.status === 'ready'
    ? pageTitle(state.contract)
    : `${TITLE[state.status]} · EKOU Elephants`;
}

/** The contract detail page in the app, at `/contratos/{id}`. */
export function ContractScreen() {
  const [state, setState] = useState<ContractDetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the load on «Reintentar»
  useEffect(() => {
    const control = new AbortController();
    setState({ status: 'loading' });
    loadContract(
      contractIdFromPath(window.location.pathname),
      arrivalOrigin(document.referrer, window.location.origin, window.history.length),
      control.signal,
    ).then(setState, () => {
      // Aborted: this effect was replaced, its answer no longer matters.
    });
    return () => control.abort();
  }, [attempt]);

  // The tab says what the page is, and focus lands on the `h1` once there is something to read.
  useEffect(() => {
    document.title = tabTitle(state);
    if (state.status !== 'loading') title.current?.focus({ preventScroll: true });
  }, [state]);

  return (
    <ContractDetailPage
      state={state}
      titleRef={title}
      onRetry={() => setAttempt((n) => n + 1)}
      onBack={() => window.history.back()}
      onShare={() => share({ title: document.title, url: window.location.href })}
      onCopy={copy}
    />
  );
}
