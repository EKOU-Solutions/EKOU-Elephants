# Map page: validation (step 5)

Date: 2026-11-15. Mockup built by `build.py` from `sample/` (cut 2026-11, data to 7 Nov 2026) with guide v1.1.0. Checked in Chrome served from `http://127.0.0.1` (the extension does not open `file://`); widths simulated with iframes of fixed width.

## Results

| Check | Result |
| --- | --- |
| Contrast pairs (`guide/build.py`) | Pass. The page adds no colour: every value is a guide token. Muted text on surface measured 8.28:1 (dark). The neutral fill against the surface stays at the audit's 1.30:1 light / 1.50:1 dark; the set outline in `--el-color-control-border` carries the shape (decision 9). |
| Risk by colour alone | Not applicable: no risk is shown. «Sin datos» always has the hatch **and** the words, in the map, the key figure and the table cell. |
| Overflow at 320, 390, 768, 1280 px | None (`scrollWidth = clientWidth` in national, department, municipality, Bogotá, and the longest names «Villa de San Diego de Ubaté» and «Archipiélago de San Andrés, Providencia y Santa Catalina»). The table scrolls inside its own region (`tabindex=0`, `role=region`). |
| Zoom buttons over the map | The fit reserves 60 px on the right, so the shapes never sit under the buttons (overlap 0 px at every width). |
| 200 % zoom | Checked as a 640 px viewport (1280 px at 200 %): one column, no overflow, labels inside the frame. |
| Keyboard | Order: back → zoom buttons → search → results → «Copiar enlace» → source links → table region → table links. Visible focus ring from `--el-color-focus` (screenshot, light). Map shapes are not focusable by design: the table is the keyboard route (spec §4). |
| Accessible names | Icon buttons «Acercar», «Alejar», «Ver todo»; map `role=img` with a `<title>` pointing to the table; labels over the map are `aria-hidden` (the name is in the `h1`). |
| Headings | One `h1` per view; `h2` for legend, counts and table. |
| Search | «granada» → 4 results with department; «bogota» → Bogotá once; «zzq» → empty message; 1 letter → hint only; result count in `role=status`. Choosing a result: focus on `h1`, «Seleccionado: …» announced, field cleared. |
| States | Loading, 400 (`#mapa/123`), 404 (`#mapa/99999`), 503 with «Reintentar» all render with the guide's alert. |
| Stressed cases | Longest names above; `null` (94884 Puerto Colombia, Guainía: hatch + «Sin datos» + reason); repeated names (Granada ×3, Puerto Colombia ×2); Bogotá (one counter, «registrados solo como Bogotá, D.C. (departamento)»). No empty list exists in the contract: every department has municipalities. |
| `impeccable detect` | 0 findings at 1280×800, 768×1024, 390×844, 320×640 on national, Guainía and 94884. Fixed during validation: line length of the mockup note, an unbalanced `h2`. Advisory kept: «repeating-stripes-gradient» = the grey hatch swatch (accepted, fixed constraint). |
| 10-second test | On a 390×844 phone arriving at `/mapa/05001`, the name sits at 115 px and the figure ends at 655 px: both visible without scrolling, with room for a site header. At 320×640 the figure ends at 550 px. The national view says «Elige un departamento» and «todavía no mide riesgo» in the dek, and the legend repeats it. |

## Points raised for Approval 2 (approved 2026-11-15)

1. **Archipelago.** First fix (one panel per island) rejected by the user: «no se deben ver así». **Now (spec decision 12, revised):** one panel, both islands at the same scale, the 90 km of sea between them reduced, shapes untouched, with a note in the legend. Checked at 320, 390 and 700 px, light, dark and Fase 2: San Andrés about 100×256 px and Providencia 95×157 px at 390 px; both labels inside the frame; no overflow. The national inset uses the same panel.
2. **Window wording.** The mockup uses «del 1 ene 2021 al 7 nov 2026» everywhere (decided wording). **Resolved:** the two spec rows that still read «entre … y …» were aligned.
3. In light theme the hatch inside a department (Guainía) reads faintly against the neutral fill. Decision 11 keeps the hatch unchanged; recorded for TASK-07.

## Changes after the first review (2026-11-15)

- **Dropdown navigation** (spec decision 13, withdrawn 2026-11-16; the selects are no longer on the page): checked national → Guainía → 94884 → Bogotá → Medellín by URL; the selects follow the view, focus lands on the `h1`, no overflow at 320, 390, 768 px.
- **Fase 2 preview with fictional risk** (spec decision 14), toggled from the mockup bar «Color del mapa»: 33 departments and every municipality get a fictional level (null stays hatched), legend, tag and table column labelled «ficticio», warning alert on every view, national dek changed so it no longer says the map does not measure risk. Checked light and dark at 320, 390, 768 px; the table scrolls inside its region. `impeccable detect` ran on the real view only (the preview is switched in the page, not by URL).

- **Hover outline cut** (reported by the user): neighbours drawn after the hovered shape covered half its outline. The hovered or focused shape is now drawn last; checked with a zoomed screenshot (continuous outline).

- **Drag to move** (spec decision 12c): a real mouse drag at full view moved the map (translate changed) without selecting; a click afterwards opened Caquetá. Touch drag not tested on a device.

## Limits

- `design:accessibility-review` and `design:ux-copy` are not installed; accessibility and copy were checked by hand against the spec and the tone rules (no «corrupción», «robo», «sospechoso»; no natural persons).
- No screen reader was run; announcements were checked through the live-region text.
- Pinch-zoom and drag were not tested on a real touch device; only the buttons and Ctrl + wheel.
- Width checks used iframes in one Chrome window, not device emulation.

## Experiencia en una sola pantalla: validación (paso 5, 2026-11-17)

Pantalla `Módulos/Mapa/MapPage` en Storybook (React, muestra de `sample/`, corte al 7 nov 2026), con `BottomSheet` (f25e0a4) y Map with legend a pantalla completa (4196675); guía v1.6.0. Revisores: `elephant-ux` (experiencia) y `elephant-tester` (reglas, accesibilidad, contrato, código), en paralelo y sin haber construido la pantalla. Comprobado también en `npm run dev` con la API real.

| Comprobación | Resultado |
| --- | --- |
| `npm run design:check` (completo) | Primera pasada: «✗ 952 renders, 228 fallas, 210 avisos «incompleto» de axe». Con cuatro rondas de repetición, cada render pasó en algún intento; las fallas que desaparecen al repetir son «Axe is already running» (choque entre el revisor de Storybook y el del script, en Windows). **No es una corrida limpia**: queda pendiente arreglar el script. Sin violaciones de axe que se repitan ni desplazamiento horizontal |
| `npm run design:check -- --filter mapa` | «✗ 408 renders, 38 fallas, 213 avisos «incompleto»» en la primera pasada; los 408 pasaron en algún reintento |
| Avisos «incompleto» de axe | Todos `color-contrast` sin fondo determinable (ficha con `transform`, rótulos sobre el mapa). Por muestreo de estilos, ninguno real: los rótulos llevan fondo o halo de `surface` y los textos de la ficha usan pares que comprueba `build.py`. Falta confirmarlos uno por uno sobre las capturas en los dos temas |
| Typecheck, lint, formato | Sin errores |
| Pruebas | `vitest src`: 150 pasan. `npm test`: 199 pasan, 1 falla ajena (`scripts/despliegue.test.mjs`) |
| Contrato y «Sin datos» | Tipos del contrato; `null` → trama + «Sin datos» + motivo, nunca 0 (también si faltara el departamento) |
| Rutas | `/mapa`, `/mapa/departamento/<cód>`, `/mapa/<mun>`; `/mapa/departamento/11` → `/mapa/11001`; enlace inválido → «No encontramos ese lugar» con el mapa en Colombia; Atrás funciona |
| Foco y anuncios (§3) | Buscador o tabla → `h1`; toque en el mapa → se queda; miga → se queda, o «← Colombia» si la miga desaparece; «Ver todo» → «Acercar»; un solo anuncio por cambio. Historias con `play` lo comprueban |
| Prueba de 10 segundos (`elephant-ux`) | Pasa en Colombia, departamento, municipio, Bogotá, archipiélago y llegada por enlace a un municipio, a 390 y 375 px. A 320×640 la ficha llega recogida (decisión 32) para que se vea el lugar |
| Orden de lectura a 390 | Municipio: cifra, `h1` y rótulo en el mapa, contorno del departamento con las migas. Colombia: el `h1` de la ficha antes que el mapa; aceptado mientras no haya color de riesgo |
| Peso (`npm run build`) | JS 272 KB (86 KB gz; +4,4 KB gz frente a `main`, casi todo de los componentes nuevos), CSS 23 KB (5,2 KB gz), geometría 369 KB (80 KB br, sin cambio). Primera visita ≈ 199 KB con Brotli |

**Corregido durante la validación:** «+» alejaba en municipios pequeños; estilos de la página sobre otros componentes (ahora son opciones de `FormField`/`Input`, `Button`, `DataTable` y `SearchResults`); encabezado fijo en la tabla; pie de tablas con la fuente; «del Archipiélago»; buscador alineado con la ficha a 768 px; zoom oculto con los resultados abiertos; anuncios dobles; código de la animación anterior retirado (`mapZoom.ts`). Decisiones nuevas del usuario: 30 (buscador con lupa), 31 (Bogotá sin tabla), 32 (ficha recogida si no hay espacio).

**No comprobado:** lector de pantalla real, gestos reales con el dedo y zoom real al 200 %; preview del PR con datos reales. **Prueba en celular real (2026-11-17):** Esteban Jimenez la probó en su celular por la red local (`npm run dev -- --host`, API real) y la aprobó: «esta re melo». **Pendiente:** la prueba de 10 segundos con alguien que no conozca el producto y en un teléfono pequeño.
