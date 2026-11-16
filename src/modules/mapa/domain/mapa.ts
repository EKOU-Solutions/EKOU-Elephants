// Map contract (TASK-09): docs/design/pages/map/contract.md.

export interface Fuente {
  /** Dataset id: "jbjy-vk9h", "gdxc-w37w", "mgn-2025". */
  id: string;
  nombre: string;
  entidad: string;
  url: string;
  licencia: string;
}

export interface CorteVigente {
  /** Monthly cut, "AAAA-MM". */
  corte: string;
  /** Date the data is current to (Colombian time), ISO date. */
  fechaCorte: string;
  /** ISO datetime (UTC) when the pipeline published the cut. */
  publicadoEn: string;
  /** Geometry version: the app serves it as a static file at /geometria/<version>.topojson. */
  geometria: string;
  fuentes: Fuente[];
}

export type TipoMunicipio = 'municipio' | 'area_no_municipalizada' | 'isla';

export interface MunicipioDelMapa {
  /** DIVIPOLA 5-digit code, with its leading zero. */
  codigo: string;
  nombre: string;
  tipo: TipoMunicipio;
  departamento: { codigo: string; iso: string; nombre: string };
  /** Contracts located here within `ventana`; null = none located ("Sin datos"), never 0. */
  contratosUbicados: number | null;
}

export interface MunicipiosDelCorte {
  corte: string;
  /** Signing years counted in `contratosUbicados`, both included. */
  ventana: { desde: number; hasta: number };
  municipios: MunicipioDelMapa[];
}

/** Every contract in the window falls in exactly one level. */
export interface TotalNacional {
  contratos: number;
  /** Located in one municipality (the municipal map). */
  contratosEnMunicipios: number;
  /** Located only in a department: governorships, several municipalities, uncertain seat. */
  contratosSoloDepartamento: number;
  /** No municipality and no department. */
  contratosSinLugar: number;
}

export interface DepartamentoDelMapa {
  /** DIVIPOLA 2-digit code. */
  codigo: string;
  iso: string;
  nombre: string;
  /** Sum of its municipalities' `contratosUbicados`. Measured, so 0 is a real zero. */
  contratosEnMunicipios: number;
  contratosSoloDepartamento: number;
}

export interface DepartamentosDelCorte {
  corte: string;
  ventana: { desde: number; hasta: number };
  nacional: TotalNacional;
  departamentos: DepartamentoDelMapa[];
}

export interface MunicipioSeleccionado extends MunicipioDelMapa {
  corte: string;
  ventana: { desde: number; hasta: number };
}

export class MunicipioNoEncontrado extends Error {
  constructor(readonly codigo: string) {
    super(`Municipio no encontrado: ${codigo}`);
    this.name = 'MunicipioNoEncontrado';
  }
}

/** No published cut, or a published file is missing or fails its schema. */
export class CorteNoDisponible extends Error {
  constructor(motivo: string) {
    super(`Corte no disponible: ${motivo}`);
    this.name = 'CorteNoDisponible';
  }
}
