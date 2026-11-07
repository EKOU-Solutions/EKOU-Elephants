export interface ResumenTerritorial {
  /** DIVIPOLA code: 2 digits (departamento) or 5 digits (municipio). */
  codigo: string;
  nombre: string;
  presupuestoAsignado: number;
  gastoActual: number;
  totalObras: number;
  obrasConRetraso: number;
}

export class TerritorioNoEncontrado extends Error {
  constructor(readonly codigo: string) {
    super(`Territorio no encontrado: ${codigo}`);
    this.name = 'TerritorioNoEncontrado';
  }
}
