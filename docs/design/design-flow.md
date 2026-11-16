# Design flow

How a page goes from data to an approved design, and how developers work with the `elephants-design` skill. The detailed agent instructions live in the skill: [Build a page](../../.claude/skills/elephants-design/references/build-page.md).

## In one minute

- **One page at a time (vertical).** We do not design every page up front. Each page goes from its API contract to an approved design before the next one starts.
- **No contract, no design.** The entry ticket is the contract of **our API**, the one the screens consume. It is not the open-data source's contract. The API itself may still be under construction.
- **Nothing invented.** Every element on a page traces back to a contract field, an approved component and approved tokens.
- **Two human approvals per page:** the spec (what and in which order), then the final design. New components need their own approval.

## Where the data comes from

```mermaid
flowchart LR
  OD["Open data<br/>datos.gov.co (SECOP, DNP…)"] --> ING["Ingestion<br/>(TASK-06)"]
  ING --> DB[("Our database<br/>or JSON files")]
  DB --> API["Our API"]
  API --> UI["Screens"]
  C["Our API contract<br/>(OpenAPI / JSON Schema / TS)"] -. "defines" .-> API
  C -. "entry ticket" .-> DS["Page design"]
  DS -. "visual target" .-> UI
```

The design depends only on the last hop: what our API returns. The upstream datasets matter only as each field's origin, so every figure can cite its source and date.

## Where each piece lives

```mermaid
flowchart LR
  subgraph Guide["docs/design/guide/ (v1.0)"]
    T["tokens.json"] -->|build.py| TC["tokens.css"]
    CC["components.css<br/>+ components.json<br/>+ reference page"]
  end
  API["Our API contract"]
  subgraph Page["docs/design/pages/{page}/"]
    K["contract.md"] --> D["data.md"] --> S["spec.md"] --> M["mockup.html"] --> V["validation.md"]
  end
  API --> K
  TC --> M
  CC --> M
  S -. "new component" .-> CC
  M --> APP["Application<br/>(imports tokens.css,<br/>follows spec.md)"]
```

`tokens.json` is the source; `tokens.css` is generated, so never edit it by hand. The catalog is the [design system guide v1.0](guide/README.md); the rules are in [design-system.md](guide/design-system.md).

## The flow for one page

```mermaid
flowchart TD
  A["Page to build"] --> B{"API contract<br/>exists and complete?"}
  B -- No --> B1["Stop: backend defines<br/>or completes the contract"] --> B
  B -- Yes --> C["1. Explore data<br/>our API → ingestion output<br/>→ contract example"]
  C --> D["2. Define the page — spec.md<br/>purpose, hierarchy, states, copy"]
  D --> G1{"Approval 1"}
  G1 -- Changes --> D
  G1 -- Yes --> E{"Catalog has the<br/>components?"}
  E -- No --> E1["Propose new component"] --> E2{"Approved?"}
  E2 -- Iterate --> E1
  E2 -- Yes --> E3["Add to catalog<br/>CSS, reference, docs"] --> E
  E -- Yes --> F["3. Mockup<br/>only tokens + catalog components<br/>mobile + desktop, light + dark"]
  F --> V["4. Validate<br/>accessibility, overflow 320–1280,<br/>detector, copy, 10-second test"]
  V --> G2{"Approval 2"}
  G2 -- Changes --> F
  G2 -- Yes --> H["5. Handoff<br/>page folder status: Approved"]
```

## What the developer does

```mermaid
sequenceDiagram
  autonumber
  actor Dev as Developer
  participant BE as Backend / our API contract
  participant Skill as elephants-design skill
  actor PO as Design owner + team

  Dev->>BE: Contract for the page's endpoint(s)
  BE-->>Dev: OpenAPI / JSON Schema / TS types + example
  Dev->>Skill: "Build the {page} page" + contract location
  Skill->>Skill: 0. Check contract (blocks if incomplete)
  Skill->>Skill: 1. Explore real or sample data → data.md
  Skill-->>PO: 2. spec.md (hierarchy, fields → components)
  PO-->>Skill: Approval 1 (or changes)
  opt A component is missing
    Skill-->>PO: New component proposal
    PO-->>Skill: Approved → added to catalog
  end
  Skill->>Skill: 3–4. Mockup + validation
  Skill-->>PO: mockup.html + validation.md
  PO-->>Skill: Approval 2
  Skill-->>Dev: Approved page folder (contract, spec, mockup, validation)
  Dev->>Dev: Implement with tokens.css + catalog classes
  Note over Dev,BE: If the contract changes later,<br/>the page goes back to step 0
```

## Contract checklist (entry ticket)

For each endpoint a page uses:

- [ ] Method, path and parameters (including the DANE territory filter).
- [ ] Every field: type, unit or format (COP, %, date), and whether it can be null or missing.
- [ ] At least one example response that conforms to the schema.
- [ ] Phase of each field: MVP or phase 2.
- [ ] Origin of each field: the upstream dataset id that ingestion maps it from (see [fuentes de datos](../fuentes-de-datos.md)), or "computed" with its rule owner (for example TASK-07 for risk level).

## What the developer receives

| File | Use it for |
| --- | --- |
| `contract.md` | The exact contract version the design depends on |
| `spec.md` | Build order and hierarchy; the field → component → token table; every state (loading, empty, "Sin datos", error, phase 2 hidden); final copy |
| `mockup.html` | Visual target in mobile and desktop, light and dark |
| `validation.md` | What was verified, and what still needs checking in the real app |

## Rules that never change

- Import `tokens.css`; use `--el-*` variables only. Never a raw hex value.
- Use catalog classes (`.el-*`, listed in `components.json`). If something is missing, ask through the flow; do not improvise a component.
- "Sin datos" is never shown as 0 or as low risk. Missing data uses the grey hatch.
- A signal asks for review; it is not a verdict. No "corrupción", "robo" or "sospechoso" in the interface. No natural persons' names until TASK-08 decides.
- Every figure shows its source and date.
