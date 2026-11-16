# Elephants design system v1.0: rules for developers and AI agents

Accepted on 2026-11-08: the [Round 05](../rounds/05-system-reference/README.md) editorial direction with **Public Sans**. This file is the short, normative version of the guide. The visual reference (`preview.html`) shows the same rules with live specimens. If the two disagree, report it; do not pick one silently.

## Files

| File | Role | Edit? |
| --- | --- | --- |
| `tokens.json` | **Source of truth** for colours (light and dark), type, spacing and geometry | Yes, only through a change (see below) |
| `tokens.css` | CSS custom properties generated from `tokens.json`. The app imports this file | No, generated |
| `tokens.md` | Token table generated for reading | No, generated |
| `contrast-report.json` | Contrast of every text, control, focus, hatch and risk-tag pair, in both themes | No, generated |
| `components.css` | Component classes (`.el-*`) | Yes, only through a change |
| `components.json` | Machine-readable catalogue: classes, status, variants, tokens, accessibility notes | Yes, alongside `components.css` |
| `source.html`, `examples.source.html`, `examples/` | Sources of the reference page and the example screens (Spanish product copy) | Yes |
| `build.py` | Regenerates everything; fails if contrast fails or if `components.json` names a class or token that does not exist | Yes |
| `preview.html`, `examples.html`, `screens/` | Generated, offline, git-ignored | No |

```sh
python3 docs/design/guide/build.py
```

## Non-negotiable rules

1. **Tokens only.** Use `var(--el-*)` everywhere. Never a raw hex, font name or pixel value that a token covers.
2. **Catalogue only.** Build screens from the `components.json` entries. A component with `"status": "candidate"` can be used, but the first page that needs it confirms or discards it. If nothing fits, do not improvise: propose a component through the [Build a page](../../../.claude/skills/elephants-design/references/build-page.md) flow.
3. **The data comes first.** Neutral surfaces, lines instead of cards, no shadows, gradients or glows. Strong colour is reserved for data.
4. **Colour is never alone.** Every risk colour comes with a text label and the 1/2/3-bar glyph, a legend, or a table with the same values.
5. **"Sin datos" is not zero.** Missing analysis uses the grey hatch (`--el-color-unknown` on `--el-color-unknown-surface`) and the words «Sin datos». It is never 0% and never low risk.
6. **A signal, not a verdict.** The interface never says «corrupción», «robo» or «sospechoso». It shows no names of natural persons until TASK-08 decides.
7. **The risk level is not chosen by hand.** `low` / `medium` / `high` come from the methodology (TASK-07). The guide sets no thresholds.
8. **Mobile first.** Everything works at 320 px with no horizontal scroll. Controls are at least 44 px tall. Nothing depends on hover.
9. **Two themes.** Every screen is checked in light and in dark. Dark mode follows `prefers-color-scheme`; you can force it with `data-theme="light|dark"` on `<html>`.

## Colour roles

| Role | Tokens | Rule |
| --- | --- | --- |
| Risk (map, tags) | `risk-low`, `risk-medium`, `risk-high`, plus `on-risk-*` for text | Blue → yellow → warm red, ordered light to dark so the order survives without hue. Data only |
| Missing data | `unknown`, `unknown-surface` | Grey hatch, always with «Sin datos» |
| Text | `text`, `text-muted` | Body text and secondary text; both pass 4.5:1 |
| Structure | `line`, `line-strong`, `control-border`, `map-border` | Lines organise content; controls get a 3:1 border |
| Action | `action`, `action-hover`, `on-action`, `action-soft`, `focus` | Links, buttons, focus ring. Never used for risk |
| Messages | `warning`, `danger`, `success` and their `-soft` versions | Interface messages only. `success` confirms an action and never labels a territory as safe |

Recorded exception (Round 05 review): in the "paid vs expected" progress bar, the expected mark uses `risk-high` as an alert cue.

## Type

- One family: **Public Sans 5.3.0** (OFL-1.1), self-hosted from `assets/fonts/`. Fallback stack in `tokens.json`. No CDN.
- Scale (`--el-size-*`): display 40, title 30 (26 on mobile), section 22, subsection 18, body 16, small 14, figure 48 (40 on mobile).
- Weights: 400 body, 600 emphasis, 700 headings and figures. Line heights: 1.5 body, 1.2 headings, 1.05 figures.
- Numbers use `font-variant-numeric: tabular-nums lining-nums` (`--el-numbers`).

## Space and shape

- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px (`--el-space-*`). Use 8–12 between related items, 24–32 between groups.
- Controls: height 44, radius 6. Data marks: radius 2. Rules: 1 px, or 2 px (`--el-rule-strong` with `line-strong`) above key figures and table headers.
- Focus: 3 px ring with a 3 px offset. Never remove it.

## Icons

Lucide 0.468.0, 2 px stroke: 20 px next to text, 24 px in alerts. A decorative icon gets `aria-hidden="true"`. An icon-only button needs an `aria-label`. No emoji, no criminal imagery, no green "safe" shield.

## Data display contract

| Element | Rule | Example |
| --- | --- | --- |
| Signal share | Distinct flagged contracts ÷ analysed contracts × 100. Always show both counts | 30%, «36 de 120 contratos analizados» |
| Coverage | Analysed ÷ available, shown apart from risk | 80%, «120 de 150 disponibles» |
| Unknown | A zero denominator means unavailable | «Sin datos», never 0% |
| True zero | Show 0 when it was measured, and say what was evaluated | «0 de 100 analizados» |
| Count | Integer, dot as thousands separator, always with a noun | 2.500 contratos |
| Money | Pesos with the scale in words. On dense rows `M` may stand for millones. Say whether the amount is signed, current, paid or budgeted | $ 2.300 millones; $ 4.800 M |
| Percentage | At most one decimal, comma as the decimal mark (`es-CO`); compute with unrounded values | 12,5% |
| Change | Percentage points, not relative change | +4 p. p. |
| Date | The data's update date, separate from the period queried | «actualizado el 31 dic 2025»; period 2025 |
| Source | Every figure carries its source and period nearby | «SECOP II · 2025» |

A contract with several signals counts once in the numerator. Never classify from a rounded display value.

## Components

`components.json` is the full list. **Core** (accepted with Round 05): Button, Alert (block, banner, inline note), Field, Risk tag, Counter, Active filter, Key figure, Data table, Map with legend. **Candidate** (introduced by the example screens, pending confirmation by a real page): Status pill, Coverage bar, Breakdown bars, Progress vs expected, Signal item.

Each section of `preview.html` gives the component's purpose, its states, do / avoid, the tokens it uses and copyable markup.

## Accessibility baseline

- WCAG 2.2 AA contrast: 4.5:1 for text, 3:1 for controls, focus and the hatch. `build.py` checks every pair in both themes and fails the build if one does not pass.
- Risk fills fall below 3:1 against the surface by design. They rely on territory borders, labels, the legend and an equivalent table.
- Use native elements: `<button>`, `<a href>`, `<label for>`, `<table>` with `<caption>` and `scope`. Field errors use `aria-invalid` plus `aria-describedby`.
- A map is an `<svg role="img">` with a `<title>`, and its values are also available in a table.

## Changing the system

The guide is versioned (`tokens.json` → `version`).

- **Fixes that keep the visual direction** (a contrast fix, a bug, a confirmed candidate component): edit here, rebuild, record the change in `README.md` and bump the minor or patch version.
- **New components or tokens** come from a page that needs them (Build a page, step 3). Each one needs the user's approval before it enters `components.css`, `components.json` and the reference page.
- **A change of direction** (palette, type, layout language) is a new round in `docs/design/rounds/`. If the user accepts it, it becomes the next major version.
