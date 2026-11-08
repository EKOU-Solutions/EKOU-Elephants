# Validation — Visual guide v0.1

Checked locally on 2026-11-07 against the generated standalone preview.

## Observed checks

- Python build succeeds; placeholders resolved; integrated fragment approximately 40 KB; JavaScript syntax check passes.
- All 10 configured contrast pairs pass their assigned 4.5:1 text or 3:1 non-text threshold. Exact pairs and ratios are in `contrast-report.json`; the build checks unrounded ratios.
- Visually inspected all four sections on desktop, including risk swatches, message colours, icon gallery, buttons, alerts, numeric examples, tags and counters.
- 23 initial Lucide icons rendered in the offline standalone preview; no unresolved initial icon placeholders.
- Section navigation changes the visible content and active state.
- Query demo returns local feedback; explanation action reveals text.
- Year `20` is rejected with visible associated error and `aria-invalid=true`; `2025` is accepted and clears the error state.
- Retry changes the error specimen to a success treatment, updates the label and icon, and announces local demonstration feedback. It does not claim a real network request occurred.
- A keyboard Tab from the primary query button moves focus to the secondary action.
- Removing the Antioquia filter chip hides it and announces the removal.
- No document horizontal overflow in any of the four sections at 320 px; colour section also checked at 1024 px. On narrow screens the exact-value table has a contained horizontal scroll area.
- Full mobile data/tag composition visually inspected. The observed primary button and field heights were 46 px, above the 44 px product minimum.
- No captured browser JavaScript errors in these checks.

## Data and decision integrity

- Fixture signal proportion: 36/120 = 30%; analysis coverage: 120/150 = 80%; change from 26% to 30% = +4 percentage points.
- Formatted specimens: 2.500 contracts and COP 12.450 million (Spanish rendering), separate from the contracted-versus-paid meaning.
- No numeric risk thresholds are assigned. Semantic tags are independent specimens, not classifications of the 30% example.
- Existing selected visual direction remains selected; newly proposed component details are explicitly awaiting review.

## Limits

These checks cover the documented specimens and token pairs, not a production application or a complete accessibility audit. No exhaustive screen-reader, zoom, colour-vision or cross-browser review. Geographic map contrast, full data methodology, contract/work aggregation, real sources and production request/error behaviour remain separate work. The integrated canvas uses the same fragment and the host's Lucide runtime; browser checks used the offline standalone wrapper.
