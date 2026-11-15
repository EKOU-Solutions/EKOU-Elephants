# Ronda 03: mapa de riesgo cálido y continuo

Estado: **No seleccionada; en su lugar se seleccionó la dirección de la Ronda 02**. Fecha: 2026-11-07. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).

## Dirección pedida

Tras el rechazo de la [Ronda 02](../02-risk-signals/README.md), Jouler eligió la dirección visual del [IPC 2025 de Transparency International](https://www.transparency.org/en/cpi/2025) y compartió una imagen de referencia: fondo blanco, progresión cálida de amarillo/naranja/coral/rojo, jerarquía editorial fuerte y la geografía como elemento visual principal.

Es una composición original inspirada en esa dirección, no una copia de la identidad, el índice, la metodología ni los recursos de TI. Se mantiene la fuente nativa del sistema, ya aceptada. El texto del producto está en español; la documentación del repositorio estaba entonces en inglés.

## Qué cambia

- Reemplazar las categorías azul/ámbar/rojo, sin relación entre sí, por una sola escala cálida continua.
- Usar una superficie blanca, tipografía carbón, un título editorial y separadores discretos; sin brillos decorativos, antetítulo promocional ni tarjetas repetidas.
- Poner un resumen territorial compacto a la izquierda y el mapa, más grande, a la derecha. En celular, mostrar el mapa antes del detalle. Una lista desplegable de departamentos ofrece los valores exactos y botones nativos de selección.
- Mantener la semántica explícita del error: superficie y borde rojos contenidos, exclamación, etiqueta de error y reintento. El análisis faltante sigue siendo trama gris, no amarillo ni cero.

## Paleta y significado

El mapa codifica `contratos distintos con señales / contratos analizados × 100`, con un solo conteo por contrato. Interpolación continua entre estos puntos:

| Porcentaje | Relleno |
| --- | --- |
| 0% | `#FFE58F` |
| 20% | `#FFC473` |
| 40% | `#F99565` |
| 60% | `#EF7164` |
| 80% | `#D34B58` |
| 100% | `#9D334A` |

Las marcas de la leyenda en 0, 25, 50, 75 y 100 % son posiciones numéricas de referencia, **no umbrales de riesgo**. Esta ronda no asigna categorías de riesgo bajo, medio o alto. La dirección de la escala es propia de Elephants: porcentajes mayores significan más contratos con señales. No se importa la interpretación numérica del IPC, cuyos puntajes altos representan un concepto distinto.

Los fixtures ficticios recorren la escala a propósito para la revisión visual. Antioquia empieza en 36/120 = 30 %, con 120 de 150 contratos disponibles analizados. El análisis desconocido tiene denominador cero, no tiene porcentaje y lleva trama gris. Cero señales detectadas no es garantía de seguridad. Todos los valores departamentales son ilustrativos, no evaluaciones reales.

Siguen sin resolverse, como se registró en la Ronda 02, la unidad definitiva contrato frente a obra, las definiciones de las señales, las reglas de cobertura y la agregación en cascada. Elegir esta dirección visual no resuelve TASK-07 ni cambia las reglas de negocio del README del proyecto.

## Cómo reproducirla y fuentes

```sh
python3 docs/design/rounds/03-warm-risk-map/build.py
```

Fuentes editables: `source.html`, `assets/territories.json`, `assets/map-paths.svg`. `mockup.html` y `preview.html` se generan, se ignoran en git y se reproducen con la biblioteca estándar de Python; no se necesitan descargas en tiempo de ejecución ni instalar paquetes.

La geometría es una copia conservada del recurso proyectado de geoBoundaries/OSM. La procedencia, la entrada fijada, la proyección y la normalización del sentido de los anillos están documentadas en la [Ronda 01](../01-territory-overview/README.md#geografía-y-atribución). El recurso de trazos derivado conserva la atribución ODbL 1.0. Año de la geometría fuente: 2017. Los códigos ISO del prototipo no son identificadores DANE de producción.

## Preguntas de revisión

- ¿La progresión cálida coherente se siente más profesional que la paleta mezclada anterior?
- ¿El mapa, la leyenda y el departamento seleccionado forman una jerarquía visual clara?
- ¿Es obvio que una señal pide revisar y no prueba corrupción?
- ¿Los estados de error y de datos desconocidos siguen siendo distintos?

Ver `validation.md` para las comprobaciones observadas. Comentarios de Jouler: el mapa todo cálido se sentía caótico, como si todo estuviera mal. En su lugar, Jouler eligió la dirección de categorías azul/amarillo/naranja-rojo de la Ronda 02; los parámetros siguen pendientes.
