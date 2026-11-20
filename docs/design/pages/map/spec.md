# Página del mapa · Especificación

> Paso 2b de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md). Estado: **aprobada (Aprobación 1) el 2026-11-17** por el usuario, tras probar el boceto interactivo en celular y escritorio y acoger la crítica de `elephant-ux`. Reemplaza la especificación aprobada el 2026-11-15 (queda en el historial de Git, commit `7a4818d`), sobre el boceto **A** elegido por Jouler el 2026-11-16: [bocetos.html](bocetos.html) y [prototipo-a.html](prototipo-a.html). Contrato: [contract.md](contract.md) (aprobado 2026-11-15, sin cambios). Datos: [data.md](data.md).

## 1. Propósito

**Pregunta (alcance de TASK-09):** «¿Dónde se firmaron los contratos públicos de Colombia, y cuántos hay en mi departamento o municipio?»

La pregunta de la referencia tentativa («¿cómo se compara mi territorio, dónde debería mirar?») necesita el riesgo, que no está en este contrato. Esta página dibuja la capa de lugares que TASK-13 y TASK-14 colorearán después.

**Principios del pedido (Jouler, 2026-11-16):** una sola pantalla, sin navegar entre páginas. El mapa es el protagonista. Limpia, bien animada, interactiva, con arrastre y con información clara.

**Audiencia:** público general en celular (por defecto), que suele llegar por un enlace compartido a un municipio; periodistas en escritorio que necesitan la cifra exacta, la fuente y la fecha.

**Prueba de 10 segundos:** en el celular, en 10 segundos la persona puede decir: (1) que es un mapa de Colombia por departamentos; (2) cómo llegar a su territorio (tocarlo o buscarlo); (3) que el mapa todavía no califica a nadie. Si llega por el enlace de un municipio, lee su nombre y su cifra sin tocar nada. La prueba del brief («dónde se concentran las señales») aplica cuando llegue el riesgo.

## 2. Contenido y jerarquía

**Una sola pantalla con tres estados** del mismo mapa: Colombia, departamento y municipio. El mapa ocupa toda la pantalla y nunca se va; la información vive en una **ficha** que sube desde abajo y cambia en su sitio. La ficha tiene tres alturas:

- **Recogida:** solo el rótulo y el título.
- **Media:** el encabezado completo de la ficha. Es la altura al llegar y después de cada cambio de lugar.
- **Completa:** el cuerpo con cifras, tabla y fuentes, con su propio desplazamiento.

Esquema de títulos, igual en los tres estados: un `h1` en el encabezado de la ficha (el lugar), y `h2` para cada sección del cuerpo.

### Siempre a la vista (sobre el mapa)

| Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| A | Buscador arriba, a todo el ancho: «Busca tu municipio o departamento», hasta 8 resultados «Municipio, Departamento» | `municipios[].nombre`, `departamento.nombre`, `departamentos[].nombre` | Input + Search results | `--el-control-height`, `--el-color-control-border`, `--el-color-surface` | Mensaje de búsqueda vacía | MVP |
| B | Migas bajo el buscador: «← Colombia» y, en un municipio, el nombre de su departamento | `departamento.codigo`, `departamento.nombre` | Button (secundario) | `--el-control-height` | — | MVP |
| C | Controles de zoom a la derecha: «Acercar», «Alejar» y «Ver todo» (este, solo con el mapa acercado o movido) | — | Map with legend · zoom | `--el-control-height` | — | MVP |
| D | Recuadro «San Andrés y Providencia»: las dos islas **ampliadas**, con su forma, a escala uniforme y sin deformar, en un marco punteado con su nombre. **En Colombia** va dentro del mapa, en su posición geográfica aproximada (en el Caribe, al noroeste del continente), y se mueve con él. **En cualquier otro departamento o municipio** queda fijo en la esquina superior izquierda de la pantalla, bajo las migas (68 px de ancho), como mapa de referencia; un toque lleva al archipiélago. Dentro del archipiélago no aparece (decisiones 12, 23 y 24) | geometría `municipios` 88001 y 88564 | Map with legend · recuadro | `--el-color-control-border` (marco punteado), `--el-color-line` | — | MVP |

### Colombia (`/mapa`)

| Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mapa de los 33 departamentos a pantalla completa, encuadrado en la zona libre sobre la ficha: relleno neutro, contorno del país | geometría `departamentos`, `codigo` | Map with legend · pantalla completa (paso 3) | `--el-color-line`, `--el-color-map-border`, `--el-color-control-border` | Nunca nulo en este nivel | MVP |
| 2 | Ficha recogida: rótulo «Mapa de contratación pública» + `h1` «7.456.749 contratos públicos firmados en Colombia» | `nacional.contratos` | Ficha deslizable (nueva) | `--el-size-title-mobile`, `--el-color-text-muted` | Estado de error | MVP |
| 3 | Ficha media: «Del 1 ene 2021 al 7 nov 2026. Elige un departamento. Este mapa todavía no mide riesgo.» + línea de fuente y fecha + botón «Ver cifras, tabla y fuentes» | `ventana`, `fechaCorte`, `fuentes[]` | Ficha, Button | `--el-size-small` | — | MVP |
| 4 | Ficha completa, `h2` «Dónde quedó cada contrato»: en un municipio / sin municipio identificado / sin lugar identificado, cada una con su glosa (decisión 18: detrás de un toque) | `nacional.contratosEnMunicipios`, `contratosSoloDepartamento`, `contratosSinLugar` | Counter | `--el-color-line` | Estado de error | MVP |
| 5 | `h2` «Contratos por departamento, 2021 – 7 nov 2026»: tabla en orden alfabético con «En municipios» y «Sin municipio»; cada nombre lleva a su departamento | `departamentos[]` | Data table | `--el-color-line`, `--el-rule-strong` | — | MVP |
| 6 | `h2` «Fuentes»: fuentes completas con licencia y fecha | `fuentes[]`, `fechaCorte` | Key figure · línea de fuente | `--el-color-text-muted` | — | MVP |

### Departamento (`/mapa/departamento/05`)

| Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | El mapa vuela al departamento: sus municipios aparecen, los demás departamentos quedan atenuados alrededor y se pueden tocar; contorno del departamento | geometría `municipios` por prefijo de `codigo`; `contratosUbicados` | Map with legend · pantalla completa + `el-fill-unknown` | `--el-color-line`, `--el-color-surface-subtle` (atenuado), `--el-color-unknown`, `--el-color-unknown-surface` | Trama + «Sin datos» | MVP |
| 2 | Ficha recogida: rótulo «DANE 05» (decisión 28) + `h1` «Antioquia» | `departamentos[].nombre`, `codigo` | Ficha | — | — | MVP |
| 3 | Ficha media: «**X** contratos en sus municipios y **Y** sin municipio identificado, del 1 ene 2021 al 7 nov 2026. Elige un municipio.» + fuente + leyenda «Sin datos» si el departamento tiene algún nulo + «Ver tabla y fuentes» | `contratosEnMunicipios`, `contratosSoloDepartamento`, `ventana`, `fechaCorte` | Ficha, Legend key, Button | — | 0 se muestra como 0 (medido) | MVP |
| 4 | Ficha completa: `h2` «Dónde quedó cada contrato» (dos cifras), `h2` tabla de sus municipios en orden alfabético, `h2` «Fuentes» | `municipios[]` del departamento | Counter, Data table | `el-num` | «Sin datos» con la trama en la celda, nunca 0 | MVP |

### Municipio (`/mapa/05001`: toque, búsqueda o enlace compartido)

| Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **El mismo foco que un departamento, con tope** (decisión 20): el mapa vuela al municipio y lo deja ocupando como máximo cerca del 55 % de la zona libre; sus vecinos y el resto del departamento quedan **atenuados alrededor** y se pueden tocar; el elegido conserva el relleno, lleva el contorno fuerte, se dibuja encima y lleva su nombre en un rótulo | `codigo`, `nombre` | Map with legend · seleccionado | `--el-color-line` (relleno del elegido), `--el-color-surface-subtle` (atenuado), `--el-color-text` (contorno), `--el-size-small` | Si la geometría no tiene su forma, se queda el encuadre del departamento | MVP |
| 2 | Ficha recogida: rótulo «Antioquia · DANE 05001» (decisión 28) (+ «· Área no municipalizada» / «· Isla») + `h1` «Medellín» | `nombre`, `departamento.nombre`, `codigo`, `tipo` | Ficha | — | — | MVP |
| 3 | Ficha media: cifra clave «356.935» y «contratos firmados del 1 ene 2021 al 7 nov 2026 y ubicados en Medellín» + fuente + «Copiar enlace» + «Ver Antioquia y tabla» | `contratosUbicados`, `ventana`, `fechaCorte`, `fuentes[]` | Key figure, Button | `--el-size-figure-mobile` | Trama + «Sin datos» + «No encontramos contratos ubicados con certeza en este lugar del 1 ene 2021 al 7 nov 2026.» | MVP |
| 4 | Ficha completa: `h2` con el departamento, sus dos cifras y la tabla de sus municipios (la fila elegida marcada con peso, no con color), `h2` «Fuentes» | como en el departamento | Counter, Data table | — | — | MVP |

**Bogotá, D.C.** (decisión 4): elegir el departamento 11 lleva directo al municipio 11001; la miga muestra solo «← Colombia»; la cifra «en sus municipios» no se repite y queda «registrados solo como Bogotá, D.C. (departamento)». El buscador lista Bogotá una vez.

## 3. Comportamiento

**Llegar y volver.** Cada estado tiene su dirección: `/mapa`, `/mapa/departamento/05`, `/mapa/05001`. Abrir el enlace muestra lo mismo que veía quien lo compartió, con la ficha a media altura. Cada cambio de lugar agrega una entrada al historial, y el botón Atrás del navegador vuelve al estado anterior con el vuelo inverso. Se vuelve con las migas, con «Ver todo» o alejando el mapa: alejar desde un departamento hasta cerca del encuadre del país vuelve a Colombia.

**Gestos sobre el mapa** (decisión 12c, revisada):

- **Un dedo o el ratón siempre arrastran el mapa**, a cualquier zoom; cursor `grab` / `grabbing`. La página nunca se desplaza.
- **Dos dedos, la rueda o «+» / «−» acercan y alejan** alrededor del punto. Con la rueda no hace falta Ctrl, porque ya no hay página que desplazar. **En un trackpad,** deslizar con dos dedos mueve el mapa y pellizcar (Ctrl) acerca y aleja; la rueda del mouse sigue acercando (revisión del PR #47, 2026-11-20).
- **Un toque sin moverse elige** el lugar tocado; un arrastre de más de 6 px nunca elige. En un departamento, tocar un municipio lo elige y tocar otro departamento atenuado va a ese departamento.
- Con la ficha completa, tocar el mapa la baja a media altura en lugar de elegir.

**La ficha** (componente nuevo, paso 3):

- Se mueve **solo desde su borde y su encabezado**. El cuerpo se desplaza por dentro únicamente con la ficha completa, así que mapa, ficha y tabla nunca se disputan el mismo gesto.
- Al soltar, se ajusta a la altura más cercana; un movimiento rápido la empuja una altura más.
- Nunca depende del arrastre: el borde es un botón de 44 px, cuyo nombre dice la altura actual («Ficha a media altura. Cambiar altura»), y que con un toque, Enter o Espacio mueve la ficha un paso, siempre volviendo a la media: media → completa → media → recogida → media (decisión 27). Escape baja la completa a la media. Cada cambio se anuncia en `role="status"`, y si el foco estaba en una parte que queda oculta, pasa al borde. En la altura recogida, todo lo que no se ve es `inert`; si el encabezado no cabe en la altura media (celular horizontal, texto al 200 %), la ficha se comporta como completa, con desplazamiento; la media nunca pasa de la completa menos 68 px, para que siempre se vea más mapa que en la completa. Si la ficha se ve completa por eso, el borde dice «Ficha completa», el ciclo es completa ↔ recogida y el botón del encabezado dice «Volver al mapa». Con la ficha completa, arrastrar el encabezado hacia arriba desplaza el cuerpo; hacia abajo, con el cuerpo arriba del todo, mueve la ficha. Los botones del encabezado van en una sola fila desde unos 360 px; a 320 px bajan a dos filas (usuario, 2026-11-17). El botón rotulado «Ver cifras, tabla y fuentes» abre la ficha completa y, abierta, pasa a decir «Volver al mapa».
- Con la ficha recogida o media, el cuerpo es `inert` (fuera del orden de tabulación); con la completa, entra.
- Alturas: la recogida y la media se miden de su contenido; la completa deja visibles 68 px de mapa **debajo del buscador** (crítica de `elephant-ux`, 2026-11-17: medidos desde arriba, el buscador los tapaba). Con la ficha completa se ocultan las migas, el zoom, el recuadro y el rótulo, que quedarían cortados.

**Cámara.**

- Cada lugar se encuadra en la **zona libre sobre la ficha**, debajo del buscador y las migas, y a la izquierda de los controles de zoom.
- Si la persona no ha movido el mapa, este se vuelve a encuadrar cuando la ficha cambia de altura; si lo movió, se respeta su encuadre hasta «Ver todo».
- El zoom va de 0,7 a 80 veces el encuadre del país.
- **Municipios pequeños:** el vuelo al municipio los deja grandes (decisión 20), y el pellizco sirve para cualquier otro.

**Vuelos** (decisiones 15 y 19):

| Transición | Token de duración | Valor |
| --- | --- | --- |
| Colombia ↔ departamento, o cambio de departamento | `--el-duration-long` | 750 ms |
| Departamento ↔ municipio, municipio ↔ municipio, «Ver todo» | `--el-duration-base` | 450 ms |
| Ficha que cambia de altura, botones «+» / «−» | `--el-duration-short` | 300 ms |

- Todos usan `--el-ease-standard`, `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- El vuelo interpola el zoom de forma geométrica (no lineal), para que acercar 20 veces no se sienta como un salto.
- Los municipios de un departamento aparecen con un fundido de `--el-duration-short`.
- Reemplaza la transición con View Transitions de la decisión 15.

**Foco y anuncios.**

- Tras elegir con el buscador o la tabla, el foco va al `h1` de la ficha. Tras un toque en el mapa, se queda en el mapa. Con las migas, se queda en la miga; si la miga tocada desaparece, el foco pasa a «← Colombia», y ya en Colombia, al `h1`.
- Tras «Ver todo», el foco va a «Acercar».
- Una región `role="status"` anuncia «Seleccionado: Medellín, Antioquia», el número de resultados de la búsqueda y «Enlace copiado».

**Mapa accesible.** El mapa es `role="img"` con una etiqueta que remite a la tabla de la ficha. La tabla es la ruta de teclado a cada lugar. El paso del puntero, el foco y el dedo apoyado muestran en el lugar candidato un contorno menos fuerte que el del elegido (decisión 25), nunca un cambio de opacidad, y nada depende del paso del puntero: es un aviso, el toque elige igual sin él.

**`prefers-reduced-motion`:** el mapa cambia de encuadre de una vez, la ficha salta a su altura y los municipios aparecen sin fundido. Ningún contenido depende de una animación.

## 4. Estados

| Estado | Qué ve la persona |
| --- | --- |
| Carga | El mapa en `--el-color-surface-subtle` con el contorno del país si ya llegó la geometría; la ficha a media altura con «Cargando el mapa…» en `role="status"` |
| Municipio `null` | Trama en la forma y en la cifra clave, «Sin datos» + el motivo. Nunca 0 ni «sin contratos» |
| Búsqueda vacía | «No encontramos «texto». Revisa la escritura o elige el departamento en el mapa.» |
| Enlace compartido inválido (400 / 404) | Ficha media con Alert (aviso): «Ese enlace no corresponde a un municipio de Colombia.» + Button «Ver el mapa de Colombia»; el mapa muestra Colombia |
| 503 `corte_no_disponible`, 404 `geometria_no_encontrada`, 500 | Ficha media con Alert (peligro): «Los datos del mapa no están disponibles en este momento.» + Button «Reintentar»; el mapa vacío, sin cifras |
| Dos cortes distintos en las respuestas | Se piden de nuevo sin caché; si siguen distintos, el estado 503 (regla del PR #29) |
| Fase 2 | Nada reservado ni en gris para el riesgo: simplemente no está |

## 5. Maquetación

- **Celular (390 px, desde 320):** el mapa ocupa `100dvh` a todo el ancho; el buscador y los controles flotan sobre él con 12 px de margen; la ficha ocupa todo el ancho, con borde superior `--el-rule-strong` y esquinas superiores redondeadas, sin sombra. A 320 px las migas recortan el nombre largo con puntos suspensivos (el nombre completo está en el `h1`).
- **Escritorio (desde 1024 px):** la ficha pasa a ser un **panel fijo a la derecha** de 400 px, a toda la altura, separado del mapa por una línea `--el-rule-strong`, sin alturas ni borde que arrastrar (encabezado y cuerpo seguidos, con desplazamiento propio); el buscador va arriba del panel. El mapa ocupa el resto a la izquierda y se encuadra en él; las migas quedan arriba a la izquierda del mapa, los controles de zoom arriba a la derecha del mapa (junto al panel) y el recuadro del archipiélago como en celular (decisiones 23 y 24).
- **Entre 600 y 1023 px:** la ficha deslizable con un ancho máximo de 560 px, centrada.
- Separaciones con líneas, nunca tarjetas ni sombras. Solo tokens `--el-*`. Dos temas.

## 6. Textos (es-CO)

Se conservan los textos aprobados el 2026-11-15 (titular, ventana, glosas de las cifras, fuente, títulos de tabla, «Elige» en lugar de «Toca»). Nuevos:

- Ficha en Colombia: «Del 1 ene 2021 al 7 nov 2026. Elige un departamento. Este mapa todavía no mide riesgo.»
- Línea de fuente en departamento y municipio: «Fuentes: SECOP II y SECOP I, DANE. Datos al 7 nov 2026. Este mapa todavía no mide riesgo.» (crítica de `elephant-ux`: quien llega por el enlace de un municipio, el caso principal, no veía la nota).
- Botones de la ficha: «Ver cifras, tabla y fuentes» (Colombia) · «Ver tabla y fuentes» (departamento) · «Ver Antioquia y tabla» (municipio) · «Volver al mapa» (ficha completa).
- Borde de la ficha: su nombre dice la altura que se ve: «Ficha recogida. Cambiar altura» · «Ficha a media altura. Cambiar altura» · «Ficha completa. Cambiar altura» (sección 3).
- En escritorio (panel) no hay alturas: los botones «Ver … y tabla» / «Volver al mapa» no se muestran, porque la tabla ya está a la vista en el panel.
- Leyenda en la ficha, solo si hay nulos: «Sin datos: no hay contratos ubicados con certeza». Nota de riesgo: «Todavía no hay color por riesgo. Gris no quiere decir «sin problemas».» (en «Fuentes»).

Nunca «corrupción», «robo» ni «sospechoso»; nunca nombres de personas naturales. Las cifras usan punto de miles y siempre llevan sustantivo.

## 7. Decisiones

Siguen vigentes, de la especificación del 2026-11-15: **1** relleno neutro con `--el-color-line` · **2** tabla en orden alfabético, sin ordenar · **3** buscador con Search results · **4** Bogotá directo a 11001 · **5** municipios pequeños con pellizco y botones · **6** sin enlace a metodología · **7** «Copiar enlace» · **8** ejemplos del contrato · **9** contornos en `--el-color-control-border` · **10** rótulos solo del elegido, el archipiélago y Bogotá · **11** trama de «Sin datos» sin cambios · **11b** `h1` con el nombre del municipio · **12** archipiélago en un panel a la misma escala · **12b** la forma con foco se dibuja encima · **14** sin colores de riesgo en la vista real.

Cambian o se agregan (usuario, 2026-11-17):

| # | Pregunta | Decisión |
| --- | --- | --- |
| 12c | Arrastrar (revisada) | **Un dedo siempre arrastra el mapa**, a cualquier zoom, porque la página ya no se desplaza; dos dedos o la rueda (sin Ctrl) acercan. «Ver todo» solo con el mapa acercado o movido; después de usarlo, el foco va a «Acercar» |
| 13 | Listas de navegación | Sigue retirada (2026-11-16) |
| 15 | Zoom entre vistas (reemplazada) | Un vuelo de cámara sobre el mismo mapa, no View Transitions entre dos vistas. Duraciones y curva de la sección 3 |
| 16 | Municipio dibujado solo (reemplazada por la 20) | — |
| 17 | Experiencia (Jouler, 2026-11-16) | **Boceto A**: mapa a pantalla completa y ficha deslizable de tres alturas; un solo estado de página con tres niveles |
| 18 | Cifras de cobertura | **Detrás de un toque rotulado** («Ver cifras, tabla y fuentes»); la ficha media trae el titular, la ventana y la fuente |
| 19 | Movimiento | **Tokens nuevos en la guía:** `--el-ease-standard` y `--el-duration-short` / `-base` / `-long` (300 / 450 / 750 ms), con su página MDX; versión menor de la guía por su proceso de cambio |
| 20 | Encuadre del municipio (revisada dos veces el mismo día; la última, por la crítica de `elephant-ux`: llenando todo el mapa se perdía dónde queda el municipio y la forma simplificada se veía tosca) | **El mismo tratamiento que un departamento, con tope de zoom:** el municipio ocupa como máximo cerca del **55 %** de la zona libre, así que se ven el contorno del departamento y varios vecinos alrededor. **Y el departamento sigue a la vista** (usuario, 2026-11-17, por la revisión de `elephant-ux`: en escritorio Medellín llenaba la pantalla y no se veía Antioquia): si el departamento entero cabe en la zona libre, el zoom no lo deja salir; en los municipios pequeños manda el departamento y el municipio se ve más chico. Sus vecinos quedan atenuados alrededor (como los demás departamentos en la vista de departamento) y se pueden tocar para cambiar de municipio. El elegido conserva su relleno, con contorno fuerte y rótulo. Ningún municipio se dibuja solo |
| 21 | Relleno mientras no hay riesgo | **Neutro hasta TASK-07** (confirma la 1 y la 14) |

## 8. Componentes para el paso 3

| Componente | Cambio | Necesita aprobación |
| --- | --- | --- |
| Ficha deslizable (`BottomSheet`, `src/components/ui/`) | **Nuevo**, por `/crear-componente`: tres alturas, borde arrastrable que es botón, cuerpo `inert` fuera de la altura completa, panel lateral desde 1024 px, tokens de movimiento | Sí |
| Map with legend | Variante a pantalla completa: cámara con vuelo, arrastre con un dedo, pellizco y rueda, encuadre en una zona libre, departamentos atenuados alrededor, rótulo del elegido, recuadro del archipiélago flotante | Sí |
| Tokens de movimiento | Nuevos en `tokens.json` + `.storybook/docs/` (decisión 19) | Sí (proceso de cambio de la guía) |
| Input, Search results, Button, Counter, Key figure, Data table, Alert, Legend key | Se usan como están | No |

## 9. Preguntas abiertas

Ninguna. Resueltas por el usuario el 2026-11-17:

| # | Pregunta | Decisión |
| --- | --- | --- |
| 22 | Escritorio | **Panel lateral derecho** de 400 px a toda la altura, con el mapa a la izquierda (sección 5) |
| 23 | Archipiélago fuera de Colombia (revisada el mismo día por el usuario: con el recuadro solo en Colombia, las islas desaparecían al entrar a otro departamento) | **Recuadro fijo en la esquina superior izquierda** de la pantalla en todo departamento o municipio que no sea el archipiélago, con las islas visibles (nunca una caja vacía) y su nombre; un toque lleva al archipiélago. El mapa reserva esa columna (88 px) igual que la de los controles de zoom, para que el lugar elegido no quede debajo |
| 25 | Aviso de cambio de lugar (usuario, 2026-11-17) | Con un departamento o un municipio elegido, **el lugar al que te vas a pasar se delinea con un contorno menos fuerte** que el del elegido: `--el-color-control-border` a 1,5 px, frente a `--el-color-text` a 2,5 px del elegido. Aplica a los vecinos atenuados y a los demás departamentos. Aparece con el puntero encima y, en pantallas táctiles, mientras el dedo está apoyado (se quita si el toque se vuelve arrastre). El candidato se dibuja encima de sus vecinos, pero el elegido sigue encima de todo (decisión 12b), así que los dos contornos nunca se tapan. Solo cambia el contorno, nunca la opacidad ni el relleno. El marco punteado del recuadro del archipiélago nunca sube al frente: taparía las islas |
| 26 | Contratos sin municipio (usuario, 2026-11-17, por la crítica de `elephant-ux`) | Cambia el texto aprobado el 2026-11-15 «solo en el departamento» por **«sin municipio identificado»** en la ficha media, las cifras y la tabla («Sin municipio»): sin la glosa, «8.565 solo en el departamento» se podía leer como «solo hay 8.565 contratos». La glosa se mantiene: «sabemos el departamento, no el municipio». En Bogotá: «registrados solo como Bogotá, D.C. (departamento)» se mantiene |
| 29 | Texto del recuadro de las islas (usuario, 2026-11-17, por la revisión de `elephant-tester`) | **Excepción a los 14 px:** solo los nombres dentro del recuadro del archipiélago (en el mapa y en la esquina) miden ≈11 px (`calc(var(--el-size-small) * 0.8)`), en `--el-color-text`, porque en 68 px no cabe más. El mismo nombre sale completo en la ficha |
| 30 | Etiqueta del buscador (usuario, 2026-11-17, por la validación de `elephant-ux` y `elephant-tester`) | **Excepción a «etiqueta siempre visible»:** la etiqueta del buscador del mapa queda oculta a la vista (sigue siendo su nombre accesible), con una **lupa visible** y el texto de ayuda «Busca municipio o departamento», que cabe a 320 px. Se hace con una opción documentada de `FormField` (ocultar la etiqueta solo con un ícono visible), nunca con CSS de la página. Gana el alto que el mapa necesita en el celular |
| 31 | Bogotá en la ficha completa (usuario, 2026-11-17, por la validación de `elephant-ux`) | En Bogotá el botón dice **«Ver más cifras y fuentes»** y la ficha completa no lleva tabla: quedan la cifra de contratos «registrados solo como Bogotá, D.C. (departamento)» y las fuentes. Una tabla de una sola fila repetía la cifra clave |
| 32 | Pantallas bajas (usuario, 2026-11-17, por la validación de `elephant-ux`) | Si con la ficha a media altura al mapa le quedan menos de unos **160 px** libres (p. ej. 320×640), la ficha llega **recogida**: se ven el nombre, el lugar en el mapa y el borde para subirla. Se mide el espacio libre real, no el ancho: a 375×667 llegan recogidos Bogotá y los nombres más largos (su ficha es más alta); Medellín y los departamentos, a media altura (confirmado por el usuario el mismo día) |
| 33 | Entrada en celular (revisión del PR #47, 2026-11-20) | En el celular, **Colombia entra con la ficha recogida** para que el mapa sea lo primero; al elegir un departamento o municipio, la ficha sube a media altura. Un enlace directo a un lugar sigue abriendo a media altura (decisión 32 manda si no cabe). El panel de escritorio no tiene alturas. Reemplaza «la ficha a media altura» de Colombia en la sección «Llegar y volver» |
| 34 | Mapa centrado en celular (misma revisión) | Sin el recuadro de esquina, la zona libre reserva a la izquierda lo mismo que la columna del zoom a la derecha (68 px), para que el lugar encuadrado quede centrado en la pantalla y no corrido a la izquierda |
| 27 | Ciclo del borde de la ficha (usuario, 2026-11-17, por la crítica de `elephant-ux` a `BottomSheet`) | **Siempre vuelve a la media:** media → completa → media → recogida → media. Cada toque mueve un paso y la cifra nunca desaparece sin pasar por la media |
| 28 | Rótulo de la ficha (usuario, 2026-11-17, por la misma crítica) | **Una línea:** «Antioquia · DANE 05001» en un municipio y «DANE 05» en un departamento (+ «· Área no municipalizada» / «· Isla» cuando aplica). «Mapa de contratación pública» sale del rótulo fuera de Colombia y queda en la vista de Colombia; gana una línea de mapa en la ficha media. El `h1` sigue siendo el nombre (decisión 11b) |
| 24 | Islas sin deformar (usuario, 2026-11-17) | **Las islas se escalan, nunca se estiran:** un solo factor de escala para el ancho y el alto, en todas partes. En el **recuadro de Colombia** (revisado el mismo día por el usuario): a la escala del país las islas son dos puntos y se ven mal, así que se dibujan **ampliadas** (el recuadro mide cerca del 18 % del alto del continente), con su forma y un solo factor de escala para las dos; como en la decisión 12, solo se acorta el mar entre ellas (Providencia arriba y a la derecha de San Andrés); el marco punteado se adapta a ellas y no al revés. El recuadro va **dentro del mapa, en su posición geográfica aproximada**: en el Caribe, en la esquina noroeste del continente, a la latitud de La Guajira; se mueve y se acerca con el mapa, y el encuadre del país lo incluye para que siempre se vea al llegar. Un toque en el recuadro va al archipiélago. En la **vista del archipiélago** (`/mapa/departamento/88` y sus dos municipios) las islas **se quedan donde estaba el recuadro**, con la misma disposición: la cámara vuela al recuadro con el vuelo de siempre, nunca a la posición real en el Caribe (que dejaría dos puntos con 90 km de mar). El marco punteado queda como contorno del departamento; cada isla lleva su nombre debajo («San Andrés», «Providencia»), y la ficha media suma la nota «En el mapa se acorta la distancia entre San Andrés y Providencia (unos 90 km) para verlas juntas, a la misma escala y sin cambiar su forma.». Las islas se proyectan con el coseno de su propia latitud (12,9°) y no con el de Colombia (4,5°), que las ensancharía cerca de 2 % (lo hace la pantalla construida, `archipelagoPanel`; el boceto usa la geometría de muestra). Con zoom, la escala sigue siendo uniforme (la cámara tiene un solo factor `k`) |
