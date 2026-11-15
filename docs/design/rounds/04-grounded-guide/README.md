# Ronda 04: guía con fundamento

Estado: **Propuesta, en espera de revisión**. Fecha: 2026-11-08. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Anterior: [Ronda 02](../02-risk-signals/README.md) (dirección seleccionada) y [guía v0.1](../../guide/README.md).

## Comentarios atendidos

Jouler sintió que la [guía v0.1](../../guide/README.md) todavía se veía «muy de IA» y pidió principios de diseño basados en el objetivo de negocio. Esta ronda conserva la semántica seleccionada en la Ronda 02 y rehace todo lo demás alrededor de ella. La v0.1 se deja intacta para comparar.

## Hipótesis

Una guía que se comporta como un registro público bien hecho (primero el mapa, reglas de libro contable, lenguaje claro) resulta más creíble para la ciudadanía que un kit con estilo SaaS, sin cambiar el significado del color ya aceptado.

## Qué cambia frente a la v0.1

- **Apertura con el mapa.** El primer elemento es un mapa departamental real con leyenda, trama gris para los datos faltantes, el contorno del territorio seleccionado y una ficha con el valor exacto, en lugar de un eslogan. El título enuncia el principio central del producto: una señal pide revisar, no acusa.
- **Sin adornos de plantilla.** Sin antetítulo en mayúsculas sobre el título, sin numeración 01–04 (las secciones no son una secuencia), sin recuadros con íconos sobre fondo de color, sin tarjetas y sin franjas en el borde izquierdo. La estructura sale de líneas de tinta y del espacio en blanco.
- **Las etiquetas son iguales a la leyenda.** Cada etiqueta de riesgo muestra el relleno exacto del mapa (o la trama) junto a su nombre.
- **Voz en lenguaje claro.** Una tabla «Cómo escribimos» traduce los patrones de riesgo del README (único oferente, contratación directa repetida, sobrecosto, obras inconclusas) a un español cotidiano para el público general.
- **Geometría.** Esquinas de 2 px en las marcas de datos, de 6 px en los controles y sin radio en los paneles. La cifra principal baja de 52 a 44 px.
- **Tipografía en comparación.** Atkinson Hyperlegible Next (diseñada para baja visión, SIL OFL 1.1, alojada en el proyecto) frente a la fuente del sistema aceptada después de la Ronda 01. Se generan ambas para poder compararlas. El cero de Atkinson va tachado por diseño.

Sin cambios: los roles azul / amarillo / rojo cálido / trama gris, los tokens de color, los pares de contraste, las metas de accesibilidad y las reglas de presentación de datos.

## Decisiones y preguntas abiertas

Aceptado: nada todavía. Falta decidir la tipografía y si esta estructura reemplaza a la v0.1 como guía. Los umbrales de riesgo, las etiquetas y la unidad contrato frente a obra siguen en TASK-07. El reparto de categorías del encabezado (hasta 12 % azul, hasta 30 % ámbar, por encima rojo) es **solo un ejemplo ilustrativo**, rotulado así en la guía; no es un umbral acordado ni los intervalos de 0 % / 25 % del fixture de la Ronda 02.

## Archivos y cómo reproducirla

- `source.html`: guía editable; en su CSS, `§` se reemplaza por el selector raíz al generar.
- `tokens.json`: tokens candidatos (v0.2: ambas familias tipográficas, pesos, radio de 2 px en las marcas).
- `assets/`: Atkinson Hyperlegible Next 5.3.0 latin variable woff2 fijada y su [licencia OFL](assets/ATKINSON-OFL); copias propias de los trazos del mapa y del fixture ficticio de territorios de la Ronda 02.
- `build.py`: solo biblioteca estándar de Python 3. Reutiliza el paquete fijado de Lucide de `../../guide/assets`.

```sh
python3 docs/design/rounds/04-grounded-guide/build.py
```

Salidas, ignoradas en git: `preview.html` y `guide.html` (Atkinson), y `preview-system.html` y `guide-system.html` (fuente del sistema); `contrast-report.json` sí se versiona. Las vistas previas funcionan sin conexión.

## Fuentes

- Tipografía: [`@fontsource-variable/atkinson-hyperlegible-next` 5.3.0](https://cdn.jsdelivr.net/npm/@fontsource-variable/atkinson-hyperlegible-next@5.3.0/), OFL-1.1, consultada el 2026-11-08.
- Geografía: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0, simplificada; procedencia en la [Ronda 01](../01-territory-overview/README.md#geografía-y-atribución). Todos los valores son ficticios.

## Validación

Ver `validation.md`.
