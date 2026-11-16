# Page designs

One folder per page, built with the `elephants-design` skill's [Build a page](../../../.claude/skills/elephants-design/references/build-page.md) flow. How developers interact with it: [design flow](../design-flow.md).

## Folder contract

```
docs/design/pages/<page>/
  README.md        status, date, links, open questions
  contract.md      which API contract (version, date) the design depends on
  data.md          data exploration: real samples, fill rates, phase, sensitive fields
  spec.md          purpose, hierarchy table (field → component → tokens), states, copy
  mockup.html      visual target: mobile + desktop, light + dark (generated output git-ignored if built)
  validation.md    accessibility, overflow, detector, copy, 10-second test, limits
```

## Page log

| Page | Status | Contract |
| --- | --- | --- |
| — | No page started yet | — |

Statuses: *Blocked — no contract* · *Exploring* · *Spec awaiting approval* · *Mockup in review* · *Approved*.

## Tentative reference

**Tentative. Not a specification.** These are starting points, taken from the scope in the [root README](../../../README.md#funcionalidades) and the dataset list in [fuentes de datos](../../fuentes-de-datos.md). What each page finally shows is decided in its own `spec.md`, after its contract and data exploration. The component names refer to the catalog in the [design system guide v1.0](../guide/components.json); candidates are marked *(candidate)*. "Likely upstream data" is where ingestion maps the fields from; the page itself is designed on our API's contract.

| Page (tentative) | Question it answers | Likely upstream data (MVP / phase 2) | Components that may apply |
| --- | --- | --- | --- |
| Map (Mapa de inversión) | How does my territory compare, and where should I look? | SECOP II Contracts `jbjy-vk9h`, DIVIPOLA `gdxc-w37w` (MVP); CUIPO budget, DNP projects (phase 2) | Map + legend, risk tag, key figure, coverage *(candidate)*, bars *(candidate)*, data table |
| Search (Buscador) | Which contracts or works match what I am looking for? | SECOP II Contracts `jbjy-vk9h`, Processes `p6dx-8zbt` (MVP); DNP projects (phase 2) | Search field, active filter, counter, risk tag, result row |
| Contract detail | Why does this contract have signals? | Contracts `jbjy-vk9h`, Processes `p6dx-8zbt`, Additions `cb9c-h8sn`, Suspensions `u99c-7mfm` (MVP); Execution `mfmm-jqmq`, Projects ↔ Contracts `uwns-mbwd` (phase 2) | Risk tag (large), key figures, signal *(candidate)*, status *(candidate)*, alert, buttons |
| Works detail | Is this work progressing, and how does the money compare with the progress? | DNP Projects `cf9k-55fw`, Follow-up `7mxf-bp6x`, Projects ↔ Contracts `uwns-mbwd` (phase 2) | Progress *(candidate)*, key figures, linked rows, timeline. **Entity model pending (works vs contract, with Esteban)** |
| Entities (Presupuesto por entidad) | What does each public entity spend its budget on? | CUIPO, PGN budget (phase 2); Contracts `jbjy-vk9h` (MVP) | Bars *(candidate)*, data table, key figures |
| Contractors (Principales contratistas) | Who receives the most contracts and money, and how are their works doing? | Contracts `jbjy-vk9h`, Sanctions `it5q-hg94` / `4n4q-k399` (MVP); RUES (phase 2) | Data table, risk tag, counter |
| Alerts (Alertas de riesgo) | Which signals appear, and where? | Computed from the datasets above; patterns defined in TASK-07 | Risk tag, signal *(candidate)*, map, data table |

Cross-cutting rule from the scope: the global territorial filter (DANE code) limits every page.
