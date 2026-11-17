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
