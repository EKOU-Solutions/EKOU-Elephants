# Build a page

Output: `docs/design/pages/<page>/`, a page design built only on the API contract, approved tokens and catalog components, ready for development.

We work **vertically**: one page from data to approved design, then the next page. Nothing about a page is assumed in advance. The [tentative page reference](../../../../docs/design/pages/README.md#tentative-reference) and the candidate components are starting points, never specifications.

Developer-facing explanation with diagrams: [`docs/design/design-flow.md`](../../../../docs/design/design-flow.md).

## Gates

Stop at each gate and wait for the user's explicit approval. A step does not start until the previous gate has passed.

| Step | Output | Gate |
| --- | --- | --- |
| 0. Contract check | `contract.md` | Contract present and complete |
| 1. Explore data | `data.md` | — |
| 2. Define the page | `spec.md` | **Approval 1** |
| 3. Components | catalog updated (if needed) | **Approval per new component** |
| 4. Mockup | `mockup.html` (+ `build.py` if generated) | — |
| 5. Validate | `validation.md` | — |
| 6. Approve and hand off | `README.md` status "Approved" | **Approval 2** |

## 0. Contract check (blocking)

Before any design work, confirm that the page's **API contract** exists. This is the contract of **our own API**: the endpoints and response shapes the screens consume. It is not a SECOP contract and not the open-data source.

The data path is fixed:

```
open-data sources (datos.gov.co …) → ingestion (TASK-06) → our database or JSON files → our API → screens
```

The design depends only on the last hop, our API. Raw upstream fields never reach a page directly. The API may still be under construction; its contract may not.

Accepted forms: OpenAPI, JSON Schema or TypeScript types, until TASK-03 fixes one. The minimum for each endpoint the page uses:

- [ ] Endpoint (method, path, parameters such as the DANE territory filter).
- [ ] Every field: name, type, unit or format (COP, %, date), and whether it can be null or missing.
- [ ] At least one example response that conforms to the schema.
- [ ] Phase of each field: MVP or phase 2.
- [ ] Origin of each field: the upstream dataset id from `docs/fuentes-de-datos.md` that ingestion maps it from, or "computed" plus the rule's owner (for example TASK-07 for risk level). This traceability lets every figure show its source and date.

If anything is missing, **stop**. List what is missing in `contract.md` and ask the user or backend to complete it. Never design on assumed fields.

Record in `contract.md`: where the contract lives (path or URL plus commit or version) and the date it was checked.

## 1. Explore data

Work from real data, in this order of preference:

1. **Our API**, if the endpoint responds (any environment).
2. **Ingestion output**: rows in the database or the JSON files that ingestion writes, shaped to the contract.
3. **The contract's example response**, checked for realism against samples of the upstream open-data datasets the fields map from (`datos.gov.co`, no auth; see `docs/fuentes-de-datos.md`). Reshape those samples to the contract; never design on the raw upstream shape.

Record every query or file with its location and date.

`data.md` answers:

- **What is really there:** fill rate of each field, typical and extreme values (longest name, largest amount, zero, null), volumes (how many rows a territory or list returns).
- **What is phase 2:** fields the page cannot show yet.
- **Sensitive data:** natural persons' names or IDs. Anonymise them in every artefact until TASK-08 says otherwise; companies and public entities may be shown.
- **Surprises** that change the design, for example a field that is empty for half the records.

## 2. Define the page (`spec.md`)

One document, in this order:

1. **Purpose:** the question the page answers, the audience (brief), and the 10-second test: what must be understood first.
2. **Content and hierarchy:** an ordered table, where row 1 is seen first.

   | Order | Content | Contract field(s) | Component | Tokens | If missing / null | Phase |
   | --- | --- | --- | --- | --- | --- | --- |

3. **States:** loading, empty result, "Sin datos" (never shown as 0 or as low risk), error with recovery, phase-2 fields hidden.
4. **Layout:** mobile first (390 px), then desktop (1280 px); what moves or collapses.
5. **Copy:** citizen-facing Spanish (Colombia) in the agreed direct tone. Never "corrupción", "robo" or "sospechoso"; never natural persons' names. Every figure carries its source and date.
6. **Open questions** for the user.

Every row must trace to a contract field or a fixed rule. Anything that does not trace is removed or listed as an open question. Get **Approval 1**.

## 3. Components

For each row of the spec:

1. Use a **catalog component**. The catalog is the [design system guide v1.0](../../../../docs/design/guide/README.md): `components.json` lists every component, and `design-system.md` holds the rules.
2. Components with `"status": "candidate"` (status pill, coverage bar, breakdown bars, progress vs expected, signal item) are approved or discarded here, the first time a real page needs them. On approval, set them to `core`; if discarded, remove them.
3. If nothing fits, propose a **new component**:
   - purpose, anatomy, variants, states, tokens, accessibility, do / avoid;
   - a specimen in the reference page (`source.html`).

   Iterate until the user approves it. Then add it to the guide:
   - `components.css`;
   - `components.json`;
   - its section in `source.html`.

   Next, run `build.py`, which fails if `components.json` and the CSS or tokens disagree. Then bump the guide's minor version and note the change in the guide README. Never use a component in a page before it is in the catalog.
4. A new token follows the same path: it goes into `tokens.json`, then `build.py` regenerates `tokens.css` and checks contrast. Never use a raw hex value.
5. A change of direction (palette, type, layout language) is not done here. It is a [round](round.md).

## 4. Mockup

`mockup.html` uses only the guide's `tokens.css` and `components.css`, plus its own page layout. Requirements:

- Data from step 1, conforming to the contract, labelled as a sample with its date; natural persons anonymised.
- Mobile and desktop.
- Light and dark themes.
- At least one stressed case: longest name, missing field, empty list.

If the page reuses the examples tooling, generate it with a small `build.py` (Python standard library) and ignore the generated output, like the rounds do.

## 5. Validate (`validation.md`)

- Contrast pairs pass (`build.py`); risk is never conveyed by colour alone.
- No horizontal overflow at 320, 390, 768 and 1280 px; 200% zoom readable.
- Keyboard order and visible focus; accessible names on icon buttons, map and charts. Run `design:accessibility-review`.
- `impeccable detect` on the mockup. Report the accepted advisories (grey hatch) as such.
- Copy reviewed against the tone rules (`design:ux-copy`).
- The 10-second test from the spec, answered honestly.
- Limits: what was not checked.

## 6. Approve and hand off

When the user approves (**Approval 2**):

- Set the page `README.md` to "Approved" with the date.
- Add or update the row in `docs/design/pages/README.md`.

The handoff is the folder itself:

- `contract.md`: which contract version the design depends on.
- `spec.md`: hierarchy, field to component to token mapping, states, copy.
- `mockup.html`: the visual target.
- `validation.md`: what was verified.

If the contract changes after approval, the page goes back to step 0: re-check the contract and update `spec.md`.

Do not commit or publish without the user's instruction.
