# Crear una API

Paso a paso para agregar una ruta nueva a la API, o cambiar una existente, siguiendo nuestros estándares. Úsala como lista de chequeo: el porqué de cada paso está en [arquitectura](../arquitectura.md) y en [API: arquitectura y documentación](../api.md).

Ejemplo de referencia en el código: `GET /api/mapa/municipios/{codigo}`, del módulo `mapa`.

## 0. Antes de escribir código

- [ ] **¿Una pantalla va a usar la ruta?** Entonces su contrato de página debe existir y estar aprobado en `docs/design/pages/<pagina>/contract.md`: campos, tipos, nulos, unidades y origen de cada dato. Lo exige el paso 0 de la ruta *Construir una página* de la skill `elephants-design` ([contrato de página y OpenAPI](../api.md#contrato-de-página-y-openapi)).
- [ ] **¿En qué módulo vive?** En el módulo dueño de esa capacidad, dentro de `src/modules/<modulo>/`. Si es una responsabilidad distinta, crea un módulo nuevo ([módulos verticales](../arquitectura.md#módulos-verticales)).
- [ ] **¿Cómo se llama?** `GET /api/<modulo>/<recurso>`, con las [convenciones](../api.md#convenciones) de campos, identificadores, dinero y fechas.

## 1. El centro: dominio, puerto y caso de uso

- [ ] **Dominio** (`domain/`): los tipos del resultado como interfaces de TypeScript y los errores como clases. Sin Hono, zod ni infraestructura ([reglas de dependencias](../arquitectura.md#reglas-de-dependencias)).
- [ ] **Puerto de salida** (`application/ports/`): el contrato de la información que necesita el caso de uso.
- [ ] **Caso de uso** (`application/`): resuelve la operación usando el puerto. Puede ser una función.
- [ ] **Prueba unitaria** del caso de uso con un puerto en memoria, junto al archivo (`*.test.ts`).

## 2. El adaptador de salida

- [ ] Implementa el puerto en `adapters/<fuente>/`: `worker-datos/` para el corte mensual o `postgres/` para la base ([de dónde sale cada respuesta](../api.md#de-dónde-sale-cada-respuesta)).
- [ ] **Valida lo que llega** de la fuente antes de entregarlo al dominio: con zod en el Worker de datos (un archivo que no cumple su esquema es `503 corte_no_disponible`, nunca un dato a medias) y con conversiones estrictas en PostgreSQL.
- [ ] Si usa PostgreSQL: SQL parametrizado, dinero en centavos exactos ([importes](../arquitectura.md#importes-exactitud-y-rechazo-de-datos-incorrectos)) y una migración si cambia el esquema.

## 3. El esquema de la respuesta

En `adapters/http/<modulo>.schemas.ts` ([las piezas de una ruta documentada](../api.md#las-piezas-de-una-ruta-documentada)):

- [ ] Un esquema zod por cada body de respuesta, con `.strict()`.
- [ ] Incluye **como mínimo todos los campos del tipo del dominio**; puede agregar datos complementarios ([regla del body](../api.md#las-piezas-de-una-ruta-documentada)).
- [ ] Cada campo que no se explica solo lleva `.meta({ description, example })` en español. Explica siempre lo que no es obvio: qué significa `null`, la unidad, el formato.
- [ ] El esquema lleva `.meta({ ref: '<NombreDelTipo>' })` para que aparezca con nombre en `/api/docs`.

## 4. La ruta

En `adapters/http/<modulo>.routes.ts`, en este orden:

- [ ] **`describeRoute`**: `summary` y `description` en español, `tags`, y en `responses` el 200 y **cada error que la ruta puede dar**, todos con `json(descripción, esquema)` de `src/server/http/respuestas.ts`.
- [ ] **`validator` de `hono-openapi`** para los parámetros, la consulta o el body de la petición. Si la entrada no es válida, responde `400` con su código de error.
- [ ] **El manejador** llama al caso de uso y responde con **`responder(c, esquema, valor)`**, nunca con `c.json` directo.
- [ ] `Cache-Control` si los datos lo permiten (por ejemplo, las rutas del corte mensual).
- [ ] Conecta la ruta en `src/server/composition/<modulo>.ts` y, si el módulo es nuevo, móntalo en `src/server/app.ts` con `app.route('/api/<modulo>', …)`.

## 5. Los errores

- [ ] Cada error nuevo es una clase en el dominio del módulo.
- [ ] Tradúcelo a estado y código en `app.onError` (`src/server/app.ts`), con la forma `{ "error": "<código>" }` ([errores](../api.md#errores)).
- [ ] Documéntalo en las `responses` de la ruta con `json(descripción, esquemaError('<código>'))`.
- [ ] No registres datos ni mensajes del error en los logs, solo su nombre o clave.

## 6. Las pruebas

- [ ] **Rutas:** estado, encabezados y cada error (`src/server/<modulo>.test.ts`), con dobles en memoria inyectados en `crearApp(db, datos)`.
- [ ] **Contrato:** agrega la ruta a la tabla de contrato de su archivo de pruebas: la respuesta 200 y cada error, validados contra su esquema. Incluye el caso «Sin datos» si un campo puede ser `null`.
- [ ] **Documentación:** suma la ruta a `RUTAS_API` en `src/server/docs/docs.test.ts`.
- [ ] **Integración** con PostgreSQL en `tests/integration/` si la ruta usa la base.

## 7. La documentación generada

- [ ] Ejecuta `npm run docs:api`.
- [ ] Haz commit de `src/server/docs/openapi.json` y `src/server/docs/llms.txt` junto con el cambio. Nunca los edites a mano.
- [ ] Si una pantalla depende de la ruta y algo cambió frente a su contrato, actualiza `docs/design/pages/<pagina>/contract.md`.

## 8. Antes de abrir el PR

- [ ] `npm run check` pasa: lint, formato, tipos, pruebas y build.
- [ ] En el preview del PR, `<URL del preview>/api/docs` muestra la ruta con su resumen, sus parámetros, el body de cada respuesta y sus errores.
- [ ] Rama y PR según el [flujo de Git](../desarrollo.md#flujo-de-git).
