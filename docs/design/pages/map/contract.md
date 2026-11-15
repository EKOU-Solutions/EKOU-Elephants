# Map page · API contract

> Page: Map (TASK-09 [#16](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/16), Corte 1) · Status: **Approved 2026-11-15** (by the user, with the decisions below) · Checked: 2026-11-15 against `main` @ `0d62f20`

Step 0 of the [Build a page](../../../../.claude/skills/elephants-design/references/build-page.md) flow found **no contract**: the current `mapa` module (`GET /api/mapa/territorios/:codigo/resumen`) is the archetype's fictional demo (`docs/arquitectura.md`, "Alcance del ejemplo"). This document defines the contract; it was approved on 2026-11-15. It is implemented in `src/modules/mapa/domain/mapa.ts` (types) and `src/modules/mapa/adapters/r2/mapa.r2.ts` (zod schemas that every published file must pass).

## Scope

TASK-09 only: draw Colombia's municipalities with real data from the latest cut, select one, identify it (DIVIPOLA code and name), and show the source and cut date. The municipal summary (TASK-10), contract lists (TASK-11) and risk signals (TASK-13/14) extend this contract later; they are **not** part of it.

## Data path

```
DANE MGN 2025 + DIVIPOLA + SECOP (ekou.duckdb) → pipeline export → R2 (local: wrangler/Miniflare) → our API (Hono, R2 adapter) → screens
```

- The API reads JSON files from R2 through an output port (`ConsultarMapa`), with no PostgreSQL. TASK-09 asks for exactly this.
- R2 keys (bucket binding `DATOS`): `datos/latest.json` (pointer `{ "corte": "2026-11" }`), `datos/<corte>/corte.json`, `datos/<corte>/mapa/municipios.json`, `datos/geometria/<version>.topojson`. The pipeline writes the same tree with `ekou-pipeline export-mapa`.
- Locally, `wrangler dev` emulates the R2 binding on disk, so the same adapter runs without a Cloudflare account and without waiting for the team's R2 decision.

## Conventions

| Topic | Rule | Standard |
| --- | --- | --- |
| Field names | Spanish camelCase, as in the existing API (`presupuestoAsignadoCentavos`) | Project convention |
| Municipality ID | DIVIPOLA 5-digit string, with its leading zero (`"05001"`) | DANE DIVIPOLA |
| Department ID | DIVIPOLA 2-digit string, plus ISO 3166-2 (`"CO-ANT"`) | ISO 3166-2:CO (ADR 0002, decision 9) |
| Dates | ISO 8601 (`"2026-11-07"`, `"2026-11-15T12:00:00Z"`) | ISO 8601 |
| Cut | `AAAA-MM` | ADR 0002 |
| Geometry | TopoJSON, WGS 84 lon/lat, shared borders, quantised. Simplified only for display, with source and licence attributed | TopoJSON spec; RFC 7946 coordinate order; DANE CC BY 4.0 |
| Missing data | `null`, never `0`. The UI shows "Sin datos" with the grey hatch | `visual-direction.md` |
| Errors | `{ "error": "<code>" }` with a stable code, as in `src/server/app.ts` | Project convention |

## Endpoints

### 1. `GET /api/mapa/corte`: the current cut

Answers "which data am I looking at?". Every screen shows its source and date from here.

```ts
interface CorteVigente {
  corte: string;              // "2026-11"
  fechaCorte: string;         // date the data is current to (Colombian time), ISO date: "2026-11-07"
  publicadoEn: string;        // ISO datetime UTC when the pipeline published it
  geometria: string;          // geometry version to request: "mgn-2025"
  fuentes: Fuente[];          // every source the map uses, in display order
}

interface Fuente {
  id: string;                 // dataset id: "jbjy-vk9h", "gdxc-w37w", "mgn-2025"
  nombre: string;             // "SECOP II – Contratos"
  entidad: string;            // "Colombia Compra Eficiente", "DANE"
  url: string;                // dataset page
  licencia: string;           // "CC BY-SA 4.0", "CC BY 4.0"
}
```

Cache: `public, max-age=300, stale-while-revalidate=86400`.

### 2. `GET /api/mapa/geometria/:version`: the shapes

Returns the TopoJSON `Topology` for `version` (the value from `/corte`). Two objects:

```ts
interface Geometria {          // TopoJSON Topology
  type: 'Topology';
  objects: {
    municipios: GeometryCollection<{ codigo: string }>;      // 1,122 polygons
    departamentos: GeometryCollection<{ codigo: string }>;   // 33, built from the municipios (shared arcs)
  };
  arcs: number[][][];
  transform: { scale: [number, number]; translate: [number, number] };
  bbox: [number, number, number, number];
}
```

- Geometry carries **only the code**. Names and data come from endpoint 3, so the shapes never change when a cut changes.
- Departments are dissolved from the municipalities, so their borders match exactly.
- San Andrés, Providencia y Santa Catalina are included. Drawing them as an inset is a layout decision for `spec.md`.
- Cache: `public, max-age=31536000, immutable`. A new MGN version is a new path.
- Size budget: **≤ 100 KB with Brotli** (what travels; mobile first, limited data; see the brief) and **≤ 350 KB uncompressed** (parse cost). Built by `scripts/geometria-mgn.mjs` (mapshaper: Visvalingam weighted, 0.4 % of vertices, quantisation 20,000 ≈ 95 m), which fails if the budget or the code join breaks. Result 2026-11-15: 340,615 B, 73,510 B with Brotli.
- Budget change (2026-11-15): the approved draft said ≤ 300 KB uncompressed. Reaching it needed ≤ 0.3 % of vertices, which deforms small municipalities when zoomed, so the uncompressed limit moved to 350 KB; the Brotli limit is unchanged.

### 3. `GET /api/mapa/municipios`: one row per municipality

```ts
interface MunicipiosDelCorte {
  corte: string;                         // "2026-11"
  ventana: { desde: number; hasta: number };  // signing years counted, both included: 2021–2026
  municipios: MunicipioDelMapa[];        // exactly 1,122, ordered by codigo
}

interface MunicipioDelMapa {
  codigo: string;                        // "05001"
  nombre: string;                        // "Medellín" (display case, accents kept)
  tipo: 'municipio' | 'area_no_municipalizada' | 'isla';
  departamento: {
    codigo: string;                      // "05"
    iso: string;                         // "CO-ANT"
    nombre: string;                      // "Antioquia"
  };
  contratosUbicados: number | null;      // contracts located here in the analysis window; null = none located → "Sin datos"
}
```

Cache: same as `/corte`.

### 4. `GET /api/mapa/municipios/:codigo`: one municipality

Returns one `MunicipioDelMapa` plus `corte` and `ventana`. It supports shared links (`/mapa/05001` arriving through WhatsApp; see the brief) without downloading all 1,122 rows.

```ts
interface MunicipioSeleccionado extends MunicipioDelMapa {
  corte: string;
  ventana: { desde: number; hasta: number };
}
```

### Errors

| Status | Body | When |
| --- | --- | --- |
| 400 | `{ "error": "codigo_invalido" }` | `:codigo` is not 5 digits; R2 is not read |
| 404 | `{ "error": "municipio_no_encontrado" }` | Valid code that is not in DIVIPOLA |
| 404 | `{ "error": "geometria_no_encontrada" }` | Unknown `:version` |
| 503 | `{ "error": "corte_no_disponible" }` | R2 has no published cut, or a file is missing or fails its schema |
| 500 | `{ "error": "error_interno" }` | Anything else; logged by error type only |

## Field origin and phase

| Field | Origin | Phase |
| --- | --- | --- |
| `corte`, `publicadoEn` | Pipeline publication (`latest.json`, workflow `corte-mensual`) | MVP |
| `fechaCorte` | Day (Colombian time) the least recent source of the cut was extracted (bronze `_extraido_en`). Changed 2026-11-15: the approved draft said "last day of the month", which shows a future date while the month runs | MVP |
| `fuentes[]` | Pipeline catalogue (`docs/fuentes-de-datos.md`) | MVP |
| `geometria` (shapes) | DANE MGN 2025, `MGN2025_ADM_MPIO_GRAFICO_(geojson).zip` from the [geoportal](https://geoportal.dane.gov.co/servicios/descarga-y-metadatos/datos-geoestadisticos/), CC BY 4.0, last modified 2026-04-15; `MPIO_CDPMP` → `codigo` | MVP |
| `codigo`, `nombre`, `departamento.codigo`, `departamento.nombre` | DIVIPOLA `gdxc-w37w` (`cod_mpio`, `nom_mpio`, `cod_dpto`, `dpto`) | MVP |
| `tipo` | MGN 2025 `MPIO_TIPO` (1,103 municipios, 18 áreas no municipalizadas, 1 isla) | MVP |
| `departamento.iso` | ISO 3166-2:CO, static seed in the pipeline | MVP |
| `contratosUbicados`, `ventana` | Gold `mapa_municipios_corte`: contracts from `mapa_municipios` (location confidence medium or better, not cancelled; rules S08, TASK-06) signed in the window | MVP |
| Risk level and signals | TASK-07 → TASK-13/14 | Later contract |
| Summary figures (value, works…) | TASK-10 | Later contract |

**Join check (2026-11-15):** MGN 2025 `MPIO_CDPMP` and DIVIPOLA `cod_mpio` match **1,122 / 1,122** codes, with none left over on either side. The pipeline turns this into a test, so a future cut fails if they drift apart.

## Example responses (real data, cut 2026-11)

`GET /api/mapa/corte`

```json
{
  "corte": "2026-11",
  "fechaCorte": "2026-11-07",
  "publicadoEn": "2026-11-07T22:43:00Z",
  "geometria": "mgn-2025",
  "fuentes": [
    { "id": "jbjy-vk9h", "nombre": "SECOP II – Contratos", "entidad": "Colombia Compra Eficiente", "url": "https://www.datos.gov.co/d/jbjy-vk9h", "licencia": "CC BY-SA 4.0" },
    { "id": "f789-7hwg", "nombre": "SECOP I – Procesos de compra", "entidad": "Colombia Compra Eficiente", "url": "https://www.datos.gov.co/d/f789-7hwg", "licencia": "CC BY-SA 4.0" },
    { "id": "gdxc-w37w", "nombre": "DIVIPOLA – Municipios", "entidad": "DANE", "url": "https://www.datos.gov.co/d/gdxc-w37w", "licencia": "CC BY-SA 4.0" },
    { "id": "mgn-2025", "nombre": "Marco Geoestadístico Nacional 2025", "entidad": "DANE", "url": "https://geoportal.dane.gov.co/servicios/descarga-y-metadatos/datos-geoestadisticos/", "licencia": "CC BY 4.0" }
  ]
}
```

`GET /api/mapa/municipios/05001`

```json
{
  "corte": "2026-11",
  "codigo": "05001",
  "nombre": "Medellín",
  "tipo": "municipio",
  "departamento": { "codigo": "05", "iso": "CO-ANT", "nombre": "Antioquia" },
  "contratosUbicados": 640861
}
```

`GET /api/mapa/municipios/81001`: Arauca, with no contract located in this cut (see open question 2)

```json
{
  "corte": "2026-11",
  "codigo": "81001",
  "nombre": "Arauca",
  "tipo": "municipio",
  "departamento": { "codigo": "81", "iso": "CO-ARA", "nombre": "Arauca" },
  "contratosUbicados": null
}
```

Other real values for the mockups: Bogotá, D.C. 1,393,923; San Andrés 17,973; Leticia 28,996; Pueblorrico 1,970. The longest name is "Villa de San Diego de Ubaté" (27 characters); the longest department name is "Archipiélago de San Andrés, Providencia y Santa Catalina".

## Decisions (2026-11-15)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Window for `contratosUbicados` | **Signing years 2021–2026**: the last 5 full years plus the current one. The UI states the window next to the figure |
| 2 | 16 municipalities with no located contract (Arauca, Sucre, Nariño…) | **Fix the pipeline's name matching within TASK-09**, before exporting the map data |
| 3 | Map fill in TASK-09 | **Neutral fill**, with the grey "Sin datos" hatch only where `contratosUbicados` is `null`. Risk colour arrives with TASK-13/14 |
| 4 | Name casing | The pipeline converts names to display case, with tested exceptions |

## Questions as asked

1. **Window for `contratosUbicados`.** Today `mapa_municipios` covers signing years 2000–2026, and the ADR leaves the window open ("¿últimos 5 años?"). Proposal: **contracts signed in the last 5 full years plus the current year (2021–2026)**, with the window stated next to the figure. Alternative: all years.
2. **The 16 municipalities with no located contract.** They include **Arauca (a department capital), Sucre and Nariño**, all named like their department. This points to a gap in the pipeline's name matching, not to a real absence. Proposal: keep `null` ("Sin datos") in the contract, and fix the matching in TASK-16 (#23) or before the TASK-09 data export if the team prefers.
3. **Does TASK-09 colour the map?** Colour roles are reserved for risk, and risk is TASK-13/14. Proposal: **neutral fill** in TASK-09, with "Sin datos" hatch only where `contratosUbicados` is `null`. Showing the count by colour would bring back the amount-based map that Round 01 superseded.
4. **Name casing.** DIVIPOLA writes names in upper case ("MEDELLÍN"). Proposal: the pipeline converts them to display case ("Medellín") with exceptions for connectives ("de", "del", "la") and for official names ("Bogotá, D.C."), and a test covers the stressed cases.
