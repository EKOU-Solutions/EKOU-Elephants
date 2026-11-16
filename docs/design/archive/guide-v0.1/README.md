# Guía visual v0.1 (archivada)

> Archivada el 2026-11-08, cuando la [guía v1.0](../../guide/README.md) la reemplazó. Se conserva como historia; los enlaces relativos de abajo se escribieron para su ubicación original, `docs/design/guide/`.

Estado: **Guía consolidada para revisión**. Basada en la dirección de la Ronda 02 que eligió Jouler y en la legibilidad de la fuente del sistema; los tokens recién especificados, las convenciones de íconos y los detalles de los componentes siguen siendo propuestas. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Actualizada el 2026-11-07.

## Propósito y fuente de verdad

Una referencia práctica para construir interfaces dirigidas a la ciudadanía. La guía visual está en español; en ese momento, las especificaciones del repositorio y los nombres de implementación estaban en inglés. Es una muestra de documentación, no un paquete de componentes de producción. No requiere servicios, publicación ni estructura de aplicación.

1. Lee [la dirección seleccionada](../visual-direction.md).
2. Usa [tokens.json](tokens.json) para los valores candidatos de color, tipografía, espacio y geometría.
3. Lee las [reglas de uso](usage.md) antes de interpretar o implementar una muestra.
4. Revisa la guía visual generada y la [validación](validation.md). No deduzcas umbrales de negocio aprobados a partir de los ejemplos.

La fuente editable es `source.html`; `build.py` genera las muestras de color y la evidencia de contraste a partir de `tokens.json`. Quien aporte cambios debe modificar estas fuentes y volver a generar. No edites las vistas previas generadas ni cambies en silencio los roles semánticos de color aceptados. La historia de la revisión queda en `../rounds/`.

```sh
python3 docs/design/guide/build.py
```

Salidas, ignoradas a propósito: `guide.html` (fragmento para el lienzo integrado) y `preview.html` (vista previa independiente y autocontenida). El build también actualiza `contrast-report.json`, que sí se versiona. Solo usa la biblioteca estándar de Python. La vista previa independiente funciona sin conexión e incrusta el paquete local fijado de Lucide; el fragmento integrado usa los íconos de Lucide que entrega el anfitrión.

## Contenido

- Principios y razones; tipografía del sistema y escala de espacio.
- Paleta de datos, colores de interacción, colores de mensajes y pares de contraste medidos.
- Botones, ejemplos deshabilitados y en carga, alertas, campos de formulario nativos y mensajes de error.
- Porcentajes con numerador y denominador; cobertura del análisis por separado; conteos, montos en COP, fechas y cambios en puntos porcentuales.
- Etiquetas de riesgo, contadores con nombre, filtros que se pueden quitar, tratamiento de los datos faltantes, tratamiento del territorio seleccionado y tablas con valores exactos.
- Familia de íconos, tamaño, trazo, etiquetas visibles y nombres accesibles.

## Recursos externos

Referencia de íconos: Lucide, que ya usa la página de inicio de EKOU. Paquete sin conexión fijado en `lucide@0.468.0`, obtenido de la [distribución del paquete en jsDelivr](https://cdn.jsdelivr.net/npm/lucide@0.468.0/dist/umd/lucide.min.js). Se incluye con su [atribución ISC/Feather](assets/LUCIDE-LICENSE). Es una versión reproducible para la muestra, no una afirmación sobre la última versión ni una decisión de dependencias de la aplicación. No quites la licencia al distribuir la guía independiente.

Las metas normativas y la guía de diseño están enlazadas en `usage.md` y en la guía; se revisaron el 2026-11-07. Siguen pendientes la conformidad completa de la interfaz, la evaluación de visión del color y las pruebas con tareas reales de personas usuarias.
