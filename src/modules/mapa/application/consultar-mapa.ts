import {
  CorteNoDisponible,
  type CorteVigente,
  type DepartamentosDelCorte,
  GeometriaNoEncontrada,
  MunicipioNoEncontrado,
  type MunicipiosDelCorte,
  type MunicipioSeleccionado,
} from '../domain/mapa';
import type { ConsultarMapa } from './ports/consultar-mapa';

export function obtenerCorte(puerto: ConsultarMapa) {
  return async (): Promise<CorteVigente> => {
    const corte = await puerto.corteVigente();
    if (!corte) throw new CorteNoDisponible('sin corte publicado');
    return corte;
  };
}

export function listarMunicipios(puerto: ConsultarMapa) {
  const corte = obtenerCorte(puerto);
  return async (): Promise<MunicipiosDelCorte> => {
    const vigente = await corte();
    const municipios = await puerto.municipios(vigente.corte);
    if (!municipios)
      throw new CorteNoDisponible(`faltan los municipios del corte ${vigente.corte}`);
    return municipios;
  };
}

export function listarDepartamentos(puerto: ConsultarMapa) {
  const corte = obtenerCorte(puerto);
  return async (): Promise<DepartamentosDelCorte> => {
    const vigente = await corte();
    const departamentos = await puerto.departamentos(vigente.corte);
    if (!departamentos)
      throw new CorteNoDisponible(`faltan los departamentos del corte ${vigente.corte}`);
    return departamentos;
  };
}

export function obtenerMunicipio(puerto: ConsultarMapa) {
  const listar = listarMunicipios(puerto);
  return async (codigo: string): Promise<MunicipioSeleccionado> => {
    const { corte, ventana, municipios } = await listar();
    const municipio = municipios.find((m) => m.codigo === codigo);
    if (!municipio) throw new MunicipioNoEncontrado(codigo);
    return { corte, ventana, ...municipio };
  };
}

export function obtenerGeometria(puerto: ConsultarMapa) {
  return async (version: string): Promise<string> => {
    const geometria = await puerto.geometria(version);
    if (geometria === null) throw new GeometriaNoEncontrada(version);
    return geometria;
  };
}
