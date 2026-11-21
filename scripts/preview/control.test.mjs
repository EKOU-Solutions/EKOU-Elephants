import { describe, expect, it } from 'vitest';
import {
  apiCambiada,
  bloqueoPorMigraciones,
  destinoApi,
  leerOpciones,
  MARCA,
  renderizarComentario,
  workerDatos,
} from './control.mjs';

const opciones = { copiaBd: false, datosPropios: false, apiPropia: false, apiPr: null };

describe('comentario de control', () => {
  it('sin comentario usa la base compartida y los datos de producción', () => {
    expect(leerOpciones(undefined)).toEqual(opciones);
    expect(workerDatos(7, opciones)).toBe('ekou-elephants-datos');
    expect(workerDatos(7, { datosPropios: true })).toBe('ekou-elephants-datos-pr-7');
  });

  it('lo que renderiza se vuelve a leer igual (ida y vuelta)', () => {
    for (const o of [
      opciones,
      { ...opciones, copiaBd: true },
      { ...opciones, datosPropios: true },
      { ...opciones, apiPropia: true },
      { ...opciones, apiPr: 57 },
    ]) {
      const cuerpo = renderizarComentario({
        pr: 7,
        sha: 'abcdef123',
        opciones: o,
        estado: 'desplegado',
      });
      expect(cuerpo.startsWith(MARCA)).toBe(true);
      expect(leerOpciones(cuerpo)).toEqual(o);
    }
  });

  it('lee una casilla marcada a mano en GitHub con [x] o [X]', () => {
    const cuerpo = renderizarComentario({
      pr: 7,
      sha: 'abcdef1',
      opciones,
      estado: 'desplegado',
    }).replace('- [ ] **Copia propia', '- [X] **Copia propia');
    expect(leerOpciones(cuerpo)).toEqual({ ...opciones, copiaBd: true });
  });

  it('bloquea migraciones sobre la base compartida', () => {
    expect(bloqueoPorMigraciones({ opciones, migracionesCambiadas: true })).toMatch(/migrations/);
    expect(bloqueoPorMigraciones({ opciones, migracionesCambiadas: false })).toBeNull();
    expect(
      bloqueoPorMigraciones({
        opciones: { ...opciones, copiaBd: true },
        migracionesCambiadas: true,
      }),
    ).toBeNull();
  });

  it('muestra URL, base y motivo de bloqueo', () => {
    const cuerpo = renderizarComentario({
      pr: 7,
      sha: 'abcdef1',
      opciones: { copiaBd: true, datosPropios: true },
      estado: 'bloqueado',
      motivo: 'razón',
      url: 'https://pr-7.x.dev/',
    });
    expect(cuerpo).toContain('preview/pr-7');
    expect(cuerpo).toContain('ekou-elephants-datos-pr-7');
    expect(cuerpo).toContain('> razón');
    expect(cuerpo).toContain('| App | [https://pr-7.x.dev/](https://pr-7.x.dev/) |');
    expect(cuerpo).toContain('| API | [https://pr-7.x.dev/api](https://pr-7.x.dev/api) |');
    expect(cuerpo).toContain(
      '| Storybook (sistema de diseño) | [https://pr-7.x.dev/storybook/](https://pr-7.x.dev/storybook/) |',
    );
  });

  it('dice si el preview lee los datos de producción o ninguno', () => {
    const base = { pr: 7, sha: 'abcdef1', opciones, estado: 'desplegado' };
    expect(renderizarComentario(base)).toContain('sin datos del corte');
    expect(renderizarComentario({ ...base, datosCorte: true })).toContain(
      'de producción `ekou-elephants-datos`',
    );
  });

  it('lee el número que alguien escribe en «API de otro PR»', () => {
    const cuerpo = renderizarComentario({ pr: 7, sha: 'abcdef1', opciones, estado: 'desplegado' });
    expect(cuerpo).toContain('- **API de otro PR:** # <!-- api-pr -->');
    expect(leerOpciones(cuerpo).apiPr).toBeNull();
    expect(leerOpciones(cuerpo.replace('# <!-- api-pr -->', '#57 <!-- api-pr -->')).apiPr).toBe(57);
    expect(leerOpciones(cuerpo.replace('# <!-- api-pr -->', '57 <!-- api-pr -->')).apiPr).toBe(57);
  });

  it('reconoce un cambio de la API: servidor, su configuración o la lógica de un módulo', () => {
    expect(apiCambiada(['src/server/api.ts'])).toBe(true);
    expect(apiCambiada(['wrangler.api.jsonc'])).toBe(true);
    expect(apiCambiada(['migrations/3_x.sql'])).toBe(true);
    expect(apiCambiada(['src/modules/contracts/adapters/http/contracts.routes.ts'])).toBe(true);
    expect(apiCambiada(['src/modules/mapa/domain/mapa.ts'])).toBe(true);
    expect(apiCambiada(['src/modules/mapa/ui/MapPage/MapPage.tsx'])).toBe(false);
    expect(apiCambiada(['web/src/pages/mapa.astro', 'docs/ci-cd.md'])).toBe(false);
  });

  it('elige la API del preview: producción, la del PR o la de otro PR', () => {
    const destino = (o, cambiosApi = false) =>
      destinoApi({ pr: 7, opciones: { ...opciones, ...o }, cambiosApi });
    expect(destino({})).toEqual({ api: '', bloqueo: null });
    expect(destino({ apiPropia: true })).toEqual({ api: 'propia', bloqueo: null });
    expect(destino({}, true)).toEqual({ api: 'propia', bloqueo: null });
    expect(destino({ apiPr: 57 })).toEqual({ api: 'pr-57', bloqueo: null });
    // Su propio número es «API de este PR».
    expect(destino({ apiPr: 7 })).toEqual({ api: 'propia', bloqueo: null });
    expect(destino({ apiPr: 57, apiPropia: true }).bloqueo).toMatch(/una sola API/);
    expect(destino({ apiPr: 57 }, true).bloqueo).toMatch(/cambia la API/);
  });

  it('con la web y la API separadas muestra cuál API usa la web', () => {
    const base = { pr: 7, sha: 'abcdef1', opciones, estado: 'desplegado', arquitectura: 'web-api' };
    const produccion = renderizarComentario({ ...base, url: 'https://pr-7-web.x.dev/' });
    expect(produccion).toContain('| Web | [https://pr-7-web.x.dev/](https://pr-7-web.x.dev/) |');
    expect(produccion).toContain('de producción `ekou-elephants-api` (service binding)');
    expect(produccion).toContain(
      '| Storybook (sistema de diseño) | [https://pr-7-web.x.dev/storybook/](https://pr-7-web.x.dev/storybook/) |',
    );
    const preview = renderizarComentario({ ...base, apiUrl: 'https://pr-7-api.x.dev/' });
    expect(preview).toContain('[https://pr-7-api.x.dev/](https://pr-7-api.x.dev/) (preview)');
    expect(renderizarComentario({ ...base, cambiosApi: true })).toContain('Este PR cambia la API');
  });
});
