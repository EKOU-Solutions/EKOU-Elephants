# Map page · Spec

> Step 2 of [Build a page](../../../../.claude/skills/elephants-design/references/build-page.md) · Status: **awaiting Approval 1** · Built on [contract.md](contract.md) (approved 2026-11-15) and [data.md](data.md) (cut 2026-11) · Guide v1.0 ([design-system.md](../../guide/design-system.md))

## 1. Purpose

**Question the page answers (TASK-09):** *Where is my municipality, and what public-contracting data is there about it?* It is the entry point that later pages build on: the municipal summary (TASK-10), contract lists (TASK-11) and risk colour (TASK-13/14) will hang from the same map and the same selection.

**Audience** ([brief](../../discovery/brief.md)): the general public first, on a mid-range phone, often arriving from a link shared through WhatsApp (`/mapa/05001`). Journalists and oversight groups second, on desktop, to verify a figure and cite its source.

**10-second test for this release.** The brief's test ("where do signals concentrate") needs risk, which arrives with TASK-13/14. For TASK-09, a person without experience must be able to say within 10 seconds:

1. this is a map of Colombia's municipalities;
2. how to find their own (search box or tap);
3. where the data comes from and how current it is (SECOP, data as of 7 nov 2026).

**Out of scope here** (data.md, "What is phase 2"): risk level, signals, amounts, contract lists, rankings or comparisons between municipalities. The page reserves no space for them.

## 2. Content and hierarchy

Row 1 is seen first. "Computed" means the page derives it from contract fields with the rule stated, without new data.

| Order | Content | Contract field(s) | Component | Tokens | If missing / null | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Headline** (h1) and dek: what the map shows, the window and the data date | `municipios[].contratosUbicados` (sum, computed), `ventana`, `corte.fechaCorte` | Page heading (type scale only) | `--el-size-title(-mobile)`, `--el-weight-heading`, `--el-color-text`, `--el-color-text-muted` | If the sum cannot be computed (503), the headline drops the figure: "Contratación pública, municipio por municipio" | MVP |
| 2 | **Municipality search**: type a name, pick from suggestions showing *name · department* | `municipios[].nombre`, `.departamento.nombre`, `.codigo` | **Territory search (new, see §7)**, built on Field | `--el-control-height`, `--el-color-control-border`, `--el-color-action-soft`, `--el-color-focus` | Disabled with an inline note while `municipios` loads or fails | MVP |
| 3 | **Map** of the 1,122 municipalities, neutral fill, department borders stronger, San Andrés y Providencia in an inset, zoom controls, selected municipality outlined | `geometria` (`municipios`, `departamentos`), `municipios[].codigo`, `.contratosUbicados` (null → hatch) | Map with legend, **neutral variant + inset + zoom (new, see §7)**, Button (zoom) | `--el-color-line` (neutral fill), `--el-color-map-border`, `--el-color-line-strong` (department borders), `--el-color-unknown`, `--el-color-unknown-surface`, `--el-color-text` (selection) | Hatch + «Sin datos» for the 6 null municipalities. If the geometry fails: map area replaced by an error alert; search and table keep working | MVP |
| 4 | **Legend**: neutral swatch "Municipio con contratos ubicados", hatch "Sin datos", outline "Municipio seleccionado" | fixed rule (guide: hatch never 0; selection by outline) | Map with legend (`el-legend`) | as row 3 | Always shown | MVP |
| 5 | **Selected municipality panel**: name, department, type when not *municipio*, the count as a key figure with its window, source line and data date | `MunicipioSeleccionado` (`nombre`, `departamento.nombre`, `tipo`, `contratosUbicados`, `ventana`), `corte.fechaCorte`, `corte.fuentes` | Key figure (`el-figure`) + readout list | `--el-rule-strong`, `--el-color-line-strong`, `--el-size-figure(-mobile)`, `--el-numbers` | `null` → the figure reads «Sin datos» with the hatch swatch and the sentence in §5; never 0 | MVP |
| 6 | **Method note** under the figure: what "ubicado" means, in one sentence, with a link to the method | fixed rule (data.md, surprise 4) | Alert, inline note (`el-inline-note`, info tone) | `--el-color-action` | Always shown with the figure | MVP |
| 7 | **No selection**: national summary in the same panel: total located contracts and coverage "1.116 de 1.122 municipios con contratos ubicados", plus the prompt to search or tap | sum and count of `contratosUbicados` (computed) | Counter (`el-counts`) | `--el-color-line`, `--el-color-text-muted` | Hidden if `municipios` fails | MVP |
| 8 | **Table alternative**: «Ver los municipios en una tabla», department, municipality, located contracts; filtered by the same search; first 50 rows, then "Mostrar más" | `municipios[]` | Data table (`el-table`, `el-num`) inside a native `<details>` | `--el-color-line`, `--el-rule-strong` | `null` shows «Sin datos» in the cell; sorting by code (DIVIPOLA order) | MVP |
| 9 | **Sources and licences**: every `fuente` with entity, link and licence; DANE attribution for the geometry; data date and publication date | `corte.fuentes[]`, `corte.fechaCorte`, `corte.publicadoEn` | Plain list (type scale only) | `--el-size-small`, `--el-color-text-muted`, `--el-color-action` | If `/corte` fails, the page shows the 503 state (§3) | MVP |

Every row traces to a contract field or a fixed rule. Nothing ranks or compares municipalities (data.md, surprise 7).

## 3. States

| State | When | What the person sees |
| --- | --- | --- |
| Loading | First visit, before `/corte`, `/municipios`, `/geometria` resolve (they load in parallel) | Headline and dek render at once with neutral text («Cargando el mapa…» in the map area, `role="status"`). Search disabled with its label visible. No spinner over the map; no skeleton shapes that look like data |
| Ready, no selection | Data loaded, URL `/mapa` | Row 7 in the panel |
| Ready, selected | Tap, search pick, or URL `/mapa/:codigo` | Outline on the shape, map zooms to its department, panel shows row 5. URL becomes `/mapa/<codigo>` (shareable). «Quitar selección» text button returns to no selection |
| «Sin datos» | Selected municipality with `contratosUbicados: null` | Hatch swatch and «Sin datos» in place of the figure, plus: «No encontramos contratos ubicados en esta área entre 2021 y 2026.» Never 0, never a "low" message |
| Search, no results | Query matches no name | Under the field: «No encontramos un municipio con ese nombre. Revisa la tilde o escribe solo una parte, por ejemplo "Ubaté".» |
| Code not found (404) | Shared link `/mapa/99999` | Map loads with no selection; banner (warning): «El enlace apunta al código 99999, que no es un municipio de Colombia. Busca el municipio por su nombre.» |
| Invalid code (400) | `/mapa/5001` | Same banner with «El código del enlace no es válido.» |
| Data not published (503) | `/corte` or `/municipios` answers `corte_no_disponible` | Block alert (warning): «Los datos de este mes todavía no están publicados. Vuelve a intentarlo en unos minutos.» + «Reintentar». No map, no figures |
| Geometry error | `/geometria` fails, the rest works | Map area: block alert (danger) «No pudimos cargar el mapa.» + «Reintentar». Search, panel and table keep working, so the person can still reach their municipality |
| Network / 500 | Any request fails otherwise | Block alert (danger): «Algo falló al cargar los datos. Revisa tu conexión y vuelve a intentarlo.» + «Reintentar» |
| Phase 2 fields | Always in TASK-09 | Not rendered and no placeholders («Próximamente» is not used) |

## 4. Layout

**Mobile first, 390 px** (works down to 320 px with no horizontal scroll):

1. Headline + dek.
2. Search (full width, sticky under the header once the person scrolls past it, so it stays reachable while looking at the map).
3. Map, full width, aspect about 4:5 (Colombia is taller than wide), zoom controls (+, −, «Ver todo el país») as 44 px buttons in the map's top-right corner; inset for San Andrés y Providencia in the top-left corner, labelled.
4. Legend in one row under the map (wraps to two).
5. Panel (row 5 or 7).
6. Table in `<details>`, closed.
7. Sources.

Gestures: tap selects; pinch and drag zoom and pan; one-finger drag on the page scrolls the page, not the map (the map pans with two fingers or after zooming in), so the map never traps the scroll.

**Desktop, 1280 px:** two columns inside the content width: map left (about 60%, up to the viewport height minus the header), right column with search, legend, panel and the table toggle, sticky. Sources span the full width under both. Hover shows the municipality name and department in a small label next to the cursor (a convenience only: everything is also available by click, search and table).

## 5. Copy (Spanish, Colombia)

Direct tone, figures with unit, window, source and date. No «corrupción», «robo», «sospechoso»; no natural persons; no rankings. Numbers in `es-CO` (dot thousands).

| Element | Copy |
| --- | --- |
| Headline (h1) | «6,8 millones de contratos públicos, municipio por municipio» |
| Dek | «Contratos firmados entre 2021 y 2026 que logramos ubicar en alguno de los 1.122 municipios y áreas de Colombia. Datos de SECOP al 7 de noviembre de 2026.» |
| Search label | «Busca tu municipio» · placeholder «Escribe un nombre, por ejemplo Medellín» |
| Suggestion | «La Unión · Nariño» (always name · department) |
| Legend title | «Cómo leer el mapa» |
| Legend items | «Municipio con contratos ubicados» · «Sin datos» · «Municipio seleccionado» |
| Inset label | «San Andrés y Providencia» |
| Zoom buttons (aria-label) | «Acercar» · «Alejar» · visible text «Ver todo el país» |
| Panel heading | «Arauca» (h2) and under it «Departamento de Arauca» (for Bogotá: «Distrito Capital») |
| Type line (only when not *municipio*) | «Área no municipalizada» · «Isla» |
| Key figure label | «Contratos ubicados en el municipio» |
| Key figure value / context | «3.967» · «firmados entre 2021 y 2026» |
| Source line | «Fuente: SECOP I y II, Colombia Compra Eficiente · datos al 7 nov 2026» |
| Method note | «Ubicamos cada contrato por el lugar de ejecución que declara la entidad o, si no lo declara, por la sede de la alcaldía. No todos los contratos se pueden ubicar.» + link «Cómo lo calculamos» |
| Sin datos | «Sin datos» · «No encontramos contratos ubicados en esta área entre 2021 y 2026.» |
| No selection | «6.771.167 contratos ubicados» · «1.116 de 1.122 municipios con contratos ubicados» · «Busca tu municipio o tócalo en el mapa.» |
| Clear selection | «Quitar selección» |
| Table toggle / caption | «Ver los municipios en una tabla» · caption «Contratos ubicados por municipio, firmados entre 2021 y 2026. Fuente: SECOP I y II · datos al 7 nov 2026.» |
| Table more | «Mostrar 50 más» |
| Sources heading | «Fuentes y licencias» |
| Geometry attribution | «Límites municipales: Marco Geoestadístico Nacional 2025, DANE (www.dane.gov.co), CC BY 4.0. Simplificados para mostrarlos en pantalla.» |
| Updated line | «Datos al 7 nov 2026 · publicado el 15 nov 2026» |

## 6. Accessibility

- The map is `<svg role="img">` with `<title>` «Mapa de los municipios de Colombia» and `<desc>` naming the selected municipality. Shapes are not individual tab stops (1,122 stops); keyboard and screen-reader users reach every municipality through the search (combobox pattern, WAI-ARIA APG) and the table. Both are announced right after the map.
- Selection is outline + name in the panel, never colour alone. The hatch carries the «Sin datos» text in the legend, the panel and the table.
- Zoom buttons are native `<button>` with `aria-label`; 44 px; visible focus ring.
- Panel updates are announced with `aria-live="polite"` («Arauca seleccionado: 3.967 contratos ubicados»).
- Respects `prefers-reduced-motion`: zoom to the department jumps instead of animating.
- Light and dark themes from the tokens; the neutral fill, borders and hatch keep their 3:1 boundary contrast in both (checked in step 5).

## 7. Components: catalogue changes this page needs (step 3, approval per component)

| Component | Status | Change |
| --- | --- | --- |
| Map with legend | core | **New variant `neutral`**: `.el-fill-neutral { fill: var(--el-color-line) }` for maps with no metric yet; department borders `.el-map .el-dpto { stroke: var(--el-color-line-strong); fill: none }`; **inset** box with label; **zoom controls** (3 Buttons stacked). No new tokens |
| Territory search | **new** | Field + suggestion list (WAI-ARIA combobox): input, up to 8 suggestions «nombre · departamento», keyboard (↑ ↓ Enter Esc), match ignoring accents and case, «no results» help text |
| Key figure | core | Used as is, plus the «Sin datos» value variant (hatch swatch + text) that the guide already defines for unknowns |
| Data table, Alert, Button, Counter | core | Used as is |

## 8. Open questions

1. **Headline with the national total.** «6,8 millones de contratos públicos, municipio por municipio» says something and passes the shared-screenshot test, but it is a total of *located* contracts, not of all contracts (91%). Keep it, or use a headline without a figure («Contratación pública, municipio por municipio»)?
2. **Method link target.** «Cómo lo calculamos» needs a public page. Proposal: link to the location section of `docs/investigacion-ingesta.md` on GitHub for now, and a methods page later. OK?
3. **Hover label on desktop.** Proposed as a convenience. Keep it, or click only (simpler, same on every device)?
4. **Neutral fill colour.** Proposed `--el-color-line` (light grey-blue; no new token). The alternative is a dedicated `--el-color-map-neutral` token, which is a token change through the guide's process.
