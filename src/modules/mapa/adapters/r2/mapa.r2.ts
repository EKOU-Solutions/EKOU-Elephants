import { z } from 'zod';
import type { ConsultarMapa } from '../../application/ports/consultar-mapa';
import { CorteNoDisponible, type CorteVigente, type MunicipiosDelCorte } from '../../domain/mapa';

/** The slice of R2Bucket this adapter needs, so tests can use an in-memory fake. */
export interface AlmacenObjetos {
  get(clave: string): Promise<{ text(): Promise<string> } | null>;
}

// Keys written by the pipeline (`ekou-pipeline export-mapa`) and the corte-mensual workflow.
const PREFIJO = 'datos';
export const claves = {
  puntero: `${PREFIJO}/latest.json`,
  corte: (corte: string) => `${PREFIJO}/${corte}/corte.json`,
  municipios: (corte: string) => `${PREFIJO}/${corte}/mapa/municipios.json`,
  geometria: (version: string) => `${PREFIJO}/geometria/${version}.topojson`,
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

export function mapaR2(almacen: AlmacenObjetos): ConsultarMapa {
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
      if (!corte) throw new CorteNoDisponible(`el puntero apunta a ${puntero.corte}, que no existe`);
      if (corte.corte !== puntero.corte) throw new CorteNoDisponible('el puntero y el corte no coinciden');
      return corte;
    },

    async municipios(corte: string): Promise<MunicipiosDelCorte | null> {
      const datos = await leerJson(claves.municipios(corte), esquemaMunicipios);
      if (datos && datos.corte !== corte) throw new CorteNoDisponible('los municipios son de otro corte');
      return datos;
    },

    async geometria(version: string): Promise<string | null> {
      const objeto = await almacen.get(claves.geometria(version));
      return objeto ? objeto.text() : null;
    },
  };
}
