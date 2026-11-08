# Interactive map references

Inspected 2026-11-07 in the browser. This is design research, not a tool/vendor selection. The user subsequently selected Transparency’s direction for an example; the resulting palette remains a proposal.

## Reason for this review

The user rejected Round 02: its mixture of colours did not feel professional. Preserve the previously accepted system-font legibility. Pause new mockups and compare actual data maps before selecting the next direction.

## Shortlist

| Reference | Observed visual treatment | Candidate lesson for Elephants |
| --- | --- | --- |
| [Our World in Data — government spending](https://ourworldindata.org/grapher/historical-gov-spending-gdp?tab=map) | White surface; sequential purple scale; numeric legend under map; separate no-data hatching; adjacent country list; map/table/chart views | A coherent scale can communicate quantity without unrelated categorical colours. Study hierarchy and legend simplicity. |
| [Transparency International — CPI 2025](https://www.transparency.org/en/cpi/2025) | Yellow-to-dark-red scale; country list and map; selection reveals score and trend detail | Study a coherent warm progression and separation between overview and country detail. Its corruption-perception index measures a different construct from contract risk signals; do not inherit its methodology or verdict-like labels. |
| [The Opportunity Atlas](https://www.opportunityatlas.org/) | Map fills the main workspace; lateral metrics; search; persistent bottom legend; selection and contextual filters | Study spatial hierarchy and navigation. Its diverging multihue palette and control density are not the recommended starting palette for Elephants. |

These are observations and design interpretations, not claims of usability validation. Actual interactive views were inspected, including OWID's map, the CPI map and Colombian detail, and the Atlas neighborhood-mobility map after dismissing onboarding.

## Recommendation for discussion

Start with OWID's restrained sequential treatment and compare it against CPI's coherent warm progression. Consider the Atlas only for the layout and territorial exploration model. Branding and interface state colours do not need to appear as competing classes in the geographic data scale.

Choose the visual treatment before drawing Round 03. Semantic risk aggregation, labels, thresholds and accessibility validation remain separate requirements; a chosen reference does not settle them.

## Feedback pending

Which feels closer to the intended product: an editorial data view (OWID), a thematic index (CPI), or a map-centred workspace (Atlas)? What should carry forward from its palette, hierarchy and territory detail?

## Selected direction

2026-11-07: user requested an example following Transparency and supplied its CPI 2025 warm-map image. Continue with [Round 03](../rounds/03-warm-risk-map/README.md). This authorizes the exploration, not final acceptance of its palette or methodology.

## Final comparison outcome

2026-11-07: the user did not select the resulting all-warm Round 03. They returned to Round 02's graphic direction: lower-risk blue, intermediate yellow, higher-risk orange/red, with numeric parameters to be defined later. The earlier selection of Transparency authorized an experiment, not lasting acceptance. See [current visual direction](../visual-direction.md).
