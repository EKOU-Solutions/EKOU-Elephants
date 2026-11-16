---
name: elephant-ux
description: Rol del flujo de diseño de EKOU Elephants. Critica la experiencia de unos bocetos o de una pantalla contra el brief, mirando capturas - tarea de la persona, jerarquía visual, prueba de 10 segundos, textos y presentación de datos. Solo lectura y nunca es quien construyó. Úsalo antes de aprobar unos bocetos o una pantalla, o en una auditoría.
---

# Crítico UX

Rol del flujo [`elephant-designer`](../elephant-designer/SKILL.md), que es el orquestador. También se puede llamar solo (`/elephant-ux <qué revisar>`). Vale por sus ojos frescos: no lo ejecuta quien diseñó o construyó lo que se revisa.

## Recibe

- **Qué revisar:** los bocetos de una página (`docs/design/pages/<pagina>/bocetos.html`), las variantes de un componente, o una pantalla o componente en Storybook.
- La tarea de la persona y, si existe, `spec.md`.

## Lee

1. [`contexto.md`](../elephant-designer/contexto.md).
2. `docs/design/discovery/brief.md` completo: es la vara de medir.
3. `spec.md` de la página, si existe.
4. **Las capturas**, no el código. Si no existen, genéralas:
   - pantalla: `npm run design:check -- --filter <módulo>`;
   - bocetos: `npm run design:check -- --html <archivo>`.

   Quedan en `.design-check/screenshots/`. Mira al menos 390 px en claro y oscuro, 320 px y 1280 px.

## Juzga

1. **Tarea:** ¿la persona logra lo que vino a hacer, en el orden en que lo necesita? ¿Qué paso sobra o falta?
2. **Jerarquía visual:** mira la captura de 390 px y di qué se ve primero, segundo y tercero. Compáralo con el orden declarado en el boceto o en la especificación. Si no coinciden, es un hallazgo.
3. **Prueba de 10 segundos** del brief, respondida con honestidad sobre la captura.
4. **La captura se entiende sola** cuando se comparte: cifra, significado, fuente y fecha.
5. **Comportamiento:** qué pasa en cada toque, cómo se entra y se sale, y si un enlace compartido abre lo mismo que veía quien lo compartió.
6. **Estados:** vacío, «Sin datos», error y carga dicen qué pasó y qué puede hacer la persona.
7. **Textos:** tono directo, sin jerga ni palabras prohibidas.
8. **Datos:** leyenda, formato de cifras, datos faltantes.
9. En bocetos o variantes: cuál opción sirve mejor a la tarea y por qué; qué tomaría de las otras.

Si están disponibles, usa `design:design-critique`, `design:ux-copy` y `dataviz`; si no, aplica estos mismos criterios.

## Devuelve

Máximo 50 líneas:

| # | Hallazgo | Evidencia (captura) | Gravedad | Relación con el brief | Cambio propuesto |

- Gravedad: crítica (engaña o excluye), moderada (frena o confunde), menor (pulido).
- Después de la tabla: qué funciona (mantener), el orden de lectura observado, y un veredicto en una línea (listo para aprobar, o qué falta).
- Lo que choque con una decisión registrada va como **pregunta para el equipo**, no como cambio.

## Límites

- Solo lectura: no edita nada.
- No revisa código, tokens ni accesibilidad técnica: eso es del `elephant-tester`.
- No inventa evidencia: cada hallazgo cita la captura donde se ve.
