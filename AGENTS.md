# Instrucciones del proyecto

## Idioma

EKOU Elephants está dirigido al público colombiano. Lo que leen las personas se escribe en español; el código se escribe en inglés.

**En español (claro y adecuado para Colombia):**

- Documentos de negocio y técnicos: arquitectura, ADR, alcance del MVP, briefs, requisitos, planes, guías, documentación de API y cualquier otro archivo Markdown para personas.
- Instrucciones para agentes y skills (incluida la de diseño).
- Textos de la interfaz, mensajes para las personas usuarias y las páginas de Storybook (títulos, nombres de las historias, descripciones de componentes y props).
- Títulos y descripciones de commits y pull requests.

**En inglés:**

- El código: nombres de variables, funciones, tipos, componentes, props, campos, clases CSS, archivos y carpetas de código.
- La API: rutas, campos de solicitudes y respuestas, y nombres de columnas o tablas nuevas.
- Los comentarios del código.

Conserva la sintaxis y los nombres exigidos por lenguajes, bibliotecas, API y herramientas externas; no traduzcas identificadores externos ni rutas de instrucciones que las herramientas requieran, como `AGENTS.md` y `CLAUDE.md`.

## Diseño: todo cambio pasa por `elephants-design`

Regla global y sin excepciones. Cualquier cambio de diseño, de una pantalla o página, de un componente visual, de un token, del sistema de diseño en Storybook o de los textos de la interfaz se hace **siempre** a través de la skill `elephants-design`. Esto incluye los cambios pequeños: la skill clasifica el pedido y elige la ruta, desde un ajuste puntual hasta una iteración profunda (construir una página, auditoría, ronda o descubrimiento).

- Antes de editar cualquiera de esos elementos, carga la skill `elephants-design` y sigue la ruta que indique. No edites diseño, pantallas ni componentes visuales por fuera de ese flujo, aunque el cambio parezca trivial o te pidan hacerlo rápido.
- Si alguien pide saltarse el flujo, o tú mismo estás a punto de hacerlo, no hagas el cambio. Aclara que debe pasar por el flujo de diseño e indica el comando: `/elephants-design` en Claude Code, `$elephants-design` en Codex, o pedirle a Antigravity que use la skill `elephants-design`.
- Storybook (`npm run storybook`) es la referencia viva del sistema de diseño. Todo componente creado o modificado con la skill termina documentado con su historia. La guía HTML v1.0 y las rondas de `docs/design/` son seguimiento histórico.
- La skill vive en `.claude/skills/elephants-design/` y está enlazada en `.agents/skills/elephants-design` para Codex y Antigravity.

## Fuente compartida de instrucciones

`AGENTS.md` es la fuente de estas instrucciones para Codex y Antigravity, que lo leen de forma nativa. `CLAUDE.md` debe ser un enlace simbólico relativo a `AGENTS.md` para que Claude use las mismas reglas sin mantener copias separadas.

## Revisión de código y trabajo con agentes

- Al revisar un PR o implementar una tarea, sigue las [guías de revisión](docs/guias-revision.md): comenta solo correctitud, seguridad, pruebas faltantes y violaciones de reglas del repositorio.
- Trabaja con el flujo de Git de [desarrollo](docs/desarrollo.md#flujo-de-git): ramas `feature/TASK-<nn>-<descripcion>` o `fix/TASK-<nn>-<descripcion>` desde `main` y PR con `Closes #<issue>`.
- Antes de entregar, ejecuta `npm run check` (y las pruebas del pipeline si lo tocas) y reporta el resultado.
- No modifiques `.github/workflows/` ni secretos. Cómo se activa cada agente: [agentes de IA](docs/agentes-ia.md).
