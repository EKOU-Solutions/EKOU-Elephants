# Map page · Data exploration

> Step 1 of [Build a page](../../../../.claude/skills/elephants-design/references/build-page.md). Checked 2026-11-15. Contract: [contract.md](contract.md) (approved 2026-11-15).

## What was read

Our API was not started for this exploration. The source is the **ingestion output** in the exact tree the R2 adapter serves (preference 2 of the flow):

| File | Location | Size | Published |
| --- | --- | --- | --- |
| Pointer | `pipeline/data/r2/datos/latest.json` | — | `{ "corte": "2026-11" }` |
| Cut | `pipeline/data/r2/datos/2026-11/corte.json` | 788 B | `publicadoEn` 2026-11-15T18:19:48Z, `fechaCorte` 2026-11-07 |
| Municipalities | `pipeline/data/r2/datos/2026-11/mapa/municipios.json` | 169,576 B | 1,122 rows |
| Departments | `pipeline/data/r2/datos/2026-11/mapa/departamentos.json` | 4,051 B | 33 rows + `nacional` |
| Geometry | `pipeline/data/r2/datos/geometria/mgn-2025.topojson` | 368,596 B | 1,122 municipios, 33 departamentos |

Profiled with a Python standard-library script (not versioned) on 2026-11-15.

## What is really there

### Cut and window

- `ventana`: 2021–2026 in both files (decision 1). The window ends at `fechaCorte` 2026-11-07, so 2026 is a partial year.
- `fuentes[]`: 4 sources (SECOP II, SECOP I, DIVIPOLA, MGN 2025), as in the contract.

### Municipalities (`contratosUbicados`)

| Measure | Value |
| --- | --- |
| Rows | 1,122 = 1,103 `municipio` + 18 `area_no_municipalizada` + 1 `isla` (San Andrés) |
| Filled | 1,116 (99.5 %) |
| `null` («Sin datos») | **6**, all `area_no_municipalizada`: Puerto Colombia, La Guadalupe, Cacahual, Pana Pana, Morichal (Guainía) and Papunahua (Vaupés) |
| `0` | none |
| Minimum | 1 (Yavaraté, Vaupés) |
| Median | 2,092 |
| 90th percentile | 6,908 |
| Maximum | 1,190,373 (Bogotá, D.C.), 17.6 % of the municipal total |
| Under 100 / 1,000 / 10,000 | 15 / 136 / 1,035 |
| Top 5 | Bogotá, D.C. 1,190,373 · Medellín 356,935 · Santiago de Cali 335,190 · Bucaramanga 120,355 · Barranquilla 118,292 |

### Departments and nation

- `nacional`: **7,456,749** contracts = 6,771,167 in municipalities + 626,277 only in a department + 59,305 without place. Adds up.
- Sum of `contratosEnMunicipios` = sum of `contratosUbicados` = 6,771,167. Adds up.
- Municipalities per department: 1 (Bogotá, D.C.) to 125 (Antioquia).
- Share «solo departamento» is uneven: **Arauca 58.2 %**, San Andrés 50.5 %, Amazonas 33.1 %, Quindío and Putumayo 16.7 %. In those departments the municipal map shows less than half of the contracting.

### Names

- Display case is applied (decision 4): no upper-case names left.
- Longest municipality: «Villa de San Diego de Ubaté» (27 characters). Longest department: «Archipiélago de San Andrés, Providencia y Santa Catalina» (56).
- Names with punctuation: «Bogotá, D.C.», «Mirití - Paraná», «Piendamó - Tunía», «Sotará - Paispamba».
- **66 municipality names repeat** across departments (Argelia, Granada, La Unión, Nariño, Santa Bárbara…). A name alone does not identify a place.

### Geometry

- `bbox` −81.74, −4.22 to −66.85, 13.39: the archipelago (department 88) sits ~700 km north-west of the mainland.
- Size 368,596 B, within the 380 KB budget.

## What is phase 2

Not in this contract and not shown: risk level and signals (TASK-07 → TASK-13/14), summary figures such as value or works (TASK-10), contract lists (TASK-11).

## Sensitive data

None. The contract carries territories and counts only; no natural persons.

## Surprises that change the design

1. **Decision 2 is done.** The contract's 16 municipalities without located contracts are down to 6, all non-municipalised areas in Guainía and Vaupés. Arauca now has 19,268 located contracts in the department (the contract's example still shows Arauca as `null`).
2. **The contract's example values are outdated.** San Andrés is now 9,128 (example: 17,973). The mockup uses this export, not the examples. See open question in [spec.md](spec.md).
3. **Extreme skew** (1 to 1,190,373; median 2,092). A count-coloured map would be a population map. Confirms decision 3 (neutral fill).
4. **Department figures need both levels.** In Arauca and San Andrés most contracts are «solo departamento». Showing only `contratosEnMunicipios` would understate them.
5. **Repeated names.** Search results and the table must show the department next to each municipality.
6. **Bogotá is a department with one municipality.** Drilling down shows one shape.
7. **The archipelago needs an inset**; drawn to scale it pushes the mainland into a corner.
8. **Hatch appears only at the municipal level.** No department is `null`.
