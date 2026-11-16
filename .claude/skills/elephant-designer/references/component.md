# Crear un componente

**Lee** (además de [`contexto.md`](../contexto.md)): `.storybook/docs/HowWeWork.mdx`; de `docs/design/guide/design-system.md`, las secciones que apliquen; «Audiencias y primeras tareas» de `docs/design/discovery/brief.md`.

Resultado: un componente nuevo en el catálogo, implementado en React, documentado en Storybook y con su commit, listo para usarse en una pantalla.

## Puertas

| Paso | Quién | Resultado | Puerta |
| --- | --- | --- | --- |
| 0. Confirmar el pedido | `elephant-designer` | Necesidad y lugar del componente | Es un componente y dice para qué se necesita |
| 1. Buscar en el catálogo | `elephant-designer` | Usar, confirmar un candidato o crear | — |
| 2. Pensar el componente | `elephant-designer` | Definición | — |
| 3. Mostrar variantes | `elephant-ui` las construye; `elephant-ux` las critica | Historia «Variantes (propuesta)» y capturas | **El equipo elige una variante** |
| 4. Implementar | `elephant-ui` | Componente, estilos, historias, catálogo | — |
| 5. Revisar | `elephant-ux` y `elephant-tester`, en paralelo | Hallazgos consolidados | **Aprobación del equipo** |
| 6. Commit | `elephant-designer` | Un commit con el componente | — |

## 0. Confirmar el pedido

Antes de empezar, comprueba que es un componente. Si no lo es, no sigas: dilo en una línea y redirige.

| El pedido es… | Va por |
| --- | --- |
| Una página o pantalla completa | `/crear-pantalla` |
| Cambiar un componente que ya existe sin cambiar la dirección | `/ajuste` |
| Cambiar la paleta, la tipografía o el lenguaje visual | `/elephant-designer` (Ronda) |
| Dudoso o mezcla de varias cosas | `/elephant-designer` |

El pedido debe decir **para qué página o necesidad** es el componente. Si no lo dice, pregúntalo: un componente sin uso no entra al catálogo.

## 1. Buscar en el catálogo

Lista el catálogo (comando en [`contexto.md`](../contexto.md)).

- Si un componente del núcleo ya resuelve la necesidad: úsalo y termina. Si le falta una variante o un estado, es un `/ajuste`.
- Si un **candidato** la resuelve: este flujo lo confirma. Sigue desde el paso 2 con su especificación de `.storybook/catalog/candidates/` como punto de partida.
- Si nada sirve: componente nuevo.

## 2. Pensar el componente

Escribe la definición, corta:

- **Propósito:** qué resuelve y para quién; cuándo usarlo y cuándo no.
- **Lugar:** UI puro (`src/components/ui/<Component>/`: no conoce ninguna página, recibe todo por props) o de módulo (`src/modules/<módulo>/ui/<Component>/`).
- **Anatomía:** sus partes y qué componentes del catálogo compone.
- **Variantes y estados:** normal, carga, vacío, «Sin datos», error, deshabilitado, foco; los que apliquen.
- **Comportamiento:** qué pasa al tocarlo, teclado, y si se mueve, cómo queda con `prefers-reduced-motion`.
- **Contenido:** textos reales y casos extremos (el nombre más largo, la cifra más grande).
- **Tokens** que usa. Si falta un token, se propone aquí y entra por `tokens.json`.
- **Accesibilidad:** elemento nativo, nombre accesible, color nunca solo.

## 3. Mostrar variantes

Dos o tres variantes distintas de verdad, con la **recomendada primero** y el motivo. Para cada una: qué favorece, qué sacrifica y cómo se lee (qué se ve primero).

- `elephant-ui` las construye en la carpeta del componente, en una sola historia `Variantes (propuesta)` que las muestra lado a lado con contenido real, usando solo tokens.
- `npm run design:check -- --filter <componente>` deja las capturas en claro y oscuro, de 320 a 1280 px.
- `elephant-ux` critica las capturas contra el brief.

Preséntale al equipo las capturas, la recomendada y la crítica. **El equipo elige.** Se pueden pedir cambios y repetir.

## 4. Implementar

`elephant-ui`, con la variante elegida:

- `Component.tsx`, `Component.module.css` y `Component.stories.tsx`, con una historia por estado. Se retira la historia `Variantes (propuesta)` y lo descartado.
- `docs/design/guide/components.json`: la entrada con `component` y `styles`, estado `core`. Si venía de un candidato, se retiran su especificación de `.storybook/catalog/` y sus clases de `components.css`.
- `python3 docs/design/guide/build.py`; versión menor de la guía y una fila en `docs/design/guide/README.md`.
- Pruebas del comportamiento que tenga lógica (formato, estados).

## 5. Revisar

`elephant-ux` (experiencia, jerarquía, textos) y `elephant-tester` (reglas, accesibilidad, código), en paralelo y sin haber construido el componente. Consolida los hallazgos, corrige los que apliquen con `elephant-ui` y vuelve a validar. Pide la **aprobación del equipo** con las capturas finales.

## 6. Commit

Solo con la aprobación del paso 5 y con `npm run design:check` (completo) y `npm run check` en verde. Llamar a `/crear-componente` cuenta como la instrucción de hacer este commit.

- Si la rama es `main`, crea primero la rama (`feature/TASK-<nn>-<descripcion>`; pregunta el número de la tarea si no lo sabes).
- **Un commit, solo con los archivos del componente** (su carpeta, `components.json`, la guía y lo que se retiró). Si hay otros cambios sin confirmar en el repositorio, no los incluyas.
- Mensaje en español: `feat(diseño): componente <Component>` y una línea de para qué sirve.
- No hagas push ni abras un PR sin que te lo pidan.

Reporta: qué se creó, dónde verlo en Storybook, qué se verificó y el commit.
