# Crear una API

Paso a paso para agregar o cambiar una ruta de la API sin olvidar nada. Lo siguen las personas y los agentes de IA. Cada paso dice **qué hacer**; el porqué está en [arquitectura](../arquitectura.md) (organización del back) y en [API](../api.md) (validación, errores y documentación).

Ejemplo de referencia en el código: `GET /api/mapa/municipios/{codigo}`, del módulo `mapa`.

## 0. Antes de escribir código

- [ ] Si una pantalla va a usar la ruta, su contrato de página está aprobado en `docs/design/pages/<pagina>/contract.md` ([contrato de página y OpenAPI](../api.md#contrato-de-página-y-openapi)).
- [ ] Elegiste el módulo dueño en `src/modules/<modulo>/`, o uno nuevo ([módulos verticales](../arquitectura.md#módulos-verticales)).
- [ ] La ruta y sus campos siguen las [convenciones](../api.md#convenciones).

## 1. Dominio, puerto y caso de uso

Respeta las [reglas de dependencias](../arquitectura.md#reglas-de-dependencias).

- [ ] **Dominio** (`domain/`): interfaces del resultado y clases de error.
- [ ] **Puerto de salida** (`application/ports/`).
- [ ] **Caso de uso** (`application/`).
- [ ] **Prueba unitaria** del caso de uso con un puerto en memoria (`*.test.ts` al lado).

## 2. Adaptador de salida

- [ ] Implementa el puerto en `adapters/worker-datos/` o `adapters/postgres/`.
- [ ] Valida lo que lee de la fuente ([validación: datos de la fuente](../api.md#validación)).
- [ ] Con PostgreSQL: SQL parametrizado, [importes en centavos](../arquitectura.md#importes-exactitud-y-rechazo-de-datos-incorrectos) y una migración nueva si cambia el esquema.

## 3. Esquema de la respuesta

En `adapters/http/<modulo>.schemas.ts` ([las piezas de una ruta documentada](../api.md#las-piezas-de-una-ruta-documentada)):

- [ ] Un esquema zod `.strict()` por cada body, con `.meta({ ref: '<NombreDelTipo>' })`.
- [ ] Contiene como mínimo todos los campos del dominio ([regla del body](../api.md#validación)).
- [ ] `.meta({ description, example })` en español en cada campo que no se explica solo: qué significa `null`, la unidad, el formato.

## 4. Ruta

En `adapters/http/<modulo>.routes.ts`:

- [ ] `describeRoute` con `summary`, `description`, `tags` y en `responses` el 200 y **cada error posible**, con `json(descripción, esquema)`.
- [ ] `validator` de `hono-openapi` para parámetros, consulta o body; si falla, `400` con su código.
- [ ] El manejador responde con `responder(c, esquema, valor)`, nunca con `c.json`.
- [ ] `Cache-Control` si los datos lo permiten.
- [ ] Conecta la ruta en `src/server/composition/<modulo>.ts` y, si el módulo es nuevo, móntalo en `src/server/app.ts` con `app.route('/api/<modulo>', …)`.

## 5. Errores

- [ ] Cada error nuevo es una clase en el dominio.
- [ ] Tradúcelo en `app.onError` (`src/server/app.ts`) a `{ "error": "<código>" }` y súmalo a la [tabla de errores](../api.md#errores).
- [ ] Documéntalo en la ruta con `json(descripción, esquemaError('<código>'))`.
- [ ] En los logs, solo el nombre del error: nunca datos ni mensajes.

## 6. Pruebas

- [ ] **Rutas** (`src/server/<modulo>.test.ts`): estado, encabezados y cada error, con dobles en memoria en `crearApp(db, datos)`.
- [ ] **Contrato:** la ruta en la tabla de contrato de ese archivo, con el 200 y cada error; incluye el caso «Sin datos» si un campo puede ser `null`.
- [ ] **Documentación:** la ruta en `RUTAS_API` de `src/server/docs/docs.test.ts`.
- [ ] **Integración** en `tests/integration/` si usa PostgreSQL.

## 7. Documentación generada

- [ ] `npm run docs:api` y commit de `src/server/docs/openapi.json` y `llms.txt` junto al cambio. Nunca se editan a mano.
- [ ] Si cambió algo frente al contrato de página, actualízalo.

## 8. Antes de abrir el PR

- [ ] `npm run check` pasa.
- [ ] En el preview del PR, `<URL del preview>/api/docs` muestra la ruta con su resumen, parámetros, el body de cada respuesta y sus errores.
- [ ] Rama y PR según el [flujo de Git](../desarrollo.md#flujo-de-git).
