import { importeACentavos } from './importe';
import type { Queryable } from '../../../../server/db';
import type { ConsultarGastoTerritorial } from '../../application/ports/consultar-gasto-territorial';

interface Fila extends Record<string, unknown> {
  codigo: string;
  nombre: string;
  presupuesto_asignado: string;
  gasto_actual: string;
  total_obras: number;
  obras_con_retraso: number;
}

export function gastoTerritorialRepository(db: Queryable): ConsultarGastoTerritorial {
  return {
    async porCodigo(codigo) {
      const [fila] = await db.query<Fila>(
        `SELECT codigo, nombre, presupuesto_asignado, gasto_actual, total_obras, obras_con_retraso
           FROM gasto_territorial WHERE codigo = $1`,
        [codigo],
      );
      if (!fila) return null;
      return {
        codigo: fila.codigo,
        nombre: fila.nombre,
        // Parse NUMERIC text exactly before converting to safe integer COP cents.
        presupuestoAsignadoCentavos: importeACentavos(fila.presupuesto_asignado),
        gastoActualCentavos: importeACentavos(fila.gasto_actual),
        totalObras: fila.total_obras,
        obrasConRetraso: fila.obras_con_retraso,
      };
    },
  };
}
