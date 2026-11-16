# Validation — Round 02

Observed locally on 2026-11-07 using the generated standalone preview.

- Build succeeds; 33 unique units; `flagged ≤ analyzed ≤ available`; assembled fragment below 1 MB; JavaScript syntax check passes.
- Desktop map and mobile map/error compositions visually inspected. No document horizontal overflow at 320 px or 1024 px.
- Antioquia: 36 / 120 = 30%, red category, with a separate warning for 120 / 150 analyzed coverage.
- Amazonas: 0 / 100 = 0%, blue and “Sin señales detectadas”. The explanatory text avoids a guarantee of safety.
- Caldas: exactly 25 / 100 = 25%, assigned to the red interval at the cut.
- Vaupés: zero analyzed contracts, no percentage, grey hatch and an explicit missing-analysis message. Does not divide by zero or display zero risk.
- Error state has an exclamation symbol, explicit error wording, red semantic treatment and `role="alert"`; the map is hidden. Retry returns to the ready composition.
- Loading and empty states render their distinct informational messages.
- Exactly one selected path. Selection preserves the risk fill and uses an independent outline. All territory values have an alternative native selector.
- Browser reported no captured JavaScript errors during these checks.

Limits: checks use fictional fixtures, not a validated risk methodology. No full accessibility, screen-reader, touch-target or colour-vision audit. Colours are paired with legend wording and exact selected values; the geographic paths are not a replacement for the selector's keyboard route. No live data, backend integration or production-readiness claim. The integrated view uses the same fragment; browser checks used its standalone wrapper.
