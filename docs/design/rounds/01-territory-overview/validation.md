# Validación: Ronda 01

Comprobado en local el 2026-11-07 sobre la vista previa independiente generada.

- El build termina con la biblioteca estándar de Python; 33 identificadores territoriales únicos; fragmento ensamblado de menos de 1 MB.
- Se inspeccionaron visualmente la composición de escritorio y la composición completa apilada a 320 px. El mapa muestra la geometría departamental proyectada, los rellenos de monto y la trama de datos faltantes.
- Sin desplazamiento horizontal del documento a 320 px ni a 1024 px (el ancho de desplazamiento es igual al ancho del cliente).
- Cambiar el selector nativo de departamento actualiza el nombre, el monto exacto, el intervalo numérico y el contorno de selección. Vaupés muestra «Sin datos» y una explicación que distingue lo faltante del cero.
- La vista previa de error muestra su mensaje; «Volver a intentar» restaura la vista lista. Las vistas de carga y de vacío muestran encabezados distintos y ocultan el mapa en lugar de dar a entender un cero.
- Exactamente un trazo geográfico seleccionado en el estado listo observado.
- Las fuentes y las etiquetas de datos ficticios se ven sin hover. No se requieren dependencias externas en tiempo de ejecución.

Límites: no hubo auditoría exhaustiva con lector de pantalla, teclado, navegadores ni visión del color. Los trazos del mapa se seleccionan con el puntero; el selector nativo de departamento es la ruta de teclado hacia cada valor. Las áreas táctiles de las formas geográficas pequeñas, el zoom y los recuadros, los identificadores DANE de producción y la metodología de riesgo quedan fuera de esta ronda visual. No se afirma que esté lista para producción ni que cumpla WCAG de forma definitiva.

El lienzo integrado usa el mismo fragmento generado; las comprobaciones de navegador de arriba se hicieron sobre el contenedor independiente.
