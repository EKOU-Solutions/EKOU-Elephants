# Round 05 — System reference

Status: **Selected (final)** (2026-11-08); consolidated as the [design system guide v1.0](../../guide/README.md) with Public Sans. [Round 06](../06-clean-layer/README.md) was explored and not selected. Date: 2026-11-08. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Previous: [Round 04](../04-grounded-guide/README.md); audit: [2026-11-08](../../audits/2026-11-08-round-04.md); brief: [discovery](../../discovery/brief.md).

## Feedback addressed

User review of Round 04 (2026-11-08):

- Foundations, components and "cifras y etiquetas" were not clear enough to build from. The system must be clear and digestible for developers, UX and UI.
- Typeface: must be legible and self-hosted (the system font varies by platform); Atkinson's slashed zero is rejected for numbers. Two options may be proposed.
- Grey hatch for missing data: kept, confirmed as clear.
- The national headline belongs to the future Map page, not to the design system; example copy must use the agreed direct, mobilising tone.
- Re-order the risk colours and add a dark theme; both themes will be used.
- Format: Storybook or per-round HTML preview are both acceptable.

Follow-up review (2026-11-08, same day):

- Risk tags, counters and the map panel did not stand out; the information hierarchy must make the risk label obvious.
- The map panel looked serious but not professional, current or eye-catching.
- Integrate the components into real screens on a separate page, shown in realistic phone and laptop simulators, to judge what works.
- Alerts needed another style and variants; the Display callout must be blue and full width.

## Hypothesis

A reference organised like component documentation — one page, side index, and the same template for every piece — lets dev, UX and UI build without interpretation, and keeps iteration fast.

## Decisions taken in this round

- **Format: per-round HTML preview now, Storybook later.** The React archetype (TASK-04) is not merged yet; a static page iterates faster. `tokens.css` is generated so the app can import the same variables when it exists, and the component markup/classes in each "Código" block map to future React components.
- **Template per piece:** what it is · specimen with variants and states · when to use · tokens · do / avoid · code · accessibility.
- **Index:** Start (how to use, principles) · Foundations (colour, typography, spacing and shape, icons, voice and tone) · Components (button, alert, form field, risk tag, counter, active filter, key figure, data table, map with legend).

- **Risk tag, filled:** risk colour as background, `--el-color-on-risk-*` text (≥ 4.5:1 in both themes) and a three-bar level glyph (1, 2 or 3 filled bars; dashed for "Sin datos"), so the level reads without colour. Two sizes: normal (lists, tables, map) and large (once, at the top of a detail page).
- **Red means "riesgo alto" only.** "Con señales" counts and bars use ink (`.el-key-flagged`), not the risk red, so a red mark never contradicts the territory's level.
- **Counter:** stat blocks (large number over its label) instead of inline text.
- **Alerts:** colour only in the icon badge and border, text in ink; three variants: page banner, inline alert, compact note.
- **Candidate components** introduced by the examples (review before adopting): status pill (`.el-status`), coverage bar with hatch for "not analysed" (`.el-coverage`), horizontal bars (`.el-bars`), progress against expected (`.el-progress`), numbered signal row (`.el-signal`).

## Examples page

`examples.html` shows four screens built only with the system: contract detail, results list, map with territory panel, and public-works detail. Each one appears in an iPhone-like simulator (390 × 844) next to a MacBook-like simulator (1280 × 800 browser viewport), with the questions to judge listed above it. Theme and typeface switches propagate to every screen. Screens are generated from `examples/*.html` fragments with `examples/app.css` (app shell and layouts, not system components).

## Proposals awaiting decision

| Topic | Proposal |
| --- | --- |
| Typeface A | **Public Sans** 5.3.0 (USWDS), one family for everything; plain zero; OFL 1.1; ~27 KB |
| Typeface B | **Source Sans 3** 5.3.1 for UI + **Source Serif 4** 5.3.1 for titles and headline figures; plain zero; OFL 1.1; ~80 KB |
| Risk fills, light | `#7FB4D4` low · `#CF8721` intermediate · `#A93F39` high — lightness descends low → high |
| Risk fills, dark | `#34708F` low · `#C08A2E` intermediate · `#F4A397` high — order inverted so high risk is the most visible on a dark surface |
| Dark theme | Full token set in `tokens.json` → `tokens.css`; follows the device by default, with a manual switch (`data-theme`) |

Both typefaces can be switched live in the preview. `tokens.css` defaults to A until the team chooses.

Unchanged: blue / yellow / warm-red roles, grey hatch for missing data, no invented thresholds (the map specimen's category split is illustrative and labelled), "signal, not verdict".

## Files and reproduction

- `source.html`: the reference page (Spanish product copy).
- `components.css`: component styles shared by the reference and the examples.
- `examples.source.html`, `examples/`: the examples page, its screen fragments and the app-shell CSS.
- `tokens.json`: source of truth for both themes, typography, spacing and geometry.
- `build.py`: Python standard library only. Writes `tokens.css` and `contrast-report.json` (versioned) and `preview.html`, `examples.html` and `screens/*.html` (ignored, standalone, offline, fonts embedded).
- `assets/fonts/`: pinned latin variable woff2 files with their OFL licences; `assets/`: own copies of the map paths and fictional fixture.
- Lucide is reused from `../../guide/assets`.

```sh
python3 docs/design/rounds/05-system-reference/build.py
```

## Sources (checked 2026-11-08)

- Fonts via Fontsource: [`@fontsource-variable/public-sans@5.3.0`](https://cdn.jsdelivr.net/npm/@fontsource-variable/public-sans@5.3.0/) (published 2026-07-19), [`@fontsource-variable/source-sans-3@5.3.1`](https://cdn.jsdelivr.net/npm/@fontsource-variable/source-sans-3@5.3.1/) and [`@fontsource-variable/source-serif-4@5.3.1`](https://cdn.jsdelivr.net/npm/@fontsource-variable/source-serif-4@5.3.1/) (published 2026-10-11), all OFL-1.1.
- Geography: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0; provenance in [Round 01](../01-territory-overview/README.md#geography-and-attribution). All values are fictional.

## Validation

See `validation.md`.

## Review outcome (2026-11-08)

- Typeface: **Public Sans** (proposal A) chosen.
- "Pagado" bar on the work screen stays red as an alert.
- Candidate components enter the reference only after approval.
- Bug: the phone "full screen" link opened the desktop layout (fixed in Round 06).
- Work page lacks clarity and visual calm; information architecture of work vs contract to be reviewed.
- Next: a cleaner, Apple-like visual layer keeping this architecture and hierarchy ([Round 06](../06-clean-layer/README.md)).
