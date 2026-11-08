# Validation — Round 03

Observed 2026-11-07 in the standalone browser preview.

- Build succeeds with 33 unique territorial IDs, valid count bounds and assembled fragment below 1 MB. JavaScript syntax check passes.
- Desktop and full 320 px mobile compositions visually inspected. Map and warm gradient legend render; mobile places the map above the department detail.
- Document width equals scroll width at 320 px and 1024 px: no observed horizontal overflow.
- Expanded department comparison list; selected Vaupés using its native button. Detail shows “Sin datos” and the geographic shape uses the grey hatch.
- Selected Amazonas: 0% and the yellow endpoint `#FFE58F`, with wording that does not guarantee absence of irregularities.
- Antioquia: 36/120 = 30%, one selected shape, corresponding interpolated warm fill and a separate 120/150 coverage note.
- Error preview uses `role="alert"` and the retry action restores the ready map.
- No captured browser JavaScript errors during the observed checks.

Limits: fictional fixtures, approximate/simplified geometry and no accepted risk model. No full accessibility, colour-perception or browser audit. Native selector and expandable exact-value table supplement geographic colour and pointer selection. No claim that RGB interpolation is perceptually uniform. Legend ticks are reference positions, not validated business thresholds. Inline view uses the same generated fragment; the checks above used its standalone wrapper.
