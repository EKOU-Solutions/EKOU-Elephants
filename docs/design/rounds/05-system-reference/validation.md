# Validation — Round 05

Observed locally on 2026-11-08 with the generated `preview.html`, `examples.html` and `screens/*.html`.

- Build succeeds; no unreplaced placeholders; both inline scripts parse.
- Contrast (`contrast-report.json`): all 17 text, control, focus, hatch and risk-tag pairs pass in **light and dark** (text 4.5:1, controls/focus/hatch 3:1). Risk fills are below 3:1 against the surface in both themes and rely on relief: territory borders, legend, tags and the equivalent table.
- Risk fills checked with the `dataviz` palette validator in ordinal mode: lightness monotone, adjacent ΔL ≥ 0.06, light-end ≥ 2:1, CVD and normal-vision separation pass in both themes. The validator's single-hue check fails by design: the blue / yellow / red roles are an accepted team decision.
- No horizontal page overflow at 320, 390, 768 and 1280 px in light and dark (initial 7 px overflow at 320 px from unbreakable token names was fixed). 41 Lucide icons rendered.
- Risk tags (`on-risk` text on risk fill): light 6.40 / 4.87 / 6.07:1, dark 5.44 / 5.79 / 8.81:1 (low / intermediate / high).
- Examples: no horizontal overflow on the four screens at 320, 390 and 1280 px (fixed during the round: grid min-width on stacks and the search field, wrapping of the sort bar and panel header). Screenshots reviewed: four screens at 390 px and 1280 px in light; the examples page with both simulators in light and in dark (theme propagates into the frames).
- Screenshots reviewed: desktop light with typeface A, desktop dark with typeface B (including figure, table and map), and 390 px mobile light.
- `impeccable detect` on `examples.html`: only `cramped-padding` on the simulator bezel, screen and browser bar (flush by design; not product components). On each screen: 0 anti-patterns, hatch advisory only.
- `impeccable detect` on `preview.html`: 0 anti-patterns (fixed in this pass: do/avoid headings promoted to `h3`, hidden `h2` before the role cards). Advisories: grey hatch (accepted missing-data semantics, kept) and "em-dash overuse", triggered by `--el-*` token names in code samples, not by prose.

Limits: the simulators are CSS approximations, not device emulation (no safe-area insets, no Safari UI on the phone). Examples were not reviewed with typeface B in screenshots. The "Pagado" bar in the work screen uses risk red to stress the gap; review whether it breaks the "red = riesgo alto" rule. No real-device, screen-reader, keyboard walk-through or 200% zoom test. Typeface B in light and typeface A in dark were not reviewed in screenshots. The dark hatch on Vaupés is faint at map scale; check it on a phone. The component markup is a specification, not a tested React implementation.
