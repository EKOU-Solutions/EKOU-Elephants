# Validation — Round 04

Observed locally on 2026-11-08 using the generated standalone previews (both typeface variants).

- Build succeeds; 10 contrast pairs pass; no unreplaced placeholders; fragments below 1 MB; JavaScript syntax check passes.
- Map renders 33 territories with Antioquia selected and drawn last so its outline is not covered; Vaupés (no analysis) uses the grey hatch.
- No horizontal document overflow at 320, 390 and 1024 px in any of the four sections, for both variants.
- Desktop screenshot of the Atkinson variant inspected across all sections. A 390 px headless screenshot cropped the layout, but the overflow measurement above shows no overflow, so it is treated as a capture artefact.

Limits: not inspected visually on a real phone; the system-font variant was measured but its screenshots were not reviewed in detail. Hero categories are an illustrative split, not a risk methodology. Contrast pairs cover tokens only, not map fills, hatch, disabled states or the whole interface. No screen-reader, colour-vision or user-task testing. Fictional data throughout.
