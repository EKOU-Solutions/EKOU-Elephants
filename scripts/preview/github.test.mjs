import { describe, expect, it, vi } from 'vitest';
import { renderizarComentario } from './control.mjs';
import { calcularOpciones, publicarComentario } from './github.mjs';

const bot = (id, body) => ({ id, body, user: { login: 'github-actions[bot]' } });
const opciones = { copiaBd: true, prefijoR2Propio: false };

function apiFalsa({ comentarios = [], archivos = [], fallaPin = false } = {}) {
  return vi.fn(async (metodo, ruta) => {
    if (metodo === 'GET' && ruta.startsWith('/issues/7/comments')) return comentarios;
    if (metodo === 'GET' && ruta.startsWith('/pulls/7/files')) return archivos;
    if (metodo === 'POST') return { id: 99 };
    if (metodo === 'PATCH') return { id: 5 };
    if (metodo === 'PUT' && fallaPin) throw Object.assign(new Error('no'), { status: 404 });
    return null;
  });
}

describe('calcularOpciones', () => {
  it('ignora comentarios con la marca que no son del bot', async () => {
    const cuerpo = renderizarComentario({ pr: 7, sha: 'a', opciones, estado: 'desplegado' });
    const api = apiFalsa({ comentarios: [{ id: 1, body: cuerpo, user: { login: 'alguien' } }] });
    const r = await calcularOpciones(api, 7);
    expect(r.comentarioId).toBe('');
    expect(r.opciones.copiaBd).toBe(false);
  });

  it('bloquea si el PR cambia migraciones sin copia propia', async () => {
    const api = apiFalsa({ archivos: [{ filename: 'migrations/2_x.sql' }] });
    const r = await calcularOpciones(api, 7);
    expect(r.migraciones).toBe(true);
    expect(r.bloqueo).toMatch(/Copia propia/);
  });

  it('con copia marcada en el comentario del bot no bloquea', async () => {
    const cuerpo = renderizarComentario({ pr: 7, sha: 'a', opciones, estado: 'desplegado' });
    const api = apiFalsa({
      comentarios: [bot(5, cuerpo)],
      archivos: [{ filename: 'migrations/2_x.sql' }],
    });
    const r = await calcularOpciones(api, 7);
    expect(r).toMatchObject({ comentarioId: 5, bloqueo: '', opciones });
  });
});

describe('publicarComentario', () => {
  it('crea y fija el comentario la primera vez; si fijar falla, solo avisa', async () => {
    const api = apiFalsa({ fallaPin: true });
    const avisar = vi.fn();
    const datos = { sha: 'abc1234', opciones, estado: 'desplegando' };
    await expect(publicarComentario(api, 7, datos, avisar)).resolves.toBe(99);
    expect(api).toHaveBeenCalledWith('PUT', '/issues/comments/99/pin');
    expect(avisar).toHaveBeenCalled();
  });

  it('actualiza el existente sin volver a fijarlo', async () => {
    const api = apiFalsa({
      comentarios: [
        bot(5, renderizarComentario({ pr: 7, sha: 'a', opciones, estado: 'desplegado' })),
      ],
    });
    await publicarComentario(api, 7, { sha: 'b', opciones, estado: 'desplegado' });
    expect(api).toHaveBeenCalledWith('PATCH', '/issues/comments/5', expect.any(Object));
    expect(api).not.toHaveBeenCalledWith('PUT', expect.anything());
  });
});
