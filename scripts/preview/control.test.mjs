import { describe, expect, it } from 'vitest';
import {
  apiCambiada,
  bloqueoPorMigraciones,
  destinoApi,
  interpretarApi,
  leerOpciones,
  MARCA,
  renderizarComentario,
  workerDatos,
} from './control.mjs';

const opciones = { copiaBd: false, datosPropios: false, api: null, apiAuto: null };

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
    ]) {
      const cuerpo = renderizarComentario({
        pr: 7,
        sha: 'abcdef123',
        opciones: o,
        estado: 'desplegado',
      });
      expect(cuerpo.startsWith(MARCA)).toBe(true);
      // La API sin elegir queda escrita con la automática: la de producción, porque no cambia la API.
      expect(leerOpciones(cuerpo)).toEqual({
        ...o,
        api: 'ekou-elephants-api',
        apiAuto: 'ekou-elephants-api',
      });
    }
  });

  it('lee una casilla marcada a mano en GitHub con [x] o [X]', () => {
    const cuerpo = renderizarComentario({
      pr: 7,
      sha: 'abcdef1',
      opciones,
      estado: 'desplegado',
    }).replace('- [ ] **Copia propia', '- [X] **Copia propia');
    expect(leerOpciones(cuerpo)).toMatchObject({ copiaBd: true, datosPropios: false });
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

  it('lee lo que alguien escribe en «API», con o sin comillas', () => {
    const cuerpo = renderizarComentario({ pr: 7, sha: 'abcdef1', opciones, estado: 'desplegado' });
    expect(cuerpo).toContain('- **API:** `ekou-elephants-api` <!-- api -->');
    const escrito = (v) =>
      leerOpciones(cuerpo.replace('`ekou-elephants-api` <!-- api -->', `${v} <!-- api -->`));
    expect(escrito('ekou-elephants-api-pr-57').api).toBe('ekou-elephants-api-pr-57');
    expect(escrito('` #57 `').api).toBe('#57');
    expect(escrito('').api).toBeNull();
    expect(escrito('#57').apiAuto).toBe('ekou-elephants-api');
  });

  it('interpreta los valores de «API»', () => {
    expect(interpretarApi('ekou-elephants-api')).toBeNull();
    expect(interpretarApi('producción')).toBeNull();
    for (const v of ['ekou-elephants-api-pr-57', 'pr-57', '#57', '57'])
      expect(interpretarApi(v)).toBe(57);
    for (const v of ['ekou-elephants-api-pr-0', 'otra', 'ekou-elephants-web'])
      expect(interpretarApi(v)).toBeUndefined();
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

  it('elige la API sola: la del PR si cambia la API; si no, la de producción', () => {
    const destino = (cambiosApi) => destinoApi({ pr: 7, opciones, cambiosApi });
    expect(destino(false)).toEqual({
      api: '',
      elegida: 'ekou-elephants-api',
      manual: false,
      bloqueo: null,
    });
    expect(destino(true)).toEqual({
      api: 'propia',
      elegida: 'ekou-elephants-api-pr-7',
      manual: false,
      bloqueo: null,
    });
  });

  it('respeta la API que alguien escribió, también en los siguientes despliegues', () => {
    // Escrita por una persona: distinta de la que el workflow eligió solo la última vez.
    const escrita = (api, apiAuto, cambiosApi = false) =>
      destinoApi({ pr: 7, opciones: { ...opciones, api, apiAuto }, cambiosApi });
    expect(escrita('#57', 'ekou-elephants-api')).toMatchObject({
      api: 'pr-57',
      elegida: 'ekou-elephants-api-pr-57',
      manual: true,
    });
    expect(escrita('ekou-elephants-api', 'ekou-elephants-api-pr-7', true)).toMatchObject({
      api: '',
      manual: true,
    });
    expect(escrita('ekou-elephants-api-pr-7', 'ekou-elephants-api')).toMatchObject({
      api: 'propia',
      manual: true,
    });
    expect(escrita('ekou-elephants-api-pr-57', 'ekou-elephants-api-pr-7', true).api).toBe('pr-57');
    // Sin tocar: si el PR empieza a cambiar la API, pasa sola a la del PR.
    expect(escrita('ekou-elephants-api', 'ekou-elephants-api', true)).toMatchObject({
      api: 'propia',
      manual: false,
    });
    const mala = escrita('otra <b>', 'ekou-elephants-api');
    expect(mala.bloqueo).toMatch(/no es una API/);
    expect(mala.elegida).toBe('otrab');
  });

  it('el comentario dice qué API usa, por qué y cómo cambiarla', () => {
    const texto = (o) => {
      const cuerpo = renderizarComentario({
        pr: 7,
        sha: 'a',
        opciones,
        estado: 'desplegado',
        ...o,
      });
      return cuerpo.slice(cuerpo.indexOf('- **API:**'), cuerpo.indexOf('<sub>'));
    };
    expect(texto({})).toContain(
      '`ekou-elephants-api` <!-- api --> La web usa la API de producción, porque este PR no cambia la API.',
    );
    expect(texto({ cambiosApi: true })).toContain(
      '`ekou-elephants-api-pr-7` <!-- api --> La web usa el preview de la API de este PR, porque este PR cambia la API.',
    );
    expect(texto({ cambiosApi: true })).toContain('<!-- api-auto: ekou-elephants-api-pr-7 -->');
    expect(
      texto({ cambiosApi: true, apiElegida: 'ekou-elephants-api-pr-57', apiManual: true }),
    ).toContain(
      'La web usa el preview de la API del PR #57, elegida a mano. Para volver a la automática, escribe `ekou-elephants-api-pr-7`.',
    );
    expect(texto({})).toContain('edita este comentario (`⋯` → *Edit*) y cambia ese valor');
    expect(texto({ apiElegida: 'otra', apiManual: true })).toContain(
      '«otra» no es un valor válido',
    );
  });

  it('con la web y la API separadas muestra la URL de cada pieza', () => {
    const base = { pr: 7, sha: 'abcdef1', opciones, estado: 'desplegado', arquitectura: 'web-api' };
    const cuerpo = renderizarComentario({
      ...base,
      url: 'https://pr-7-web.x.dev/',
      apiUrl: 'https://ekou-elephants-api.x.dev/',
    });
    expect(cuerpo).toContain('| Web | [https://pr-7-web.x.dev/](https://pr-7-web.x.dev/) |');
    expect(cuerpo).toContain(
      '| API | [https://ekou-elephants-api.x.dev/api](https://ekou-elephants-api.x.dev/api) |',
    );
    expect(cuerpo).toContain(
      '| Storybook (sistema de diseño) | [https://pr-7-web.x.dev/storybook/](https://pr-7-web.x.dev/storybook/) |',
    );
    expect(cuerpo).not.toContain('la web la llama');
  });
});
