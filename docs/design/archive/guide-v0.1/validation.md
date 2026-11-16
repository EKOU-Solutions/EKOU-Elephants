# Validación: guía visual v0.1

Comprobado en local el 2026-11-07 sobre la vista previa independiente generada.

## Comprobaciones observadas

- El build de Python funciona; los marcadores se resolvieron; el fragmento integrado pesa unos 40 KB; la comprobación de sintaxis de JavaScript pasa.
- Los 10 pares de contraste configurados cumplen su umbral asignado: 4,5:1 para texto o 3:1 para elementos que no son texto. Los pares exactos y sus razones están en `contrast-report.json`; el build comprueba las razones sin redondear.
- Se inspeccionaron visualmente las cuatro secciones en escritorio, incluidas las muestras de riesgo, los colores de mensajes, la galería de íconos, los botones, las alertas, los ejemplos numéricos, las etiquetas y los contadores.
- Se muestran 23 íconos iniciales de Lucide en la vista previa independiente sin conexión; no quedan marcadores de íconos sin resolver.
- La navegación entre secciones cambia el contenido visible y el estado activo.
- La demostración de consulta devuelve una respuesta local; la acción de explicación muestra el texto.
- El año `20` se rechaza con un error visible y asociado y `aria-invalid=true`; `2025` se acepta y quita el estado de error.
- Reintentar cambia la muestra de error a un tratamiento de éxito, actualiza la etiqueta y el ícono, y anuncia una respuesta local de demostración. No afirma que haya ocurrido una solicitud de red real.
- Un Tab del teclado desde el botón principal de consulta mueve el foco a la acción secundaria.
- Quitar el filtro de Antioquia lo oculta y anuncia que se quitó.
- Sin desplazamiento horizontal del documento en ninguna de las cuatro secciones a 320 px; la sección de color también se comprobó a 1024 px. En pantallas angostas, la tabla de valores exactos tiene un área contenida con desplazamiento horizontal.
- Se inspeccionó visualmente la composición completa de datos y etiquetas en celular. El botón principal y el campo medían 46 px de alto, por encima del mínimo de 44 px del producto.
- No se capturaron errores de JavaScript del navegador durante estas comprobaciones.

## Integridad de los datos y las decisiones

- Proporción de señales del fixture: 36/120 = 30 %; cobertura del análisis: 120/150 = 80 %; cambio de 26 % a 30 % = +4 puntos porcentuales.
- Muestras con formato: 2.500 contratos y COP 12.450 millones (presentación en español), separadas del significado de contratado frente a pagado.
- No se asignan umbrales numéricos de riesgo. Las etiquetas semánticas son muestras independientes, no clasificaciones del ejemplo de 30 %.
- La dirección visual seleccionada sigue seleccionada; los detalles de componentes recién propuestos están marcados explícitamente como pendientes de revisión.

## Límites

Estas comprobaciones cubren las muestras documentadas y los pares de tokens, no una aplicación de producción ni una auditoría completa de accesibilidad. No hubo revisión exhaustiva con lector de pantalla, zoom, visión del color ni distintos navegadores. El contraste del mapa geográfico, la metodología completa de datos, la agregación de contratos y obras, las fuentes reales y el comportamiento de producción ante solicitudes y errores siguen siendo trabajo aparte. El lienzo integrado usa el mismo fragmento y el Lucide del anfitrión; las comprobaciones de navegador usaron el contenedor independiente sin conexión.
