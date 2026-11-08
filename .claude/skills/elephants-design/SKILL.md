---
name: elephants-design
description: Use for any visual or interface design work on EKOU Elephants (design system, visual guide, rounds, map, components, copy, and designing a specific page for development). Runs the agreed flows - discover, audit against the brief, review rounds, and build-a-page (API contract check, data exploration, spec, components, mockup, validation, handoff) - and decides when to call the other design skills.
---

# Elephants design

Owner flow for design in this repository. Other design skills (ours or third-party) are tools this flow calls; this skill decides when, how, and what wins.

## Read first, every time

1. `docs/design/README.md` (index, round rules, review log).
2. `docs/design/visual-direction.md` (accepted decisions).
3. `docs/design/discovery/brief.md` if it exists (the yardstick).
4. The accepted guide: `docs/design/guide/README.md`, `design-system.md` and `components.json` (v1.0, Round 05 editorial + Public Sans, accepted 2026-11-08). Read the latest round's README only if a round is in progress.
5. For page work: `docs/design/pages/README.md` (page log and tentative reference) and `docs/fuentes-de-datos.md`.

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
| Audit findings were accepted for action, or the user wants to change the system's direction (palette, type, layout language) | [Round](references/round.md); if accepted, it becomes the guide's next major version |
| User asks for "everything" | Discover → Audit → Round, stopping for approval between phases |
| A specific page/screen must be designed for development (map, search, contract, works, entities, contractors, alerts…) | [Build a page](references/build-page.md): starts by checking the API contract; one page at a time |

State the chosen phase in one line before starting.

## Always

- Repository documents and implementation names in English; citizen-facing copy in Spanish (Colombia).
- New directions are rounds under `docs/design/rounds/NN-short-name/`, never edits that overwrite an earlier round. The accepted guide changes only through its change process (`docs/design/guide/design-system.md#changing-the-system`): approved components and tokens, `build.py` passing, version bump.
- Page designs live in `docs/design/pages/<page>/` and are built only on **our API's contract** (ingestion → database/JSON → our API → screens), the guide's tokens and its catalogue components. No contract, no design.
- Label fictional data. Record external sources with date checked.
- Do not commit, publish, or mark anything accepted without the user's instruction.

## Tools this flow calls

| Skill | Source | Used in |
| --- | --- | --- |
| `design:design-critique`, `design:accessibility-review`, `design:ux-copy`, `design:design-system` | Anthropic design plugin | Audit, Build a page (validate) |
| `dataviz` | Anthropic | Audit, Round (map, legend, charts) |
| `frontend-design` | Anthropic | Round |
| `impeccable` (`critique`, `audit`, `shape`, `polish`; detector CLI) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0, installed project-scoped for Claude (`.claude/skills`) and Codex (`.agents/skills`) without hooks | Audit (second opinion, anti-pattern detector), Round (shape) |

Impeccable is installed **without hooks** by team decision (2026-11-08): when installing or updating, always pass `--no-hooks` and never add its hook to `.claude/settings*.json` or `.codex/hooks.json`; run its detector explicitly during an audit instead. Do not run `impeccable init` or `document`: they write their own PRODUCT.md / DESIGN.md. Our brief and `docs/design/` are the single source; pass them to Impeccable as context instead. Add a third-party skill only after reading its full contents, checking its licence, and getting the user's approval; then list it here.
