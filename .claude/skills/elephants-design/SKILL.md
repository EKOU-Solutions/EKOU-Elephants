---
name: elephants-design
description: Use for any visual or interface design work on EKOU Elephants (design system, visual guide, rounds, map, components, copy). Runs the agreed flow - discover, audit against the brief, then a new review round - and decides when to call the other design skills.
---

# Elephants design

Owner flow for design in this repository. Other design skills (ours or third-party) are tools this flow calls; this skill decides when, how, and what wins.

## Read first, every time

1. `docs/design/README.md` (index, round rules, review log).
2. `docs/design/visual-direction.md` (accepted decisions).
3. `docs/design/discovery/brief.md` if it exists (the yardstick).
4. The selected round and the latest round README.

Do not ask the team for anything these files already answer.

## Precedence

1. Explicit user decisions recorded in the files above.
2. The discovery brief.
3. This skill's rules.
4. Third-party skill advice (Impeccable, etc.).

A third-party finding that contradicts 1 or 2 is reported as a question for the user, never applied silently. Fixed until TASK-07 decides otherwise: blue / yellow / warm-red risk roles, grey hatch for missing data, no invented risk thresholds, "signal, not verdict".

## Pick the phase

| Situation | Phase |
| --- | --- |
| No brief, or the business/audience changed | [Discover](references/discover.md) |
| A round or the guide needs judging | [Audit](references/audit.md) |
| Audit findings were accepted for action | [Round](references/round.md) |
| User asks for "everything" | Discover → Audit → Round, stopping for approval between phases |

State the chosen phase in one line before starting.

## Always

- Repository documents and implementation names in English; citizen-facing copy in Spanish (Colombia).
- New explorations are rounds under `docs/design/rounds/NN-short-name/`, never edits that overwrite an earlier round or the accepted guide.
- Label fictional data. Record external sources with date checked.
- Do not commit, publish, or mark anything accepted without the user's instruction.

## Tools this flow calls

| Skill | Source | Used in |
| --- | --- | --- |
| `design:design-critique`, `design:accessibility-review`, `design:ux-copy`, `design:design-system` | Anthropic design plugin | Audit |
| `dataviz` | Anthropic | Audit, Round (map, legend, charts) |
| `frontend-design` | Anthropic | Round |
| `impeccable` (`critique`, `audit`, `shape`, `polish`; detector CLI) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0, installed project-scoped for Claude (`.claude/skills`) and Codex (`.agents/skills`) without hooks | Audit (second opinion, anti-pattern detector), Round (shape) |

Impeccable is installed **without hooks** by team decision (2026-11-08): when installing or updating, always pass `--no-hooks` and never add its hook to `.claude/settings*.json` or `.codex/hooks.json`; run its detector explicitly during an audit instead. Do not run `impeccable init` or `document`: they write their own PRODUCT.md / DESIGN.md. Our brief and `docs/design/` are the single source; pass them to Impeccable as context instead. Add a third-party skill only after reading its full contents, checking its licence, and getting the user's approval; then list it here.
