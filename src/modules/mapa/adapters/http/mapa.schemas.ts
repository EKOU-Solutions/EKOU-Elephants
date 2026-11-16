// Public response shapes of the map API, owned by the HTTP adapter. The domain stays plain
// TypeScript and knows nothing about them. They document the body in OpenAPI (describeRoute +
// resolver); each route sends its body through `responder` (typecheck: no documented field
// missing) and the contract tests validate the real body against them (`.strict()`: no
// undocumented field). A response may add complementary data to the domain (docs/api.md).
import { z } from 'zod';
const corteId = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .meta({ description: 'Corte mensual, `AAAA-MM`.', example: '2026-11' });

const ventana = z
  .object({
    desde: z.number().int().meta({ example: 2021 }),
    hasta: z.number().int().meta({ example: 2026 }),
  })
  .strict()
  .meta({
    ref: 'Ventana',
    description: 'Años de firma que se cuentan, ambos incluidos.',
  });

const codigoDepartamento = z
  .string()
  .regex(/^\d{2}$/)
  .meta({ description: 'Código DIVIPOLA del departamento (2 dígitos).', example: '05' });

const isoDepartamento = z
  .string()
  .regex(/^CO-[A-Z]{2,3}$/)
  .meta({ description: 'Código ISO 3166-2:CO del departamento.', example: 'CO-ANT' });

const conteo = z.number().int().nonnegative();

const fuente = z
  .object({
    id: z.string().meta({ description: 'Id del conjunto de datos.', example: 'jbjy-vk9h' }),
    nombre: z.string().meta({ example: 'SECOP II – Contratos' }),
    entidad: z.string().meta({ example: 'Colombia Compra Eficiente' }),
    url: z.url().meta({ example: 'https://www.datos.gov.co/d/jbjy-vk9h' }),
    licencia: z.string().meta({ example: 'CC BY-SA 4.0' }),
  })
  .strict()
  .meta({ ref: 'Fuente', description: 'Fuente de datos abiertos del corte.' });

export const esquemaCorteVigente = z
  .object({
    corte: corteId,
    fechaCorte: z.iso.date().meta({
      description: 'Fecha hasta la que llegan los datos (hora de Colombia).',
      example: '2026-11-07',
    }),
    publicadoEn: z.iso.datetime().meta({
      description: 'Fecha y hora (UTC) en que el pipeline publicó el corte.',
      example: '2026-11-15T17:43:18Z',
    }),
    geometria: z.string().meta({
      description:
        'Versión de la geometría. La app la sirve como archivo estático en `/geometria/<versión>.topojson`.',
      example: 'mgn-2025',
    }),
    fuentes: z.array(fuente),
  })
  .strict()
  .meta({ ref: 'CorteVigente', description: 'Corte mensual vigente y sus fuentes.' });

const municipio = {
  codigo: z
    .string()
    .regex(/^\d{5}$/)
    .meta({ description: 'Código DIVIPOLA de 5 dígitos, con su cero inicial.', example: '05001' }),
  nombre: z.string().meta({ example: 'Medellín' }),
  tipo: z.enum(['municipio', 'area_no_municipalizada', 'isla']),
  departamento: z
    .object({
      codigo: codigoDepartamento,
      iso: isoDepartamento,
      nombre: z.string().meta({ example: 'Antioquia' }),
    })
    .strict(),
  contratosUbicados: conteo.positive().nullable().meta({
    description:
      'Contratos ubicados en el municipio dentro de la ventana. `null` significa «Sin datos» (ninguno ubicado), nunca 0.',
    example: 356935,
  }),
};

const municipioDelMapa = z.object(municipio).strict().meta({ ref: 'MunicipioDelMapa' });

export const esquemaMunicipiosDelCorte = z
  .object({ corte: corteId, ventana, municipios: z.array(municipioDelMapa) })
  .strict()
  .meta({ ref: 'MunicipiosDelCorte', description: 'Municipios del corte vigente.' });

export const esquemaMunicipioSeleccionado = z
  .object({ corte: corteId, ventana, ...municipio })
  .strict()
  .meta({
    ref: 'MunicipioSeleccionado',
    description: 'Un municipio del corte vigente, con el corte y la ventana a los que pertenece.',
  });

export const esquemaDepartamentosDelCorte = z
  .object({
    corte: corteId,
    ventana,
    nacional: z
      .object({
        contratos: conteo,
        contratosEnMunicipios: conteo.meta({ description: 'Ubicados en un municipio.' }),
        contratosSoloDepartamento: conteo.meta({
          description:
            'Ubicados solo en un departamento: gobernaciones, varios municipios o sede incierta.',
        }),
        contratosSinLugar: conteo.meta({ description: 'Sin municipio ni departamento.' }),
      })
      .strict()
      .meta({
        ref: 'TotalNacional',
        description:
          'Cada contrato de la ventana cae en un solo nivel: `contratos` es la suma de los otros tres.',
      }),
    departamentos: z.array(
      z
        .object({
          codigo: codigoDepartamento,
          iso: isoDepartamento,
          nombre: z.string().meta({ example: 'Antioquia' }),
          contratosEnMunicipios: conteo.meta({
            description:
              'Suma de `contratosUbicados` de sus municipios. Es una medición: 0 es un cero real.',
          }),
          contratosSoloDepartamento: conteo,
        })
        .strict()
        .meta({ ref: 'DepartamentoDelMapa' }),
    ),
  })
  .strict()
  .meta({
    ref: 'DepartamentosDelCorte',
    description: 'Departamentos del corte vigente con sus agregados y el total nacional.',
  });

const centavos = z.number().int().nonnegative();

export const esquemaResumenTerritorial = z
  .object({
    codigo: z
      .string()
      .regex(/^(\d{2}|\d{5})$/)
      .meta({
        description: 'Código DIVIPOLA: 2 dígitos (departamento) o 5 (municipio).',
        example: '05',
      }),
    nombre: z.string().meta({ example: 'Antioquia' }),
    presupuestoAsignadoCentavos: centavos.meta({
      description: 'Presupuesto asignado, en centavos de peso colombiano.',
      example: 100050,
    }),
    gastoActualCentavos: centavos.meta({
      description: 'Gasto actual, en centavos de peso colombiano.',
      example: 40000,
    }),
    totalObras: conteo.meta({ example: 10 }),
    obrasConRetraso: conteo.meta({ example: 2 }),
  })
  .strict()
  .meta({
    ref: 'ResumenTerritorial',
    description: 'Ejemplo del arquetipo con cifras ficticias (docs/arquitectura.md).',
  });
