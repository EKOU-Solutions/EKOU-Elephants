# Map page · Spec

> Step 2 of [Build a page](../../../../.claude/skills/elephants-design/references/build-page.md). Status: **Approved (Approval 1) 2026-11-15** by the user (drafted and revised the same day with the [audit](../../audits/2026-11-15-map-page.md) and decisions 9–11). Contract: [contract.md](contract.md) (approved 2026-11-15). Data: [data.md](data.md).

## 1. Purpose

**Question (TASK-09 scope):** «¿Dónde se firmaron los contratos públicos de Colombia, y cuántos hay en mi departamento o municipio?»

The tentative question («how does my territory compare, where should I look?») needs risk, which is not in this contract. This page draws the place layer that TASK-13/14 will later colour.

**Audience:** general public on a phone (default), often arriving through a shared link to one municipality; journalists on desktop who need the exact figure, source and date.

**10-second test (adapted for TASK-09):** on a phone, within 10 seconds a person can say: (1) this is a map of Colombia by department; (2) how to get to their territory (tap or search); (3) that the map does not rate anyone yet. Arriving on a municipality link, within 10 seconds they read its name and figure without scrolling. The brief's test («where signals concentrate») applies when risk arrives.

## 2. Content and hierarchy

Heading outline, the same in every view: one `h1` (the page's subject), then `h2` for the legend, the selected territory, the counts and the table.

### National view (`/mapa`)

| Order | Content | Contract field(s) | Component | Tokens | If missing / null | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Kicker + `h1` headline «7.456.749 contratos públicos firmados en Colombia» + dek | `nacional.contratos`, `ventana`, `fechaCorte` | Page heading (type scale) | `--el-size-title`, `--el-color-text`, `--el-color-text-muted` | Error state (no headline without data) | MVP |
| 2 | Map of 33 departments: neutral fill, internal borders as surface gaps, **outline of the country** (decision 9). Archipelago in an inset, labelled «San Andrés y Providencia» at 14 px outside the box (decision 10). Zoom with + / − / «Ver todo» | Geometry `departamentos`, `codigo`; `departamentos[].nombre` | Map with legend · neutral variant + zoom (step 3) | `--el-color-line` (fill), `--el-color-map-border` (internal borders), `--el-color-control-border` (outline, hover, focus), `--el-size-small` (labels) | Never null at this level | MVP |
| 3 | Legend `h2` «Qué muestra el mapa»: neutral key + note that the map does not measure risk yet | fixed copy | Map with legend · `el-legend` | `--el-color-text-muted` | — | MVP |
| 4 | Place search: municipality or department by name, up to 8 results «Municipio, Departamento» | `municipios[].nombre`, `departamento.nombre`, `departamentos[].nombre` | Field + Search results (new, step 3) | `--el-control-height`, `--el-color-control-border`, `--el-color-line`, `--el-color-text-muted` (placeholder) | Empty-result message | MVP |
| 5 | Counts `h2` «Dónde quedó cada contrato»: en un municipio / solo en un departamento / sin lugar identificado, each with a one-line gloss | `nacional.contratosEnMunicipios`, `contratosSoloDepartamento`, `contratosSinLugar` | Counter | `--el-color-line`, `--el-color-text-muted` | Error state | MVP |
| 6 | Source and date line | `fuentes[].nombre`, `entidad`, `licencia`, `url`; `fechaCorte`; `ventana` | Key figure · source line | `--el-color-text-muted` | Error state | MVP |
| 7 | Table `h2` of departments in DANE code order (not sortable): name, contracts in municipalities, contracts only in the department | `departamentos[]` | Data table | `--el-color-line`, `--el-rule-strong` | — | MVP |

### Department view (`/mapa/departamento/05`)

| Order | Content | Contract field(s) | Component | Tokens | If missing / null | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Back: «← Colombia» | — | Button (secondary) | `--el-color-action` | — | MVP |
| 2 | Kicker «Código DANE 05» + `h1` department name | `departamentos[].nombre`, `codigo` | Page heading | `--el-size-title` | — | MVP |
| 3 | Map of its municipalities, fitted to the department, **outline of the department**; hatch where `null`; zoom. In Cundinamarca, «Bogotá, D.C.» labelled in its gap (decision 10) | Geometry `municipios` filtered by `codigo` prefix; `contratosUbicados` | Map with legend · neutral variant + `el-fill-unknown` + zoom | `--el-color-line`, `--el-color-control-border`, `--el-color-unknown`, `--el-color-unknown-surface` | Hatch + «Sin datos» (the guide's hatch unchanged, decision 11) | MVP |
| 4 | Legend: neutral + «Sin datos» (the hatch item only if the department has a `null`) | fixed copy | `el-legend` | — | — | MVP |
| 5 | Counts `h2`: «en sus municipios» / «solo en el departamento» | `contratosEnMunicipios`, `contratosSoloDepartamento` | Counter | — | 0 shown as 0 (measured) | MVP |
| 6 | Source and date line | as national | Key figure · source line | — | — | MVP |
| 7 | Table `h2` of its municipalities in DANE code order: name, code, contracts | `municipios[]` of that department | Data table | `el-num` | «Sin datos» with the hatch key in the cell, never 0 | MVP |

### Municipality view (`/mapa/05001`: tap, search or shared link)

| Order | Content | Contract field(s) | Component | Tokens | If missing / null | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Back: «← Antioquia» (to the department; «← Colombia» for Bogotá) | `departamento.codigo`, `departamento.nombre` | Button (secondary) | `--el-color-action` | — | MVP |
| 2 | Kicker «Antioquia · Código DANE 05001» (+ «· Área no municipalizada» / «· Isla») + **`h1` municipality name** (decision 11b) | `nombre`, `departamento.nombre`, `codigo`, `tipo` | Page heading | `--el-size-title` | — | MVP |
| 3 | Map of the department with the selected shape outlined and **labelled with its name**; fill unchanged | `codigo`, `nombre` | Map with legend · selected | `--el-color-text` (outline), `--el-size-small` | — | MVP |
| 4 | Key figure, **directly under the map** on mobile: «356.935» «contratos firmados del 1 ene 2021 al 7 nov 2026 y ubicados en Medellín» | `contratosUbicados`, `ventana`, `fechaCorte`, `nombre` | Key figure | `--el-size-figure`, `--el-rule-strong` | Hatch swatch + «Sin datos» + «No encontramos contratos ubicados con certeza en este lugar del 1 ene 2021 al 7 nov 2026.» | MVP |
| 5 | Source line | `fuentes[]`, `fechaCorte` | Key figure · source | — | — | MVP |
| 6 | «Copiar enlace» → «Enlace copiado» (`role="status"`); copies `/mapa/<codigo>` | `codigo` | Button (secondary) | `--el-color-action` | If the clipboard is refused, select the URL in a read-only field | MVP |
| 7 | Department counts and table, as in the department view (the selected row marked by weight, not colour) | as department view | Counter, Data table | — | — | MVP |

**Bogotá, D.C.** (decision 4): the municipality view of 11001. The «en sus municipios» counter is hidden because it equals the key figure; only «solo en el departamento» stays, labelled «registrados solo como Bogotá, D.C. (departamento)». Search lists Bogotá once.

## 3. States

| State | What the person sees |
| --- | --- |
| Loading | Map area keeps its height; «Cargando el mapa…» in `role="status"` |
| `null` municipality | Hatch on the shape and in the key figure, «Sin datos» + reason. Never 0, never «sin contratos» |
| Empty search | «No encontramos «texto». Revisa la escritura o elige el departamento en el mapa.» |
| 400 / 404 from a shared link | Alert (warning): «Ese enlace no corresponde a un municipio de Colombia.» + Button «Ver el mapa de Colombia» |
| 503 `corte_no_disponible` | Alert (danger): «Los datos del mapa no están disponibles en este momento.» + Button «Reintentar». No map, no figures |
| 404 `geometria_no_encontrada` / 500 | Same as 503 |
| Phase 2 | Nothing reserved or greyed out for risk; it is simply absent |

## 4. Layout and behaviour

- **Mobile (390 px, from 320):** one column.
  - National and department: headline → map → legend → search → counts → source → table.
  - Municipality: back → headline → map → **key figure + source + «Copiar enlace»** → legend → search → department counts → table.
  - Counts: stacked, separated by horizontal rules only (no vertical dividers when stacked); a 3-up row from 600 px.
- **Desktop (1280 px):** headline full width; two columns: map 7/12 left; right column with search, the key figure (municipality view), counts and source, kept in view beside the map (sticky) so the column has no dead space. Table full width under both.
- **Selection:** tapping, searching or arriving by URL updates the view. After a tap or a search result, the page scrolls the key figure into view (instant with `prefers-reduced-motion`) and moves focus to the `h1`. Every view change resets the scroll to the top of the map and clears the search field.
- **Map interaction:** hover and keyboard focus show an outline in `--el-color-control-border`, never an opacity change. Nothing depends on hover. The table is the keyboard route to every territory; the map is `role="img"` with a `<title>` that points to it.
- **Zoom (decision 5):** pinch and drag on touch; Ctrl + wheel on desktop (plain scroll keeps scrolling the page). «Acercar», «Alejar» and «Ver todo» icon buttons (44 px, `aria-label`) at the map's top-right. Zoom resets when the view changes. One-finger drag pans only when zoomed in.
- **Table on narrow screens:** caption outside the scroll region; the scroll region has `tabindex="0"`, `role="region"` and an `aria-label`; under 360 px the headers shorten («Municipios», «Solo depto.»).
- **Search accessibility:** the hint «Escribe al menos 2 letras.» shows only below 2 letters; a live region announces the number of results, not the list; choosing a result announces the selected territory.
- **Text:** `text-wrap: pretty` on paragraphs (no one-word last lines).

## 5. Copy (es-CO)

- Kicker (national): «Mapa de contratación pública»
- Headline: «7.456.749 contratos públicos firmados en Colombia»
- Dek: «Del 1 ene 2021 al 7 nov 2026. Elige un departamento para ver sus municipios. Este mapa muestra dónde se firmaron los contratos; todavía no mide riesgo.»
- Window, one wording everywhere: «del 1 ene 2021 al 7 nov 2026» in sentences; «2021 – 7 nov 2026» in captions and source lines.
- Legend: «Territorio con contratos ubicados» · «Sin datos: no hay contratos ubicados con certeza» · note: «Todavía no hay color por riesgo. Gris no quiere decir «sin problemas».»
- Counts and glosses:
  - «6.771.167 en un municipio»: «sabemos en qué municipio se firmaron»
  - «626.277 solo en un departamento»: «sabemos el departamento, no el municipio»
  - «59.305 sin lugar identificado»: «no sabemos dónde»
- Municipality key figure: no label above the number; the sentence below carries the noun.
- Search label: «Busca tu municipio o departamento»
- Source: «Fuentes: SECOP II y SECOP I (Colombia Compra Eficiente), DIVIPOLA y Marco Geoestadístico 2025 (DANE). Datos al 7 nov 2026.»
- Table captions: «Contratos por departamento, 2021 – 7 nov 2026» · «Contratos por municipio en Antioquia, 2021 – 7 nov 2026»
- Verbs work on touch and desktop: «Elige», not «Toca».

No «corrupción», «robo», «sospechoso»; no natural persons. Figures use dot as the thousands separator and always carry a noun.

## 6. Decisions (2026-11-15, by the user)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Neutral fill | **No new token.** `--el-color-line` as the territory fill (already the «clean» fill in Coverage bar and `el-key-clean`) |
| 2 | Sortable table | **Not for now.** DANE code order |
| 3 | Search | **Yes, with a new search-results component**, to approve in step 3 |
| 4 | Bogotá | **Straight to the municipality** 11001 |
| 5 | Small municipalities | **Pinch-zoom**, with keyboard buttons |
| 6 | Methodology link | **Left out** until a methodology page exists |
| 7 | Shared link | **«Copiar enlace»** in the municipality view |
| 8 | Contract examples | **Refreshed** in `contract.md` (examples only; schema unchanged) |
| 9 | Map visibility (audit #2) | Outline of the drawn set and hover/focus outline in `--el-color-control-border` (existing token); fill unchanged |
| 10 | Place labels (audit #5) | **Selected territory, the archipelago inset and Bogotá, D.C.** No department labels |
| 11 | «Sin datos» hatch (audit #4) | **Unchanged** (guide rule, 3:1); decision 9 restores the visual order |
| 11b | `h1` on a municipality (audit #3) | **The municipality's name**, department and code in the kicker |
| 12 | Archipelago (national inset, `/mapa/departamento/88` and its two municipalities; user, 2026-11-15, revised) | **Both islands in one panel at the same scale.** The islands are about 90 km apart, so only the empty sea between them is reduced: Providencia sits next to San Andrés, shapes and scale untouched, x projected at the islands' latitude (cos 12.9°) so neither is stretched. Each island labelled with its name below it; the legend adds «San Andrés y Providencia están a unos 90 km. En el mapa se acercan para verlas juntas a la misma escala, sin cambiar su forma.» The national inset uses the same panel |
| 12b | Hover / focus outline (user, 2026-11-15) | The shape under the pointer or with focus is drawn last (the selected shape stays on top), so neighbours never cover part of its outline |
| 12c | Drag to move (user, 2026-11-15) | With a mouse the map can always be grabbed and dragged, at any zoom (cursor `grab` / `grabbing`); a drag never selects, a click without moving does. On touch, one finger scrolls the page at full view and moves the map once zoomed; two fingers pinch. «Ver todo» recentres |
| 13 | Navigation by list (user, 2026-11-15) | Two selects from the guide's Field above the search: «Departamento» («Toda Colombia» + 33) and «Municipio» («Todo el departamento» + its municipalities; disabled with «Elige primero un departamento» on the national view). They follow the current view; choosing moves like a search result (focus on the `h1`). Bogotá goes straight to 11001 |
| 14 | Risk colours (user, 2026-11-15) | No risk data exists in the cut (only counts), so the real view stays neutral (decision 1). The mockup adds a **Fase 2 preview with fictional levels**: guide fills `el-fill-low/medium/high`, legend «Contratos con señales» Bajo / Intermedio / Alto / Sin datos, risk tag in the key figure, a «Riesgo (ficticio)» table column, and a warning alert «Vista previa con datos ficticios». Every fictional level says «(ficticio)». Building it for real needs a risk field in the API contract (TASK-07) and goes back to step 0 |

## 7. Components for step 3

| Component | Change | Needs approval |
| --- | --- | --- |
| Map with legend | Variant «neutral» (`el-fill-neutral` with `--el-color-line`, `el-key-neutral`), set outline and hover/focus outline in `--el-color-control-border`, place labels, zoom controls | Yes |
| Search results | New | Yes |
| Field | `::placeholder` in `--el-color-text-muted` (audit #10: the browser default is 3.8:1 in dark) | Yes (fix to a core component) |
| Button, Counter, Key figure, Data table, Alert | Used as they are | No |

## 8. Requirements for the mockup (step 4)

- Generated by `build.py` in this folder from the guide's `tokens.css` and `components.css`. A standalone document: `<meta charset="utf-8">` and the `[hidden]` rule. It must open from disk and from a local server (audit #1).
- Validated (step 5) before it is shown.
