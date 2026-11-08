# Validation — Round 01

Checked locally on 2026-11-07 against the generated standalone preview.

- Build completes with Python standard library; 33 unique territorial identifiers; assembled fragment below 1 MB.
- Visually inspected desktop composition and the full stacked 320 px composition. Map renders projected departmental geometry, amount fills and the missing-data hatch.
- No document horizontal overflow at 320 px and 1024 px (scroll width equals client width).
- Changing the native department selector updates the name, exact amount, numeric interval and selected outline. Vaupés displays “No data” and an explanation distinguishing missing from zero.
- Error preview displays its message; “Try again” restores the ready view. Loading and empty previews show distinct headings and hide the map rather than imply zero.
- Exactly one selected geometry path in the observed ready state.
- Sources and fictional-data labels are visible without hover. No external runtime dependencies are required.

Limits: no exhaustive screen-reader, keyboard, browser or colour-vision audit. Map paths use pointer selection; the native department selector provides the keyboard route to every value. Touch hit targets on small geographical shapes, zoom/insets, production DANE identifiers and risk methodology remain outside this visual round. No claim of production readiness or final WCAG conformance.

The integrated canvas uses the same generated fragment; the above browser checks were performed on the standalone wrapper.
