import { describe, expect, it, vi } from 'vitest';
import { renderizarComentario } from './control.mjs';
import { calcularOpciones, publicarComentario } from './github.mjs';

const bot = (id, body) => ({ id, body, user: { login: 'github-actions[bot]' } });
const opciones = { copiaBd: true, datosPropios: false, apiPropia: false, apiPr: null };

function apiFalsa({ comentarios = [], archivos = [], otros = {} } = {}) {
  return vi.fn(async (metodo, ruta) => {
    if (metodo === 'GET' && ruta.startsWith('/issues/7/comments')) return comentarios;
    if (metodo === 'GET' && ruta.startsWith('/pulls/7/files')) return archivos;
    const otro = /^\/pulls\/(\d+)$/.exec(ruta)?.[1];
    if (metodo === 'GET' && otro) {
      if (!otros[otro]) throw Object.assign(new Error('404'), { status: 404 });
      return otros[otro];
    }
    if (metodo === 'POST') return { id: 99 };
    if (metodo === 'PATCH') return { id: 5 };
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

describe('calcularOpciones con la API', () => {
  const conApiPr = (n) =>
    bot(
      5,
      renderizarComentario({
        pr: 7,
        sha: 'a',
        opciones: { ...opciones, copiaBd: false, apiPr: n },
        estado: 'desplegado',
      }),
    );
  const repo = { repo: { full_name: 'ekou/elephants' } };

  it('un PR que cambia la API despliega su propia API', async () => {
    const api = apiFalsa({ archivos: [{ filename: 'src/server/api.ts' }] });
    expect(await calcularOpciones(api, 7)).toMatchObject({
      cambiosApi: true,
      api: 'propia',
      bloqueo: '',
    });
  });

  it('usa la API de otro PR solo si está abierto y no viene de un fork', async () => {
    const abierto = { state: 'open', head: repo, base: repo };
    let r = await calcularOpciones(
      apiFalsa({ comentarios: [conApiPr(57)], otros: { 57: abierto } }),
      7,
    );
    expect(r).toMatchObject({ api: 'pr-57', bloqueo: '' });
    r = await calcularOpciones(
      apiFalsa({ comentarios: [conApiPr(57)], otros: { 57: { ...abierto, state: 'closed' } } }),
      7,
    );
    expect(r.bloqueo).toMatch(/no está abierto/);
    r = await calcularOpciones(
      apiFalsa({
        comentarios: [conApiPr(57)],
        otros: { 57: { ...abierto, head: { repo: { full_name: 'otro/fork' } } } },
      }),
      7,
    );
    expect(r.bloqueo).toMatch(/fork/);
    r = await calcularOpciones(apiFalsa({ comentarios: [conApiPr(58)] }), 7);
    expect(r.bloqueo).toMatch(/No existe el PR #58/);
  });
});

describe('publicarComentario', () => {
  it('crea el comentario la primera vez, sin intentar fijarlo', async () => {
    const api = apiFalsa();
    const datos = { sha: 'abc1234', opciones, estado: 'desplegando' };
    await expect(publicarComentario(api, 7, datos)).resolves.toBe(99);
    expect(api).toHaveBeenCalledWith('POST', '/issues/7/comments', expect.any(Object));
    expect(api).not.toHaveBeenCalledWith('PUT', expect.anything());
  });

  it('actualiza el existente en lugar de crear otro', async () => {
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
