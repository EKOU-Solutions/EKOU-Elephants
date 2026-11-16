# Auditoría: componentes de Storybook (accesibilidad y feedback del PR #41)

Fecha: 2026-11-16. Objetivo: Storybook de la rama `feature/TASK-05-storybook` (commit `357c072`): los 9 componentes de `src/components/ui/` y los 6 candidatos de `.storybook/catalog/candidates/`, publicados en el [preview del PR #41](https://pr-41-ekou-elephants.ekousolutions.workers.dev/storybook/). Solo lectura: no se modificaron componentes, historias ni la guía.

Alcance pedido: revisar el feedback de Esteban en el [PR #41](https://github.com/EKOU-Solutions/EKOU-Elephants/pull/41) (revisión del 2026-11-16, sobre `15e3ced`) y auditar la accesibilidad de los componentes.

Evidencia:

- **Barrido automático** sobre el preview desplegado: las 35 historias × tema claro/oscuro × 320/390/1024 px (210 renders, Chromium headless).
  - axe-core 4.14.0 con las etiquetas WCAG 2.0/2.1/2.2 A y AA y `best-practice`: **0 violaciones**. Seis renders quedaron en «incompleto» (contraste que axe no puede calcular sobre rellenos y SVG): `DataTable` y el mapa candidato.
  - Foco visible: cada elemento enfocable recibe un estilo de foco distinto del estado normal: **sin fallas**.
  - Desplazamiento horizontal del documento: **ninguno**.
  - Áreas táctiles por debajo de 24 × 24 px (WCAG 2.5.8): **una**.
- **Capturas a 320 px** de todas las historias en los dos temas, y del mapa candidato a 390 y 1024 px.
- **Lectura del código** de `Alert`, `Button`, `Field`, `KeyFigure`, `Counter`, `DataTable`, `shared.tsx` (`RiskMap`) y `CoverageBar` para comprobar cada hallazgo del feedback. Los 10 se confirman.

## Hallazgos

| # | Hallazgo | Evidencia | Pasada(s) de origen | Gravedad | Relación con el brief | Cambio propuesto |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Alert` banner con `onAction` y sin `actionHref` renderiza un `<a>` sin `href`: no recibe foco con teclado, no se anuncia como enlace y el clic no hace nada. | `Alert.tsx:48`: `<a href={actionHref}>` siempre; `onAction` se ignora en la variante banner. (Feedback de Esteban, confirmado.) | Feedback PR #41, accesibilidad (2.1.1, 4.1.2) | Crítica | Excluye a quien navega con teclado o lector de pantalla | Con `actionHref`, enlace; con `onAction`, el mismo `Button` de la variante en línea; si no hay ninguno, no renderizar la acción. |
| 2 | En el mapa candidato, el panel de detalle superpone etiqueta y valor a 320 y 390 px: «Seleccionado» y «Antioquia», «Cobertura» y «120 de 150 (80%)» se pisan y una parte no se lee. | Capturas a 320 y 390 px de `mapa-con-leyenda--antioquia-selected`; a 1024 px se ve bien. axe no lo detecta. | Accesibilidad (1.4.10 reflujo), crítica | Crítica | Celular primero; la cifra exacta es lo que se comparte | En pantallas angostas, poner la etiqueta encima del valor (una columna) o dejar que la etiqueta envuelva sin ancho fijo. Lo mismo ya se había pedido en la auditoría de la ronda 04 (hallazgo 7). |
| 3 | `Field` select no recibe `aria-invalid` ni `aria-describedby`: el error se ve, pero el lector de pantalla no lo anuncia. El texto de ayuda (`help`) no está ligado a ningún control. | `Field.tsx:28` (select sin atributos); `Field.tsx:49` (ayuda sin `id`). `components.json` pide `aria-describedby` hacia el mensaje. (Feedback, confirmado.) | Feedback PR #41, accesibilidad (1.3.1, 3.3.1) | Moderada | Formularios de filtro accesibles | Mismos atributos en `input` y `select`; dar `id` a la ayuda e incluirla en `aria-describedby` (error y ayuda juntos cuando existan). |
| 4 | `Alert` `info` y `success` no tienen `aria-live="polite"`: si aparecen tras una acción («Filtro aplicado»), no se anuncian. Solo `danger` lleva `role="alert"`. | `Alert.tsx:55`; las notas de `.storybook/catalog/shared.tsx` piden `aria-live` polite. (Feedback, confirmado.) | Feedback PR #41, accesibilidad (4.1.3) | Moderada | Confirmar a la persona lo que pasó | `role="status"` (polite) para `info` y `success`; mantener `role="alert"` para `danger`. Documentar en la historia que la región debe existir antes de cambiar su contenido. |
| 5 | `Field` `kind="input"` fija `inputMode="numeric"`: en el celular, un campo de texto (entidad, contratista) abre el teclado numérico. | `Field.tsx:37`. (Feedback, confirmado.) | Feedback PR #41, crítica | Moderada | Celular primero | Recibir `inputMode` como prop, sin valor por defecto. |
| 6 | `Button` en carga reemplaza siempre el texto por «Consultando…», sea cual sea la acción («Descargar CSV» pasa a «Consultando…»). | `Button.tsx:34`. (Feedback, confirmado.) | Feedback PR #41, textos | Moderada | Voz clara: la interfaz dice lo que está haciendo | Prop `loadingLabel`; si no viene, conservar `label`. `aria-busy` ya está bien. |
| 7 | `KeyFigure` arma la frase de contexto con `String(part)` y `String(total)`, sin formato es-CO («12450 de 30000»), y `.replace` solo cambia la primera aparición de cada marcador. | `KeyFigure.tsx:34`. (Feedback, confirmado.) | Feedback PR #41, consistencia del sistema, presentación de datos | Moderada | Las cifras se leen y se comparten bien | `formatNumber(n, 0)` y `replaceAll`. |
| 8 | `Counter` crea su propio `Intl.NumberFormat('es-CO')` (hasta 3 decimales), mientras que `KeyFigure` y el mapa usan `formatNumber` (1 decimal). | `Counter.tsx:16`. (Feedback, confirmado.) | Feedback PR #41, consistencia del sistema | Menor | Un solo formato de cifras | Usar `formatNumber` de `../format`. |
| 9 | `RiskMap` usa IDs fijos (`el-map-title`, `el-hatch`): dos mapas en la misma página duplican IDs y el segundo toma el nombre accesible y la trama del primero. | `.storybook/catalog/shared.tsx:67-70`. (Feedback, confirmado; hoy hay un solo mapa por historia.) | Feedback PR #41, accesibilidad (4.1.2) | Menor | — | `useId()` para el título y el patrón. |
| 10 | `CoverageBar` con todo en 0 anuncia «De 1 contratos» (el `|| 1` contra la división por cero termina en el `aria-label`), y las cifras no usan formato es-CO. | `CoverageBar.tsx:15`. (Feedback, confirmado.) | Feedback PR #41, textos | Menor | Datos faltantes visibles y honestos | Separar el divisor del total mostrado; con total 0, decir «Sin contratos analizados»; usar `formatNumber`. |
| 11 | El enlace de acción del banner de cobertura mide 95 × 23 px, por debajo del mínimo de 24 px de alto. Al ser una acción aparte y no un enlace dentro de una frase, no aplica la excepción. | Barrido de áreas táctiles a 320 px, `alerta--coverage-banner`. | Accesibilidad (2.5.8) | Menor | Celular primero | `min-block-size: 24px` (mejor 44 px en táctil) o relleno vertical en la acción del banner. Se resuelve junto con el hallazgo 1 si pasa a `Button`. |
| 12 | `DataTable` a 320 px: la tabla se desplaza dentro de su contenedor (bien: es una `section` con `aria-label` y `tabIndex=0`), pero el `caption` queda dentro del área desplazable y se corta en el borde. | Captura a 320 px de `tabla-de-datos--ranking` (claro y oscuro). | Accesibilidad (1.4.10), crítica | Menor | La tabla es la alternativa accesible al mapa | Poner el título fuera del contenedor desplazable (o `caption` con `position: sticky; left: 0` y ancho del contenedor). |

Fuera de accesibilidad, y sin cambio de componentes: el override global de `glob` 14.0.3 (feedback de Esteban, `package.json:67`) hoy no rompe las migraciones, porque `node-pg-migrate` solo usa `glob` con comodines. Conviene acotarlo a Storybook o anotar el motivo.

## Decisiones necesarias

Ninguno de los hallazgos choca con decisiones aceptadas (roles azul / ámbar / rojo, trama gris, umbrales sin inventar, «señal, no veredicto»).

Una pregunta de alcance: el mapa (hallazgo 2) y `CoverageBar` son **candidatos**, no componentes del catálogo v1.0. ¿Se corrigen ahora o cuando el mapa pase a `src/components/ui` en la página del mapa (TASK-09)?

## Qué funciona (mantener)

- Cero violaciones de axe en las 35 historias, en los dos temas y en los tres anchos.
- Foco visible en todos los elementos enfocables.
- Ningún desplazamiento horizontal de página de 320 a 1024 px.
- `DataTable` como región desplazable enfocable y con nombre.
- `aria-busy` en el botón en carga.
- Iconos con `aria-hidden`.
- Etiqueta visible en todos los campos.

## Los 3 cambios principales

1. Acción del `Alert` banner: `Button` con `onAction`, enlace solo con `actionHref` (hallazgos 1 y 11).
2. Panel del mapa en una columna en pantallas angostas (hallazgo 2).
3. `Field` accesible y neutro: `aria-invalid` y `aria-describedby` en `select` y en la ayuda, e `inputMode` como prop (hallazgos 3 y 5).

## Comprobaciones que no se hicieron

- **Pasadas omitidas** (el alcance pedido fue accesibilidad y feedback):
  - ajuste al brief;
  - crítica con `design:design-critique` e `impeccable critique`;
  - detector de `impeccable`;
  - `dataviz`;
  - `design:ux-copy`.
- **Lectores de pantalla reales** (VoiceOver, NVDA, TalkBack): no se usaron. Los anuncios de los hallazgos 3 y 4 se deducen de los atributos.
- **Contraste en los rellenos del mapa y de la tabla:** quedó como «incompleto» en axe y no se calculó a mano en esta pasada. La auditoría de la ronda 04 ya midió los rellenos de riesgo.
- **Navegación completa con teclado:** solo se comprobaron el foco visible y el orden en cada historia, no recorridos entre componentes.
- **Zoom de 200 % y espaciado de texto (1.4.12):** no se probaron.

## Estado tras las correcciones (2026-11-16, más tarde)

Corregidos en la rama `feature/TASK-05-storybook` (guía 1.2.0):

- **Ya corregidos:** hallazgos 1, 3, 4, 5, 6, 7, 8, 9, 10, 11 y 12.
  - `Field` se separó en `Input` y `Select`, sobre la base `FormField`.
  - La barra de cobertura pasó a `ProgressBar`.
- **Pendiente:** el hallazgo 2 (panel del mapa a 320 y 390 px), un candidato.
- **Revisión de código posterior**, con tres problemas más que axe no ve, ya corregidos:
  - el `Alert` banner no era región viva;
  - el `Button` perdía el foco al pasar a cargando, y no aceptaba `type` ni `aria-describedby`;
  - el `caption` de `DataTable` se cortaba a 320 px (era el hallazgo 12).
- **Barrido automático de nuevo** (axe-core 4.14.0, 43 historias de `Componentes/UI` × claro y oscuro × 320 y 1024 px):
  - 0 violaciones;
  - sin desbordamiento horizontal;
  - ninguna área táctil por debajo de 24 px;
  - «incompleto» solo en el contraste de los cuadros de `DataTable`.
