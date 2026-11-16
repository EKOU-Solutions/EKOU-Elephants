# Instrucciones del proyecto

## Idioma

EKOU Elephants está dirigido al público colombiano. Lo que leen las personas se escribe en español; el código se escribe en inglés.

**En español (claro y adecuado para Colombia):**

- Documentos de negocio y técnicos: arquitectura, ADR, alcance del MVP, briefs, requisitos, planes, guías, documentación de API y cualquier otro archivo Markdown para personas.
- Instrucciones para agentes y skills (incluida la de diseño).
- Textos de la interfaz, mensajes para las personas usuarias y las páginas de Storybook (secciones, nombres de las historias, descripciones de componentes y props).
- Títulos y descripciones de commits y pull requests.

**En inglés:**

- El código: nombres de variables, funciones, tipos, componentes, props, campos, clases CSS, archivos y carpetas de código. Como el nombre del componente es código, en Storybook también se usa tal cual en el título de su historia (`Componentes/UI/Button`), para encontrarlo igual en Storybook y en el código.
- La API: rutas, campos de solicitudes y respuestas, y nombres de columnas o tablas nuevas.
- Los comentarios del código.

Conserva la sintaxis y los nombres exigidos por lenguajes, bibliotecas, API y herramientas externas; no traduzcas identificadores externos ni rutas de instrucciones que las herramientas requieran, como `AGENTS.md` y `CLAUDE.md`.

## Diseño: todo cambio visual o de experiencia pasa por los flujos de diseño

Regla global y sin excepciones. Cualquier cambio visual o de experiencia (una pantalla o página, un componente, un token, el sistema de diseño en Storybook o los textos de la interfaz) se hace **siempre** por uno de los flujos de diseño, también los cambios pequeños.

| Comando | Para qué |
| --- | --- |
| `/crear-pantalla` | Una página o pantalla completa, del contrato de la API a la pantalla aprobada |
| `/crear-componente` | Un componente nuevo: definición, variantes, implementación, revisión y commit |
| `/revisar-implementacion` | Revisar algo ya construido, con el alcance que diga la persona |
| `/ajuste` | Un cambio puntual que mantiene la dirección |
| `/elephant-designer` | Todo lo demás (auditoría, ronda, descubrimiento) y cualquier pedido dudoso: clasifica y elige el flujo |

- **Si nadie activó un comando** y te piden un cambio visual o de experiencia, carga igual la skill `elephant-designer` antes de editar y sigue el flujo que indique. No edites diseño, pantallas ni componentes por fuera de un flujo, aunque el cambio parezca trivial o te pidan hacerlo rápido.
- Si un comando recibe un pedido que no es suyo (por ejemplo, `/crear-componente` para una página), no lo fuerces: redirige al comando correcto o a `elephant-designer`.
- Si alguien pide saltarse el flujo, no hagas el cambio y explica que debe pasar por los flujos de diseño. En Codex los comandos se llaman con `$` (`$ajuste`); en Antigravity, pidiendo usar la skill por su nombre.
- Storybook (`npm run storybook`) es la referencia viva del sistema de diseño. Todo componente o pantalla creado o modificado termina documentado con su historia. La guía HTML v1.0 y las rondas de `docs/design/` son seguimiento histórico.
- Las skills viven en `.claude/skills/` y están enlazadas en `.agents/skills/` para Codex y Antigravity. Roles del flujo: `elephant-designer` (orquesta), `elephant-data`, `elephant-ui`, `elephant-ux` y `elephant-tester`. Qué hace cada comando: [comandos de diseño](docs/design/comandos.md).

## Fuente compartida de instrucciones

`AGENTS.md` es la fuente de estas instrucciones para Codex y Antigravity, que lo leen de forma nativa. `CLAUDE.md` debe ser un enlace simbólico relativo a `AGENTS.md` para que Claude use las mismas reglas sin mantener copias separadas.

## Revisión de código y trabajo con agentes

- Al revisar un PR o implementar una tarea, sigue las [guías de revisión](docs/guias-revision.md): comenta solo correctitud, seguridad, pruebas faltantes y violaciones de reglas del repositorio.
- Trabaja con el flujo de Git de [desarrollo](docs/desarrollo.md#flujo-de-git): ramas `feature/TASK-<nn>-<descripcion>` o `fix/TASK-<nn>-<descripcion>` desde `main` y PR con `Closes #<issue>`.
- Antes de entregar, ejecuta `npm run check` (y las pruebas del pipeline si lo tocas) y reporta el resultado.
- No modifiques `.github/workflows/` ni secretos. Cómo se activa cada agente: [agentes de IA](docs/agentes-ia.md).
