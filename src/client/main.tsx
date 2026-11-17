import '../styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initialState } from '../modules/mapa/ui/MapScreen';
import { App } from './App';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta el elemento raíz #root');

// A place's generated page (ADR 0003) stays in view until its data arrive; then the app takes over.
initialState(raiz.hasChildNodes()).then((initial) =>
  createRoot(raiz).render(
    <StrictMode>
      <App initial={initial} />
    </StrictMode>,
  ),
);
