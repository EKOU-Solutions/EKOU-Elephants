# Herramientas que llama el flujo

Carga cada skill solo en el paso que la usa, no al empezar.

| Skill | Origen | Se usa en |
| --- | --- | --- |
| `design:design-critique`, `design:accessibility-review`, `design:ux-copy`, `design:design-system` | Plugin de diseño de Anthropic | Auditoría, Construir una página (validar), Ajuste (si toca textos o accesibilidad) |
| `dataviz` | Anthropic | Auditoría, Ronda (mapa, leyenda, gráficos) |
| `frontend-design` | Anthropic | Ronda |
| `impeccable` (`critique`, `audit`, `shape`, `polish`; CLI de detección) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0, instalada en el proyecto para Claude (`.claude/skills`) y Codex/Antigravity (`.agents/skills`) sin hooks | Auditoría (segunda opinión, detector de antipatrones), Ronda (shape) |
| `ponytail` (solo la skill principal, nivel `full`) | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) v5.3.3, MIT, copiada en `.claude/skills/elephant-ui/references/ponytail/` sin hooks ni plugin | Solo el rol `elephant-ui`: el menor código que resuelve el encargo |

Lo que es mecánico (render, axe, desplazamiento horizontal, capturas, contraste de tokens) lo hace `npm run design:check`; las skills se reservan para el juicio: jerarquía, claridad, tono y lo que axe deja como «incompleto».

## Impeccable

Se instala **sin hooks** por decisión del equipo (2026-11-08): al instalarla o actualizarla, usa siempre `--no-hooks` y nunca agregues su hook a `.claude/settings*.json` ni a `.codex/hooks.json`; ejecuta su detector de forma explícita. No ejecutes `impeccable init` ni `document`: escriben su propio PRODUCT.md / DESIGN.md. Nuestro brief y `docs/design/` son la única fuente; pásaselos a Impeccable como contexto.

## Agregar una skill de terceros

Solo después de leerla completa, revisar su licencia y obtener la aprobación del equipo; luego regístrala en la tabla.
