# API: arquitectura y documentación

> Lo propio de la API: qué expone, sus convenciones, cómo valida, sus errores y cómo se documenta. La organización del back (Worker, módulos, puertos y adaptadores) está en [arquitectura](arquitectura.md); el paso a paso para crear una ruta, en [la guía](how-to/crear-una-api.md). Despliegue: [CI/CD](ci-cd.md)

## En 30 segundos

La API es REST, de solo lectura y responde JSON desde `/api/*` del Worker de la app ([arquitectura](arquitectura.md#en-30-segundos)). Cada ruta valida lo que entra, lo que lee y lo que responde.

La documentación **no se escribe a mano**: se genera de las rutas registradas en Hono y el mismo Worker la publica en tres formatos, uno para cada lector.

```mermaid
flowchart LR
    PER["👥 Personas"]
    AGE["🤖 Agentes de IA"]
    HER["🧰 Herramientas"]

    subgraph WORKER["⚙️ Worker ekou-elephants · Hono"]
        direction TB
        RUTAS["/api/salud<br/>/api/mapa/*"]
        DOCS["/api/docs · Scalar<br/>/api/llms.txt · Markdown<br/>/api/openapi.json · OpenAPI 3.1"]
    end

    DATOS[("📦 Worker de datos<br/>ekou-elephants-datos<br/>corte mensual en JSON")]
    PG[("🐘 PostgreSQL · Neon<br/>ejemplo del arquetipo")]

    PER --> DOCS
    AGE --> DOCS
    HER --> DOCS
    PER -->|"app React"| RUTAS
    RUTAS -->|"service binding DATOS"| DATOS
    RUTAS -->|"SQL parametrizado"| PG
```

## Qué expone

Cada ruta es el adaptador HTTP de un módulo y sigue el patrón de [puertos y adaptadores](arquitectura.md#puertos-y-adaptadores); el ejemplo de punta a punta está en [arquitectura](arquitectura.md#ejemplo-consultar-un-resumen-territorial).

### De dónde sale cada respuesta

| Ruta | Origen | Sin datos |
| --- | --- | --- |
| `GET /api/salud` | El Worker mismo | — |
| `GET /api/mapa/corte`, `/municipios`, `/municipios/{codigo}`, `/departamentos` | Worker de datos `ekou-elephants-datos`: `datos/latest.json` apunta al corte vigente (`datos/AAAA-MM/`) | `503 corte_no_disponible` (por ejemplo, sin el binding `DATOS`, ver [CI/CD](ci-cd.md)) |
| `GET /api/mapa/territorios/{codigo}/resumen` | PostgreSQL: ejemplo ficticio del arquetipo ([alcance](arquitectura.md#alcance-del-ejemplo-y-refinamiento-del-mapa)) | `404 territorio_no_encontrado` |

### Convenciones

- **Rutas:** `/api/<modulo>/<recurso>`, solo `GET`. Un módulo monta sus rutas con `app.route('/api/<modulo>', …)`.
- **Campos:** los actuales están en español y en camelCase (`presupuestoAsignadoCentavos`), según el [contrato del mapa](design/pages/map/contract.md). El idioma de los campos nuevos sigue la regla de idioma de `AGENTS.md`.
- **Identificadores:** códigos DIVIPOLA como texto, con su cero inicial: departamento de 2 dígitos (`"05"`), municipio de 5 (`"05001"`).
- **Dinero:** enteros en centavos, nunca decimales de punto flotante ([importes](arquitectura.md#importes-exactitud-y-rechazo-de-datos-incorrectos)).
- **Fechas:** ISO 8601. El corte se identifica como `AAAA-MM`.
- **Caché:** las rutas del corte responden `Cache-Control: public, max-age=300, stale-while-revalidate=86400`, porque los datos cambian una vez al mes.
- **Seguridad y registros:** `secureHeaders()` en todas las respuestas. Los errores se registran sin mensaje ni traza, para no filtrar datos de conexión.

### Errores

Todo error responde JSON con la forma `{ "error": "<código>" }`. El código es estable y es lo que deben leer los clientes; el texto para las personas lo pone la interfaz.

| Estado | Código | Cuándo |
| --- | --- | --- |
| 400 | `codigo_invalido` | El código DIVIPOLA no tiene el formato esperado. |
| 404 | `territorio_no_encontrado` | No existe el territorio del resumen. |
| 404 | `municipio_no_encontrado` | El municipio no está en el corte vigente. |
| 404 | `no_encontrado` | La ruta no existe. |
| 503 | `corte_no_disponible` | No hay corte publicado o sus archivos no son coherentes. |
| 500 | `error_interno` | Error inesperado. |

Los errores de negocio son clases del dominio; `app.onError` (`src/server/app.ts`) es el único lugar que los traduce a estado y código. Cada ruta documenta los suyos en `describeRoute`.

## Validación

Una ruta valida en tres momentos. Cada uno tiene su herramienta y su forma de fallar:

| Momento | Qué se valida | Con qué | Si falla |
| --- | --- | --- | --- |
| **Entrada** | Parámetros, consulta o body de la petición | `validator` de `hono-openapi` con un esquema zod, en la ruta | `400` con su código, sin llegar al caso de uso |
| **Datos de la fuente** | Lo que lee el adaptador de salida | Esquemas zod en el adaptador del Worker de datos; conversiones estrictas en PostgreSQL ([importes](arquitectura.md#importes-exactitud-y-rechazo-de-datos-incorrectos)) | `503 corte_no_disponible` o `500`: nunca se responde un dato a medias |
| **Salida** | El body que responde la ruta | El esquema de respuesta: `responder(c, esquema, valor)` al compilar y las pruebas de contrato al probar | El typecheck falla si falta un campo documentado; la prueba de contrato falla si sale uno no documentado («Unrecognized key») |

La salida no se valida en ejecución: lo garantizan el typecheck y las pruebas, sin costo por petición.

**Regla del body:** la respuesta incluye como mínimo el tipo del dominio y puede agregar datos complementarios, siempre documentados en su esquema. Un dato del dominio que no deba salir se traduce en el adaptador.

## Cómo documentamos la API

### El principio: el código es la fuente

Cada ruta se documenta junto a su código, y de ahí se generan los documentos. Se versionan en el repositorio y una prueba falla si quedan desactualizados. Así la documentación no puede contradecir lo que está desplegado.

| Ruta | Para quién | Contenido |
| --- | --- | --- |
| `/api/docs` | Personas | Interfaz de Scalar que lee `/api/openapi.json`: rutas, parámetros, el body de cada respuesta, errores y un cliente para probarlas. |
| `/api/llms.txt` | Agentes de IA | El mismo OpenAPI en Markdown (`@scalar/openapi-to-markdown`), fácil de leer en un contexto de modelo. |
| `/api/openapi.json` | Herramientas | OpenAPI 3.1 generado con `hono-openapi`: clientes, validadores, importar en Postman o Insomnia. |

Cada preview de PR y producción las publican, así que se puede revisar la API de un PR en `<URL del preview>/api/docs`.

### Las piezas de una ruta documentada

```ts
// src/modules/mapa/adapters/http/mapa.routes.ts
.get(
  '/municipios/:codigo',
  describeRoute({                                   // 1. documentación de la ruta
    summary: 'Detalle de un municipio',
    tags: ['Mapa'],
    responses: {
      200: json('Municipio seleccionado.', esquemaMunicipioSeleccionado),
      404: json('El municipio no está en el corte vigente.', esquemaError('municipio_no_encontrado')),
    },
  }),
  validator('param', municipioParams, (r, c) => {   // 2. revisa y documenta los parámetros
    if (!r.success) return c.json({ error: 'codigo_invalido' }, 400);
  }),
  async (c) => {
    const municipio = await casos.obtenerMunicipio(c.req.valid('param').codigo);
    return responder(c, esquemaMunicipioSeleccionado, municipio);   // 3. responde con su esquema
  },
)
```

| Pieza | Dónde | Qué hace |
| --- | --- | --- |
| Esquemas de respuesta | `adapters/http/<modulo>.schemas.ts` | Describen con zod el body público de cada respuesta, `.strict()`, con descripciones y ejemplos en español (`.meta`). Son del adaptador HTTP: el dominio no los conoce. |
| `describeRoute` | En cada ruta | Resumen, descripción, etiqueta y el body de cada respuesta (200 y errores) con `json(descripción, esquema)`. |
| `validator` de `hono-openapi` | En cada ruta con parámetros, consulta o body | Valida la entrada ([validación](#validación)) y además la documenta (tipo y patrón). |
| `responder(c, esquema, valor)`, `json(descripción, esquema)`, `esquemaError(código)` | `src/server/http/respuestas.ts` | Compartidos por todos los módulos. `json` y `esquemaError` describen una respuesta en `describeRoute`; `responder` envía el body atado a su esquema ([validación](#validación)). |

### Cómo se genera

```mermaid
flowchart LR
    R["Rutas Hono<br/>describeRoute · validator"] --> G["hono-openapi<br/>generateSpecs"]
    G --> J["src/server/docs/openapi.json"]
    J --> M["@scalar/openapi-to-markdown"] --> L["src/server/docs/llms.txt"]
    J & L -->|"importados como archivos"| W["Worker: /api/openapi.json<br/>/api/llms.txt · /api/docs"]
    J & L -.->|"docs.test.ts compara"| T["✅ pruebas"]
```

- `npm run docs:api` (`scripts/generar-docs-api.mjs`) carga `src/server/docs/openapi.ts` con Vite, construye la app real sin base de datos y escribe `src/server/docs/openapi.json` y `src/server/docs/llms.txt`. `npm run build` lo ejecuta antes de `vite build`.
- El Worker (`src/server/docs/index.ts`) importa esos archivos como JSON y texto. No se sirven como assets estáticos porque `run_worker_first: ["/api/*"]` envía todo `/api/*` al Worker.
- Los dos archivos **se versionan**: las pruebas, el typecheck y `npm run dev` los necesitan antes de cualquier build, y el diff del PR muestra cómo cambia el contrato público.
- **Peso:** `describeRoute`, `validator` y los esquemas viajan en el Worker (~190 kB gzip en total, frente a ~101 kB sin ellos). Lo aceptamos a propósito: la documentación queda pegada a la ruta, que es más fácil de leer y mantener. El generador de Markdown sigue fuera del bundle. El límite de Cloudflare es 3 MB gzip.

### Qué mantiene la documentación al día

`src/server/docs/docs.test.ts` falla si:

- `openapi.json` o `llms.txt` no coinciden con lo que se genera de las rutas actuales;
- una ruta no tiene resumen, etiqueta o el body JSON de alguna de sus respuestas;
- el OpenAPI documenta más o menos rutas `GET` de las que tiene la app, o incluye las rutas de documentación;
- `/api/openapi.json`, `/api/llms.txt` o `/api/docs` dejan de responder lo esperado.

### Contrato de página y OpenAPI

Son dos documentos con papeles distintos:

| | Contrato de página | OpenAPI |
| --- | --- | --- |
| Dónde | `docs/design/pages/<pagina>/contract.md` | `/api/openapi.json` (generado) |
| Cuándo | **Antes** de implementar: lo exige el paso 0 de la ruta *Construir una página* de `elephants-design` | **Después**: describe lo que está desplegado |
| Qué dice | Campos, tipos, nulos, unidades, fase y origen de cada dato | Rutas, parámetros, respuestas y errores |
| Quién lo cambia | El equipo, con aprobación | Nadie a mano: sale del código |

El contrato de página es la especificación; el código la implementa (tipos del dominio y esquemas zod), y el OpenAPI refleja el código.

## Para agentes de IA

- Para conocer la API, lee `/api/llms.txt` del entorno o `src/server/docs/llms.txt` en el repositorio. Para generar un cliente, usa `/api/openapi.json`.
- No edites `openapi.json` ni `llms.txt` a mano: cambia la ruta (su `describeRoute` o su esquema) y ejecuta `npm run docs:api`.
- El significado de cada campo está en su descripción dentro del OpenAPI. El contrato de la página explica de dónde sale cada dato.

## Limitaciones

- Las reglas que cruzan campos (por ejemplo, que el total nacional sea la suma de sus niveles) no se pueden expresar en JSON Schema: se explican en la descripción del campo.
- La interfaz de `/api/docs` carga el script de Scalar desde su CDN (jsDelivr).
