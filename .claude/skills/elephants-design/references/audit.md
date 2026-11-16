# Audit

Output: `docs/design/audits/YYYY-MM-DD-<target>.md`. Read-only for the target: an audit never edits the round or the guide.

## Target

The round or guide the user names; otherwise the latest round. Build it (`python3 <round>/build.py`) and inspect the generated preview at 320, 390 and 1024+ px. Look at screenshots; do not judge from source alone.

## Passes

Run what applies; note any pass skipped and why.

| Pass | Tool | Question |
| --- | --- | --- |
| Brief fit | this skill | Does each element serve an audience task, voice and success criterion in `brief.md`? |
| Critique | `design:design-critique`, `impeccable critique` | Hierarchy, clarity, what draws the eye first, what reads as generic |
| Anti-patterns | `impeccable` detector on the generated HTML | Template tells, typography and layout smells |
| Accessibility | `design:accessibility-review`, `impeccable audit` | Contrast (incl. map fills and hatch), focus, targets, colour-only meaning |
| Data display | `dataviz` | Legend, categories, missing data, selection, number formats |
| Copy | `design:ux-copy` | Plain Spanish, risk wording, errors, empty states |
| System consistency | `design:design-system` | Tokens vs hard-coded values, naming, component states |

Without a brief, say so at the top and audit against `visual-direction.md` only.

## Consolidate

One table, deduplicated, ranked by severity:

| # | Finding | Evidence | Source pass(es) | Severity | Brief link | Proposed change |

- Severity: critical (misleads or excludes), moderate (slows or confuses), minor (polish).
- A finding that conflicts with an accepted decision goes to **Decisions needed**, not to the change list.
- End with: what works (keep), top 3 changes, decisions needed, checks not run.

Ask the user which findings to act on before starting a round.
