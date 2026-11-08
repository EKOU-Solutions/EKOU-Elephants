# Validation: guide v1.0

Observed locally on 2026-11-08 with the output of `build.py`.

- The build succeeds with no unreplaced placeholders. Every class and token named in `components.json` exists in `components.css` / `tokens.css`, and every `var(--el-*)` used by the components is defined.
- **Contrast** (`contrast-report.json`): all 17 text, control, focus, hatch and risk-tag pairs pass in light and dark. Risk fills are below 3:1 against the surface by design and rely on relief: borders, labels, legend and table. This is unchanged from Round 05, which also validated the fills with the `dataviz` palette validator.
- **Overflow** (iframes at a fixed width, headless Chrome): no horizontal overflow at 320, 390, 768 or 1280 px on the three screens and on `preview.html`.
  - `examples.html` overflowed by 4 px at 320 px because the laptop simulator had a 280 px minimum. I lowered it to 240 px, as in Round 06, and it now fits.
- **`impeccable detect`:**
  - On the three screens: 0 anti-patterns; only the grey-hatch advisory, which is the accepted missing-data semantics.
  - On `preview.html`: 0 anti-patterns. Its advisories are the hatch and "em-dash overuse"; the latter comes from `--el-*` token names in code samples.
  - On `examples.html`: only `cramped-padding` on the simulator bezel, screen and browser bar, which are flush by design and are not product components.
- **Screenshots reviewed** (dark theme, the system setting):
  - `preview.html` at 1280 px;
  - `examples.html` at 1440 px, showing both simulators;
  - the contract screen.
  - Public Sans renders in every frame, and the theme carries into the simulators.

Limits:

- Round 05's per-component review in light mode was not repeated for v1.0, because only the type switch and the works screen changed.
- Not tested: real devices, a screen-reader walkthrough, a keyboard-only walkthrough, 200% zoom.
- The simulators are CSS approximations, not device emulation.
- The component markup is a specification, not a tested implementation.
