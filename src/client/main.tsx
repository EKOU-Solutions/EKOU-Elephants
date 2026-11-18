import '../styles/global.css';
import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { initialState } from '../modules/mapa/ui/MapScreen';
import { App } from './App';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta el elemento raíz #root');

// What tells a control of the generated page and its twin in the app apart: both render these the same.
const IDENTITY = ['href', 'type', 'aria-label', 'data-crumb', 'data-height-button'];
const isTwin = (a: Element, b: Element) =>
  a.tagName === b.tagName &&
  a.textContent === b.textContent &&
  IDENTITY.every((name) => a.getAttribute(name) === b.getAttribute(name));

// A place's generated page (ADR 0003) stays in view until its data arrive; then the app takes over,
// keeping what the person did meanwhile: the search text, the focus and the caret.
initialState(raiz.hasChildNodes()).then((initial) => {
  const query = raiz.querySelector<HTMLInputElement>('input[type="search"]')?.value;
  const active = document.activeElement;
  const focused = active && active !== raiz && raiz.contains(active) ? active : null;
  const caret =
    focused instanceof HTMLInputElement && focused.selectionStart !== null
      ? ([focused.selectionStart, focused.selectionEnd ?? focused.selectionStart] as const)
      : null;
  flushSync(() =>
    createRoot(raiz).render(
      <StrictMode>
        <App initial={initial} query={query} />
      </StrictMode>,
    ),
  );
  if (!focused) return;
  const twin = Array.from(raiz.querySelectorAll(focused.tagName)).find((el) => isTwin(el, focused));
  if (!(twin instanceof HTMLElement)) return;
  twin.focus({ preventScroll: true });
  if (caret && twin instanceof HTMLInputElement) twin.setSelectionRange(...caret);
});
