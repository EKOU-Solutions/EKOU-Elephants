# Visual direction

## Agreed intent

A clear, approachable and rigorous citizen tool for understanding Colombian public spending. Preserve a restrained relationship with EKOU: a light neutral reading surface, dark blue text and small brand accents. Geographic data should receive the strongest colour emphasis.

Brand, interaction and data have separate roles. Selection must retain the territory's data fill and use an outline plus an explicit name. Risk is an explainable signal, not a corruption verdict. Unknown data must never appear as zero or low risk.

## Final selection (2026-11-08)

**Decision:** the user and Esteban selected the [Round 05](rounds/05-system-reference/README.md) editorial direction. It became the [design system guide v1.0](guide/README.md). The typeface is **Public Sans**, confirmed on the same day.

| Decided | Detail |
| --- | --- |
| Visual language | Round 05 editorial: neutral surface, lines instead of cards, large figures with source, risk fills ordered light → dark, filled risk tags with a 1/2/3-bar glyph, light and dark themes |
| Typeface | Public Sans 5.3.0, self-hosted, single family |
| Not selected | [Round 06](rounds/06-clean-layer/README.md) clean layer (canvas with white cards, pill controls, Apple-like spacing). It is cleaner and more eye-catching, and it invites browsing. The product, though, wants to centre on the data, and the editorial version serves that better |
| Kept from the Round 05 review | The "Pagado" / expected mark stays red as an alert cue (a recorded exception to "red means riesgo alto"). Candidate components enter the catalogue only once a page approves them |
| Carried over from Round 06 | Bug fixes only: the phone full-screen view and the laptop simulator's width at 320 px |
| Still open | Works (obra) vs contract as entities: decided when the business model is shaped with Esteban. Risk thresholds: TASK-07. Personal data: TASK-08 |

This confirms the brief's "data journalism" visual world. How pages are designed from now on: [design flow](design-flow.md).

## Earlier selection — Round 02 (basis of the colour roles)

The user selected Round 02's visual direction after comparing Transparency-inspired Round 03. The all-warm map suggested that everything was wrong; distinct blue, yellow and warm-red categories communicate the intended business meaning more clearly to the user. The native system font's legibility remains accepted.

| Foundation | Selected direction / pending detail |
| --- | --- |
| Font | Native system sans serif, no external font download (superseded: Public Sans, 2026-11-08) |
| Body / secondary text | Round 02 reference: 16 px / 14 px |
| Heading / key figure | Round 02 reference: 30 px heading desktop, 26 px mobile; 52 px percentage |
| Spacing | 4, 8, 12, 16, 24, 32 px |
| Surface | White; quiet separators; minimal card styling |
| Text / secondary text | Round 02: `#192C3C` / `#52626D` |
| Functional accent | Restrained blue `#245B78` |
| Lower risk | Blue, using Round 02's `#82B5D0` as the visual reference |
| Intermediate risk | Yellow/amber, using `#E7AE46` as the visual reference |
| Higher risk | Orange/red, using `#CF726B` as the current warm-red reference; exact production token pending |
| Error | Restrained pale red surface, red edge, visible symbol, explicit wording and retry |
| Partial information | Small amber warning, with coverage count |
| Insufficient data | Neutral grey hatch and explicit label, never a low-risk blue fill |

Acceptance covers the visual direction and semantic colour roles. It does not finalize every token, component state, threshold or label. Keep identity accents small and the map as the main use of colour. Avoid decorative gradients, glows, inclined cards and multicoloured backgrounds in consultation views.

## Application to geographic data

Blue must cover the agreed lower-risk category, not only the exact zero-signals case used in Round 02's fixture. Yellow/amber marks an intermediate category; orange/red marks higher risk. Numeric boundaries, whether three or more categories are needed, and the definitive risk calculation remain pending. Do not promote the illustrative 25% boundary to a business rule.

Pair colour with a clear legend, selected territorial name, exact metric and explanation. Keep selection as a separate outline without changing the category fill. Missing analysis must remain distinct from zero detected signals. A lower-risk label is relative to the defined signals and available data; it is not a guarantee of absence of irregularities.

The existing prototype demonstrates flagged contracts divided by analyzed contracts, counting each flagged contract once. Coverage is displayed separately. The user requested contract-based semantics while the project README describes works; the definitive unit, aggregation/cascade and methodology remain open under TASK-07. A visual choice does not settle these business questions.

Real, simplified departmental geography is used for composition only. Prototype ISO codes are not production DANE identifiers. A production map still needs geographic labeling, zoom/small-unit treatment and an accessible data alternative.

## Review continuity

- [Round 01](rounds/01-territory-overview/README.md): typography legibility accepted; amount-based map superseded.
- [Round 02](rounds/02-risk-signals/README.md): initially rejected for mixed colours, then selected by the user after comparing references and Round 03. Its prototype remains a historical fixture with **unapproved 0%/25% bins**, which must be updated when the risk parameters are agreed.
- [Round 03](rounds/03-warm-risk-map/README.md): not selected; the all-warm palette felt chaotic and conveyed that everything was wrong.

- [Round 04](rounds/04-grounded-guide/README.md): structure not clear enough to build from; hatch kept.
- [Round 05](rounds/05-system-reference/README.md): **selected (final)**, became guide v1.0 with Public Sans.
- [Round 06](rounds/06-clean-layer/README.md): not selected; cleaner and invites browsing, but less centred on the data.

Product copy is Spanish for the Colombian audience; repository documentation is English. The accepted reference is the [design system guide v1.0](guide/README.md); the earlier [guide v0.1](archive/guide-v0.1/README.md), built on Round 02, is archived. Numeric risk thresholds remain undefined.

## Accessibility and mobile

Use sufficient text contrast, visible keyboard focus, native controls and at least 44 px control heights. Do not encode meaning with colour alone: pair the legend with numeric ranges, a selected-name/value panel and missing-data text/hatching. On narrow screens stack map and detail without horizontal overflow. Keep all essential information available without hover. Loading, error and missing information have distinct messages.

This prototype is not a complete accessibility audit or functional map specification.

## References inspected 2026-11-07

- [EKOU palette](https://github.com/EKOU-Solutions/ekou-landing/blob/4912a42c0df6fd729e7f80c737e3c326ac6d16db/src/styles/global.css).
- [EKOU welcome composition](https://github.com/EKOU-Solutions/ekou-landing/blob/4912a42c0df6fd729e7f80c737e3c326ac6d16db/src/components/Welcome.astro).
- [WCAG use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- [WCAG minimum text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

The deployment linked from the landing repository returned 404 when inspected; the reference analysis used its source code.
