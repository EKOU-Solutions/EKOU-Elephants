// Title and description of each place's page (ADR 0003). People read them in search results and in
// link previews: they go through `/ajuste` with the `elephant-ux` review, so they live here, alone.
import { formatNumber } from '../../../src/components/ui/format';

const MARCA = 'EKOU Elephants';
const CIERRE = 'Fuentes: SECOP II y SECOP I, DANE. Este mapa todavía no mide riesgo.';

export type LugarParaTextos =
  | { tipo: 'pais'; contratos: number }
  | {
      tipo: 'departamento';
      /** Short name: «San Andrés y Providencia», never the official one (only in the JSON-LD). */
      nombre: string;
      /** `null`: the department is not in the cut («Sin datos», never 0). */
      enMunicipios: number | null;
      soloDepartamento: number | null;
    }
  | {
      tipo: 'municipio';
      nombre: string;
      /** Without it (Bogotá, D.C.) the name stands alone. Short name for the Archipelago. */
      departamento?: string;
      /** `null` is «Sin datos»: no contract located with certainty, never 0. */
      contratos: number | null;
    };

const n = (valor: number) => formatNumber(valor, 0);
/** «1 contrato público», «356.935 contratos públicos»; `s` pluralizes the words that follow. */
const contratos = (valor: number) =>
  valor === 1 ? '1 contrato público' : `${n(valor)} contratos públicos`;
const s = (valor: number) => (valor === 1 ? '' : 's');
const sinDatos = (donde: string, periodo: string) =>
  `Sin datos: no encontramos contratos públicos ubicados con certeza en ${donde} ${periodo}. ${CIERRE}`;

/** `<title>` and `description` of a place's page. `periodo`: «del 1 ene 2021 al 7 nov 2026», as the app says it. */
export function textosDelLugar(
  lugar: LugarParaTextos,
  periodo: string,
): { title: string; description: string } {
  if (lugar.tipo === 'pais') {
    return {
      title: `Mapa de contratación pública de Colombia · ${MARCA}`,
      description: `${contratos(lugar.contratos)} firmado${s(lugar.contratos)} en Colombia ${periodo}, por departamento y municipio. ${CIERRE}`,
    };
  }
  if (lugar.tipo === 'departamento') {
    const { nombre, enMunicipios, soloDepartamento } = lugar;
    return {
      title: `${nombre}: contratos públicos por municipio · ${MARCA}`,
      description:
        enMunicipios === null || soloDepartamento === null
          ? sinDatos(`los municipios de ${nombre}`, periodo)
          : `${contratos(enMunicipios)} en los municipios de ${nombre} y ${n(soloDepartamento)} sin municipio identificado, ${periodo}. ${CIERRE}`,
    };
  }
  const { nombre, departamento } = lugar;
  const donde = departamento ? `${nombre} (${departamento})` : nombre;
  return {
    title: `${departamento ? `${nombre}, ${departamento}` : nombre}: contratos públicos · ${MARCA}`,
    description:
      lugar.contratos === null
        ? sinDatos(donde, periodo)
        : `${contratos(lugar.contratos)} firmado${s(lugar.contratos)} ${periodo} y ubicado${s(lugar.contratos)} en ${donde}${donde.endsWith('.') ? '' : '.'} ${CIERRE}`,
  };
}
