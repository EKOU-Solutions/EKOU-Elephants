import { describe, expect, it } from 'vitest';
import {
  type AlmacenObjetos,
  almacenDesdeWorker,
  claves,
} from '../modules/mapa/adapters/worker-datos/mapa.worker-datos';
import type { ResumenMunicipalDatos } from '../modules/mapa/domain/resumen-municipal';
import { crearApp } from './app';
import type { Queryable } from './db';

// Real values from cut 2026-11 (docs/design/pages/map/contract.md).
const corte = {
  corte: '2026-11',
  fechaCorte: '2026-11-07',
  publicadoEn: '2026-11-15T17:43:18Z',
  geometria: 'mgn-2025',
  fuentes: [
    {
      id: 'jbjy-vk9h',
      nombre: 'SECOP II – Contratos',
      entidad: 'Colombia Compra Eficiente',
      url: 'https://www.datos.gov.co/d/jbjy-vk9h',
      licencia: 'CC BY-SA 4.0',
    },
  ],
};
const medellin = {
  codigo: '05001',
  nombre: 'Medellín',
  tipo: 'municipio',
  departamento: { codigo: '05', iso: 'CO-ANT', nombre: 'Antioquia' },
  contratosUbicados: 356935,
};
const cacahual = {
  codigo: '94886',
  nombre: 'Cacahual',
  tipo: 'area_no_municipalizada',
  departamento: { codigo: '94', iso: 'CO-GUA', nombre: 'Guainía' },
  contratosUbicados: null,
};
const municipios = {
  corte: '2026-11',
  ventana: { desde: 2021, hasta: 2026 },
  municipios: [medellin, cacahual],
};
const departamentos = {
  corte: '2026-11',
  ventana: { desde: 2021, hasta: 2026 },
  nacional: {
    contratos: 7456749,
    contratosEnMunicipios: 6771167,
    contratosSoloDepartamento: 626277,
    contratosSinLugar: 59305,
  },
  departamentos: [
    {
      codigo: '81',
      iso: 'CO-ARA',
      nombre: 'Arauca',
      contratosEnMunicipios: 19268,
      contratosSoloDepartamento: 26863,
    },
  ],
};

function publicado(): Record<string, string> {
  return {
    [claves.puntero]: JSON.stringify({ corte: '2026-11' }),
    [claves.corte('2026-11')]: JSON.stringify(corte),
    [claves.municipios('2026-11')]: JSON.stringify(municipios),
    [claves.departamentos('2026-11')]: JSON.stringify(departamentos),
  };
}

const sinBaseDeDatos: Queryable = {
  async query() {
    throw new Error('el mapa no debe consultar PostgreSQL');
  },
};

function app(objetos: Record<string, string> = publicado()) {
  const leidas: string[] = [];
  const almacen: AlmacenObjetos = {
    async get(clave) {
      leidas.push(clave);
      const texto = objetos[clave];
      return texto === undefined ? null : { text: async () => texto };
    },
  };
  return { app: crearApp(sinBaseDeDatos, almacen), leidas };
}

describe('GET /api/mapa/corte', () => {
  it('devuelve el corte vigente con caché corta', async () => {
    const res = await app().app.request('/api/mapa/corte');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(corte);
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=86400',
    );
  });

  it('responde 503 si no hay corte publicado', async () => {
    const res = await app({}).app.request('/api/mapa/corte');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'corte_no_disponible' });
  });

  it('responde 503 si no hay bucket configurado', async () => {
    const res = await crearApp(sinBaseDeDatos).request('/api/mapa/corte');
    expect(res.status).toBe(503);
  });

  it('responde 503 si el puntero apunta a un corte que no existe', async () => {
    const objetos = { ...publicado(), [claves.puntero]: JSON.stringify({ corte: '2026-12' }) };
    expect((await app(objetos).app.request('/api/mapa/corte')).status).toBe(503);
  });

  it.each([
    ['no es JSON', '{'],
    ['no cumple el contrato', JSON.stringify({ ...corte, fechaCorte: '30/11/2026' })],
    ['trae campos de más', JSON.stringify({ ...corte, extra: 1 })],
  ])('responde 503 si el archivo del corte %s', async (_caso, contenido) => {
    const objetos = { ...publicado(), [claves.corte('2026-11')]: contenido };
    const res = await app(objetos).app.request('/api/mapa/corte');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'corte_no_disponible' });
  });
});

describe('GET /api/mapa/municipios', () => {
  it('devuelve los municipios del corte vigente, con null cuando no hay datos', async () => {
    const res = await app().app.request('/api/mapa/municipios');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(municipios);
  });

  it('responde 503 si faltan los municipios del corte', async () => {
    const { [claves.municipios('2026-11')]: _, ...objetos } = publicado();
    expect((await app(objetos).app.request('/api/mapa/municipios')).status).toBe(503);
  });

  it.each([
    ['un conteo en 0 en vez de null', { ...medellin, contratosUbicados: 0 }],
    ['un código sin el cero inicial', { ...medellin, codigo: '5001' }],
    ['un tipo desconocido', { ...medellin, tipo: 'vereda' }],
  ])('responde 503 si el archivo trae %s', async (_caso, municipio) => {
    const objetos = {
      ...publicado(),
      [claves.municipios('2026-11')]: JSON.stringify({ ...municipios, municipios: [municipio] }),
    };
    expect((await app(objetos).app.request('/api/mapa/municipios')).status).toBe(503);
  });

  it('responde 503 si los municipios son de otro corte', async () => {
    const objetos = {
      ...publicado(),
      [claves.municipios('2026-11')]: JSON.stringify({ ...municipios, corte: '2026-10' }),
    };
    expect((await app(objetos).app.request('/api/mapa/municipios')).status).toBe(503);
  });
});

describe('GET /api/mapa/departamentos', () => {
  it('devuelve los departamentos y el total nacional por nivel', async () => {
    const res = await app().app.request('/api/mapa/departamentos');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(departamentos);
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=86400',
    );
  });

  it('responde 503 si el total nacional no cuadra con sus niveles', async () => {
    const objetos = {
      ...publicado(),
      [claves.departamentos('2026-11')]: JSON.stringify({
        ...departamentos,
        nacional: { ...departamentos.nacional, contratosSinLugar: 0 },
      }),
    };
    expect((await app(objetos).app.request('/api/mapa/departamentos')).status).toBe(503);
  });

  it('responde 503 si faltan los departamentos del corte', async () => {
    const { [claves.departamentos('2026-11')]: _, ...objetos } = publicado();
    expect((await app(objetos).app.request('/api/mapa/departamentos')).status).toBe(503);
  });
});

describe('GET /api/mapa/municipios/:codigo', () => {
  it('devuelve un municipio con el corte y la ventana', async () => {
    const res = await app().app.request('/api/mapa/municipios/05001');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      corte: '2026-11',
      ventana: { desde: 2021, hasta: 2026 },
      ...medellin,
    });
  });

  it('responde 404 si el código no está en DIVIPOLA', async () => {
    const res = await app().app.request('/api/mapa/municipios/99999');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'municipio_no_encontrado' });
  });

  it.each(['5001', '050011', 'abcde', "05001'--"])(
    'responde 400 sin leer los datos si el código es %s',
    async (codigo) => {
      const { app: a, leidas } = app();
      const res = await a.request(`/api/mapa/municipios/${encodeURIComponent(codigo)}`);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'codigo_invalido' });
      expect(leidas).toHaveLength(0);
    },
  );
});

const etapas = (c: number, o: number, p: number) => ({ comprometido: c, obligado: o, pagado: p });
const rubrosDe = (i: number) => [
  { clave: 'funcionamiento', etapas: etapas(10 * i, 9 * i, 8 * i) },
  { clave: 'deuda', etapas: etapas(0, 0, 0) },
  { clave: 'inversion', etapas: etapas(100 * i, 90 * i, 80 * i) },
];
const gasto = (periodo: string, completo: boolean) => ({
  periodo,
  alcance: 'municipio',
  completo,
  recibido: 5000,
  rubros: rubrosDe(1),
  total: etapas(110, 99, 88),
  reservas: null,
  cuentasPorPagar: null,
});
const fuentesResumen = [
  {
    id: '4f7r-epif',
    nombre: 'CUIPO – Ejecución de gastos',
    entidad: 'Contaduría General de la Nación',
    url: 'https://www.datos.gov.co/d/4f7r-epif',
    licencia: 'CC BY-SA 4.0',
    fechaCorte: '2026-09-30',
    usadoPara: 'gastoPublico',
  },
];
const resumenMedellin = {
  corte: '2026-11',
  codigo: '05001',
  nombre: 'Medellín',
  nivel: 'municipio',
  anios: [2021, 2022, 2023, 2024, 2025, 2026],
  porAnio: {
    '2023': { gastoPublico: gasto('2023-12', true), contratado: { valor: 900, contratos: 3 } },
    '2024': { gastoPublico: gasto('2024-12', true), contratado: null },
    '2025': { gastoPublico: gasto('2025-09', false), contratado: { valor: null, contratos: 2 } },
    '2022': { gastoPublico: null, contratado: { valor: 700, contratos: 1 } },
  },
  fuentes: fuentesResumen,
};
const resumenArauca = { ...resumenMedellin, codigo: '81', nombre: 'Arauca', nivel: 'departamento' };

function conResumenes() {
  return app({
    ...publicado(),
    [claves.resumenMunicipio('2026-11', '05001')]: JSON.stringify(resumenMedellin),
    [claves.resumenDepartamento('2026-11', '81')]: JSON.stringify(resumenArauca),
  });
}

describe('GET /api/mapa/municipios/:codigo/resumen', () => {
  it('sin anio devuelve el último año con gasto público', async () => {
    const res = await conResumenes().app.request('/api/mapa/municipios/05001/resumen');
    expect(res.status).toBe(200);
    const cuerpo = (await res.json()) as ResumenMunicipalDatos;
    expect(cuerpo).toMatchObject({
      corte: '2026-11',
      codigo: '05001',
      nombre: 'Medellín',
      anio: 2025,
    });
    expect(cuerpo.anios).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
    expect(cuerpo.gastoPublico?.periodo).toBe('2025-09');
    expect(cuerpo.gastoPublico?.completo).toBe(false);
    expect(cuerpo.fuentes).toEqual(fuentesResumen);
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=86400',
    );
  });

  it('con anio devuelve ese año; contratado ausente es null y valor sin confiar es null', async () => {
    const a = conResumenes().app;
    const dosMilVeinticuatro = (await (
      await a.request('/api/mapa/municipios/05001/resumen?anio=2024')
    ).json()) as ResumenMunicipalDatos;
    expect(dosMilVeinticuatro.anio).toBe(2024);
    expect(dosMilVeinticuatro.contratado).toBeNull();
    const dosMilVeinticinco = (await (
      await a.request('/api/mapa/municipios/05001/resumen?anio=2025')
    ).json()) as ResumenMunicipalDatos;
    expect(dosMilVeinticinco.contratado).toEqual({ valor: null, contratos: 2 });
  });

  it('2022 no tiene CUIPO: gastoPublico null y contratado presente', async () => {
    const cuerpo = (await (
      await conResumenes().app.request('/api/mapa/municipios/05001/resumen?anio=2022')
    ).json()) as ResumenMunicipalDatos;
    expect(cuerpo.gastoPublico).toBeNull();
    expect(cuerpo.contratado).toEqual({ valor: 700, contratos: 1 });
  });

  it('un año sin datos responde 200 con ambos null, nunca ceros', async () => {
    const cuerpo = (await (
      await conResumenes().app.request('/api/mapa/municipios/05001/resumen?anio=2021')
    ).json()) as ResumenMunicipalDatos;
    expect(cuerpo.gastoPublico).toBeNull();
    expect(cuerpo.contratado).toBeNull();
  });

  it('sin archivo del municipio responde 200 con ambos null y el último año de la ventana', async () => {
    const res = await app().app.request('/api/mapa/municipios/94886/resumen');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      codigo: '94886',
      anio: 2026,
      gastoPublico: null,
      contratado: null,
      fuentes: [],
    });
  });

  it.each(['1999', '2027', 'abc', '20x5', ''])(
    'anio=%s responde 400 con los años válidos',
    async (anio) => {
      const res = await conResumenes().app.request(
        `/api/mapa/municipios/05001/resumen?anio=${anio}`,
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: 'anio_invalido',
        anios: [2021, 2022, 2023, 2024, 2025, 2026],
      });
    },
  );

  it.each(['99999', 'abc', '5001'])('código %s responde 404', async (codigo) => {
    const res = await conResumenes().app.request(`/api/mapa/municipios/${codigo}/resumen`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'municipio_no_encontrado' });
  });

  it('un archivo que no cumple el contrato responde 503', async () => {
    const roto = {
      ...resumenMedellin,
      porAnio: { '2025': { gastoPublico: { periodo: '2025-12' }, contratado: null } },
    };
    const a = app({
      ...publicado(),
      [claves.resumenMunicipio('2026-11', '05001')]: JSON.stringify(roto),
    }).app;
    expect((await a.request('/api/mapa/municipios/05001/resumen')).status).toBe(503);
  });

  it('un archivo de otro municipio responde 503', async () => {
    const a = app({
      ...publicado(),
      [claves.resumenMunicipio('2026-11', '05001')]: JSON.stringify({
        ...resumenMedellin,
        codigo: '94886',
      }),
    }).app;
    expect((await a.request('/api/mapa/municipios/05001/resumen')).status).toBe(503);
  });
});

describe('GET /api/mapa/departamentos/:codigo/resumen', () => {
  it('devuelve el resumen del departamento', async () => {
    const res = await conResumenes().app.request('/api/mapa/departamentos/81/resumen?anio=2024');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ codigo: '81', nombre: 'Arauca', anio: 2024 });
  });

  it('un departamento desconocido responde 404', async () => {
    const res = await conResumenes().app.request('/api/mapa/departamentos/99/resumen');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'departamento_no_encontrado' });
  });

  it('anio inválido responde 400', async () => {
    const res = await conResumenes().app.request('/api/mapa/departamentos/81/resumen?anio=1999');
    expect(res.status).toBe(400);
  });
});

describe('almacenDesdeWorker', () => {
  const worker = (respuestas: Record<string, Response>) =>
    ({
      fetch: async (url: string) => respuestas[url] ?? new Response('no', { status: 404 }),
    }) as unknown as Fetcher;

  it('lee cada clave como una ruta del Worker de datos', async () => {
    const almacen = almacenDesdeWorker(
      worker({ 'https://datos/datos/latest.json': new Response('{"corte":"2026-11"}') }),
    );
    expect(await (await almacen?.get('datos/latest.json'))?.text()).toBe('{"corte":"2026-11"}');
  });

  it('devuelve null si el archivo no existe', async () => {
    expect(await almacenDesdeWorker(worker({}))?.get('datos/2026-11/corte.json')).toBeNull();
  });

  it('falla si el Worker responde con un error', async () => {
    const almacen = almacenDesdeWorker(
      worker({ 'https://datos/datos/latest.json': new Response('', { status: 500 }) }),
    );
    await expect(almacen?.get('datos/latest.json')).rejects.toThrow('500');
  });

  it('no hay almacén sin el binding DATOS', () => {
    expect(almacenDesdeWorker(undefined)).toBeUndefined();
  });
});
