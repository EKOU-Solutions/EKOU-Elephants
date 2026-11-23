# Guía del sistema de diseño v1.3

Estado: **Aceptada** (2026-11-08). Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Origen: [Ronda 05: referencia del sistema](../rounds/05-system-reference/README.md). Registro de la decisión: [dirección visual](../visual-direction.md#selección-final-2026-11-08).

Este fue el entregable de TASK-05: una guía en HTML, documentación para desarrollo y agentes de IA, y la skill `elephant-designer`, que construye cada página final a partir de su contrato de API. El 2026-11-08 se descartó Storybook.

> **Actualización 2026-11-15:** se revirtió esa decisión. La referencia visual viva es Storybook (`npm run storybook`). Esta carpeta conserva la fuente de verdad de tokens y catálogo (`tokens.json`, `components.css`, `components.json`, `build.py`), que Storybook importa. La página de referencia `preview.html` y los ejemplos `examples.html` quedan como seguimiento histórico de la v1.0: no se amplían con componentes nuevos.

## Empieza aquí

| Si eres | Lee |
| --- | --- |
| Desarrollo o un agente de IA que implementa interfaz | Storybook (`npm run storybook`), [design-system.md](design-system.md) (reglas), `tokens.css` (impórtalo), [components.json](components.json) (catálogo), `tokens.md` (tabla de tokens) |
| Diseño, o el equipo que revisa lo visual | Storybook: lineamientos, fundamentos y componentes en tema claro y oscuro |
| Quien diseña una página nueva | [Flujo de diseño](../design-flow.md) y la ruta [Construir una página](../../../.claude/skills/elephant-designer/references/build-page.md) de la skill |
| Quien quiere ver la referencia histórica v1.0 | `preview.html` y `examples.html` (pantallas en celular y portátil), después de generarlas |

```sh
python3 docs/design/guide/build.py
open docs/design/guide/preview.html docs/design/guide/examples.html
```

## Qué contiene la v1.0

- La **maquetación editorial** de la Ronda 05: superficie neutra, líneas en lugar de tarjetas, el dato primero.
- **Una sola tipografía: Public Sans 5.3.0**, alojada con la aplicación. Se quitaron el selector A/B de tipografía y los archivos de Source Sans 3 / Source Serif 4.
- Tema claro y oscuro. Los 17 pares de contraste pasan en ambos.
- 9 componentes del núcleo (React, en `src/components/ui/`) y 6 candidatos (ver `components.json`). Al aceptarse eran 9 y 5; ver «Cambios después de la aceptación».
- Tres pantallas de ejemplo (detalle de contrato, lista de resultados, mapa con panel de territorio) dentro de simuladores de iPhone y MacBook.

Qué cambió frente a la Ronda 05, y por qué:

- **Correcciones trasladadas:**
  - El enlace de «pantalla completa» del celular ahora abre la pantalla a 390 px (`screens/phone.html`).
  - El simulador de portátil ya no se desborda a 320 px.
- **Quitado:** la pantalla de obra. Si una obra es una entidad distinta de un contrato se decidirá cuando se defina el modelo de negocio con Esteban, y su página pasará por Construir una página.
- **Agregado:**
  - `components.json` y `design-system.md`.
  - Un `tokens.md` generado.
  - Comprobaciones en el build de que cada clase y cada token del catálogo existen.
- **No adoptado:** la capa visual de la Ronda 06 (lienzo con tarjetas blancas, controles en píldora). Ver el registro de la decisión.

## Cambios después de la aceptación

| Versión | Fecha | Cambio | Decisión |
| --- | --- | --- | --- |
| 1.0.1 | 2026-11-15 | El Mapa con leyenda pasa de núcleo a candidato: la página del Mapa lo confirma o lo ajusta | Jouler |
| 1.1.0 | 2026-11-16 | Los componentes del núcleo son React en `src/components/ui/`, cada uno con su CSS Module; sale la Clave de leyenda (antes la clase `.el-key`). Sin cambios visuales: capturas idénticas antes y después | Jouler |
| 1.2.0 | 2026-11-16 | Correcciones de la revisión del PR #41 y ajustes pedidos por Jouler. El Campo de formulario (`Field`) se separa en `Input` y `Select`, los dos sobre la base `FormField` (etiqueta, ayuda o error y `aria-describedby`), que acepta los atributos nativos. El `Button` recibe el ícono por composición (`icon`, antes `withIcon` con la lupa fija) y un texto de carga propio (`loadingLabel`). La acción del `Alert` es un enlace con `actionHref` o un botón con `onAction`, de al menos 24 px de alto; info y success llevan `role="status"`. Las cifras de `KeyFigure`, `Counter` y la barra de cobertura usan el formato es-CO. Nuevo componente `Icon`, que dibuja un ícono por su nombre (`<Icon name="search" />`) desde un registro único (`icons.ts`: hoy Lucide, mañana otro proveedor o SVG propios sin tocar las pantallas), con trazo de 2 px, decorativo por defecto y con `label` si va solo; se suma `download` al conjunto aprobado. Lo usan por dentro `Button`, `Alert`, `FormField` y `ActiveFilter`. La barra de cobertura pasa de especificación a un componente React puro y reutilizable, `ProgressBar` (sigue como candidato): una pista que se llena por tramos, con valor y color por tramo, que sirve para la cobertura y para el desglose en barras; la leyenda ya no es parte de la barra, la pone la página. Tras auditar los componentes puros: el `Button` acepta los atributos nativos (`type`, `aria-describedby`…) y mientras carga usa `aria-disabled` para no perder el foco; el `Alert` banner también es región viva; el `caption` de `DataTable` queda visible a 320 px. Los títulos de Storybook nombran cada componente con su nombre real en inglés (`Componentes/UI/Button`). Suma dos tokens de tinta (`ink-mid`, `ink-light`, claro y oscuro, con su par de contraste) y las llaves `ink`, `inkMid`, `inkLight` de `LegendKey`; la dirección visual no cambia | Jouler |
| 1.2.1 | 2026-11-16 | El movimiento reducido pasa a ser una regla de la línea base de accesibilidad: `src/styles/global.css` anula animaciones y transiciones con `prefers-reduced-motion`. Sin cambios visuales | Jouler |
| 1.3.0 | 2026-11-16 | Desde la página del Mapa (TASK-09, aprobada el 2026-11-15 en la Aprobación 2). El **Mapa con leyenda** vuelve al núcleo con su **variante neutra**: `el-fill-neutral`, `el-key-neutral`, contorno del conjunto (`el-map-outline`, una sombra en `--el-color-control-border`), contorno al pasar y enfocar, recuadro del archipiélago (`el-map-inset`), nombres de lugar en HTML (`el-map-frame`, `el-map-label`) y botones de zoom (`el-map-zoom`). Nuevo componente **Resultados de búsqueda** (`el-results`, `el-results-empty`, `el-results-status`): hasta 8 lugares con su departamento, bajo un campo de búsqueda. El placeholder del campo pasa a `--el-color-text-muted` (el del navegador daba 3,8:1 en oscuro, por debajo de 4,5:1). Los dos son componentes React de página en `src/modules/mapa/ui/` (`MapWithLegend` con `MapLegend`, y `SearchResults`), con su CSS Module y sus historias (`Componentes/Mapa/…`); sale la especificación candidata de `.storybook/catalog/`. Para construir la página, ajustes compatibles en el núcleo: `Button` solo ícono (`hideLabel`), `Counter` con glosa (`note`) y `layout="adaptive"`, `KeyFigure` en modo cantidad (`value`, con `null` = «Sin datos» con trama), `DataTable` con fila elegida (`currentRowId`) y celdas con contenido, `LegendKey` `neutral`, e íconos `plus`, `minus`, `maximize`, `link` y `arrow-left`. Sin tokens nuevos. Muestras históricas en `preview.html#mapa-neutro` y `preview.html#resultados` | Esteban |
| 1.4.0 | 2026-11-17 | Desde la página del Mapa (TASK-09). **Tokens de movimiento** (decisión 19): `--el-ease-standard` (`cubic-bezier(0.2, 0.7, 0.2, 1)`) y `--el-duration-short` / `-base` / `-long` (300 / 450 / 750 ms), con su página «Fundamentos/Movimiento»; con `prefers-reduced-motion` nada se anima. Nuevo componente del núcleo **`BottomSheet`** (ficha deslizable, `src/components/ui/BottomSheet/`): tres alturas (recogida, media, completa) con un borde que es botón de 44 px y dice la altura, ciclo que siempre vuelve a la media (decisión 27), Escape, anuncios en `role="status"`, lo oculto `inert`, arrastre del borde y del encabezado con ajuste a la altura más cercana; si el encabezado no cabe en la media, se comporta como completa; desde 1024 px, panel fijo de 400 px a la derecha (decisión 22). Elegida la variante A tras la crítica de `elephant-ux` | Esteban Jimenez |
| 1.5.0 | 2026-11-17 | Desde la página del Mapa (TASK-09, especificación del 2026-11-17, boceto A). El **Mapa con leyenda** suma la variante **a pantalla completa** (`variant="fullscreen"`, nuevo `FullscreenMap.tsx` en su carpeta, con sus props de `fullscreenView` en `mapModel.ts`): un solo mapa con tres niveles bajo la ficha, cámara `{x, y, k}` con vuelos que usan `--el-duration-*` y `--el-ease-standard` e interpolan el zoom de forma geométrica (sin vuelo con `prefers-reduced-motion`), encuadre en la zona libre sobre la ficha, un dedo o el ratón siempre arrastran, pellizco y rueda sin Ctrl de 0,7 a 80 veces el país, municipio con tope del 55 % sin que su departamento salga de la pantalla (decisión 20 ampliada) y vecinos atenuados y tocables, contorno del candidato (`--el-color-control-border`, 1,5 px) frente al del elegido (2,5 px), y recuadro de San Andrés y Providencia dentro del mapa en Colombia o fijo en la esquina (68 px) en los demás lugares (decisiones 12c, 20, 23, 24 y 25); nombres del recuadro a ≈11 px en el color del texto (decisión 29); zoom y recuadro de esquina se ocultan cuando la ficha llega a su franja. La lógica pura (encuadre, curva, vuelo, límites de zoom y arrastre, disposición del archipiélago) va en `camera.ts` y `archipelagoInset` (`geometry.ts`), con pruebas. La **`BottomSheet`** suma `onLayoutChange` (cómo se ve y cuánto tapa), sin cambiar su comportamiento. La variante en la página no cambia. Sin tokens nuevos | Esteban Jimenez |
| 1.6.0 | 2026-11-17 | Desde la validación de la pantalla del Mapa (TASK-09, decisiones 30 a 32). **`FormField` / `Input`**: ícono visible dentro del campo (`icon`), ancho completo (`fullWidth`) y etiqueta oculta a la vista (`hideLabel`, solo con un ícono visible; la etiqueta sigue siendo el nombre accesible), excepción a «etiqueta siempre visible» para el buscador que flota sobre el mapa (decisión 30). **`SearchResults`**: variante `floating`, una caja a todo el ancho sobre el mapa con altura máxima, que también dice «Escribe al menos 2 letras.». **`Button`**: `truncate`, etiqueta con puntos suspensivos (migas del mapa a 320 px). **`DataTable`**: `stickyHeader`, encabezado fijo al desplazar la ficha. **`BottomSheet`**: `contentKey`, que no anuncia la altura con la que llega un lugar nuevo (la página ya lo anuncia). **Mapa con leyenda**: `controlsHidden` oculta el zoom y el recuadro de esquina bajo la lista del buscador; sale `transitionName` (View Transitions), reemplazada por el vuelo de cámara. Sin tokens nuevos | Esteban Jimenez |
| 1.6.1 | 2026-11-17 | Desde las páginas generadas de cada lugar (ADR 0003). **`BottomSheet`** suma `prerendered`: la ficha llega a media altura solo con CSS en la página generada y la reemplaza la medida real al montar. **Mapa con leyenda** suma su versión estática (`StaticFullscreenMap`): contorno simplificado del departamento con el lugar marcado y el mismo encuadre que la cámara, sin JavaScript. Sin tokens nuevos. | Esteban Jimenez |
| 1.7.0 | 2026-11-22 | Desde el resumen municipal (TASK-10). **`ProgressBar`** pasa de candidato a núcleo y suma dos tonos de tinta (`mid`, `light`) y `separated` (2 px entre tramos) para repartir un total en tres partes, por ejemplo el gasto por rubro; los tonos no se distinguen solos, cada tramo lleva su nombre y su cifra en texto. Sin cambios de tokens ni de dirección visual | Esteban Jimenez |
| 1.8.0 | 2026-11-23 | Nuevo componente **Tooltip**: nombra lo que señala el puntero, pegado a él (nombre y cifra debajo), solo mouse y `aria-hidden`; se voltea a la izquierda cerca del borde. Lo usa el mapa en lugar del `<title>` nativo de cada territorio (que tardaba y no se podía leer). Sin tokens nuevos | Esteban |

## Archivos

`tokens.json` (fuente de verdad) → `build.py` → `tokens.css`, `tokens.md` y `contrast-report.json`, todos versionados y generados. También escribe `preview.html`, `examples.html` y `screens/`, que se ignoran en git y funcionan sin conexión: la fuente va incrustada y el script de Lucide va en línea. Las otras fuentes son `source.html`, `examples.source.html`, `examples/`, `components.css` y `components.json`. La carpeta `assets/` guarda la fuente con su licencia OFL, Lucide 0.468.0 con su licencia ISC, los trazos del mapa y los territorios ficticios.

La guía anterior (v0.1, basada en la Ronda 02) se conserva como historia en [`../archive/guide-v0.1/`](../archive/guide-v0.1/README.md).

## Fuentes (consultadas el 2026-11-08)

- Tipografía: [`@fontsource-variable/public-sans@5.3.0`](https://cdn.jsdelivr.net/npm/@fontsource-variable/public-sans@5.3.0/), OFL-1.1.
- Íconos: [Lucide 0.468.0](https://lucide.dev), ISC.
- Geografía: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0; procedencia en la [Ronda 01](../rounds/01-territory-overview/README.md#geografía-y-atribución). Todos los valores son ficticios.

## Abierto (fuera de esta guía)

- Umbrales y categorías de riesgo: TASK-07.
- Datos personales: TASK-08.
- Obra frente a contrato como entidades: se decide cuando se defina el modelo de negocio.
- Implementación de producción: el marcado de aquí es una especificación, no una biblioteca de componentes probada.

Validación: [validation.md](validation.md).
