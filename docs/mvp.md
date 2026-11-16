# Alcance del MVP · Explorar Colombia

Estado: alcance elegido por Jouler el 2026-11-14, con patrones sospechosos base incluidos en el MVP.

## Resultado del producto

La ciudadanía explora Colombia desde un mapa interactivo, selecciona un municipio, consulta el resumen de su contratación, recorre los contratos asociados y abre el detalle de cada contrato.

## Iteración 1 · Mapa, contratos municipales, detalle y patrones base

- Mapa interactivo de Colombia y selección de municipio.
- Resumen municipal basado en el diseño tentativo.
- Contratos asociados al municipio seleccionado.
- Detalle del contrato basado en el diseño tentativo y los datos disponibles.
- Un conjunto inicial de señales de patrones sospechosos en los contratos y los resúmenes municipales o territoriales, cuando las definiciones revisadas y los datos disponibles lo permitan. Explicar qué significa cada señal y distinguir la falta de datos de la ausencia de señales detectadas.
- Fuente y fecha de corte suficientes para entender la información mostrada.

Los indicadores, campos, reglas de negocio, contratos de API y diseños detallados se definen al abordar cada página. Los diseños tentativos existentes son referencias, no un contrato de datos definitivo. El valor contratado y el gasto público deben mantenerse como conceptos distintos.

## Patrones base · Alcance y trabajo existente

Los patrones sospechosos base forman parte del MVP. Esteban está trabajando en su metodología en [TASK-07](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/8) y el [PR #10](https://github.com/EKOU-Solutions/EKOU-Elephants/pull/10); ese trabajo es el punto de partida, sin crear un catálogo paralelo.

El subconjunto inicial, las fórmulas, los umbrales, los registros a los que aplica cada patrón y la agregación territorial se acuerdan a partir de esa revisión y se refinan cuando cada corte vertical los necesite. Esta decisión de alcance no aprueba todos los patrones propuestos, no reproduce el análisis ni afirma que el sistema de alertas ya esté implementado. El PR #10 define y valida patrones propuestos; su integración al pipeline de producción y a la interfaz requiere implementación adicional.

La primera entrega mostrará las señales base respaldadas por los datos, con su explicación, fuente y fecha de corte. La agregación debe definirse antes de presentar alertas municipales o departamentales. Las señales indican registros que merecen revisión, no pruebas de corrupción. La falta de evidencia no debe presentarse como un resultado de riesgo bajo.

## Iteración 2 · Refinar y ampliar patrones y alertas

- Iterar los patrones base a partir de la calidad observada de los datos y la retroalimentación de la primera entrega.
- Refinar las definiciones, los umbrales, la cobertura, la agregación territorial y la explicación de las alertas.
- Ampliar el conjunto de patrones y la experiencia de alertas según los datos disponibles y las prioridades acordadas.

La iteración 2 mejora las señales iniciales y el sistema de alertas; no es la primera incorporación de patrones sospechosos al producto.

## Metodología de entrega

Trabajamos por cortes verticales: cada página seleccionada se aborda de principio a fin, refinando sus reglas de negocio, necesidades de datos, API, diseño, implementación, manejo de errores y pruebas aplicables según sea necesario. Se completa y verifica esa página antes de pasar al siguiente corte acordado.

No se introduce una fase separada para diseñar todas las páginas ni construir todos los endpoints del backend por adelantado. Después de definir este MVP, el trabajo inmediato es revisar y avanzar las tareas transversales existentes, sin comenzar todavía el diseño de páginas.

Se utiliza el trabajo del sistema visual y su flujo por página del [PR #13](https://github.com/EKOU-Solutions/EKOU-Elephants/pull/13), sin definir una nueva dirección visual en este documento de alcance.

## Trabajo transversal existente

El [Proyecto #3 de GitHub](https://github.com/orgs/EKOU-Solutions/projects/3) sigue siendo la fuente de tareas. Su estado actual se consulta allí:

- [TASK-03 · Arquitectura inicial y arquetipo](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/4).
- [TASK-04 · Configurar CI y CD](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/5).
- [TASK-05 · Definir sistema visual](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).
- [TASK-06 · Ingesta de datos: ADR y POC](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/7).
- [TASK-08 · Revisión legal del uso de datos personales](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/9), relevante para el detalle público del contrato.

## Alternativas consideradas

1. Ficha municipal sin mapa: entrada más sencilla, pero no es la dirección elegida.
2. Exploración desde el mapa con resumen municipal: elegida y ampliada para incluir los contratos asociados y su detalle en la iteración 1.
3. Entrada centrada en investigar señales: no se eligió como recorrido principal. Aun así, la iteración 1 incluye patrones sospechosos base; su refinamiento y ampliación continúan en la iteración 2.

Este documento registra los límites del MVP y la metodología de entrega acordada. Las especificaciones detalladas de cada página y el estado de las tareas pertenecen a sus flujos existentes; aquí no se afirma que haya implementación o publicación.
