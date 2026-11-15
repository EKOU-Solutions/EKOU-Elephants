# Ronda 05: referencia del sistema

Estado: **Seleccionada (final)** (2026-11-08); consolidada como la [guía del sistema de diseño v1.0](../../guide/README.md) con Public Sans. La [Ronda 06](../06-clean-layer/README.md) se exploró y no se seleccionó. Fecha: 2026-11-08. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Anterior: [Ronda 04](../04-grounded-guide/README.md); auditoría: [2026-11-08](../../audits/2026-11-08-round-04.md); brief: [descubrimiento](../../discovery/brief.md).

> Desde el 2026-11-15 la referencia viva del sistema es Storybook (`npm run storybook`). Esta ronda se conserva como historia.

## Comentarios atendidos

Revisión de Jouler sobre la Ronda 04 (2026-11-08):

- Los fundamentos, los componentes y «cifras y etiquetas» no eran lo bastante claros para construir a partir de ellos. El sistema debe ser claro y fácil de digerir para desarrollo, UX y UI.
- Tipografía: debe ser legible y alojada en el proyecto (la fuente del sistema cambia según la plataforma); se descarta el cero tachado de Atkinson para los números. Se pueden proponer dos opciones.
- Trama gris para los datos faltantes: se mantiene, confirmada como clara.
- El titular nacional pertenece a la futura página del Mapa, no al sistema de diseño; los textos de ejemplo deben usar el tono directo y movilizador acordado.
- Reordenar los colores de riesgo y agregar un tema oscuro; se usarán ambos temas.
- Formato: Storybook o una vista previa HTML por ronda; los dos sirven.

Revisión de seguimiento (2026-11-08, el mismo día):

- Las etiquetas de riesgo, los contadores y el panel del mapa no se destacaban; la jerarquía de la información debe hacer evidente la etiqueta de riesgo.
- El panel del mapa se veía serio, pero no profesional, actual ni llamativo.
- Integrar los componentes en pantallas reales en una página aparte, mostradas en simuladores realistas de celular y portátil, para juzgar qué funciona.
- Las alertas necesitaban otro estilo y variantes; el destacado Display debe ser azul y de ancho completo.

## Hipótesis

Una referencia organizada como documentación de componentes (una página, índice lateral y la misma plantilla para cada pieza) permite que desarrollo, UX y UI construyan sin interpretar, y mantiene rápida la iteración.

## Decisiones tomadas en esta ronda

- **Formato: vista previa HTML por ronda ahora, Storybook después.** El arquetipo de React (TASK-04) todavía no está integrado; una página estática itera más rápido. `tokens.css` se genera para que la app pueda importar las mismas variables cuando exista, y el marcado y las clases de cada bloque «Código» corresponden a futuros componentes React.
- **Plantilla por pieza:** qué es · muestra con variantes y estados · cuándo usarla · tokens · hacer / evitar · código · accesibilidad.
- **Índice:** Inicio (cómo usarla, principios) · Fundamentos (color, tipografía, espacio y forma, íconos, voz y tono) · Componentes (botón, alerta, campo de formulario, etiqueta de riesgo, contador, filtro activo, cifra destacada, tabla de datos, mapa con leyenda).

- **Etiqueta de riesgo rellena:** el color de riesgo como fondo, texto `--el-color-on-risk-*` (≥ 4,5:1 en ambos temas) y un glifo de nivel de tres barras (1, 2 o 3 barras llenas; punteadas para «Sin datos»), para que el nivel se lea sin color. Dos tamaños: normal (listas, tablas, mapa) y grande (una vez, arriba de una página de detalle).
- **El rojo significa solo «riesgo alto».** Los conteos y las barras de «Con señales» usan tinta (`.el-key-flagged`), no el rojo de riesgo, para que una marca roja nunca contradiga el nivel del territorio.
- **Contador:** bloques de cifra (número grande sobre su etiqueta) en lugar de texto en línea.
- **Alertas:** el color va solo en el distintivo del ícono y en el borde; el texto, en tinta. Tres variantes: banner de página, alerta en línea y nota compacta.
- **Componentes candidatos** que trajeron los ejemplos (revisar antes de adoptarlos): píldora de estado (`.el-status`), barra de cobertura con trama para «sin analizar» (`.el-coverage`), barras horizontales (`.el-bars`), avance frente a lo esperado (`.el-progress`) y fila numerada de señal (`.el-signal`).

## Página de ejemplos

`examples.html` muestra cuatro pantallas construidas solo con el sistema: detalle de contrato, lista de resultados, mapa con panel territorial y detalle de obra pública. Cada una aparece en un simulador tipo iPhone (390 × 844) junto a un simulador tipo MacBook (ventana de navegador de 1280 × 800), con las preguntas para juzgarla encima. Los selectores de tema y de tipografía se aplican a todas las pantallas. Las pantallas se generan a partir de los fragmentos `examples/*.html` con `examples/app.css` (estructura de la app y composiciones, no componentes del sistema).

## Propuestas pendientes de decisión

| Tema | Propuesta |
| --- | --- |
| Tipografía A | **Public Sans** 5.3.0 (USWDS), una sola familia para todo; cero sin tachar; OFL 1.1; ~27 KB |
| Tipografía B | **Source Sans 3** 5.3.1 para la interfaz + **Source Serif 4** 5.3.1 para títulos y cifras destacadas; cero sin tachar; OFL 1.1; ~80 KB |
| Rellenos de riesgo, claro | `#7FB4D4` bajo · `#CF8721` intermedio · `#A93F39` alto: la luminosidad baja de bajo a alto |
| Rellenos de riesgo, oscuro | `#34708F` bajo · `#C08A2E` intermedio · `#F4A397` alto: orden invertido para que el riesgo alto sea el más visible sobre una superficie oscura |
| Tema oscuro | Conjunto completo de tokens en `tokens.json` → `tokens.css`; sigue al dispositivo por defecto, con un selector manual (`data-theme`) |

Las dos tipografías se pueden cambiar en vivo en la vista previa. `tokens.css` usa la A por defecto hasta que el equipo elija.

Sin cambios: los roles azul / amarillo / rojo cálido, la trama gris para los datos faltantes, ningún umbral inventado (el reparto de categorías de la muestra del mapa es ilustrativo y está rotulado) y «una señal, no un veredicto».

## Archivos y cómo reproducirla

- `source.html`: la página de referencia (textos del producto en español).
- `components.css`: estilos de los componentes, compartidos por la referencia y los ejemplos.
- `examples.source.html`, `examples/`: la página de ejemplos, sus fragmentos de pantalla y el CSS de la estructura de la app.
- `tokens.json`: fuente de verdad de ambos temas, la tipografía, el espacio y la geometría.
- `build.py`: solo biblioteca estándar de Python. Escribe `tokens.css` y `contrast-report.json` (versionados) y `preview.html`, `examples.html` y `screens/*.html` (ignorados, independientes, sin conexión, con las fuentes incrustadas).
- `assets/fonts/`: archivos woff2 latin variables fijados, con sus licencias OFL; `assets/`: copias propias de los trazos del mapa y del fixture ficticio.
- Lucide se reutiliza desde `../../guide/assets`.

```sh
python3 docs/design/rounds/05-system-reference/build.py
```

## Fuentes (consultadas el 2026-11-08)

- Tipografías vía Fontsource: [`@fontsource-variable/public-sans@5.3.0`](https://cdn.jsdelivr.net/npm/@fontsource-variable/public-sans@5.3.0/) (publicada el 2026-07-19), [`@fontsource-variable/source-sans-3@5.3.1`](https://cdn.jsdelivr.net/npm/@fontsource-variable/source-sans-3@5.3.1/) y [`@fontsource-variable/source-serif-4@5.3.1`](https://cdn.jsdelivr.net/npm/@fontsource-variable/source-serif-4@5.3.1/) (publicadas el 2026-10-11), todas OFL-1.1.
- Geografía: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0; procedencia en la [Ronda 01](../01-territory-overview/README.md#geografía-y-atribución). Todos los valores son ficticios.

## Validación

Ver `validation.md`.

## Resultado de la revisión (2026-11-08)

- Tipografía: se eligió **Public Sans** (propuesta A).
- La barra «Pagado» de la pantalla de obra se queda en rojo como alerta.
- Los componentes candidatos entran a la referencia solo después de aprobarlos.
- Error: el enlace de «pantalla completa» del celular abría la composición de escritorio (corregido en la Ronda 06).
- A la página de obra le falta claridad y calma visual; hay que revisar la arquitectura de información de obra frente a contrato.
- Siguiente: una capa visual más limpia, al estilo de Apple, que conserve esta arquitectura y jerarquía ([Ronda 06](../06-clean-layer/README.md)).
