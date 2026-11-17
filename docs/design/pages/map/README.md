# Map page (Mapa de contratación)

Status: **Approved** 2026-11-15 (Approval 2). The handoff for development is this folder: [contract.md](contract.md), [spec.md](spec.md), `mockup.html` (built by [build.py](build.py)) and [validation.md](validation.md). The «Fase 2» risk colours in the mockup are a preview with fictional levels; building them needs a risk field in the contract (TASK-07), which sends the page back to step 0. Task: TASK-09 [#16](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/16). Design restarted 2026-11-15.

| Step | File | State |
| --- | --- | --- |
| 0. Contract | [contract.md](contract.md) | Approved 2026-11-15 |
| 1. Data | [data.md](data.md) | Done 2026-11-15 (pipeline export, cut 2026-11) |
| 2. Spec | [spec.md](spec.md) | Approved 2026-11-15 (Approval 1) |
| 3. Components | Guide v1.1.0 (published as v1.3.0 when merging main) | Done 2026-11-15: Map with legend (neutral variant), Search results (new), Field placeholder (fix); each approved by the user |
| 4. Mockup | [build.py](build.py) → `mockup.html` (git-ignored), data in [sample/](sample/) | Done 2026-11-15 |
| 5. Validation | [validation.md](validation.md) | Done 2026-11-15; open points resolved |
| 6. Approval 2 | — | Approved by the user 2026-11-15 (spec decisions 12–14 added in review) |
| Construcción | `src/modules/mapa/ui/` | 2026-11-16: componentes `MapWithLegend` y `SearchResults`, pantalla `MapPage` conectada a la API en `MapScreen`, historias en Storybook (`Componentes/Mapa/…` y `Pantallas/MapPage`) con la muestra de [sample/](sample/). Guía v1.3.0. 2026-11-16, ajuste: salen las listas «Departamento» y «Municipio» (decisión 13 retirada); queda solo el buscador. Mismo día: tablas en orden alfabético (decisión 2), «Ver todo» solo con el mapa acercado o movido (decisión 12c), y `/mapa/departamento/11` abre Bogotá (11001). Transición de zoom entre Colombia y un departamento (decisión 15). La maqueta aprobada conserva el diseño anterior como historia |

Decisions on the open questions: [spec.md § 6](spec.md#6-decisions-2026-11-15-by-the-user).
| Experiencia en una sola pantalla | [bocetos.html](bocetos.html), [prototipo-a.html](prototipo-a.html) | 2026-11-16: se replantea la experiencia para que el mapa sea el protagonista y no haya que navegar entre vistas. Tres bocetos (A, B, C) con la crítica de `elephant-ux`; Jouler eligió **A, mapa a pantalla completa con ficha deslizable**, y la probó en el boceto interactivo (baja fidelidad, datos de [sample/](sample/)). Pendiente: `spec.md` nuevo (paso 2b) y cuatro decisiones: un dedo siempre arrastra el mapa (cambia la decisión 12c), si las cifras de cobertura se ven al llegar, relleno neutro hasta TASK-07, y tokens de movimiento. La ficha deslizable es un componente nuevo (`/crear-componente`). La pantalla construida todavía sigue la especificación del 2026-11-15 |
