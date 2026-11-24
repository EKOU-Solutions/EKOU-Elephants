# Resumen municipal · API contract

Status: **draft for team review** (2026-11-22). Page: the summary shown when a municipality is selected on the map (TASK-10, issue #17, Corte 2). It extends the [map contract](../map/contract.md) (same conventions, same `corte`); it does not replace it.

## Scope

For one municipality and one year: **how much public money it received, what it spent it on (by rubro), and how far each peso has gone (committed → owed → paid)**, plus, separately, **how much it contracted** (SECOP). Only the central administration (no descentralizados). Two levels with the same shape: municipality and department (decision 2026-11-22, department moved from phase 2 to MVP).

Two different concepts, never added together and never in one bar:

| Concept | Meaning | Source |
| --- | --- | --- |
| `gastoPublico` | Money the town hall actually received and spent, by budget stage | CUIPO (CHIP, Contaduría) |
| `contratado` | Value of contracts signed in the year (a promise to buy, not money spent) | SECOP II |

## Data path

```
datos.gov.co CUIPO 9axr-9gnb + 4f7r-epif, SECOP II jbjy-vk9h → bronze/silver (dbt + DuckDB)
  → gold `resumen_municipal` → `ekou-pipeline export-mapa`
  → `resumen.tar.gz` (Release); the cut extracts it to the Worker de datos: `datos/<corte>/resumen/<codigo>.json` (one file per municipality, all years, ~2.5 KB)
  → Worker de datos → Hono API (`?anio=` picks the year) → page
```

The page reads only the API. CUIPO is joined to DANE codes by the last 5 digits of `codigo_entidad` (ámbito A439), plus Bogotá (A440, `11001`); 7 municipalities need a manual table (see [datos-gov-co README](../../../datos-gov-co/README.md)).

## Conventions

Same as the map contract: Spanish camelCase fields, 5-digit DIVIPOLA `codigo`, **`null` is never 0** (no data → `null`), money in whole COP (`number`, integer), dates ISO (`AAAA-MM-DD`), cut `AAAA-MM`. Cache `public, max-age=300, stale-while-revalidate=86400`.

## Endpoint

### `GET /api/mapa/municipios/:codigo/resumen?anio=2025`

- `:codigo`: 5-digit DIVIPOLA code. Unknown code → 404 (below).
- `anio` (optional): signing/budget year. Default: the latest year with `gastoPublico` for this municipality; if none, the latest year of the window. A year outside `anios` → 400.

```ts
interface ResumenMunicipal {
  corte: string;                        // "2026-11", same as /corte
  codigo: string;                       // "70678"
  nombre: string;                       // "San Benito Abad"
  anio: number;                         // the year this answer is about
  anios: number[];                      // years the selector offers, ascending: 2021…current. Same for every municipality
  gastoPublico: GastoPublico | null;    // null = no CUIPO report for this municipality in `anio` → "Sin información"
  contratado: Contratado | null;        // null = no contracts located here in `anio` → "Sin información"
  fuentes: FuenteResumen[];             // sources used, each with its own cut date
}

interface GastoPublico {
  periodo: string;                      // "2025-12": last quarter reported in `anio` (figures are accumulated from January to this quarter-end)
  alcance: 'municipio' | 'departamento-isla';  // 'departamento-isla' only for 88001: figures are San Andrés, Providencia y Santa Catalina as one department; the UI must say so
  completo: boolean;                    // true when periodo is the year's last quarter ("2025-12"); false = year still running
  recibido: number | null;              // COP actually collected in the year (total_recaudo, income account 1). null = not reported
  rubros: Rubro[];                      // vigencia actual (CUIPO code 1): always 3, order funcionamiento, deuda, inversion
  total: Etapas;                        // sum of the three rubros (the rule: 2.1 + 2.2 + 2.3 = total of account 2)
  reservas: Desglose | null;            // vigencia 2: budget committed in earlier years and carried over. null = none reported
  cuentasPorPagar: Desglose | null;     // vigencia 3: debts of earlier years still being paid. null = none reported
}

interface Desglose {                    // same shape as the current vigencia
  rubros: Rubro[];                      // always 3; a rubro the entity did not report is 0/0/0 inside a block that exists
  total: Etapas;
}

interface Rubro {
  clave: 'funcionamiento' | 'deuda' | 'inversion';   // cuentas 2.1, 2.2, 2.3
  etapas: Etapas;
}

interface Etapas {
  comprometido: number;                 // COP committed (contracts/orders signed against the budget)
  obligado: number;                     // COP owed (goods/services received, payment due). ≤ comprometido
  pagado: number;                       // COP paid out. ≤ obligado
}

interface Contratado {
  valor: number | null;                 // COP, contracts signed in `anio` located here (reliable values only). null = none reliable
  contratos: number;                    // number of contracts located here and signed in `anio`
}

interface FuenteResumen {
  id: string;                           // "jbjy-vk9h" | "9axr-9gnb" | "4f7r-epif"
  nombre: string;                       // "SECOP II – Contratos"
  entidad: string;                      // "Colombia Compra Eficiente", "Contaduría General de la Nación (CUIPO)"
  url: string;
  licencia: string;
  fechaCorte: string;                   // ISO date this source is current to. CUIPO: end of its latest quarter in the cut ("2026-06-30"); SECOP: extraction day
  usadoPara: 'gastoPublico' | 'contratado';
}
```

Rules the API guarantees (and dbt tests check):
- `rubros` always has the 3 entries when `gastoPublico` is not null; a rubro with no spending reported is `0`/`0`/`0` only when the entity reported that account; if the entity reported none of the three, `gastoPublico` is `null`.
- `obligado ≤ comprometido` holds. `pagado ≤ obligado` is expected but **not guaranteed**: the source has 1–2 municipalities per year with `pagado > obligado` (data.md). The API passes the figure as reported; the UI must not break on it.
- `total` = sum of rubros (levels 2.1, 2.2, 2.3 only; summing all account levels duplicates ~6×).
- `rubros`/`total` are vigencia 1 (actual); `reservas` is vigencia 2; `cuentasPorPagar` is vigencia 3. **The three are shown, never merged by the API** (decision 2026-11-22: leaving them out hides money that is going out). The UI presents them as separate lines; any grand total is computed in the UI from the three `total`s.
- `recibido` and spending are independent: `recibido: null` with spending present is valid.
- 2021 and 2022: `gastoPublico` is always `null` (CUIPO coverage starts 2023); `contratado` can exist.

### `GET /api/mapa/departamentos/:codigo/resumen?anio=2025`: same for a department

Same response (`ResumenMunicipal`), same rules and cache. Differences:

- `:codigo`: 2-digit department code (`"70"`). `nombre` is the department name.
- `gastoPublico` comes from CUIPO ámbito A438 (digits −5 to −3 of `codigo_entidad`); Bogotá `11` = A440 and San Andrés `88` = A441. Central administration only.
- `contratado` comes from gold `mapa_niveles_corte` (every contract of the window in that department, not the sum of its municipalities).
- `alcance` is always `'municipio'` here (the `departamento-isla` value only exists for `88001`).
- A department with no CUIPO report (1 of 32 gobernaciones) → `gastoPublico: null` → «Sin información».
- Worker de datos key: `datos/<corte>/resumen-departamento/<codigo>.json` (33 files). `contratado` is per signing year (`anio_firma`), computed with the same filters as `mapa_niveles_corte`.

### Errors

| Case | Response |
| --- | --- |
| Unknown or malformed `codigo` | 404 `{ "error": "municipio_no_encontrado" }` (`departamento_no_encontrado` on the department endpoint) |
| `anio` not in `anios` | 400 `{ "error": "anio_invalido", "anios": [...] }` |
| Municipality with no data at all in the year | 200 with `gastoPublico: null` and `contratado: null` (never an error, never zeros) |
| File missing in the Worker de datos for a valid code | 200 with both `null` (municipality has no data in any year) |

## Field origin and phase

| Field | Origin | Phase |
| --- | --- | --- |
| `corte`, `codigo`, `nombre` | Same as map contract (`/corte`, DIVIPOLA `gdxc-w37w`) | MVP |
| `anio`, `anios` | Calculated: window 2021 … cut year | MVP |
| `gastoPublico.recibido` | CUIPO ejecución de ingresos `9axr-9gnb`, `total_recaudo`, `cuenta = '1'`, last period of the year | MVP |
| `gastoPublico.reservas`, `cuentasPorPagar` | Same dataset and rule, `cod_vigencia_del_gasto = '2'` / `'3'` | MVP |
| `gastoPublico.rubros[].etapas`, `total` | CUIPO ejecución de gastos `4f7r-epif`: `compromisos`, `obligaciones`, `pagos`, accounts 2.1 / 2.2 / 2.3, `cod_vigencia_del_gasto = '1'`, ámbito A439 (+ A440 Bogotá), last period of the year; rule owner: TASK-10 | MVP |
| `gastoPublico.periodo`, `completo` | Calculated from the latest `periodo` present for the entity and year | MVP |
| `contratado.valor`, `contratado.contratos` | Gold `mapa_municipios` (`valor_contratado`, `contratos` by `anio_firma`; rules S08) from SECOP II `jbjy-vk9h` | MVP |
| `fuentes[]` | Pipeline catalogue (`docs/fuentes-de-datos.md`, `docs/datos-gov-co/`) | MVP |
| Income by source, spending by sector or program | CUIPO (`cod_sector`, `cod_fuentes_financiacion`) | Phase 2 |
| Descentralizados (A442) | CUIPO | Phase 2 |
| Department summary (`/departamentos/:codigo/resumen`) | CUIPO A438 + gold `mapa_niveles_corte` | MVP |

## Example response (real CUIPO figures, San Benito Abad, 2025, cut 2026-11)

CUIPO query run 2026-11-22 against `4f7r-epif` / `9axr-9gnb`, `periodo = 20251201`, entity `217870678`. `contratado` values are not measured yet: step 1 (`data.md`) fills them from the gold output.

```json
{
  "corte": "2026-11",
  "codigo": "70678",
  "nombre": "San Benito Abad",
  "anio": 2025,
  "anios": [2021, 2022, 2023, 2024, 2025, 2026],
  "gastoPublico": {
    "periodo": "2025-12",
    "completo": true,
    "recibido": 70684311036,
    "rubros": [
      { "clave": "funcionamiento", "etapas": { "comprometido": 4422148516, "obligado": 4422030895, "pagado": 4029319317 } },
      { "clave": "deuda", "etapas": { "comprometido": 5688142543, "obligado": 5688142543, "pagado": 5688142543 } },
      { "clave": "inversion", "etapas": { "comprometido": 60909800534, "obligado": 53883915448, "pagado": 53083110591 } }
    ],
    "total": { "comprometido": 71020091593, "obligado": 63994088886, "pagado": 62800572451 },
    "reservas": {
      "rubros": [
        { "clave": "funcionamiento", "etapas": { "comprometido": 0, "obligado": 0, "pagado": 0 } },
        { "clave": "deuda", "etapas": { "comprometido": 0, "obligado": 0, "pagado": 0 } },
        { "clave": "inversion", "etapas": { "comprometido": 387520595, "obligado": 378360073, "pagado": 378360073 } }
      ],
      "total": { "comprometido": 387520595, "obligado": 378360073, "pagado": 378360073 }
    },
    "cuentasPorPagar": {
      "rubros": [
        { "clave": "funcionamiento", "etapas": { "comprometido": 357960175, "obligado": 357960175, "pagado": 210411031 } },
        { "clave": "deuda", "etapas": { "comprometido": 0, "obligado": 0, "pagado": 0 } },
        { "clave": "inversion", "etapas": { "comprometido": 953552391, "obligado": 953552391, "pagado": 578293597 } }
      ],
      "total": { "comprometido": 1311512566, "obligado": 1311512566, "pagado": 788704628 }
    }
  },
  "contratado": { "valor": null, "contratos": 0 },
  "fuentes": [
    { "id": "4f7r-epif", "nombre": "CUIPO – Ejecución de gastos", "entidad": "Contaduría General de la Nación", "url": "https://www.datos.gov.co/d/4f7r-epif", "licencia": "CC BY-SA 4.0", "fechaCorte": "2026-06-30", "usadoPara": "gastoPublico" }
  ]
}
```

Check: 4,422,148,516 + 5,688,142,543 + 60,909,800,534 = 71,020,091,593 = `total.comprometido` (the account-2 total of the source).

## Missing before design can rely on it (blocks step 2 until answered)

1. ~~Reservas y cuentas por pagar~~ — **resuelto 2026-11-22:** se muestran todas (vigencias 1, 2 y 3), cada una por separado.
2. ~~Bogotá y San Andrés~~ — **resuelto 2026-11-22:** Bogotá `11001` usa su CUIPO municipal (A440). El CUIPO del departamento de San Andrés (A441, `88`) se muestra en `88001`; Providencia `88564` queda `null` → «Sin información». Como la cifra de `88001` es del departamento y no solo del municipio, el contrato añade `gastoPublico.alcance`.
3. ~~Seven municipalities~~ — **resuelto:** seed `cuipo_entidades_manual` (Coveñas and six with prefix `9232`).
4. ~~License~~ — **resuelto 2026-11-22:** CC BY-SA 4.0 (metadata of `4f7r-epif` and `9axr-9gnb`).
5. **`contratado`** uses the map's window and cut date. It includes SECOP I (source «SECOP I y II – Contratos»). Confirm that `valor` excludes `contratos_valor_excluido` as the map does.
6. **Partial year:** a closed year without December uses the last reported quarter with `completo: false`; the page says «Acumulado hasta sep 2024».
7. **Providencia `88564`** turned out to have its own CUIPO data (not `null` as item 2 assumed).

## Contract location and review

Draft in this file; the TypeScript types will live in `src/modules/mapa/domain/resumen-municipal.ts` and the Hono route in `src/modules/mapa/adapters/http/`. Reviewed 2026-11-22 against `docs/datos-gov-co/README.md` (sections CUIPO) and the map contract at commit `4c172d7`.
