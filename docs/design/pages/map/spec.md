# Map page · Spec

> Step 2 of [Build a page](../../../../.claude/skills/elephants-design/references/build-page.md) · Status: **awaiting Approval 1** · Built on [contract.md](contract.md) (approved 2026-11-15; decision 5 adds the department level) and [data.md](data.md) (cut 2026-11) · Guide v1.0 ([design-system.md](../../guide/design-system.md))

## 1. Purpose

**Question the page answers (TASK-09):** *Where is public contracting located in Colombia, and what is there about my department and my municipality?* Contracting happens at three levels (nation, departments, municipalities), so the page has **two zoom levels**: Colombia by department, then a department by municipality. Later pages build on it: the territorial summary (TASK-10), contract lists (TASK-11) and risk colour (TASK-13/14) hang from the same map and the same selection.

**Audience** ([brief](../../discovery/brief.md)): the general public first, on a mid-range phone, often arriving from a shared link (`/mapa/81` or `/mapa/81001`). Journalists and oversight groups second, on desktop, to verify a figure and cite its source.

**10-second test for this release.** The brief's test ("where do signals concentrate") needs risk, which arrives with TASK-13/14. For TASK-09, a person without experience must be able to say within 10 seconds:

1. this is a map of Colombia by department, and I can go into my department to see its municipalities;
2. how to find my place (search box or tap);
3. where the data comes from and how current it is (SECOP, data as of 7 nov 2026).

**Out of scope** (data.md, "What is phase 2"): risk level, signals, amounts, contract lists, rankings or comparisons between territories. The page reserves no space for them.

## 2. Levels and navigation

| Level | URL | Map shows | Panel shows |
| --- | --- | --- | --- |
| **Colombia** | `/mapa` | 33 departments, neutral fill; municipal borders not drawn | National total split in its three levels |
| **Department** | `/mapa/81` | Zoom to the department: its municipalities with neutral fill and hatch for «Sin datos»; the rest of the country stays as faded department shapes for context | The department: contracts in its municipalities + contracts at department level |
| **Municipality** | `/mapa/81001` | Department view with the municipality outlined | The municipality's located contracts, plus a line with its department's department-level contracts |

- Tap a department (Colombia level) → department level. Tap a municipality → municipality level. Tap a faded neighbouring department → that department.
- A breadcrumb above the panel («Colombia › Arauca › Arauca»); each part links back.
- Search finds departments and municipalities.
- Bogotá, D.C. is a department with one municipality: `/mapa/11` shows the department panel, `/mapa/11001` the municipality.
- Each level is a URL, so browser back and forward move between levels and any level can be shared.

## 3. Content and hierarchy

Row 1 is seen first. "Computed" means the page derives it from contract fields with the rule stated, without new data.

| Order | Content | Contract field(s) | Component | Tokens | If missing / null | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Headline** (h1) and dek: what the map shows, the window and the data date | `departamentos.nacional.contratos`, `ventana`, `corte.fechaCorte` | Page heading (type scale only) | `--el-size-title(-mobile)`, `--el-weight-heading`, `--el-color-text`, `--el-color-text-muted` | If `/departamentos` fails, no figure: «Contratación pública en Colombia, departamento por departamento» | MVP |
| 2 | **Search**: department or municipality | `departamentos[].codigo`, `.nombre`; `municipios[].codigo`, `.nombre`, `.departamento.nombre` | **Territory search (new, §8)**, built on Field | `--el-control-height`, `--el-color-control-border`, `--el-color-action-soft`, `--el-color-focus` | Disabled with an inline note while data loads or fails | MVP |
| 3 | **Map**, level-dependent (§2): neutral fill, selection outlined, San Andrés y Providencia in an inset, zoom controls | `geometria` (`departamentos`, `municipios`), `municipios[].contratosUbicados` (null → hatch) | Map with legend, **neutral variant + context fill + inset + zoom (new, §8)**, Button | `--el-color-line` (neutral fill), `--el-color-surface-subtle` (faded context), `--el-color-map-border`, `--el-color-line-strong` (department borders), `--el-color-unknown`, `--el-color-unknown-surface`, `--el-color-text` (selection) | Hatch + «Sin datos» for the 6 null municipalities. Geometry fails → alert in the map area; search, panel and table keep working | MVP |
| 4 | **Legend**: «Territorio con contratos ubicados», «Sin datos», «Seleccionado» | fixed rule (guide: hatch never 0; selection by outline) | Map with legend (`el-legend`) | as row 3 | «Sin datos» item shown only when the view contains a null | MVP |
| 5 | **Breadcrumb**: Colombia › departamento › municipio | `departamentos[].nombre`, `municipios[].nombre` | **Breadcrumb (new, §8)** | `--el-color-action`, `--el-size-small` | Shows only the levels reached | MVP |
| 6a | **Panel, Colombia**: national total as key figure; the three levels as a counter row | `nacional.*`, `ventana`, `corte.fechaCorte`, `corte.fuentes` | Key figure (`el-figure`) + Counter (`el-counts`) | `--el-rule-strong`, `--el-size-figure(-mobile)`, `--el-numbers`, `--el-color-text-muted` | All measured | MVP |
| 6b | **Panel, department**: key figure = its municipalities + its department level; counter row with both parts; count of its municipalities with «Sin datos», if any (computed) | `departamentos[codigo]`, `municipios[]` of that department | Key figure + Counter | as 6a | A part with 0 shows «0» (measured; guide "true zero") | MVP |
| 6c | **Panel, municipality**: name, «Departamento de …», type when not *municipio*, key figure = located contracts, line with the department-level contracts | `MunicipioSeleccionado`, `departamentos[codigo].contratosSoloDepartamento` | Key figure + readout line | as 6a | `null` → «Sin datos» with the hatch swatch and the sentence in §6; never 0 | MVP |
| 7 | **Method note** under the figure: what "ubicado" and "solo en el departamento" mean, with a link | fixed rule (data.md, surprises 4 and 7) | Alert, inline note (`el-inline-note`, info tone) | `--el-color-action` | Always shown with the figure | MVP |
| 8 | **Table alternative** in `<details>`: at Colombia level the 33 departments with both parts; at department level its municipalities. Each row links to its territory | `departamentos[]`, `municipios[]` | Data table (`el-table`, `el-num`) | `--el-color-line`, `--el-rule-strong` | `null` → «Sin datos» in the cell; ordered by DIVIPOLA code | MVP |
| 9 | **Sources and licences**: every `fuente` with entity, link and licence; DANE attribution; data and publication dates | `corte.fuentes[]`, `corte.fechaCorte`, `corte.publicadoEn` | Plain list (type scale only) | `--el-size-small`, `--el-color-text-muted`, `--el-color-action` | If `/corte` fails, the 503 state (§4) | MVP |

Every row traces to a contract field or a fixed rule. Nothing ranks or compares territories (data.md, surprise 8).

## 4. States

| State | When | What the person sees |
| --- | --- | --- |
| Loading | Before `/corte`, `/departamentos`, `/municipios`, `/geometria` resolve (in parallel) | Headline and dek at once with neutral text; «Cargando el mapa…» in the map area (`role="status"`). Search disabled with its label visible. No spinner over the map; no skeleton shapes that look like data |
| Colombia | `/mapa` | §2 Colombia, panel 6a |
| Department | Tap, search pick, or `/mapa/:dd` | Zoom to the department, panel 6b, breadcrumb, URL `/mapa/<dd>` |
| Municipality | Tap at department level, search pick, or `/mapa/:ddmmm` | Outline, panel 6c, URL `/mapa/<codigo>` |
| «Sin datos» | Municipality with `contratosUbicados: null` | Hatch swatch and «Sin datos» in place of the figure: «No encontramos contratos ubicados en esta área entre 2021 y 2026.» The department line still shows. Never 0, never a "low" message |
| Search, no results | Query matches nothing | «No encontramos ese lugar. Revisa la tilde o escribe solo una parte, por ejemplo "Ubaté".» |
| Code not found | `/mapa/99999` (404) or `/mapa/99` (not among the 33) | Colombia level; banner (warning): «El enlace apunta al código 99999, que no es un lugar de Colombia. Búscalo por su nombre.» |
| Invalid code | `/mapa/5001` (400) | Same banner: «El código del enlace no es válido.» |
| Data not published (503) | `/corte`, `/departamentos` or `/municipios` answers `corte_no_disponible` | Block alert (warning): «Los datos de este mes todavía no están publicados. Vuelve a intentarlo en unos minutos.» + «Reintentar». No map, no figures |
| Geometry error | `/geometria` fails, the rest works | Map area: block alert (danger) «No pudimos cargar el mapa.» + «Reintentar». Search, breadcrumb, panel and table keep working |
| Network / 500 | Any other failure | Block alert (danger): «Algo falló al cargar los datos. Revisa tu conexión y vuelve a intentarlo.» + «Reintentar» |
| Phase 2 fields | Always in TASK-09 | Not rendered; no placeholders («Próximamente» is not used) |

## 5. Layout

**Mobile first, 390 px** (works down to 320 px, no horizontal scroll):

1. Headline + dek.
2. Search (full width; sticky under the header after scrolling past it).
3. Breadcrumb.
4. Map, full width, aspect about 4:5; zoom controls (+, −, «Ver todo el país») as 44 px buttons in the top-right corner; San Andrés y Providencia inset in the top-left corner, labelled.
5. Legend in one row under the map (wraps to two).
6. Panel (6a, 6b or 6c).
7. Table in `<details>`, closed.
8. Sources.

Gestures: tap selects; pinch and two-finger drag zoom and pan; one-finger drag scrolls the page, so the map never traps the scroll. A level change animates the zoom (≤ 300 ms) unless `prefers-reduced-motion`.

**Desktop, 1280 px:** two columns: map left (about 60%, up to the viewport height minus the header); right column with search, breadcrumb, legend, panel and table toggle, sticky. Sources span the full width below. Hover shows the territory name (and department) next to the cursor, as a convenience only.

## 6. Copy (Spanish, Colombia)

Direct tone, figures with unit, window, source and date. No «corrupción», «robo», «sospechoso»; no natural persons; no rankings. Numbers in `es-CO` (dot thousands, comma decimal).

| Element | Copy |
| --- | --- |
| Headline (h1) | «7,5 millones de contratos públicos: dónde se ejecutan» |
| Dek | «Contratos firmados entre 2021 y 2026 por entidades nacionales, departamentales y municipales, ubicados en el mapa. Datos de SECOP al 7 de noviembre de 2026.» |
| Search | label «Busca un departamento o municipio» · placeholder «Por ejemplo: Arauca, Ubaté» |
| Suggestions | «Arauca · Departamento» · «Arauca · Arauca» · «La Unión · Nariño» |
| Breadcrumb | «Colombia › Arauca › Arauca» |
| Legend | «Cómo leer el mapa» · «Territorio con contratos ubicados» · «Sin datos» · «Seleccionado» |
| Inset | «San Andrés y Providencia» |
| Zoom | aria-label «Acercar» · «Alejar» · text «Ver todo el país» |
| Panel Colombia, figure | «7.456.749» · «contratos públicos firmados entre 2021 y 2026» |
| Panel Colombia, counters | «6.771.167 · en un municipio» · «626.277 · solo en un departamento» · «59.305 · sin lugar registrado» |
| Panel department, heading | «Arauca» · «Departamento» |
| Panel department, figure | «46.131» · «contratos ubicados en Arauca, firmados entre 2021 y 2026» |
| Panel department, counters | «19.268 · en sus municipios» · «26.863 · del departamento, sin un solo municipio» |
| Panel department, Sin datos line (only if any) | Guainía: «5 de 8 municipios y áreas sin datos» |
| Panel municipality, heading | «Arauca» · «Departamento de Arauca» (Bogotá: «Distrito Capital») |
| Type line (only when not *municipio*) | «Área no municipalizada» · «Isla» |
| Panel municipality, figure | «3.967» · «contratos ubicados en el municipio, firmados entre 2021 y 2026» |
| Panel municipality, department line | «Además, 26.863 contratos del departamento de Arauca no se pueden ubicar en un solo municipio.» + link «Ver Arauca» |
| Source line (all panels) | «Fuente: SECOP I y II, Colombia Compra Eficiente · datos al 7 nov 2026» |
| Method note | «Ubicamos cada contrato por el lugar de ejecución que declara la entidad o, si no lo declara, por la sede de la alcaldía. Los contratos que cubren varios municipios quedan en el departamento.» + link «Cómo lo calculamos» |
| Sin datos | «Sin datos» · «No encontramos contratos ubicados en esta área entre 2021 y 2026.» |
| Table | toggle «Ver en una tabla» · caption «Contratos firmados entre 2021 y 2026, por departamento. Fuente: SECOP I y II · datos al 7 nov 2026.» (department level: «…, por municipio de Arauca.») |
| Sources | heading «Fuentes y licencias» · geometry «Límites: Marco Geoestadístico Nacional 2025, DANE (www.dane.gov.co), CC BY 4.0. Simplificados para mostrarlos en pantalla.» · «Datos al 7 nov 2026 · publicado el 15 nov 2026» |

All figures are real values from the local API (cut 2026-11).

## 7. Accessibility

- The map is `<svg role="img">` with `<title>` («Mapa de Colombia por departamento» / «Mapa de Arauca por municipio») and `<desc>` naming the selection. Shapes are not tab stops; keyboard and screen-reader users move through levels with the search (combobox, WAI-ARIA APG), the breadcrumb and the table, whose rows link to each territory.
- Selection is outline + name in the panel and breadcrumb, never colour alone. The hatch always comes with «Sin datos» in the legend, panel and table.
- Zoom buttons: native `<button>`, `aria-label`, 44 px, visible focus ring.
- Level changes are announced with `aria-live="polite"` («Arauca: 46.131 contratos ubicados»), and focus moves to the panel heading.
- Respects `prefers-reduced-motion`.
- Light and dark themes from the tokens; neutral fill, faded context, borders and hatch keep a 3:1 boundary contrast in both (checked in step 5).

## 8. Components: catalogue changes (step 3, approval per component)

| Component | Status | Change |
| --- | --- | --- |
| Map with legend | core | **New variant `neutral`**: `.el-fill-neutral { fill: var(--el-color-line) }` for maps with no metric yet; context shapes outside the current department `.el-fill-context { fill: var(--el-color-surface-subtle) }`; department borders `.el-dpto { stroke: var(--el-color-line-strong); fill: none }`; **inset** box with label; **zoom controls** (3 stacked Buttons). No new tokens |
| Territory search | **new** | Field + suggestion list (WAI-ARIA combobox): up to 8 suggestions (departments first), keyboard (↑ ↓ Enter Esc), match ignoring accents and case, «no results» help text |
| Breadcrumb | **new** (small) | `<nav aria-label="Ubicación">` with an ordered list of links; current item `aria-current="page"`; 44 px tap height |
| Key figure, Counter, Data table, Alert, Button | core | Used as is |

## 9. Decisions (2026-11-15)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Headline with the national total | **Keep the figure.** With the department level it is the national total of the window (7.5 M), no longer only the located contracts |
| 2 | Method link target | **Location section of `docs/investigacion-ingesta.md` on GitHub** until a methods page exists |
| 3 | Hover label on desktop | **Yes, as a convenience**; everything stays reachable by click, search, breadcrumb and table |
| 4 | Neutral fill colour | **Existing token `--el-color-line`**; no change to `tokens.json` |
| 5 | Nation, departments, municipalities | **Two zoom levels** (contract decision 5) |
