# Validación: Ronda 06

Observado en local el 2026-11-08 con los archivos generados `preview.html`, `examples.html` y `screens/*.html`.

- **Build:** funciona; no quedan marcadores ni macros sin reemplazar.
- **Contraste** (`contrast-report.json`): pasan los 19 pares en claro y oscuro. Los dos pares nuevos son el texto secundario y el enlace sobre el lienzo.
- **Desbordamiento:** ninguno en las cuatro pantallas, la página de referencia ni la página de ejemplos, a 320, 390, 768 y 1280 px (24 combinaciones). Corregido durante la ronda:
  - las grillas `.hero` e `.intro` (ancho mínimo);
  - el título de 48 px a 320 px;
  - el ancho mínimo del simulador de portátil.
- **Capturas revisadas:**
  - las cuatro pantallas a 390 px (claro) y a 1280 px (claro);
  - la pantalla de obra a 1280 px en oscuro;
  - el encabezado de la página de referencia;
  - la vista de celular en pantalla completa (`screens/phone.html?s=map`), que ahora muestra la composición de 390 px.
- **`impeccable detect`:** 0 antipatrones en la página de referencia y en las cuatro pantallas. Corregido en esta ronda:
  - texto gris sobre la alerta informativa oscura;
  - un nivel de título saltado en los resultados;
  - dos bordes de la última fila, que ahora se dibujan entre filas.

  Siguen los avisos de la trama gris (aceptada) y del «uso excesivo de rayas largas» (nombres de tokens en los ejemplos de código). En `examples.html`, `cramped-padding` aparece solo en el bisel del simulador, la pantalla y la barra del navegador, que van al ras por diseño.

**Límites:**
- No hubo pruebas en dispositivos reales, con lector de pantalla ni con zoom al 200 %.
- `backdrop-filter` en la barra de la app depende del soporte del navegador; si falta, se usa una superficie casi opaca.
- La página de referencia de Apple se observó en una captura sin interfaz; sus imágenes de producto no cargaron. La tipografía, las superficies y la composición sí se veían.
