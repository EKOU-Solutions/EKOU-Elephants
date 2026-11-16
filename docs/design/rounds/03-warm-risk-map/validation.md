# Validación: Ronda 03

Observado el 2026-11-07 en la vista previa independiente en el navegador.

- El build funciona con 33 id territoriales únicos, límites de conteo válidos y un fragmento ensamblado de menos de 1 MB. La comprobación de sintaxis de JavaScript pasa.
- Se inspeccionaron visualmente las composiciones de escritorio y de celular completo a 320 px. El mapa y la leyenda con degradado cálido se ven; en celular el mapa va encima del detalle del departamento.
- El ancho del documento es igual al ancho de desplazamiento a 320 px y a 1024 px: no se observó desplazamiento horizontal.
- Se desplegó la lista de comparación de departamentos y se seleccionó Vaupés con su botón nativo. El detalle muestra «Sin datos» y la forma geográfica usa la trama gris.
- Amazonas seleccionado: 0 % y el extremo amarillo `#FFE58F`, con una redacción que no garantiza la ausencia de irregularidades.
- Antioquia: 36/120 = 30 %, una sola forma seleccionada, el relleno cálido interpolado correspondiente y una nota aparte de cobertura de 120/150.
- La vista previa de error usa `role="alert"` y la acción de reintento restaura el mapa listo.
- No se capturaron errores de JavaScript del navegador durante las comprobaciones observadas.

Límites: fixtures ficticios, geometría aproximada y simplificada, y ningún modelo de riesgo aceptado. No hubo auditoría completa de accesibilidad, percepción del color ni navegadores. El selector nativo y la tabla desplegable con valores exactos complementan el color geográfico y la selección con el puntero. No se afirma que la interpolación RGB sea perceptualmente uniforme. Las marcas de la leyenda son posiciones de referencia, no umbrales de negocio validados. La vista en línea usa el mismo fragmento generado; las comprobaciones de arriba usaron su contenedor independiente.
