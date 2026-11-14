# Visual and component usage rules

## Principles

1. **Clarity:** one main question per view; precise labels, units and hierarchy. Neutral surfaces leave the map as the dominant colour field. No glows or decorative gradients.
2. **Explainability:** show source, period, update date, analyzed scope and coverage. A signal is grounds for review, not proof of corruption.
3. **Redundancy:** category labels, exact values, shapes, outlines and missing-data patterns supplement colour. A screen-reader description does not by itself provide a visual alternative for people who cannot distinguish colours.
4. **Consistency and mobile:** retain semantic meaning, labels and units across views. Reflow groups rather than shrinking the desktop view. Keep touch controls at least 44 px high as a product target.

## Colour roles

The user selected blue for lower risk, yellow for intermediate risk and orange/red for higher risk. Round 02's blue `#82B5D0`, amber `#E7AE46` and warm red `#CF726B` are the reference fills. Do not create extra categories without a business reason. Grey hatching means insufficient analysis, never low risk. The definitive risk index, labels, ranges and contract-versus-work aggregation unit remain open in TASK-07.

Use dark blue `#245B78` for actions and links; white on dark blue for the primary button. Pale map fills are not body-text colours. Text uses `#192C3C` and readable secondary `#52626D`. Low-contrast structural separators are not the only boundaries of inputs; controls use a darker border `#71818F`.

Message families combine a light surface with dark text and a labelled symbol: informational blue, amber warning, muted red error and green success. Green only confirms a completed interface action. It must not label a territory as safe. An interface failure and a high-risk territory are different concepts despite using red in their respective contexts.

## Typography, composition and geometry

Use the native system sans-serif family from `tokens.json`; it varies by platform. Default body 16 px, supporting text 14 px, line-height 1.5. Reference view title 30 px (26 px mobile), section heading 22 px, headline figure 52 px. The guide's own cover title is editorial documentation styling, not a new application-title token.

Use 400 body and 500/600 emphasis weights. Space related items by 8–12 px, groups by 24–32 px, control content by 12–16 px. Shared spacing tokens are 4, 8, 12, 16, 24 and 32 px. Control radius 6 px, panel radius 8 px. Prefer separators and whitespace to repeated cards. Use tabular digits for values that change or align.

## Buttons and links

- Primary: one per action group, filled dark blue, concrete verb and optional 20 px leading icon.
- Secondary: white, readable boundary and dark blue label. Tertiary: underlined text action; preserve a clear hit area.
- Hover: darken or add a pale tint without layout jumps. Pressed: restrained feedback. Keyboard focus: 3 px blue outline with a 3 px white gap; do not remove browser focus without an equivalent.
- Disabled: native `disabled`; do not rely on reduced opacity alone. Explain the reason near the control. Loading: prevent duplicate activation, keep a visible loading label and expose the busy state. Animation is optional and must respect reduced motion.
- A link navigates to a real destination; a button performs a local action. Do not implement navigation as an unlabeled icon-only control.

Guide actions are explicitly local demonstrations. They do not fetch real contracts or publish changes.

## Alerts and form states

An alert explains what happened, its implication and the available next step. Avoid alarms, shame, large red areas and unexplained technical errors. Keep error, partial data, empty result and loading distinct. A failed request must not render an empty map as zero risk.

For actual newly occurring failures use an appropriate alert announcement; informational/success updates use polite live regions. Do not announce all static guide samples on page load. Retry feedback in the guide is a local demonstration; the production implementation must reflect the actual request outcome.

Every field has a persistent visible label and useful help text. Validation pairs colour with an explicit correction, `aria-invalid` and associated error text. The guide's year field checks only the four-digit format as a visual specimen; it does not define supported production years. Optional department selection in this specimen does not finalize the production filtering behaviour.

## Data display contract

| Element | Rule | Specimen |
| --- | --- | --- |
| Signal proportion | Distinct flagged contracts / analyzed contracts × 100; show both counts | 30%; 36 of 120 analyzed |
| Coverage | Analyzed / available, displayed separately from risk | 80%; 120 of 150 available |
| Unknown | Zero denominator means unavailable; never coerce to 0% | “Sin datos” |
| True zero | Show 0 when measured zero; explain what was evaluated | 0 of 100 analyzed |
| Count | Integer, local thousands separator, noun required | 2.500 contratos |
| Money | Explicit COP and scale; identify contracted vs paid vs budget | COP 12.450 millones |
| Percent precision | At most one decimal for ordinary summaries; locale `es-CO`; keep original precision for calculations | 12,5%; 30% |
| Change in a percentage | Difference in percentage points, not relative percent change | 26% to 30% = +4 p.p. |
| Date | Data update date separate from reporting period | 31 dic 2025; period 2025 |
| Missing numeric table cell | Visible unavailable label/context; dash only when the column's meaning stays clear | “Sin datos”; count unavailable “—” |

The examples are fixtures, not territorial claims. The 30% example is intentionally not assigned a low/intermediate/high tag: thresholds have not been agreed. A contract with multiple signals counts once in the flagged-contract numerator. Three signals are not necessarily three contracts. Never classify on a rounded display value when the model defines precise boundaries.

## Tags, counts, filters and tables

Status tags are non-interactive: a soft surface, dark text and a supporting icon or pattern. Low/intermediate/high tags must be generated by the agreed methodology, not chosen from a displayed percentage in this guide. Missing data is a separate state.

Counters always name what they count. A decorative badge containing only a number is not sufficient context. A removable filter chip is a native button with an explicit accessible name, a visible selection label, close icon and at least a 44 px interaction height. Removal announces which selection changed.

Tables use meaningful headers, end-aligned numbers and tabular digits. Keep source/period context near data. On mobile, simplify optional columns or provide a contained table scroll area; do not shrink all labels to fit. Territory selection uses an independent contrasting outline and a named detail/selector; it must preserve the fill's risk meaning.

## Iconography

Reuse Lucide as the EKOU landing does: 24 px source canvas, 2 px strokes, rounded joins and caps; display 20 px beside text or 24 px in alerts. Keep a consistent family and avoid emoji as interface icons. Search, map-pin, filter, chevron, information, warning, error, confirmation, loading and external-source icons have specific roles.

Decorative icons have `aria-hidden`; visible text carries meaning. An icon-only action needs a meaningful accessible name and a sufficiently large target. Do not depend on hover tooltips for essential meaning. Do not use a skull, criminal imagery or a green safety shield as a territorial-risk verdict.

## Accessibility targets and evidence

Target WCAG AA minimum text contrast of 4.5:1 for ordinary text; 3:1 where required for essential control/state boundaries and meaningful non-text information. These are not universal requirements for every decorative line. Product control sizing aims at 44 px, above WCAG 2.5.8's 24 px baseline (which has exceptions).

`contrast-report.json` records the computed token pairs and build-time pass/fail checks. This verifies only these colour pairs, not the whole interface, map polygons, disabled states or every icon interaction. Map fills remain paired with labels, exact-value access and unknown-data hatching; a separate geographic colour-perception/non-text contrast review is still required.

## References — checked 2026-11-07

- [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [W3C use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- [W3C minimum target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [Lucide design language](https://lucide.dev/contribute/icons/design-principles).
