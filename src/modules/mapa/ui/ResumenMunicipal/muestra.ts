import type { Etapas, ResumenMunicipalDatos, Rubro } from './resumenModel';

const e = (comprometido: number, obligado: number, pagado: number): Etapas => ({
  comprometido,
  obligado,
  pagado,
});
const rubros = (f: Etapas, d: Etapas, i: Etapas): Rubro[] => [
  { clave: 'funcionamiento', etapas: f },
  { clave: 'deuda', etapas: d },
  { clave: 'inversion', etapas: i },
];

const fuenteCuipo = {
  id: '4f7r-epif',
  nombre: 'CUIPO – Ejecución de gastos',
  entidad: 'Contaduría General de la Nación (CUIPO)',
  url: 'https://www.datos.gov.co/d/4f7r-epif',
  licencia: 'Por confirmar',
  fechaCorte: '2026-06-30',
  usadoPara: 'gastoPublico',
} as const;
const fuenteSecop = {
  id: 'jbjy-vk9h',
  nombre: 'SECOP II – Contratos',
  entidad: 'Colombia Compra Eficiente',
  url: 'https://www.datos.gov.co/d/jbjy-vk9h',
  licencia: 'Por confirmar',
  fechaCorte: '2026-11-07',
  usadoPara: 'contratado',
} as const;

const anios = [2021, 2022, 2023, 2024, 2025, 2026];

/** San Benito Abad (Sucre), 2025: real figures of the CUIPO cut of 2026-06-30 (data.md). Pesos. */
export const sanBenito: ResumenMunicipalDatos = {
  corte: '2026-11',
  codigo: '70678',
  nombre: 'San Benito Abad',
  anio: 2025,
  anios,
  gastoPublico: {
    periodo: '2025-12',
    alcance: 'municipio',
    completo: true,
    recibido: 70_684_311_036,
    rubros: rubros(
      e(4_422_000_000, 4_029_000_000, 4_029_000_000),
      e(5_688_000_000, 5_688_000_000, 5_688_000_000),
      e(60_910_091_593, 54_277_088_886, 53_083_572_451),
    ),
    total: e(71_020_091_593, 63_994_088_886, 62_800_572_451),
    reservas: {
      rubros: rubros(
        e(120_000_000, 120_000_000, 120_000_000),
        e(0, 0, 0),
        e(267_520_595, 258_360_073, 258_360_073),
      ),
      total: e(387_520_595, 378_360_073, 378_360_073),
    },
    cuentasPorPagar: {
      rubros: rubros(
        e(211_512_566, 211_512_566, 188_704_628),
        e(100_000_000, 100_000_000, 100_000_000),
        e(1_000_000_000, 1_000_000_000, 500_000_000),
      ),
      total: e(1_311_512_566, 1_311_512_566, 788_704_628),
    },
  },
  contratado: { valor: 48_300_000_000, contratos: 212 },
  fuentes: [fuenteCuipo, fuenteSecop],
};

const sinGasto = { gastoPublico: null } as const;

/** 2022 has SECOP but no CUIPO: the balance says «sin información», the contracts stay. */
export const anioSinCuipo: ResumenMunicipalDatos = {
  ...sanBenito,
  anio: 2022,
  ...sinGasto,
  contratado: { valor: 31_900_000_000, contratos: 167 },
  fuentes: [fuenteSecop],
};

/** The running year: accumulated to the last quarter published, not a closed year. */
export const anioEnCurso: ResumenMunicipalDatos = {
  ...sanBenito,
  anio: 2026,
  gastoPublico: {
    periodo: '2026-06',
    alcance: 'municipio',
    completo: false,
    recibido: 41_200_000_000,
    rubros: rubros(
      e(2_100_000_000, 1_500_000_000, 1_300_000_000),
      e(2_400_000_000, 2_400_000_000, 2_400_000_000),
      e(38_300_000_000, 17_000_000_000, 9_900_000_000),
    ),
    total: e(42_800_000_000, 20_900_000_000, 13_600_000_000),
    reservas: null,
    cuentasPorPagar: {
      rubros: rubros(
        e(300_000_000, 300_000_000, 250_000_000),
        e(0, 0, 0),
        e(900_000_000, 900_000_000, 400_000_000),
      ),
      total: e(1_200_000_000, 1_200_000_000, 650_000_000),
    },
  },
  contratado: { valor: 9_100_000_000, contratos: 58 },
};

/** The source's own inconsistency: paid above owed (1 municipality in 2025). Shown as is. */
export const pagadoMayorQueObligado: ResumenMunicipalDatos = {
  ...sanBenito,
  gastoPublico: {
    ...(sanBenito.gastoPublico as NonNullable<ResumenMunicipalDatos['gastoPublico']>),
    total: e(71_020_091_593, 60_000_000_000, 62_800_572_451),
  },
};

/** No report at all in the year: «sin información», never zeros. */
export const sinNingunDato: ResumenMunicipalDatos = {
  ...sanBenito,
  nombre: 'Busbanzá',
  codigo: '15106',
  gastoPublico: null,
  contratado: null,
  fuentes: [],
};

/** The department-island: San Andrés, Providencia y Santa Catalina as one entity. */
export const sanAndres: ResumenMunicipalDatos = {
  ...sanBenito,
  nombre: 'San Andrés',
  codigo: '88001',
  gastoPublico: {
    ...(sanBenito.gastoPublico as NonNullable<ResumenMunicipalDatos['gastoPublico']>),
    alcance: 'departamento-isla',
  },
};

/** The biggest figures: «$11,0 billones» and the longest DIVIPOLA name must not overflow at 320 px. */
export const medellin: ResumenMunicipalDatos = {
  ...sanBenito,
  nombre: 'Medellín',
  codigo: '05001',
  gastoPublico: {
    periodo: '2025-12',
    alcance: 'municipio',
    completo: true,
    recibido: 10_400_000_000_000,
    rubros: rubros(
      e(1_200_000_000_000, 1_150_000_000_000, 1_100_000_000_000),
      e(626_000_000_000, 626_000_000_000, 626_000_000_000),
      e(9_200_000_000_000, 8_300_000_000_000, 7_900_000_000_000),
    ),
    total: e(11_026_000_000_000, 10_076_000_000_000, 9_626_000_000_000),
    reservas: null,
    cuentasPorPagar: null,
  },
  contratado: { valor: 3_100_000_000_000, contratos: 9_840 },
};
