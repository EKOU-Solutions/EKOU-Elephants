# Detalle de contrato · Contrato de la API

> Página: Detalle de contrato (TASK-12, [#19](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/19), Corte 4) · Estado: **Aprobado el 2026-11-17** (Jouler, con las decisiones de abajo) · Revisado: 2026-11-17 contra `main` @ `7a4818d`

El paso 0 de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md) no encontró contrato: la API no tiene ninguna ruta de contratos. Este documento lo propone. Los datos reales que lo sustentan están en [data.md](data.md).

## Alcance

Solo TASK-12: mostrar un contrato por su identificador, con el enlace a su registro en SECOP, aplicando los criterios de datos personales de TASK-08. Quedan fuera la lista de contratos del municipio (TASK-11), las señales (TASK-13) y la lista de adiciones y suspensiones con fecha y motivo (fase 2).

## Camino de los datos

```
SECOP I y II → pipeline (silver `contratos`) → gold `contrato_detalle` → export → Worker de datos → nuestra API → pantalla
```

- La API lee archivos JSON del Worker de datos por un puerto de salida, igual que el mapa. No usa PostgreSQL.
- **Qué contratos tienen detalle:** los de la ventana del mapa (2021–2026) con municipio de ejecución confiable. Son 6,78 M, los mismos que cuenta `contratosUbicados`.
- El Worker de datos admite 20.000 archivos por versión y 25 MiB por archivo (plan gratuito, [límites de Workers](https://developers.cloudflare.com/workers/platform/limits/), consultado el 2026-11-17). No cabe un archivo por contrato: los contratos se publican en **grupos**, y la API abre un solo grupo por consulta.

## Decisiones (Jouler, 2026-11-17)

| # | Decisión | Qué se decidió |
| --- | --- | --- |
| 1 | Dónde se guardan los 6,78 M de contratos | **Worker de datos, en grupos** (opción A). Se mide el peso real antes de publicar |
| 2 | Idioma de la API | **Inglés**: rutas, campos y códigos de error. Los nombres de las rutas podrían pasar a español más adelante. Comentarios explicativos en español solo si de verdad hacen falta |
| 3 | Adiciones y suspensiones | **Solo el resumen** que ya trae silver, mientras no exista el detalle. La lista con fecha y motivo es de fase 2 |
| 4 | Retraso (`retraso_dias`) | **No va en el detalle.** Es una alerta: entra por el flujo de señales y patrones (TASK-13) |
| 5 | Orden con TASK-11 | El detalle se entrega con su **URL propia** y el enlace queda listo. El criterio «se abre desde la lista» se cierra cuando TASK-11 exista |

### Decisión 1: opciones que se compararon

| Opción | Costo | Cabe hoy | Contra |
| --- | --- | --- | --- |
| **A. Worker de datos, en grupos** (recomendada) | $ 0, sin tarjeta | Sí: 16.384 grupos de unos 480 kB | Hay que cambiar `corte-mensual.yml` (lo hace una persona). Peso medido el 2026-11-18: 7,9 GB; falta probar la publicación en Cloudflare |
| B. Cloudflare R2 | Gratis hasta un tope, con tarjeta | Sí | El equipo ya lo descartó por exigir tarjeta (`docs/ci-cd.md`) |
| C. Neon PostgreSQL | Gratis hasta 1 GB por proyecto | No: se necesitan unos 8 GB | Habría que pagar o reducir la ventana a un año |
| D. Cloudflare D1 | Gratis hasta 500 MB por base | No | El plan gratuito escribe 100.000 filas al día: cargar el corte tomaría meses |
| E. Consultar datos.gov.co en cada visita | $ 0 | — | Rompe el ADR 0002: la app dependería de la fuente y perdería las reglas de silver y la seudonimización |

Límites de Neon y D1 consultados el 2026-11-17 en [neon.com/docs/introduction/plans](https://neon.com/docs/introduction/plans), [D1: límites](https://developers.cloudflare.com/d1/platform/limits/) y [D1: precios](https://developers.cloudflare.com/d1/platform/pricing/).

Si la opción A falla por peso o por tiempo de publicación, la salida es acortar la ventana del detalle (2025–2026 son 2,2 M de contratos) y enlazar a SECOP los más antiguos.

## Convenciones

| Tema | Regla |
| --- | --- |
| Nombres de campos | Inglés, camelCase (decisión 2) |
| Identificador | El `id_contrato` de SECOP, sin transformar |
| Dinero | Centavos de peso, entero exacto (`…Cents`), como en la API actual |
| Fechas | ISO 8601 (`"2025-06-09"`) |
| Municipio y departamento | Código DIVIPOLA como texto, con su cero inicial |
| Dato faltante | `null`, nunca `0`. La interfaz muestra «Sin datos» |
| Errores | `{ "error": "<código>" }` con un código estable |

## Endpoint

### `GET /api/contracts/:id`

`id` cumple `^(CO\d{1,3}\.PCCNTR\.\d{1,12}|\d{1,12}(-\d{1,12}){3})$` y tiene 40 caracteres como máximo.

| Estado | Cuerpo | Cuándo |
| --- | --- | --- |
| 200 | `ContractDetail` | El contrato está en el corte vigente |
| 400 | `{ "error": "invalid_contract_id" }` | El id no cumple el patrón. No se consultan los datos |
| 404 | `{ "error": "contract_not_found" }` | El id es válido y no está en el corte vigente |
| 503 | `{ "error": "corte_no_disponible" }` | No hay corte publicado o un archivo no cumple el esquema (código que ya existe) |

Caché: `public, max-age=300, stale-while-revalidate=86400`, como el mapa.

```ts
interface ContractDetail {
  cut: string;                    // "2026-11"
  id: string;                     // "CO1.PCCNTR.7954915"
  source: 'secop_i' | 'secop_ii';
  sourceUrl: string | null;       // registro del proceso en SECOP
  description: string | null;     // objeto del contrato, tal como viene
  type: string | null;            // "Obra", "Prestación de servicios"
  isPublicWorks: boolean;
  procurementMethod: string | null;
  methodJustification: string | null;
  status: ContractStatus;
  sourceStatus: string | null;    // estado tal como lo escribe SECOP
  provisional: boolean;           // firmado hace poco: SECOP puede no haberlo cargado completo
  buyer: { name: string; taxId: string | null };
  supplier: Supplier;
  location: {
    municipality: { code: string; name: string };
    department: { code: string; name: string };
  };
  dates: {
    signed: string;
    start: string | null;
    end: string | null;           // fecha vigente, con prórrogas
    addedDays: number | null;     // null si no se reportan días adicionados
  };
  amounts: {
    currentCents: number | null;  // valor actual, con adiciones
    initialCents: number | null;  // valor al firmar
    changePct: number | null;     // 0.21 = 21 % más que al firmar; negativo si bajó; null si no se puede calcular
    exceedsLegalAdditionLimit: boolean; // subió más del 50 % (Ley 80, art. 40)
    reliable: boolean;            // false: el valor trae una alerta de magnitud
    paidCents: number | null;     // null = pago no reportado; nunca 0 por defecto
  };
}

type ContractStatus =
  | 'not_started' | 'active' | 'suspended' | 'finished' | 'expired_unclosed';

type Supplier =
  | { kind: 'company'; name: string; taxId: string | null }
  | { kind: 'natural_person' }    // TASK-08: sin nombre, sin documento, sin seudónimo
  | { kind: 'unknown' };          // SECOP no trae el documento
```

### Ejemplo (contrato real del corte 2026-11)

```json
{
  "cut": "2026-11",
  "id": "CO1.PCCNTR.7954915",
  "source": "secop_ii",
  "sourceUrl": "https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.8249008&isFromPublicArea=True&isModal=true&asPopupView=true",
  "description": "Aunar esfuerzos administrativos; técnicos y financieros entre el MUNICIPIO DE PASTO y JUNTA DE ACCIÓN COMUNAL DE LA VEREDA MOJONDINOY para la ejecución del mantenimiento rutinario de las vías rurales del Corregimiento de El Encano…",
  "type": "Obra",
  "isPublicWorks": true,
  "procurementMethod": "Contratación directa",
  "methodJustification": "Convenios Solidarios Regimen articulo 92 Ley 2166 de 2021",
  "status": "expired_unclosed",
  "sourceStatus": "Modificado",
  "provisional": false,
  "buyer": { "name": "ALCALDIA DE PASTO", "taxId": "891280000" },
  "supplier": { "kind": "company", "name": "JAC Mojondinoy", "taxId": "800167184" },
  "location": {
    "municipality": { "code": "52001", "name": "Pasto" },
    "department": { "code": "52", "name": "Nariño" }
  },
  "dates": { "signed": "2025-06-09", "start": "2025-07-09", "end": "2026-09-30", "addedDays": 273 },
  "amounts": {
    "currentCents": 6781538313,
    "initialCents": 5609556600,
    "changePct": 0.2089,
    "exceedsLegalAdditionLimit": false,
    "reliable": true,
    "paidCents": null
  }
}
```

La fuente y la fecha del corte que muestra la pantalla salen de `GET /api/mapa/corte`, que ya existe.

## Campos: origen y fase

| Campo | Origen (silver `contratos`) | Conjunto de datos | Fase |
| --- | --- | --- | --- |
| `id`, `source`, `sourceUrl` | `id_contrato`, `fuente`, `url_proceso` | `jbjy-vk9h`, `f789-7hwg` | MVP |
| `description`, `type`, `isPublicWorks` | `objeto`, `tipo_contrato`, `es_obra` | Los mismos | MVP |
| `procurementMethod`, `methodJustification` | `modalidad`, `justificacion_modalidad` | Los mismos | MVP |
| `status`, `sourceStatus`, `provisional` | `estado_ejecucion` (calculado, regla S07), `estado_origen`, `mes_provisional` (S14) | Los mismos | MVP |
| `buyer` | `nombre_entidad`, `nit_entidad` | Los mismos | MVP |
| `supplier` | `tipo_persona_contratista`, `nombre_contratista`, `contratista_id` (calculado, regla S12 y TASK-08) | Los mismos | MVP |
| `location` | `cod_mpio_ejecucion` (calculado, regla S08) y nombres de DIVIPOLA | `gra4-pcp2`, `gdxc-w37w` | MVP |
| `dates` | `fecha_firma`, `fecha_inicio`, `fecha_fin`, `dias_adicionados` | `jbjy-vk9h`, `f789-7hwg` | MVP |
| `amounts` | `valor_actual`, `valor_inicial` (SECOP II: del proceso, `p6dx-8zbt`), `pct_sobrecosto`, `adicion_supera_50pct`, `valor_confiable`, `valor_pagado` con `pago_reportado` | Los mismos | MVP |
| Retraso | `retraso_dias` | Calculado | TASK-13 (decisión 4) |
| Competencia (invitados, respuestas) | `proveedores_invitados`, `respuestas_al_proceso` | `p6dx-8zbt` | TASK-13 |
| Lista de adiciones y suspensiones | — | `cb9c-h8sn`, `u99c-7mfm` | Fase 2 |
| Señales | — | Calculado (TASK-07) | TASK-13 |

## Datos personales (TASK-08)

Se aplica [`docs/datos-personales.md`](https://github.com/EKOU-Solutions/EKOU-Elephants/pull/27) (PR #27, todavía en revisión), con su criterio más conservador:

- Persona natural: la API responde solo `{ "kind": "natural_person" }`. No salen el nombre, el documento ni el seudónimo `k1_…`.
- Persona jurídica, consorcio o unión temporal: razón social y NIT.
- Entidad pública: nombre y NIT. No hay nombres de servidores públicos en silver.
- `description` se publica como viene de SECOP.
- Una prueba del pipeline falla si un contrato con persona natural lleva nombre o documento en el archivo publicado.

## Ajustes al implementar (2026-11-18)

Cambios pequeños que salieron de los datos reales; no cambian las decisiones:

- `increasePct` pasó a llamarse `changePct`: más de 100.000 contratos bajaron de valor, así que el cambio puede ser negativo.
- `description` puede ser `null` (un contrato del corte no trae objeto) y `dates.signed` nunca lo es.
- `status` tiene cinco valores. Los contratos cancelados o anteriores a la firma no entran al mapa ni tienen detalle.
- Un valor que no cabe como entero exacto (8 contratos con errores de magnitud) sale como `null` y con `reliable: false`.

## Archivos publicados

`datos/<corte>/contratos/<grupo>.ndjson`: 16.384 archivos por corte, cada uno con unos 410 contratos, uno por línea, con la forma `ContractDetail` sin `cut`.

- **Grupo:** los primeros 16 bits del SHA-256 del `id`, llevados a 16.384 grupos, en hexadecimal de cuatro cifras (`CO1.PCCNTR.7954915` → `2f08`). La regla está en `pipeline/src/ekou_pipeline/contracts.py` y en `src/modules/contracts/adapters/data-worker/`; una prueba en cada lado fija los mismos valores.
- **Línea:** empieza siempre por `{"id":"<id>",`. La API busca esa línea como texto y solo analiza esa, para no gastar CPU en el archivo entero.
- **Medido con el corte 2026-11 (2026-11-18):** 6.778.189 contratos, 7,9 GB en total, 480 kB por archivo en promedio. El export tarda 1,5 minutos y el empaquetado otro tanto.
- **Release:** los grupos viajan en cuatro archivos `contratos-<n>.tar.gz` de 300 MB cada uno (`ekou-pipeline export-contracts --pack`), porque el Release solo admite archivos sueltos.
- **Solo el corte vigente** lleva contratos en el Worker de datos: dos cortes pasarían el límite de 20.000 archivos.

No comprobado: que Cloudflare acepte 7,9 GB en un Worker de archivos estáticos del plan gratuito, y cuánto tarda en subirlos. Su documentación no fija un límite de peso total. Probarlo exige desplegar en la cuenta de EKOU.
