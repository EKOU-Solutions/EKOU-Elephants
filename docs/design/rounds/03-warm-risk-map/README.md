# Round 03 — Continuous warm risk map

Status: **Not selected — Round 02 direction selected instead**. Date: 2026-11-07. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).

## Requested direction

Following rejection of [Round 02](../02-risk-signals/README.md), the user selected the visual direction of [Transparency International CPI 2025](https://www.transparency.org/en/cpi/2025) and supplied a reference image: white background, warm yellow/orange/coral/red progression, strong editorial hierarchy and geography as the main visual.

This is an original composition inspired by that direction, not a copy of TI's identity, index, methodology or assets. Keep the accepted native system font. Product text is Spanish; repository documentation is English.

## What changes

- Replace unrelated blue/amber/red categories with one continuous warm scale.
- Use a white surface, charcoal typography, an editorial title and quiet dividers; no decorative glows, promotional eyebrow or repeated cards.
- Put a compact territorial summary on the left and the larger map on the right. On mobile, show the map before the detail. An expandable departmental list offers exact values and native selection buttons.
- Keep explicit error semantics: restrained red surface/edge, exclamation, error label and retry. Missing analysis remains grey hatching, not yellow/zero.

## Palette and meaning

The map encodes `distinct flagged contracts / analyzed contracts × 100`, with one count per contract. Continuous interpolation between these stops:

| Percentage | Fill |
| --- | --- |
| 0% | `#FFE58F` |
| 20% | `#FFC473` |
| 40% | `#F99565` |
| 60% | `#EF7164` |
| 80% | `#D34B58` |
| 100% | `#9D334A` |

Legend ticks at 0, 25, 50, 75 and 100% are numeric reference positions, **not risk thresholds**. This round does not assign low/medium/high risk categories. The scale direction is specific to Elephants: larger percentages mean more contracts with signals. Do not import CPI's numeric interpretation, whose high scores represent a different concept.

Fictional fixtures deliberately span the scale for visual review. Antioquia starts at 36/120 = 30%, with 120 of 150 available contracts analyzed. Unknown analysis has a zero denominator, no percentage and a grey hatch. Zero detected signals is not a guarantee of safety. All departmental values are illustrative, not factual assessments.

The definitive contract-versus-work unit, signal definitions, coverage rules and aggregation/cascade remain unresolved as recorded in Round 02. Choosing this visual direction does not settle TASK-07 or alter the project README's business rules.

## Reproduction and sources

```sh
python3 docs/design/rounds/03-warm-risk-map/build.py
```

Editable sources: `source.html`, `assets/territories.json`, `assets/map-paths.svg`. Generated `mockup.html` and `preview.html` are ignored and reproducible with Python standard library; no runtime downloads or package installation are needed.

Geometry is a preserved copy of the existing projected geoBoundaries/OSM asset. Provenance, pinned input, projection and winding normalization are documented in [Round 01](../01-territory-overview/README.md#geography-and-attribution). The derived path asset retains ODbL 1.0 attribution. Source geometry year: 2017. Prototype ISO codes are not production DANE identifiers.

## Review questions

- Does the coherent warm progression feel more professional than the previous mixed palette?
- Do the map, legend and selected department form a clear visual hierarchy?
- Is it obvious that a signal calls for review rather than proving corruption?
- Do the error and unknown-data states remain distinct?

See `validation.md` for observed checks. User feedback: the all-warm map felt chaotic, as though everything was wrong. The user selected Round 02’s blue/yellow/orange-red category direction instead; parameters remain pending.
