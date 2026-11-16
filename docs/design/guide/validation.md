# Validación: guía v1.0

Observado en local el 2026-11-08 con la salida de `build.py`.

- El build termina sin marcadores sin reemplazar. Cada clase y token que nombra `components.json` existe en `components.css` / `tokens.css`, y cada `var(--el-*)` que usan los componentes está definida.
- **Contraste** (`contrast-report.json`): los 17 pares de texto, control, foco, trama y etiqueta de riesgo pasan en claro y en oscuro. Los rellenos de riesgo quedan por debajo de 3:1 frente a la superficie a propósito y se apoyan en el relieve: bordes, etiquetas, leyenda y tabla. No cambia respecto a la Ronda 05, que también validó los rellenos con el validador de paletas de `dataviz`.
- **Desbordamiento** (iframes de ancho fijo, Chrome headless): sin desplazamiento horizontal a 320, 390, 768 ni 1280 px en las tres pantallas ni en `preview.html`.
  - `examples.html` se desbordaba 4 px a 320 px porque el simulador de portátil tenía un mínimo de 280 px. Lo bajé a 240 px, como en la Ronda 06, y ahora cabe.
- **`impeccable detect`:**
  - En las tres pantallas: 0 antipatrones; solo la advertencia de la trama gris, que es la semántica aceptada para datos faltantes.
  - En `preview.html`: 0 antipatrones. Sus advertencias son la trama y el «exceso de rayas largas», que viene de los nombres de tokens `--el-*` en los ejemplos de código.
  - En `examples.html`: solo `cramped-padding` en el marco del simulador, la pantalla y la barra del navegador, que van al ras a propósito y no son componentes del producto.
- **Capturas revisadas** (tema oscuro, la configuración del sistema):
  - `preview.html` a 1280 px;
  - `examples.html` a 1440 px, con ambos simuladores;
  - la pantalla de contrato.
  - Public Sans se ve en todos los marcos y el tema se aplica dentro de los simuladores.

Límites:

- No se repitió para la v1.0 la revisión por componente en tema claro de la Ronda 05, porque solo cambiaron el selector de tipografía y la pantalla de obra.
- No se probó: dispositivos reales, un recorrido con lector de pantalla, un recorrido solo con teclado, zoom al 200 %.
- Los simuladores son aproximaciones en CSS, no emulación de dispositivos.
- El marcado de los componentes es una especificación, no una implementación probada.

La validación de Storybook (2026-11-15: axe sin violaciones en las 32 historias, en claro y oscuro, e iframes reales de 320 px) se describe en el commit que lo introdujo.
