# Map page · Data exploration

> Step 1 of [Build a page](../../../../.claude/skills/elephants-design/references/build-page.md). Source: our API running locally (`npm run dev`, local R2 loaded from the pipeline export), cut **2026-11**, checked 2026-11-15. Every figure below is what the [contract](contract.md) endpoints return, not raw upstream data.

## Volumes

| Endpoint | Rows | Size |
| --- | --- | --- |
| `GET /api/mapa/municipios` | 1,122 municipalities | 169,576 B (JSON) |
| `GET /api/mapa/geometria/mgn-2025` | 1,122 municipal shapes + 33 departments, 3,331 shared arcs | 340,615 B; 73,510 B with Brotli |
| `GET /api/mapa/municipios/:codigo` | 1 | < 300 B |
| `GET /api/mapa/corte` | 1 cut, 4 sources | < 1 KB |

The first screen needs `corte` + `municipios` + `geometria`: about **250 KB on the wire** (Brotli), within the brief's mobile budget.

## Fill rate

| Field | Filled | Notes |
| --- | --- | --- |
| `codigo`, `nombre`, `tipo`, `departamento.*` | 1,122 / 1,122 | Always present (DIVIPOLA). The schema rejects any file without them |
| `contratosUbicados` | **1,116 / 1,122** | 6 `null` → "Sin datos" (see Surprises 3) |
| `tipo` | 1,103 `municipio` · 18 `area_no_municipalizada` · 1 `isla` | |

## Typical and extreme values

**`contratosUbicados`** (window 2021–2026, 1,116 municipalities with data):

| Min | P10 | P25 | Median | P75 | P90 | P99 | Max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 936 | 1,310 | 2,091 | 3,387 | 6,875 | 65,239 | 1,190,373 |

- Largest: Bogotá, D.C. 1,190,373 · Medellín 356,935 · Santiago de Cali 335,190 · Bucaramanga 120,355 · Barranquilla 118,292.
- Smallest: Yavaraté (Vaupés) 1 · Pacoa (Vaupés) 2 · San Felipe (Guainía) 2 · Puerto Arica and La Victoria (Amazonas) 4. 5 municipalities have fewer than 10, 15 fewer than 100.
- Real values for mockups: Arauca 3,967 · Sucre (Sucre) 1,098 · San Andrés 9,128 · Úmbita 1,398 · Cacahual `null`.

**Names**

- Longest municipality: "Villa de San Diego de Ubaté" and "San Sebastián de Buenavista" (27 characters).
- Longest department: "Archipiélago de San Andrés, Providencia y Santa Catalina" (56). Next: "Norte de Santander" (18).
- Display case works for the stressed cases: "Bogotá, D.C.", "Sotará - Paispamba", "Güicán de la Sierra".

**Geography**

- Bounding box: lon −81.74 to −66.85, lat −4.22 to 13.39. San Andrés and Providencia sit about 700 km north-west of the mainland.
- Municipalities per department: from 125 (Antioquia) to 1 (Bogotá, D.C.).

## What is phase 2

Nothing in this contract is phase 2. The page must not show or reserve space for: risk level and signals (TASK-13/14), amounts and the municipal summary (TASK-10), contract lists (TASK-11).

## Sensitive data

None. The contract has only territories, counts and sources: no natural persons' names or IDs (`docs/datos-personales.md`).

## Surprises that change the design

1. **The count is extremely skewed.** Bogotá alone holds 17.6 % of all located contracts, and the maximum is 570 times the median. A colour scale by count would paint four cities and leave the country flat. This confirms decision 3 (**neutral fill**). The count is a fact in the selected municipality's panel, not a map encoding.
2. **66 names repeat across departments** (La Unión ×4, Villanueva ×4, Buenavista ×4, Sucre ×3, Nariño ×3…). The name alone never identifies a municipality: every label, search result and shared link title must show **name + department**.
3. **"Sin datos" is rare and clustered.** Only 6 municipalities, all *áreas no municipalizadas* in Guainía (5) and Vaupés (1), in the far east. The grey hatch appears as one patch, not scattered. The legend still needs it, and the panel explains it ("No hay contratos ubicados en esta área entre 2021 y 2026"), never as 0.
4. **"Ubicados" is not "ejecutados".** 6.77 M of the 7.46 M contracts signed in 2021–2026 (91 %) are located in a municipality. For 65 % of those, the location comes from the municipal entity's seat (confidence *media*), not from a declared execution place. Copy must say "contratos ubicados en el municipio" with the window, and link to the method; never "contratos ejecutados en".
5. **Tiny shapes in dense clusters.** The Valle de Aburrá, the Sabana de Bogotá and the Caribbean coast pack dozens of small municipalities. On a 390 px screen many are under one finger width. Selection cannot rely on tapping the map alone: the page needs a **search by name** (showing the department, see 2) as an equal way in.
6. **San Andrés needs an inset.** Drawn at true position, the archipelago forces a wide empty area and is invisible on mobile. `spec.md` decides the inset (the geometry already includes it).
7. **The six largest values are cities people know.** Showing a raw count without context invites ranking ("Bogotá is the worst"). The panel shows the count as information about volume, with the window and the source, and no comparison until TASK-10 defines one.

## Checks that back this file

- Pipeline: 61 tests; dbt 36/36 on the real warehouse; `mapa_municipios_corte` tests (unique code, accepted `tipo`, ISO not null, count > 0 or null).
- API: 60 tests; local Worker answers every contract endpoint and error.
- Geometry: `scripts/geometria-mgn.mjs` fails on budget or code mismatch; joined 1,122/1,122 with the cut.
