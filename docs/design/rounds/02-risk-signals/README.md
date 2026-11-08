# Round 02 — Risk signals

Status: **Visual direction selected after comparison — risk parameters pending**. Date: 2026-11-07. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Previous: [Round 01](../01-territory-overview/README.md).

## Feedback addressed

The user accepted the legibility of Round 01's typography, rejected its neutral error treatment, and corrected the map's meaning: colour must communicate possible risk signals, rather than contracted amounts. Requested direction: clean, clear, professional and visually understandable for the general public.

This round keeps the system font, removes the promotional eyebrow, reduces container styling, and gives the map and a single territorial detail area priority. Citizen-facing copy is Spanish for the Colombian audience; repository documentation remains English.

## Visual semantics — proposed

| Role | Map fill | Visible wording |
| --- | --- | --- |
| Evaluated, zero detected signals | Blue `#82B5D0` | Sin señales detectadas |
| Nonzero proportion below illustrative cut | Amber `#E7AE46` | Menos del 25% / Señales presentes |
| Greater proportion in this example | Muted red `#CF726B` | 25% o más / Mayor proporción de señales |
| No usable analysis | Grey hatching | Sin datos suficientes |

Blue is the baseline for evaluated data, never a substitute for missing analysis or a guarantee of safety. The selected outline is dark and independent from the risk fill. The legend names ranges; the selector and detail panel provide exact values without relying on colour. No green “safe” state is claimed.

Interface errors use a pale red surface, a restrained red edge, a visible exclamation symbol, the explicit label “Error de carga”, plain-language explanation and a retry action. Partial coverage uses a smaller amber warning. Red means an interface failure in the error message and a larger proportion of signals on the map; location and visible labels keep these distinct. Data error hides the map rather than recolouring it red. Empty data is neutral/informational, not a failure or a zero-risk result.

## Business meaning and unresolved methodology

The user's latest direction uses **contracts**. This fixture therefore calculates `distinct flagged contracts / analyzed contracts × 100`. Multiple signals on a contract must not inflate the numerator. Coverage is `analyzed / available`, shown separately when partial.

The current project README describes a percentage of **works** with suspicious patterns. Do not silently treat works and contracts as equivalent: the definitive unit, eligibility rules, missing-data policy, signal calculation and municipal/departmental cascade remain to be resolved in TASK-07. This round demonstrates the user's contract-oriented direction without rewriting the canonical business scope.

The 25% cut is a **visual-review fixture only**, not an agreed operational threshold, risk model or statistically validated boundary. Every territory and count is fictional. The UI explicitly identifies this as a demonstration and exposes the explanation. Definitive labels and bins need review with real distributions and methodology. Zero denominator results are unknown, not zero percent.

## Reproduction

```sh
python3 docs/design/rounds/02-risk-signals/build.py
```

Edit `source.html` and `assets/territories.json`; rebuild ignored `mockup.html` and `preview.html`. No packages or network are needed to use the previews. `build.py` also checks counts, nonnegative denominators and numerator bounds.

The round owns its geometry copy so it remains reproducible if Round 01 changes. It reuses the source, projection, winding normalization and attribution documented in [Round 01 geography](../01-territory-overview/README.md#geography-and-attribution): geoBoundaries COL ADM1, OSM/Wambacher, represented year 2017, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Prototype ISO codes are not DANE identifiers. Small units remain accessible through the selector; this is not a production cartographic specification.

## Review

- Does the error read immediately as a recoverable problem?
- Do blue, amber and red make the map's meaning understandable with the legend?
- Are a risk signal, proven corruption and missing information clearly distinguished?
- Can the reader see the numerator, denominator and partial coverage?
- Is the same typography still comfortable on desktop and mobile?

User feedback, 2026-11-07: the composition and mixed palette do not feel professional. Pause further proposals and inspect real interactive data maps. See [reference research](../../references/interactive-maps.md) and `validation.md` for observed checks and limitations.

## Subsequent selection

2026-11-07: after reviewing the Transparency-inspired Round 03, the user selected this round's graphic direction. The all-warm alternative felt chaotic and suggested that everything was wrong. Selected colour meaning: blue for lower risk, yellow for intermediate risk, orange/red for higher risk, based on parameters still to be agreed. Typography remains accepted; insufficient data stays grey/hatched.

This later decision supersedes the earlier rejection of the direction. It does **not** accept the fixture's zero-only blue category or 25% boundary. The preview is preserved as the reviewed example; definitive category ranges and labels await the risk methodology. See [current direction](../../visual-direction.md).
