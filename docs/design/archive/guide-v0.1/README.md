# Visual guide — v0.1 (archived)

> Archived on 2026-11-08 when [guide v1.0](../../guide/README.md) replaced it. Kept as history; relative links below were written for its original location `docs/design/guide/`.

Status: **Consolidated guide for review**. Based on the user-selected Round 02 direction and system-font legibility; newly specified tokens, icon conventions and component details remain proposed. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Updated 2026-11-07.

## Purpose and source of truth

A practical reference for building citizen-facing interfaces. The visual guide is in Spanish; repository specifications and implementation names are in English. This is a documentation specimen, not a production component package. No services, publishing or application scaffolding are required.

1. Read [the selected direction](../visual-direction.md).
2. Use [tokens.json](tokens.json) for the candidate colour, typography, spacing and geometry values.
3. Read [usage rules](usage.md) before interpreting or implementing a specimen.
4. Inspect the generated visual guide and [validation](validation.md). Do not infer approved business thresholds from examples.

Editable source is `source.html`; `build.py` renders swatches and contrast evidence from `tokens.json`. Providers must change these sources, then rebuild. Do not edit generated previews or silently change accepted semantic colour roles. Review history stays in `../rounds/`.

```sh
python3 docs/design/guide/build.py
```

Outputs, intentionally ignored: `guide.html` (integrated canvas fragment) and `preview.html` (self-contained standalone preview). The build also updates versionable `contrast-report.json`. Python standard library only. The standalone preview works offline and embeds the pinned local Lucide bundle; the integrated fragment uses the host's supplied Lucide icons.

## Contents

- Principles and rationale; system typography and spacing scale.
- Data palette, interaction colours, message colours and measured contrast pairs.
- Buttons, disabled/loading examples, alerts, native form fields and error feedback.
- Percentages with numerator/denominator; separate analysis coverage; counts, COP amounts, dates and percentage-point changes.
- Risk tags, named counters, removable filter chips, missing-data treatment, selected-territory treatment and exact-value tables.
- Icon family, size, stroke, visible labels and accessible names.

## External resources


Icon reference: Lucide, already used by the EKOU landing. Offline bundle pinned to `lucide@0.468.0`, obtained from [jsDelivr package distribution](https://cdn.jsdelivr.net/npm/lucide@0.468.0/dist/umd/lucide.min.js). Included under its [ISC/Feather attribution](assets/LUCIDE-LICENSE). This is a reproducible specimen version, not a claim about the latest release or an application dependency decision. Do not remove the license when distributing the standalone guide.

Normative targets and design guidance are linked in `usage.md` and the guide; inspected 2026-11-07. Full interface conformance, colour-vision assessment and tests on real user tasks remain pending.
