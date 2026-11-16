# Ronda 02: señales de riesgo

Estado: **Dirección visual seleccionada tras comparar; parámetros de riesgo pendientes**. Fecha: 2026-11-07. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Anterior: [Ronda 01](../01-territory-overview/README.md).

## Comentarios atendidos

Jouler aceptó la legibilidad de la tipografía de la Ronda 01, rechazó su tratamiento neutro del error y corrigió el significado del mapa: el color debe comunicar posibles señales de riesgo, no montos contratados. Dirección pedida: limpia, clara, profesional y fácil de entender visualmente para el público general.

Esta ronda mantiene la fuente del sistema, quita el antetítulo promocional, reduce el estilo de los contenedores y da prioridad al mapa y a una sola área de detalle territorial. Los textos para la ciudadanía están en español para el público colombiano; la documentación del repositorio estaba entonces en inglés.

## Semántica visual propuesta

| Rol | Relleno en el mapa | Texto visible |
| --- | --- | --- |
| Evaluado, cero señales detectadas | Azul `#82B5D0` | Sin señales detectadas |
| Proporción distinta de cero bajo el corte ilustrativo | Ámbar `#E7AE46` | Menos del 25% / Señales presentes |
| Proporción mayor en este ejemplo | Rojo apagado `#CF726B` | 25% o más / Mayor proporción de señales |
| Sin análisis utilizable | Trama gris | Sin datos suficientes |

El azul es la base de los datos evaluados, nunca un sustituto del análisis faltante ni una garantía de seguridad. El contorno de selección es oscuro e independiente del relleno de riesgo. La leyenda nombra los rangos; el selector y el panel de detalle dan los valores exactos sin depender del color. No se declara ningún estado verde de «seguro».

Los errores de la interfaz usan una superficie roja pálida, un borde rojo contenido, un símbolo de exclamación visible, la etiqueta explícita «Error de carga», una explicación en lenguaje claro y una acción para reintentar. La cobertura parcial usa una advertencia ámbar más pequeña. El rojo significa una falla de la interfaz en el mensaje de error y una mayor proporción de señales en el mapa; la ubicación y las etiquetas visibles los mantienen separados. Un error de datos oculta el mapa en lugar de pintarlo de rojo. Los datos vacíos son neutros e informativos, no una falla ni un resultado de riesgo cero.

## Significado de negocio y metodología sin resolver

La última dirección de Jouler usa **contratos**. Por eso este fixture calcula `contratos distintos con señales / contratos analizados × 100`. Varias señales en un contrato no deben inflar el numerador. La cobertura es `analizados / disponibles` y se muestra aparte cuando es parcial.

El README actual del proyecto describe un porcentaje de **obras** con patrones sospechosos. No trates en silencio obras y contratos como equivalentes: la unidad definitiva, las reglas de elegibilidad, la política de datos faltantes, el cálculo de señales y la cascada municipal/departamental siguen por resolver en TASK-07. Esta ronda muestra la dirección orientada a contratos que pidió Jouler sin reescribir el alcance de negocio canónico.

El corte de 25 % es **solo un fixture para la revisión visual**, no un umbral operativo acordado, un modelo de riesgo ni un límite validado estadísticamente. Todos los territorios y conteos son ficticios. La interfaz lo identifica explícitamente como demostración y muestra la explicación. Las etiquetas y los rangos definitivos necesitan revisión con distribuciones reales y metodología. Un denominador en cero es desconocido, no cero por ciento.

## Cómo reproducirla

```sh
python3 docs/design/rounds/02-risk-signals/build.py
```

Edita `source.html` y `assets/territories.json`; vuelve a generar `mockup.html` y `preview.html`, que se ignoran en git. Para usar las vistas previas no se necesitan paquetes ni red. `build.py` también comprueba los conteos, que los denominadores no sean negativos y los límites del numerador.

La ronda tiene su propia copia de la geometría para seguir siendo reproducible si la Ronda 01 cambia. Reutiliza la fuente, la proyección, la normalización del sentido de los anillos y la atribución documentadas en la [geografía de la Ronda 01](../01-territory-overview/README.md#geografía-y-atribución): geoBoundaries COL ADM1, OSM/Wambacher, año representado 2017, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Los códigos ISO del prototipo no son identificadores DANE. Las unidades pequeñas siguen accesibles por el selector; esto no es una especificación cartográfica de producción.

## Revisión

- ¿El error se lee de inmediato como un problema recuperable?
- ¿El azul, el ámbar y el rojo hacen comprensible el significado del mapa junto con la leyenda?
- ¿Se distinguen con claridad una señal de riesgo, la corrupción probada y la información faltante?
- ¿Se ven el numerador, el denominador y la cobertura parcial?
- ¿La misma tipografía sigue siendo cómoda en escritorio y en celular?

Comentarios de Jouler, 2026-11-07: la composición y la paleta mezclada no se sienten profesionales. Pausar nuevas propuestas e inspeccionar mapas de datos interactivos reales. Ver la [investigación de referentes](../../references/interactive-maps.md) y `validation.md` para las comprobaciones observadas y sus limitaciones.

## Selección posterior

2026-11-07: después de revisar la Ronda 03, inspirada en Transparencia, Jouler seleccionó la dirección gráfica de esta ronda. La alternativa toda cálida se sentía caótica y sugería que todo estaba mal. Significado de color seleccionado: azul para riesgo bajo, amarillo para riesgo intermedio, naranja/rojo para riesgo alto, según parámetros todavía por acordar. La tipografía sigue aceptada; los datos insuficientes siguen en gris con trama.

Esta decisión posterior reemplaza el rechazo anterior de la dirección. **No** acepta la categoría azul solo para cero del fixture ni el límite de 25 %. La vista previa se conserva como el ejemplo revisado; los rangos y las etiquetas definitivos esperan la metodología de riesgo. Ver la [dirección actual](../../visual-direction.md).
