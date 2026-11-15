# Design system guide v1.0

Status: **Accepted** (2026-11-08). Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Origin: [Round 05: system reference](../rounds/05-system-reference/README.md). Decision record: [visual direction](../visual-direction.md#final-selection-2026-11-08).

This is the deliverable of TASK-05: an HTML guide, documentation for developers and AI agents, and the `elephants-design` skill, which builds each final page from its API contract. Storybook was dropped by decision on 2026-11-08.

## Start here

| You are | Read |
| --- | --- |
| A developer or an AI agent implementing UI | [design-system.md](design-system.md) (rules), `tokens.css` (import it), [components.json](components.json) (catalogue), `tokens.md` (token table) |
| A designer, or the team reviewing visuals | `preview.html` (reference) and `examples.html` (screens on a phone and a laptop) after building |
| Anyone designing a new page | [Design flow](../design-flow.md) and the skill's [Build a page](../../../.claude/skills/elephants-design/references/build-page.md) phase |

```sh
python3 docs/design/guide/build.py
open docs/design/guide/preview.html docs/design/guide/examples.html
```

## What v1.0 contains

- Round 05's **editorial layout**: neutral surface, lines instead of cards, data first.
- **One typeface: Public Sans 5.3.0**, self-hosted. The A/B type switch and the Source Sans 3 / Source Serif 4 files were removed.
- Light and dark themes. All 17 contrast pairs pass in both.
- 9 core components and 5 candidates (see `components.json`).
- Three example screens (contract detail, results list, map with territory panel) inside iPhone and MacBook simulators.

What changed against Round 05, and why:

- **Fixes carried over:**
  - The phone's "full screen" link now opens the screen at 390 px (`screens/phone.html`).
  - The laptop simulator no longer overflows at 320 px.
- **Removed:** the works (obra) screen. Whether a work is a separate entity from a contract will be decided when the business model is shaped with Esteban, and its page will go through Build a page.
- **Added:**
  - `components.json` and `design-system.md`.
  - A generated `tokens.md`.
  - Build-time checks that every catalogue class and token exists.
- **Not adopted:** Round 06's visual layer (canvas with white cards, pill controls). See the decision record.

## Files

`tokens.json` (source of truth) → `build.py` → `tokens.css`, `tokens.md` and `contrast-report.json`, all versioned and generated. It also writes `preview.html`, `examples.html` and `screens/`, which are ignored and fully offline: the font is embedded and the Lucide script is inlined. The other sources are `source.html`, `examples.source.html`, `examples/`, `components.css` and `components.json`. The `assets/` folder holds the font with its OFL licence, Lucide 0.468.0 with its ISC licence, the map paths and the fictional territories.

The previous guide (v0.1, based on Round 02) is kept for history in [`../archive/guide-v0.1/`](../archive/guide-v0.1/README.md).

## Sources (checked 2026-11-08)

- Font: [`@fontsource-variable/public-sans@5.3.0`](https://cdn.jsdelivr.net/npm/@fontsource-variable/public-sans@5.3.0/), OFL-1.1.
- Icons: [Lucide 0.468.0](https://lucide.dev), ISC.
- Geography: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0; provenance in [Round 01](../rounds/01-territory-overview/README.md#geography-and-attribution). All values are fictional.

## Open (outside this guide)

- Risk thresholds and categories: TASK-07.
- Personal data: TASK-08.
- Works vs contract as entities: to be decided when the business model is shaped.
- Production implementation: the markup here is a specification, not a tested component library.

Validation: [validation.md](validation.md).
