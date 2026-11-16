# Documentación de la API

El mismo Worker sirve la documentación de la API, que se genera a partir de las rutas de Hono ya registradas, sin anotarlas:

| Ruta | Para quién | Contenido |
| --- | --- | --- |
| `/api/openapi.json` | Herramientas | OpenAPI 3.1 generado con `hono-openapi`. |
| `/api/llms.txt` | Agentes de IA | El mismo OpenAPI en Markdown (`@scalar/openapi-to-markdown`). |
| `/api/docs` | Personas | Interfaz de Scalar que lee `/api/openapi.json`. |

- El código está en `src/server/docs.ts` y se monta en `src/server/app.ts` con `montarDocumentacion(app)`, después de las rutas de la API. Las rutas de documentación no aparecen dentro del OpenAPI.
- Los resúmenes en español y los errores conocidos (`400 codigo_invalido`, `404 territorio_no_encontrado`/`municipio_no_encontrado`, `503 corte_no_disponible`, `500 error_interno`) se agregan en `ENRIQUECIMIENTO`, dentro de `docs.ts`, sin tocar los módulos. Si se agrega, renombra o elimina una ruta, actualiza `ENRIQUECIMIENTO`: `src/server/docs.test.ts` falla si no coincide con las rutas generadas.
- Limitación: el generador no lee los esquemas de `@hono/zod-validator`, así que las respuestas no incluyen el esquema del cuerpo.
- Los documentos se generan en la primera petición y quedan en memoria del isolate.
- La interfaz de `/api/docs` carga el script de Scalar desde su CDN (jsDelivr).
