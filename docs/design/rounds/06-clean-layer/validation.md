# Validation — Round 06

Observed locally on 2026-11-08 with the generated `preview.html`, `examples.html` and `screens/*.html`.

- **Build:** succeeds; no unreplaced placeholders or macros.
- **Contrast** (`contrast-report.json`): all 19 pairs pass in light and dark. The two new pairs are secondary text and link on the canvas.
- **Overflow:** none on the four screens, the reference page or the examples page, at 320, 390, 768 and 1280 px (24 combinations). Fixed during the round:
  - the `.hero` and `.intro` grids (min-width);
  - the 48 px title at 320 px;
  - the laptop simulator's minimum width.
- **Screenshots reviewed:**
  - four screens at 390 px (light) and 1280 px (light);
  - work screen at 1280 px in dark;
  - reference page header;
  - full-screen phone view (`screens/phone.html?s=map`), which now shows the 390 px layout.
- **`impeccable detect`:** 0 anti-patterns on the reference page and the four screens. Fixed in this round:
  - grey text on the dark info alert;
  - a skipped heading in results;
  - two last-row borders, now drawn between rows.

  Advisories remain for the grey hatch (accepted) and "em-dash overuse" (token names in code samples). On `examples.html`, `cramped-padding` is reported only on the simulator bezel, screen and browser bar, which are flush by design.

**Limits:**
- No real device, screen reader or 200% zoom test.
- `backdrop-filter` on the app bar depends on browser support; it falls back to a near-opaque surface.
- Apple's reference page was observed in a headless screenshot; its product images did not load. Typography, surfaces and layout were visible.
