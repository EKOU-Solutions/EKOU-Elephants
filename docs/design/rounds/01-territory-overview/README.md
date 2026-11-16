# Ronda 01: panorama territorial

Estado: **Revisada: tipografía aceptada; la semántica del mapa y el tratamiento de errores fueron reemplazados por la Ronda 02**. Fecha: 2026-11-07. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).

## Pregunta de revisión

¿Puede una identidad de EKOU clara y contenida sostener un mapa legible, una leyenda de montos y el detalle de un territorio seleccionado sin competir con los datos?

## Alcance

Una composición adaptable: mapa nacional por departamentos, un territorio seleccionado, un monto contratado ilustrativo, leyenda, procedencia y mensajes de estado de los datos. El selector superior «Estado de la vista previa» es una herramienta de revisión, no una función propuesta para el producto. La letra E es una marca de identidad provisional, no un logo aprobado de EKOU.

Los textos de revisión estaban en inglés según el acuerdo de trabajo de ese momento. La traducción al español para la ciudadanía quedó pendiente. No incluye escala de riesgo, integración con datos de producción, biblioteca completa de componentes ni la interacción final del mapa.

## Archivos y cómo reproducirla

- `source.html`: composición, estilos e interacciones locales editables.
- `assets/territories.json`: las 33 unidades con nombre y montos ficticios deterministas; Antioquia empieza en COP 12,4 billones y Vaupés no tiene datos.
- `assets/map-paths.svg`: fragmento de trazos vectoriales proyectados, derivado de la geometría descrita abajo; no es un recurso cartográfico oficial.
- `build.py`: solo biblioteca estándar de Python 3; combina estas fuentes en `mockup.html` (fragmento para el lienzo integrado) y `preview.html` (vista previa independiente y sin conexión), ambos ignorados en git.

Desde la raíz del repositorio:

```sh
python3 docs/design/rounds/01-territory-overview/build.py
```

Abre `preview.html` en un navegador o `mockup.html` en el lienzo de visualización integrado. Para usar la vista previa generada no se necesita servidor, instalación de paquetes ni acceso a la red. No edites los archivos generados; actualiza las fuentes y vuelve a generar.

## Geografía y atribución

Fuente consultada el 2026-11-07: [metadatos de geoBoundaries COL ADM1](https://www.geoboundaries.org/api/current/gbOpen/COL/ADM1/). Id de límites `COL-ADM1-13589884`, año representado 2017, 33 unidades administrativas. Atribución de la fuente: contribuyentes de OpenStreetMap / Wambacher; distribuidor geoBoundaries. Licencia declarada por la fuente: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), con [atribución a OpenStreetMap](https://www.openstreetmap.org/copyright).

Entrada: [GeoJSON simplificado fijado en 9469f09](https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/COL/ADM1/geoBoundaries-COL-ADM1_simplified.geojson). Adaptación: se invirtió el sentido de los anillos cuando el área esférica de la entidad superaba 2π y luego se proyectó con D3 7.9.0 `geoMercator().fitExtent([[18,18],[582,542]], collection)` y `geoPath(projection).digits(1)`. Los trazos conservan los nombres ISO de la fuente; no son identificadores DANE. El recurso de trazos derivado sigue bajo la licencia ODbL de la fuente. Conserva la atribución al reutilizarlo.

Todos los montos, el periodo y la fecha de actualización son ficticios. No se afirma nada sobre el gasto real, el riesgo ni la completitud de los conjuntos de datos.

## Lista de revisión

- ¿Los datos se destacan más que el tratamiento de identidad?
- ¿El territorio seleccionado es evidente mientras su color de monto se mantiene?
- ¿Se distingue el monto contratado del gasto y del riesgo?
- ¿El tratamiento de datos faltantes se distingue del rango de monto más bajo?
- ¿Se puede acceder a todos los valores de los territorios con teclado y en celular?
- ¿El título, el monto, la explicación y la fuente siguen un orden claro?

## Validación

Ver `validation.md` para las comprobaciones observadas y sus límites. La aceptación parcial y las correcciones pedidas se registran abajo.

## Comentarios y decisiones

Comentarios de Jouler, 2026-11-07: la tipografía es legible y clara. El error necesita semántica de advertencia o peligro y un tratamiento de falla reconocible pero tranquilo. El mapa debe mostrar señales de riesgo posibles, no el monto contratado. Se continúa en la [Ronda 02](../02-risk-signals/README.md); esta ronda se conserva como historia de la revisión.
