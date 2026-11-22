import {
  AnioInvalido,
  DepartamentoNoEncontrado,
  type ResumenDelTerritorio,
  type ResumenMunicipalDatos,
} from '../domain/resumen-municipal';
import { MunicipioNoEncontrado } from '../domain/mapa';
import { listarDepartamentos, listarMunicipios } from './consultar-mapa';
import type { ConsultarMapa } from './ports/consultar-mapa';
import type { ConsultarResumen } from './ports/consultar-resumen';

interface Territorio {
  corte: string;
  codigo: string;
  nombre: string;
  ventana: { desde: number; hasta: number };
}

/** The years the selector offers: the whole window, the same for every territory. */
function aniosDe(ventana: { desde: number; hasta: number }): number[] {
  return Array.from({ length: ventana.hasta - ventana.desde + 1 }, (_, i) => ventana.desde + i);
}

/**
 * `anio` arrives as text from the query string. Without it the latest year with spending is used,
 * and if the territory has none, the latest year of the window.
 */
function armar(
  t: Territorio,
  archivo: ResumenDelTerritorio | null,
  anioPedido: string | undefined,
): ResumenMunicipalDatos {
  const anios = aniosDe(t.ventana);
  let anio: number;
  if (anioPedido === undefined) {
    const conGasto = anios.filter((a) => archivo?.porAnio[String(a)]?.gastoPublico);
    anio = conGasto.at(-1) ?? t.ventana.hasta;
  } else {
    anio = /^\d{4}$/.test(anioPedido) ? Number(anioPedido) : Number.NaN;
    if (!anios.includes(anio)) throw new AnioInvalido(anios);
  }
  const delAnio = archivo?.porAnio[String(anio)];
  return {
    corte: t.corte,
    codigo: t.codigo,
    nombre: t.nombre,
    anio,
    anios,
    gastoPublico: delAnio?.gastoPublico ?? null,
    contratado: delAnio?.contratado ?? null,
    fuentes: archivo?.fuentes ?? [],
  };
}

export function obtenerResumenMunicipal(mapa: ConsultarMapa, resumen: ConsultarResumen) {
  const listar = listarMunicipios(mapa);
  return async (codigo: string, anio?: string): Promise<ResumenMunicipalDatos> => {
    const { corte, ventana, municipios } = await listar();
    const municipio = municipios.find((m) => m.codigo === codigo);
    if (!municipio) throw new MunicipioNoEncontrado(codigo);
    const archivo = await resumen.resumenMunicipio(corte, codigo);
    return armar({ corte, codigo, nombre: municipio.nombre, ventana }, archivo, anio);
  };
}

export function obtenerResumenDepartamental(mapa: ConsultarMapa, resumen: ConsultarResumen) {
  const listar = listarDepartamentos(mapa);
  return async (codigo: string, anio?: string): Promise<ResumenMunicipalDatos> => {
    const { corte, ventana, departamentos } = await listar();
    const departamento = departamentos.find((d) => d.codigo === codigo);
    if (!departamento) throw new DepartamentoNoEncontrado(codigo);
    const archivo = await resumen.resumenDepartamento(corte, codigo);
    return armar({ corte, codigo, nombre: departamento.nombre, ventana }, archivo, anio);
  };
}
