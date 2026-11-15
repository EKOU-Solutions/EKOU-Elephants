# Instrucciones del proyecto

## Idioma

Todo el contenido de EKOU Elephants debe escribirse en español, ya que el producto está dirigido al público colombiano.

- Esta regla aplica a los documentos de negocio y técnicos: arquitectura, ADR, alcance del MVP, briefs, requisitos, planes, guías, documentación de API y cualquier otra documentación del proyecto.
- También aplica a las instrucciones para agentes, las skills (incluida la de diseño), los comentarios y la documentación del código, los textos de la interfaz y los mensajes destinados a las personas usuarias.
- Los títulos y las descripciones de commits y pull requests deben escribirse en español.
- No existe una excepción de idioma para el contenido técnico. Al crear o actualizar contenido, usa un español claro y adecuado para Colombia.
- Conserva la sintaxis y los nombres exigidos por lenguajes, bibliotecas, API y herramientas externas; no traduzcas identificadores externos ni rutas de instrucciones que las herramientas requieran, como `AGENTS.md` y `CLAUDE.md`.

## Fuente compartida de instrucciones

`AGENTS.md` es la fuente de estas instrucciones para Codex. `CLAUDE.md` debe ser un enlace simbólico relativo a `AGENTS.md` para que Claude use las mismas reglas sin mantener copias separadas.

## Revisión de código y trabajo con agentes

- Al revisar un PR o implementar una tarea, sigue las [guías de revisión](docs/guias-revision.md): comenta solo correctitud, seguridad, pruebas faltantes y violaciones de reglas del repositorio.
- Trabaja con el flujo de Git de [desarrollo](docs/desarrollo.md#flujo-de-git): ramas `feature/TASK-<nn>-<descripcion>` o `fix/TASK-<nn>-<descripcion>` desde `main` y PR con `Closes #<issue>`.
- Antes de entregar, ejecuta `npm run check` (y las pruebas del pipeline si lo tocas) y reporta el resultado.
- No modifiques `.github/workflows/` ni secretos. Cómo se activa cada agente: [agentes de IA](docs/agentes-ia.md).
