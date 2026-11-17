import { z } from 'zod';
import type { ConsultarMapa } from '../../application/ports/consultar-mapa';
import {
  CorteNoDisponible,
  type CorteVigente,
  type DepartamentosDelCorte,
  type MunicipiosDelCorte,
} from '../../domain/mapa';

/** Read files by key, so tests can use an in-memory fake instead of the data Worker. */
export interface AlmacenObjetos {
  get(clave: string): Promise<{ text(): Promise<string> } | null>;
}

/**
 * DATOS is the static-assets Worker `ekou-elephants-datos`. The monthly cut deploys it from the
 * GitHub Releases `corte-AAAA-MM` (docs/ci-cd.md): `datos/<corte>/` holds the JSON files of that
 * Release with the same names, and `datos/latest.json` points to the current cut. A key is fetched
 * as a path, and 404 means the file does not exist.
 */
export function almacenDesdeWorker(worker: Fetcher | undefined): AlmacenObjetos | undefined {
  if (!worker) return undefined;
  return {
    async get(clave) {
      const res = await worker.fetch(`https://datos/${clave}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Worker de datos respondió ${res.status} para ${clave}`);
      return res;
    },
  };
}

// Release assets written by `ekou-pipeline export-mapa`, served by the data Worker.
const PREFIJO = 'datos';
export const claves = {
  puntero: `${PREFIJO}/latest.json`,
  corte: (corte: string) => `${PREFIJO}/${corte}/corte.json`,
  municipios: (corte: string) => `${PREFIJO}/${corte}/municipios.json`,
  departamentos: (corte: string) => `${PREFIJO}/${corte}/departamentos.json`,
};

const corteId = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const ventana = z.object({ desde: z.number().int(), hasta: z.number().int() }).strict();

const esquemaPuntero = z.object({ corte: corteId });

const esquemaCorte = z
  .object({
    corte: corteId,
    fechaCorte: z.iso.date(),
    publicadoEn: z.iso.datetime(),
    geometria: z.string().regex(/^[a-z0-9-]+$/),
    fuentes: z.array(
      z
        .object({
          id: z.string().min(1),
          nombre: z.string().min(1),
          entidad: z.string().min(1),
          url: z.url(),
          licencia: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

const esquemaMunicipios = z
  .object({
    corte: corteId,
    ventana,
    municipios: z.array(
      z
        .object({
          codigo: z.string().regex(/^\d{5}$/),
          nombre: z.string().min(1),
          tipo: z.enum(['municipio', 'area_no_municipalizada', 'isla']),
          departamento: z
            .object({
              codigo: z.string().regex(/^\d{2}$/),
              iso: z.string().regex(/^CO-[A-Z]{2,3}$/),
              nombre: z.string().min(1),
            })
            .strict(),
          // Missing data is null, never 0.
          contratosUbicados: z.number().int().positive().nullable(),
        })
        .strict(),
    ),
  })
  .strict();

const conteo = z.number().int().nonnegative();

const esquemaDepartamentos = z
  .object({
    corte: corteId,
    ventana,
    nacional: z
      .object({
        contratos: conteo,
        contratosEnMunicipios: conteo,
        contratosSoloDepartamento: conteo,
        contratosSinLugar: conteo,
      })
      .strict()
      .refine(
        (n) =>
          n.contratos ===
          n.contratosEnMunicipios + n.contratosSoloDepartamento + n.contratosSinLugar,
        'el total nacional no cuadra con sus niveles',
      ),
    departamentos: z.array(
      z
        .object({
          codigo: z.string().regex(/^\d{2}$/),
          iso: z.string().regex(/^CO-[A-Z]{2,3}$/),
          nombre: z.string().min(1),
          contratosEnMunicipios: conteo,
          contratosSoloDepartamento: conteo,
        })
        .strict(),
    ),
  })
  .strict();

export function mapaDesdeDatos(almacen: AlmacenObjetos): ConsultarMapa {
  async function leerJson<T>(clave: string, esquema: z.ZodType<T>): Promise<T | null> {
    const objeto = await almacen.get(clave);
    if (!objeto) return null;
    let crudo: unknown;
    try {
      crudo = JSON.parse(await objeto.text());
    } catch {
      throw new CorteNoDisponible(`${clave} no es JSON`);
    }
    const resultado = esquema.safeParse(crudo);
    if (!resultado.success) throw new CorteNoDisponible(`${clave} no cumple el contrato`);
    return resultado.data;
  }

  return {
    async corteVigente(): Promise<CorteVigente | null> {
      const puntero = await leerJson(claves.puntero, esquemaPuntero);
      if (!puntero) return null;
      const corte = await leerJson(claves.corte(puntero.corte), esquemaCorte);
      if (!corte)
        throw new CorteNoDisponible(`el puntero apunta a ${puntero.corte}, que no existe`);
      if (corte.corte !== puntero.corte)
        throw new CorteNoDisponible('el puntero y el corte no coinciden');
      return corte;
    },

    async municipios(corte: string): Promise<MunicipiosDelCorte | null> {
      const datos = await leerJson(claves.municipios(corte), esquemaMunicipios);
      if (datos && datos.corte !== corte)
        throw new CorteNoDisponible('los municipios son de otro corte');
      return datos;
    },

    async departamentos(corte: string): Promise<DepartamentosDelCorte | null> {
      const datos = await leerJson(claves.departamentos(corte), esquemaDepartamentos);
      if (datos && datos.corte !== corte)
        throw new CorteNoDisponible('los departamentos son de otro corte');
      return datos;
    },
  };
}
