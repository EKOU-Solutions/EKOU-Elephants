# Resumen municipal · Validación

Paso 5 de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md). Fecha: 2026-11-22. Maqueta: `Módulos/Mapa/ResumenMunicipal` (14 historias).

## Resultado

- `design:check`: 112 renders (14 historias × 2 temas × 4 anchos), 0 fallas, 0 avisos «incompleto» de axe.
- `tsc`, `biome` y las pruebas del módulo `mapa` (137) pasan. Pruebas propias del modelo: formato de dinero y porcentaje, reparto por rubro, escala común, aviso de gasto mayor, motivo sin gasto.
- Revisión de experiencia (`elephant-ux`) y técnica (`elephant-tester`) hechas por roles distintos de quien construyó.

## Hallazgos y cómo se resolvieron

| Hallazgo | Gravedad | Resolución |
| --- | --- | --- |
| Tabla exacta cortaba cifras a 320 px | Crítica | Listas anidadas por concepto; ninguna cifra se corta |
| Foco no iba al título de la tabla | P0 | `ref` y foco solo si la persona abrió la tabla |
| «Por pagar» mayor que «Pagado» confundía | Moderada | Se llama «Recibido» (bienes y servicios que llegaron, pagados o no); spec actualizada |
| Precisión desigual de cifras y contratos sin «$» | Moderada | Un decimal en billones; contratos con «$» |
| Fuente lejos de la cifra clave | Moderada | «CUIPO, corte …» bajo lo recibido |
| SECOP poco separado | Moderada | Bloque con fondo propio y la aclaración antes de las cifras |
| Estado sin datos sin trama ni siguiente paso | Menor | Trama y botón al año con datos |
| `aria-live` no anunciaba error ni «sin información» | P1 | Anuncia ambos |
| `?? 0` inventaba ceros | P1 | «Sin información» |
| Rubro con plata decía «0 %» | P1 | «<1 %» |

## Pendiente para la integración

- «La alcaldía recibió» → «la gobernación» según el nivel.
- «Año inválido en la URL»: lo avisa la página.
- Prueba automática del foco (falta `@testing-library/react`).
- Desviaciones del catálogo: cifras en pesos con marcado propio (KeyFigure solo formatea conteos); tabla exacta como listas, no `<table>`.
- Preguntas abiertas de la spec §7 (Select o botones de año, presupuesto definitivo, licencia, copiar enlace, departamento).
