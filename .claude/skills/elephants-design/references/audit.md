# Auditoría

Resultado: `docs/design/audits/AAAA-MM-DD-<objetivo>.md`. Es de solo lectura para el objetivo: una auditoría nunca edita la ronda, la guía ni Storybook.

## Objetivo

La ronda, la guía o la sección de Storybook que nombre el equipo; si no nombra ninguna, la última ronda. Genérala (`python3 <ronda>/build.py`, o `npm run storybook`) e inspecciona la vista previa a 320, 390 y 1024+ px. Mira capturas; no juzgues solo desde el código fuente.

## Pasadas

Ejecuta las que apliquen; anota las que se omitan y por qué.

| Pasada | Herramienta | Pregunta |
| --- | --- | --- |
| Ajuste al brief | esta skill | ¿Cada elemento sirve a una tarea de la audiencia, a la voz y a un criterio de éxito de `brief.md`? |
| Crítica | `design:design-critique`, `impeccable critique` | Jerarquía, claridad, qué atrae primero la mirada, qué se ve genérico |
| Antipatrones | detector de `impeccable` sobre el HTML generado | Señales de plantilla, problemas de tipografía y de maquetación |
| Accesibilidad | `design:accessibility-review`, `impeccable audit`, panel de accesibilidad de Storybook | Contraste (incluidos los rellenos del mapa y la trama), foco, áreas táctiles, significado solo por color |
| Presentación de datos | `dataviz` | Leyenda, categorías, datos faltantes, selección, formatos numéricos |
| Textos | `design:ux-copy` | Español claro, forma de hablar del riesgo, errores, estados vacíos |
| Consistencia del sistema | `design:design-system` | Tokens frente a valores escritos a mano, nombres, estados de los componentes |

Sin brief, dilo al principio y audita solo contra `visual-direction.md`.

## Consolidar

Una sola tabla, sin duplicados, ordenada por gravedad:

| # | Hallazgo | Evidencia | Pasada(s) de origen | Gravedad | Relación con el brief | Cambio propuesto |

- Gravedad: crítica (engaña o excluye), moderada (frena o confunde), menor (pulido).
- Un hallazgo que choca con una decisión aceptada va a **Decisiones necesarias**, no a la lista de cambios.
- Termina con: qué funciona (mantener), los 3 cambios principales, decisiones necesarias y comprobaciones que no se hicieron.

Pregunta al equipo qué hallazgos atender antes de empezar una ronda.
