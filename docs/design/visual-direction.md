# Dirección visual

## Intención acordada

Una herramienta ciudadana clara, cercana y rigurosa para entender el gasto público colombiano. Conservar una relación contenida con EKOU: una superficie de lectura neutra y clara, texto azul oscuro y acentos de marca pequeños. Los datos geográficos deben recibir el mayor énfasis de color.

Marca, interacción y datos tienen roles separados. La selección debe conservar el relleno de datos del territorio y usar un contorno más un nombre explícito. El riesgo es una señal explicable, no un veredicto de corrupción. Los datos desconocidos nunca deben aparecer como cero ni como riesgo bajo.

## Selección final (2026-11-08)

**Decisión:** Jouler y Esteban seleccionaron la dirección editorial de la [Ronda 05](rounds/05-system-reference/README.md). Se convirtió en la [guía del sistema de diseño v1.0](guide/README.md). La tipografía es **Public Sans**, confirmada el mismo día.

| Decidido | Detalle |
| --- | --- |
| Lenguaje visual | Editorial de la Ronda 05: superficie neutra, líneas en lugar de tarjetas, cifras grandes con fuente, rellenos de riesgo ordenados de claro → oscuro, etiquetas de riesgo rellenas con un glifo de 1/2/3 barras, tema claro y oscuro |
| Tipografía | Public Sans 5.3.0, alojada con la aplicación, una sola familia |
| No seleccionado | La capa limpia de la [Ronda 06](rounds/06-clean-layer/README.md) (lienzo con tarjetas blancas, controles en píldora, espaciado estilo Apple). Es más limpia y llamativa, e invita a explorar. Pero el producto quiere centrarse en los datos, y la versión editorial lo sirve mejor |
| Conservado de la revisión de la Ronda 05 | La marca de lo esperado frente a «Pagado» sigue en rojo como alerta (una excepción registrada a «rojo significa riesgo alto»). Los componentes candidatos entran al catálogo solo cuando una página los aprueba |
| Trasladado de la Ronda 06 | Solo correcciones de errores: la vista a pantalla completa del celular y el ancho del simulador de portátil a 320 px |
| Sigue abierto | Obra frente a contrato como entidades: se decide cuando se defina el modelo de negocio con Esteban. Umbrales de riesgo: TASK-07. Datos personales: TASK-08 |

Esto confirma el mundo visual de «periodismo de datos» del brief. Cómo se diseñan las páginas de ahora en adelante: [flujo de diseño](design-flow.md).

## Referencia en Storybook (2026-11-15)

**Decisión (Jouler):** el sistema de diseño se consulta en Storybook (`npm run storybook`). Reúne los lineamientos para personas, los fundamentos, la accesibilidad y el catálogo, y en él se suman los componentes que se crean con la skill `elephant-designer`. La guía HTML v1.0 y las rondas quedan como seguimiento histórico. Los tokens y el catálogo siguen saliendo de `docs/design/guide/`. Revierte la decisión del 2026-11-08 de descartar Storybook. La dirección visual no cambia.

## Selección anterior: Ronda 02 (base de los roles de color)

Jouler seleccionó la dirección visual de la Ronda 02 después de compararla con la Ronda 03, inspirada en Transparencia. El mapa todo cálido sugería que todo estaba mal; las categorías diferenciadas de azul, amarillo y rojo cálido comunican con más claridad el significado de negocio buscado. Se mantiene aceptada la legibilidad de la fuente nativa del sistema.

| Fundamento | Dirección seleccionada / detalle pendiente |
| --- | --- |
| Fuente | Sans serif nativa del sistema, sin descargar fuentes externas (reemplazada: Public Sans, 2026-11-08) |
| Texto principal / secundario | Referencia de la Ronda 02: 16 px / 14 px |
| Título / cifra clave | Referencia de la Ronda 02: título de 30 px en escritorio y 26 px en celular; porcentaje de 52 px |
| Espaciado | 4, 8, 12, 16, 24, 32 px |
| Superficie | Blanca; separadores discretos; estilo de tarjeta mínimo |
| Texto / texto secundario | Ronda 02: `#192C3C` / `#52626D` |
| Acento funcional | Azul contenido `#245B78` |
| Riesgo bajo | Azul, con `#82B5D0` de la Ronda 02 como referencia visual |
| Riesgo intermedio | Amarillo/ámbar, con `#E7AE46` como referencia visual |
| Riesgo alto | Naranja/rojo, con `#CF726B` como referencia actual de rojo cálido; token de producción exacto pendiente |
| Error | Superficie roja pálida y contenida, borde rojo, símbolo visible, redacción explícita y reintento |
| Información parcial | Advertencia ámbar pequeña, con el conteo de cobertura |
| Datos insuficientes | Trama gris neutra y etiqueta explícita, nunca un relleno azul de riesgo bajo |

La aceptación cubre la dirección visual y los roles semánticos de color. No fija todos los tokens, estados de componentes, umbrales ni etiquetas. Mantén pequeños los acentos de identidad y el mapa como uso principal del color. Evita degradados decorativos, brillos, tarjetas inclinadas y fondos multicolores en las vistas de consulta.

## Aplicación a los datos geográficos

El azul debe cubrir la categoría acordada de riesgo bajo, no solo el caso exacto de cero señales que usaba el fixture de la Ronda 02. Amarillo/ámbar marca una categoría intermedia; naranja/rojo marca riesgo alto. Siguen pendientes los límites numéricos, si se necesitan tres categorías o más, y el cálculo definitivo del riesgo. No conviertas el límite ilustrativo de 25 % en regla de negocio.

Acompaña el color con una leyenda clara, el nombre del territorio seleccionado, la métrica exacta y una explicación. La selección es un contorno aparte que no cambia el relleno de la categoría. El análisis faltante debe distinguirse del caso de cero señales detectadas. Una etiqueta de riesgo bajo es relativa a las señales definidas y a los datos disponibles; no garantiza la ausencia de irregularidades.

El prototipo actual muestra los contratos con señales divididos por los contratos analizados, contando cada contrato con señales una sola vez. La cobertura se muestra aparte. Jouler pidió una semántica basada en contratos, mientras que el README del proyecto describe obras; la unidad definitiva, la agregación en cascada y la metodología siguen abiertas en TASK-07. Una elección visual no resuelve estas preguntas de negocio.

La geografía departamental real y simplificada se usa solo para la composición. Los códigos ISO del prototipo no son identificadores DANE de producción. Un mapa de producción todavía necesita etiquetas geográficas, tratamiento de zoom y de unidades pequeñas, y una alternativa de datos accesible.

## Continuidad de las revisiones

- [Ronda 01](rounds/01-territory-overview/README.md): se aceptó la legibilidad de la tipografía; el mapa basado en montos fue reemplazado.
- [Ronda 02](rounds/02-risk-signals/README.md): rechazada al principio por mezclar colores y luego seleccionada por Jouler tras comparar referencias y la Ronda 03. Su prototipo queda como fixture histórico con **rangos de 0 %/25 % no aprobados**, que deben actualizarse cuando se acuerden los parámetros de riesgo.
- [Ronda 03](rounds/03-warm-risk-map/README.md): no seleccionada; la paleta toda cálida se sentía caótica y transmitía que todo estaba mal.
- [Ronda 04](rounds/04-grounded-guide/README.md): estructura poco clara para construir; se mantiene la trama.
- [Ronda 05](rounds/05-system-reference/README.md): **seleccionada (final)**, se convirtió en la guía v1.0 con Public Sans.
- [Ronda 06](rounds/06-clean-layer/README.md): no seleccionada; más limpia e invita a explorar, pero menos centrada en los datos.

Los textos del producto y la documentación del repositorio están en español para el público colombiano. La referencia viva es Storybook; su fuente es la [guía del sistema de diseño v1.0](guide/README.md). La [guía v0.1](archive/guide-v0.1/README.md) anterior, construida sobre la Ronda 02, está archivada. Los umbrales numéricos de riesgo siguen sin definirse.

## Accesibilidad y celular

Usa suficiente contraste de texto, foco de teclado visible, controles nativos y alturas de control de al menos 44 px. No codifiques significado solo con color: acompaña la leyenda con rangos numéricos, un panel con el nombre y el valor seleccionados, y texto o trama para los datos faltantes. En pantallas angostas, apila el mapa y el detalle sin desplazamiento horizontal. Toda la información esencial debe estar disponible sin hover. Carga, error e información faltante tienen mensajes distintos.

Este prototipo no es una auditoría completa de accesibilidad ni una especificación funcional del mapa.

## Referencias consultadas el 2026-11-07

- [Paleta de EKOU](https://github.com/EKOU-Solutions/ekou-landing/blob/4912a42c0df6fd729e7f80c737e3c326ac6d16db/src/styles/global.css).
- [Composición de bienvenida de EKOU](https://github.com/EKOU-Solutions/ekou-landing/blob/4912a42c0df6fd729e7f80c737e3c326ac6d16db/src/components/Welcome.astro).
- [WCAG: uso del color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- [WCAG: contraste mínimo del texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

El despliegue enlazado desde el repositorio de la landing devolvió 404 al consultarlo; el análisis de la referencia usó su código fuente.
