# Validación: Ronda 02

Observado en local el 2026-11-07 con la vista previa independiente generada.

- El build funciona; 33 unidades únicas; `flagged ≤ analyzed ≤ available`; fragmento ensamblado de menos de 1 MB; la comprobación de sintaxis de JavaScript pasa.
- Se inspeccionaron visualmente el mapa de escritorio y las composiciones de mapa y error en celular. Sin desplazamiento horizontal del documento a 320 px ni a 1024 px.
- Antioquia: 36 / 120 = 30 %, categoría roja, con una advertencia aparte por la cobertura analizada de 120 / 150.
- Amazonas: 0 / 100 = 0 %, azul y «Sin señales detectadas». El texto explicativo evita garantizar seguridad.
- Caldas: exactamente 25 / 100 = 25 %, asignado al intervalo rojo en el corte.
- Vaupés: cero contratos analizados, sin porcentaje, trama gris y un mensaje explícito de análisis faltante. No divide por cero ni muestra riesgo cero.
- El estado de error tiene un símbolo de exclamación, una redacción explícita del error, tratamiento semántico rojo y `role="alert"`; el mapa se oculta. Reintentar vuelve a la composición lista.
- Los estados de carga y de vacío muestran sus mensajes informativos distintos.
- Exactamente un trazo seleccionado. La selección conserva el relleno de riesgo y usa un contorno independiente. Todos los valores de los territorios tienen un selector nativo alternativo.
- El navegador no reportó errores de JavaScript capturados durante estas comprobaciones.

Límites: las comprobaciones usan fixtures ficticios, no una metodología de riesgo validada. No hubo auditoría completa de accesibilidad, lector de pantalla, áreas táctiles ni visión del color. Los colores van acompañados de la leyenda y de los valores exactos del territorio seleccionado; los trazos geográficos no reemplazan la ruta de teclado del selector. No hay datos en vivo, integración con backend ni afirmación de estar lista para producción. La vista integrada usa el mismo fragmento; las comprobaciones de navegador usaron su contenedor independiente.
