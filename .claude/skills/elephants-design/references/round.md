# Ronda

Resultado: una nueva carpeta `docs/design/rounds/NN-nombre-corto/` construida a partir de los hallazgos aceptados de una auditoría.

## Empezar

- El número siguiente a la ronda más alta que exista; un nombre corto en kebab-case para la hipótesis.
- Se basa en la ronda seleccionada o en la guía; copia a la carpeta nueva lo que cambies. Nunca edites en su lugar una ronda anterior ni la guía aceptada.
- Una hipótesis por ronda. Si los hallazgos aceptados tiran en direcciones distintas, propone rondas separadas.

## Contrato de la carpeta

Igual que en las rondas anteriores:

- `README.md`: estado, fecha, enlace a la tarea, ronda anterior, comentarios atendidos, hipótesis, qué cambia, decisiones y preguntas abiertas, archivos y cómo reproducir, fuentes, enlace a la validación.
- `source.html` y una carpeta `assets/` pequeña (copias propias de la geometría y de los datos de ejemplo), `build.py` solo con la biblioteca estándar de Python.
- `.gitignore` para las vistas previas generadas; los archivos generados nunca se editan a mano.
- `validation.md`: qué se observó, en qué anchos, qué comprobaciones pasaron y los límites (qué no se comprobó).

## Construir

Usa `frontend-design` para el plan y su autocrítica (gasta la audacia en un solo lugar; quita las señales de plantilla); `impeccable shape` es un segundo plan opcional. Usa `dataviz` para el mapa y la leyenda. Antes de reportar, repite sobre el resultado las pasadas de crítica y de accesibilidad de la auditoría.

## Cerrar

- Agrega la ronda al registro de revisiones de `docs/design/README.md` como «Propuesta: pendiente de revisión».
- Si el equipo acepta la ronda, se convierte en la siguiente versión mayor de la guía y Storybook se actualiza en la misma entrega (tokens, páginas MDX de fundamentos e historias de los componentes que cambian).
- Sirve las vistas previas en local para el equipo (`python3 -m http.server` en la carpeta de la ronda) y comparte las URL.
- Reporta qué cambió, qué se verificó y qué decisiones le quedan al equipo. No hagas commit.
