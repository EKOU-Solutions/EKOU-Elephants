# Reglas de uso visual y de componentes

## Principios

1. **Claridad:** una pregunta principal por vista; etiquetas, unidades y jerarquía precisas. Las superficies neutras dejan el mapa como el campo de color dominante. Sin brillos ni degradados decorativos.
2. **Explicabilidad:** muestra la fuente, el periodo, la fecha de actualización, el alcance analizado y la cobertura. Una señal es motivo para revisar, no prueba de corrupción.
3. **Redundancia:** las etiquetas de categoría, los valores exactos, las formas, los contornos y las tramas de datos faltantes complementan el color. Una descripción para lector de pantalla no ofrece, por sí sola, una alternativa visual a quien no distingue colores.
4. **Coherencia y celular:** conserva el significado semántico, las etiquetas y las unidades entre vistas. Reacomoda los grupos en lugar de encoger la vista de escritorio. Como meta del producto, los controles táctiles miden al menos 44 px de alto.

## Roles del color

Jouler eligió azul para el riesgo bajo, amarillo para el intermedio y naranja/rojo para el alto. El azul `#82B5D0`, el ámbar `#E7AE46` y el rojo cálido `#CF726B` de la Ronda 02 son los rellenos de referencia. No crees categorías adicionales sin una razón de negocio. La trama gris significa análisis insuficiente, nunca riesgo bajo. El índice de riesgo definitivo, las etiquetas, los rangos y la unidad de agregación contrato frente a obra siguen abiertos en TASK-07.

Usa el azul oscuro `#245B78` para acciones y enlaces; blanco sobre azul oscuro para el botón principal. Los rellenos pálidos del mapa no son colores para texto corrido. El texto usa `#192C3C` y el secundario legible `#52626D`. Los separadores estructurales de bajo contraste no son el único límite de los campos; los controles usan un borde más oscuro, `#71818F`.

Las familias de mensajes combinan una superficie clara con texto oscuro y un símbolo rotulado: azul informativo, advertencia ámbar, error rojo apagado y confirmación verde. El verde solo confirma una acción de la interfaz que terminó. No debe calificar un territorio como seguro. Una falla de la interfaz y un territorio de riesgo alto son conceptos distintos, aunque ambos usen el rojo en su contexto.

## Tipografía, composición y geometría

Usa la familia sans-serif nativa del sistema definida en `tokens.json`; cambia según la plataforma. Cuerpo por defecto de 16 px, texto de apoyo de 14 px, interlineado de 1,5. Título de vista de referencia de 30 px (26 px en celular), título de sección de 22 px, cifra destacada de 52 px. El título de portada de la propia guía es un estilo editorial de la documentación, no un token nuevo de título de la aplicación.

Usa peso 400 para el cuerpo y 500/600 para el énfasis. Separa los elementos relacionados con 8–12 px, los grupos con 24–32 px y el contenido de los controles con 12–16 px. Los tokens de espacio compartidos son 4, 8, 12, 16, 24 y 32 px. Radio de controles de 6 px y de paneles de 8 px. Prefiere separadores y espacio en blanco a tarjetas repetidas. Usa dígitos tabulares para los valores que cambian o se alinean.

## Botones y enlaces

- Principal: uno por grupo de acciones, relleno azul oscuro, verbo concreto e ícono opcional de 20 px a la izquierda.
- Secundario: blanco, con un borde legible y la etiqueta en azul oscuro. Terciario: acción de texto subrayada; conserva un área de toque clara.
- Hover: oscurecer o agregar un tinte pálido sin saltos en la composición. Presionado: respuesta contenida. Foco del teclado: contorno azul de 3 px con un espacio blanco de 3 px; no quites el foco del navegador sin un equivalente.
- Deshabilitado: `disabled` nativo; no dependas solo de bajar la opacidad. Explica el motivo cerca del control. En carga: evita la activación doble, mantén una etiqueta de carga visible y expón el estado ocupado. La animación es opcional y debe respetar la preferencia de movimiento reducido.
- Un enlace lleva a un destino real; un botón ejecuta una acción local. No implementes la navegación como un control de solo ícono sin etiqueta.

Las acciones de la guía son demostraciones locales explícitas. No consultan contratos reales ni publican cambios.

## Alertas y estados de formulario

Una alerta explica qué pasó, qué implica y cuál es el siguiente paso posible. Evita las alarmas, la vergüenza, las grandes áreas rojas y los errores técnicos sin explicación. Mantén distintos el error, los datos parciales, el resultado vacío y la carga. Una solicitud fallida no debe mostrar un mapa vacío como riesgo cero.

Para las fallas reales y nuevas usa el anuncio de alerta adecuado; las actualizaciones informativas y de confirmación usan regiones vivas corteses. No anuncies todas las muestras estáticas de la guía al cargar la página. La respuesta de reintento en la guía es una demostración local; la implementación de producción debe reflejar el resultado real de la solicitud.

Cada campo tiene una etiqueta visible y permanente y un texto de ayuda útil. La validación combina el color con una corrección explícita, `aria-invalid` y un texto de error asociado. El campo de año de la guía solo comprueba el formato de cuatro dígitos como muestra visual; no define los años admitidos en producción. La selección opcional de departamento en esta muestra no define el comportamiento final del filtro en producción.

## Contrato de presentación de datos

| Elemento | Regla | Muestra |
| --- | --- | --- |
| Proporción de señales | Contratos distintos con señales / contratos analizados × 100; muestra ambos conteos | 30 %; 36 de 120 analizados |
| Cobertura | Analizados / disponibles, mostrada aparte del riesgo | 80 %; 120 de 150 disponibles |
| Desconocido | Un denominador en cero significa que no está disponible; nunca se convierte en 0 % | «Sin datos» |
| Cero real | Muestra 0 cuando se midió cero; explica qué se evaluó | 0 de 100 analizados |
| Conteo | Entero, separador de miles local, sustantivo obligatorio | 2.500 contratos |
| Dinero | COP y escala explícitos; distingue contratado, pagado y presupuesto | COP 12.450 millones |
| Precisión de porcentajes | Máximo un decimal en los resúmenes comunes; configuración regional `es-CO`; conserva la precisión original para los cálculos | 12,5 %; 30 % |
| Cambio en un porcentaje | Diferencia en puntos porcentuales, no cambio porcentual relativo | De 26 % a 30 % = +4 p. p. |
| Fecha | Fecha de actualización de los datos aparte del periodo reportado | 31 dic 2025; periodo 2025 |
| Celda numérica faltante en una tabla | Etiqueta o contexto visible de «no disponible»; raya solo cuando el significado de la columna sigue claro | «Sin datos»; conteo no disponible «—» |

Los ejemplos son fixtures, no afirmaciones sobre territorios. Al ejemplo de 30 % no se le asigna a propósito una etiqueta baja, intermedia o alta: no hay umbrales acordados. Un contrato con varias señales cuenta una sola vez en el numerador de contratos con señales. Tres señales no son necesariamente tres contratos. Nunca clasifiques a partir de un valor redondeado para mostrar cuando el modelo define límites precisos.

## Etiquetas, conteos, filtros y tablas

Las etiquetas de estado no son interactivas: una superficie suave, texto oscuro y un ícono o trama de apoyo. Las etiquetas bajo/intermedio/alto deben salir de la metodología acordada, no elegirse a partir de un porcentaje mostrado en esta guía. Los datos faltantes son un estado aparte.

Los contadores siempre nombran lo que cuentan. Un distintivo decorativo con solo un número no da suficiente contexto. Un filtro que se puede quitar es un botón nativo con un nombre accesible explícito, la etiqueta visible de la selección, un ícono de cerrar y al menos 44 px de alto de interacción. Al quitarlo, se anuncia qué selección cambió.

Las tablas usan encabezados con sentido, números alineados al final y dígitos tabulares. Mantén el contexto de fuente y periodo cerca de los datos. En el celular, simplifica las columnas opcionales u ofrece un área contenida con desplazamiento de la tabla; no encojas todas las etiquetas para que quepan. La selección de un territorio usa un contorno contrastado e independiente y una ficha o selector con nombre; debe conservar el significado de riesgo del relleno.

## Iconografía

Reutiliza Lucide, como la página de inicio de EKOU: lienzo de origen de 24 px, trazos de 2 px, uniones y terminaciones redondeadas; se muestra a 20 px junto al texto o a 24 px en las alertas. Mantén una familia coherente y evita los emojis como íconos de la interfaz. Los íconos de búsqueda, ubicación, filtro, flecha desplegable, información, advertencia, error, confirmación, carga y fuente externa tienen roles específicos.

Los íconos decorativos llevan `aria-hidden`; el texto visible lleva el significado. Una acción de solo ícono necesita un nombre accesible con sentido y un área de toque suficiente. No dependas de los tooltips al pasar el cursor para un significado esencial. No uses una calavera, imágenes criminales ni un escudo verde de seguridad como veredicto del riesgo territorial.

## Metas de accesibilidad y evidencia

Meta: contraste mínimo de texto WCAG AA de 4,5:1 para el texto común; 3:1 cuando se requiera para los límites esenciales de controles y estados y para la información no textual con significado. No son requisitos universales para cada línea decorativa. El tamaño de los controles del producto apunta a 44 px, por encima de la base de 24 px de WCAG 2.5.8 (que tiene excepciones).

`contrast-report.json` registra los pares de tokens calculados y las comprobaciones de aprobado/fallido del build. Solo verifica estos pares de color, no toda la interfaz, los polígonos del mapa, los estados deshabilitados ni cada interacción con íconos. Los rellenos del mapa siguen acompañados de etiquetas, acceso a los valores exactos y la trama de datos desconocidos; todavía hace falta una revisión aparte de la percepción del color y del contraste no textual en el mapa.

## Referencias (consultadas el 2026-11-07)

- [W3C, contraste del texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C, contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [W3C, uso del color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- [W3C, tamaño mínimo del área de toque](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [Lenguaje de diseño de Lucide](https://lucide.dev/contribute/icons/design-principles).
