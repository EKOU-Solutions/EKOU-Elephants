# Documentación de la API

El mismo Worker sirve la documentación de la API, que se genera a partir de las rutas de Hono ya registradas, sin anotarlas:

| Ruta | Para quién | Contenido |
| --- | --- | --- |
| `/api/openapi.json` | Herramientas | OpenAPI 3.1 generado con `hono-openapi`. |
| `/api/llms.txt` | Agentes de IA | El mismo OpenAPI en Markdown (`@scalar/openapi-to-markdown`). |
| `/api/docs` | Personas | Interfaz de Scalar que lee `/api/openapi.json`. |

## Cómo se genera

- `npm run docs:api` (`scripts/generar-docs-api.mjs`) carga `src/server/docs/openapi.ts` con Vite, construye la app real y escribe `src/server/docs/openapi.json` y `src/server/docs/llms.txt`. `npm run build` lo ejecuta antes de `vite build`.
- El Worker (`src/server/docs/index.ts`) importa esos archivos como texto y JSON. No se sirven como assets estáticos porque `run_worker_first: ["/api/*"]` envía todo `/api/*` al Worker. Así, `hono-openapi` y el conversor a Markdown son dependencias de desarrollo y no entran al bundle.
- Los dos archivos **se versionan**: las pruebas, el typecheck y `npm run dev` los necesitan antes de cualquier build, y el diff del PR muestra cómo cambia el contrato público. `src/server/docs/docs.test.ts` los regenera en memoria y falla si no coinciden. **Si cambias una ruta, ejecuta `npm run docs:api` y haz commit de los archivos.**
- Los resúmenes en español y los errores conocidos (`400 codigo_invalido`, `404 territorio_no_encontrado`/`municipio_no_encontrado`, `503 corte_no_disponible`, `500 error_interno`) se agregan en `ENRIQUECIMIENTO`, dentro de `openapi.ts`, sin tocar los módulos. Las pruebas fallan si `ENRIQUECIMIENTO` deja de coincidir con las rutas.

## Limitaciones

- El generador no lee los esquemas de `@hono/zod-validator`, así que las respuestas no incluyen el esquema del cuerpo.
- La interfaz de `/api/docs` carga el script de Scalar desde su CDN (jsDelivr).
