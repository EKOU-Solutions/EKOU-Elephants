# Round 04 — Grounded guide

Status: **Proposed — awaiting review**. Date: 2026-11-08. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Previous: [Round 02](../02-risk-signals/README.md) (selected direction) and [guide v0.1](../../guide/README.md).

## Feedback addressed

The user found [guide v0.1](../../guide/README.md) still looked "very AI" and asked for design principles grounded in the business objective. This round keeps the selected Round 02 semantics and reworks everything around them. v0.1 is left untouched for comparison.

## Hypothesis

A guide that behaves like a well-made public record (map first, ledger rules, plain language) reads as more credible to citizens than a SaaS-style kit, without changing the accepted colour meaning.

## What changes from v0.1

- **Map-led opening.** The first element is a real departmental map with legend, grey hatch for missing data, a selected-territory outline and an exact-value readout, instead of a slogan. The title states the product's core principle: a signal asks for review, it does not accuse.
- **Template chrome removed.** No all-caps label above the title, no 01–04 numbering (the sections are not a sequence), no tinted icon callouts, no card containers, no left-border stripes. Structure comes from ink rules and whitespace.
- **Tags equal the legend.** Each risk tag shows the exact map fill (or the hatch) next to its name.
- **Plain-language voice.** A "Cómo escribimos" table translates the README's risk patterns (single bidder, repeated direct contracting, cost overrun, unfinished works) into everyday Spanish for the general public.
- **Geometry.** 2 px corners on data marks, 6 px on controls, no panel radius. Headline figure reduced from 52 to 44 px.
- **Typeface under comparison.** Atkinson Hyperlegible Next (designed for low vision, SIL OFL 1.1, self-hosted) versus the system font accepted after Round 01. Both are built so they can be compared. The Atkinson zero is slashed by design.

Unchanged: blue / yellow / warm-red / grey-hatch roles, colour tokens, contrast pairs, accessibility targets and data-display rules.

## Decisions and open questions

Accepted: none yet. Needs a decision: the typeface, and whether this structure replaces v0.1 as the guide. Risk thresholds, labels and the contract-versus-work unit remain TASK-07. The hero's category split (up to 12% blue, up to 30% amber, above red) is an **illustrative example only**, labelled as such in the guide, and is not an agreed threshold nor the Round 02 fixture's 0%/25% bins.

## Files and reproduction

- `source.html`: editable guide; `§` in its CSS is replaced by the root selector at build time.
- `tokens.json`: candidate tokens (v0.2: both font families, weights, 2 px mark radius).
- `assets/`: pinned Atkinson Hyperlegible Next 5.3.0 latin variable woff2 and its [OFL licence](assets/ATKINSON-OFL); own copies of the Round 02 map paths and fictional territory fixture.
- `build.py`: Python 3 standard library only. Reuses the pinned Lucide bundle from `../../guide/assets`.

```sh
python3 docs/design/rounds/04-grounded-guide/build.py
```

Outputs, ignored: `preview.html` and `guide.html` (Atkinson) and `preview-system.html` and `guide-system.html` (system font); `contrast-report.json` is versioned. Previews work offline.

## Sources

- Font: [`@fontsource-variable/atkinson-hyperlegible-next` 5.3.0](https://cdn.jsdelivr.net/npm/@fontsource-variable/atkinson-hyperlegible-next@5.3.0/), OFL-1.1, checked 2026-11-08.
- Geography: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0, simplified; provenance in [Round 01](../01-territory-overview/README.md#geography-and-attribution). All values are fictional.

## Validation

See `validation.md`.
