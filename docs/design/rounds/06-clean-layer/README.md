# Round 06 — Clean layer

Status: **Not selected** (2026-11-08). The team found it cleaner, more eye-catching and more inviting to browse. They chose [Round 05](../05-system-reference/README.md), the editorial version, because the product centres on data. Only its bug fixes (phone full-screen view, laptop simulator width) were carried into [guide v1.0](../../guide/README.md). Date: 2026-11-08. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Previous: [Round 05](../05-system-reference/README.md); brief: [discovery](../../discovery/brief.md).

## Feedback addressed

User review of Round 05 (2026-11-08):

- **Typeface decided: Public Sans.** Proposal B (Source Sans 3 + Source Serif 4) is dropped, and so is the typeface switch.
- The "Pagado" bar stays red: it signals an alert. This is a recorded exception to "red means riesgo alto".
- Candidate components (status, coverage, bars, progress, signal) are added to the reference only once approved.
- The phone's "full screen" link opened the desktop layout.
- The work page lacked clarity and visual calm (the timeline was crammed after the money block).
- Open question: is a work (obra) a different business entity from a contract?
- New direction: keep the information architecture and hierarchy, and add a more professional, clean visual layer following Apple's web style (reference: [apple.com/es/macbook-air](https://www.apple.com/es/macbook-air/), checked 2026-11-08).

## Hypothesis

Separating content with surfaces and space instead of rules makes each screen calmer and easier to scan. The risk tag and the key figure then stand out with less effort, without changing what the page says or in what order. The layer consists of white cards on a light-grey canvas, large semibold headlines, an ink lead-in followed by grey text, and pill controls.

## What changed

| Area | Round 05 | Round 06 |
| --- | --- | --- |
| Page | White surface, 2 px rules start each block | `--el-color-canvas` (light grey / black) with white cards (`.el-card`, radius 22 / 28 px); only 1 px hairlines inside cards |
| Neutrals | Blue-tinted ink `#192C3C` | Neutral ink `#1D1D1F`, secondary `#6E6E73`, hairline `#E5E5EA`; dark: `#000` canvas, `#1C1C1E` cards |
| Typography | Two proposals, headings 700 | Public Sans only; headings 600 with tighter tracking (`--el-tracking-*`); body 17 px; figure 80 / 64 px |
| Text pattern | Plain paragraphs | `.el-lead`: the key idea in ink and semibold, the rest in grey |
| Controls | 6 px radius | Buttons, tags, filters, search: pill (`--el-pill-radius`); fields 12 px |
| Alerts | Badge plus border | Tinted surface, coloured icon, no border |
| App bar | Opaque with 2 px rule | Translucent (blur) with a hairline |
| Map panel | Side panel with left rule | Floating card next to the map card; bottom sheet with a large radius on mobile |

**Iteration 2 (user feedback, 2026-11-08), bringing back Round 05 structure where it read better:**

- Mobile page titles go back to bold (700, 28 px). Desktop keeps 600 at 48 px.
- Counters become equal columns with hairlines above, below and between them, so the summary has structure and is aligned.

**Iteration 3 (2026-11-08):**

- The 2 px rules on mobile key figures were tried and reverted.
- Round 05 buttons (6 px radius, weight 600) were tried and reverted: buttons are pills again.
- Counter text is centred. Counters are compact (22 px number, 13 px label, max 420 px) and share the sort row, so the results list starts higher; "Mostrando 5 de 48" moves to the footer line.

Unchanged: risk colours and order, grey hatch, filled tag with level glyph, "signal, not verdict", no invented thresholds, Lucide icons.

## Work page and information architecture (proposal)

The repository's data model already separates them (see [fuentes de datos](../../../fuentes-de-datos.md)):

- A **work (obra)** is a DNP investment project identified by BPIN.
- A **contract** is a SECOP record.
- They are linked through "DNP – Proyectos ↔ Contratos" (`uwns-mbwd`). One work usually has several contracts (construction, supervision).

**Proposal:** two entities with their own pages, linked both ways.

- The work page leads with "Lo principal" (35% built vs 81% paid), then progress, money, **"Contratos de esta obra"** and the timeline.
- The contract page shows **"Hace parte de la obra"**.
- Tender details (single bidder) live on the contract, because a tender belongs to a contract, not to a project.

Status: **deferred**. It will be decided with Esteban once the business model is shaped (user, 2026-11-08). The examples show the proposal only to make it reviewable. If accepted, it affects the scope README ("Seguimiento de obras") and the alert cascade.

## Third-party skill

No Apple-style skill is installed in this repository. Impeccable's `reference/ios.md` covers native iOS apps (HIG, SF Symbols, tab bars), not a web product, so it was not applied. Community Apple-design skills were found but **not installed**: the skill flow requires reading them in full, checking their licence and getting approval first. The layer here comes from the Apple reference page and the existing design skills.

## Files and reproduction

Same structure as Round 05:

- `tokens.json` adds `canvas`, `tracking`, `pill-radius`, `card-radius`, `card-radius-lg`, and drops `rule-strong` and the typeface proposals.
- `screens/phone.html?s=<screen>` is the new full-screen phone view (390 px).
- Proposal B font files are removed.

```sh
python3 docs/design/rounds/06-clean-layer/build.py
```

## Validation

See `validation.md`.
