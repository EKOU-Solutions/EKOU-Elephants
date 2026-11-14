# Design

Repository-first source of truth for the visual direction, the design system and the review rounds for [TASK-05](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).

Every provider, human or agent, reads this index and the [visual direction](visual-direction.md) before making changes. Previews are generated from repository files. Chat attachments and provider canvases are views of those files, not the canonical source. Do not publish, commit or mark a proposal accepted without the user's instruction.

## Current direction

**Accepted 2026-11-08:**
- The [Round 05](rounds/05-system-reference/README.md) editorial direction, with **Public Sans**. It puts data first: neutral surfaces, lines instead of cards, large figures with source and date.
- Blue, yellow and warm red for lower, intermediate and higher risk. Grey hatch for missing data.
- [Round 06](rounds/06-clean-layer/README.md)'s cleaner, Apple-like layer was not selected: the product centres on data.

Decision record: [visual direction](visual-direction.md#final-selection-2026-11-08). Risk thresholds and the risk method stay in TASK-07.

## Interface reference

The [design system guide v1.0](guide/README.md) is the deliverable and the catalogue. It contains:
- tokens (`tokens.json` is the source of truth, `tokens.css` is generated);
- components (`components.css` and `components.json`);
- [rules for developers and AI agents](guide/design-system.md);
- an HTML reference and example screens in phone and laptop simulators.

Storybook was dropped. The previous [guide v0.1](archive/guide-v0.1/README.md) is archived.

## Designing pages for development

Pages are designed one at a time. Each starts from **our API's contract**: ingestion stores the data in the database or JSON files, and our API serves it to the screens. See:
- the [design flow](design-flow.md), with diagrams, for developers;
- the [page designs](pages/README.md): the page log and a tentative reference.

Agents use the `elephants-design` skill's *Build a page* phase.

## Working in rounds

Rounds are for changing the system itself (a new direction or a major version), not for designing pages.

- Agents use the project skill `elephants-design` (`.claude/skills/`, linked for Codex in `.agents/skills/`). It runs discover → audit → round and calls the other design skills, including the project-scoped third-party `impeccable`.
- Each round lives in `rounds/NN-short-name/`, with a README covering purpose, status, decisions, sources, reproduction and validation.
- Keep the editable source and the small assets it needs inside the round. Label fictional data and record where external assets come from.
- Revise the current round while it explores the same hypothesis. A materially different direction starts a new round, linked to the previous one.
- Record feedback and acceptance in the round's README. Keep accepted decisions apart from proposals and open questions. Never silently replace an accepted round.
- Documents and implementation names are in English; citizen-facing copy is in Spanish for the Colombian audience.
- Generated previews are disposable; rebuild them from the checked-in sources.

## Review log

| Round | Hypothesis | Status |
| --- | --- | --- |
| [01](rounds/01-territory-overview/README.md) | Restrained EKOU accents leave geographic data as the main visual focus | Typography accepted; map semantics and error treatment superseded |
| [02](rounds/02-risk-signals/README.md) | Blue baseline, amber/red signals and explicit recoverable errors | Selected after comparison; basis of the risk colour roles |
| [03](rounds/03-warm-risk-map/README.md) | Continuous warm scale inspired by Transparency; editorial map and territory summary | Not selected: all-warm map felt chaotic |
| [04](rounds/04-grounded-guide/README.md) | Map-led, ledger-style guide with plain-language voice; typeface compared with the system font | Reviewed: structure not clear enough to build from; hatch kept; Atkinson rejected for numbers |
| [05](rounds/05-system-reference/README.md) | Component-documentation reference for dev/UX/UI, self-hosted type, ordered risk fills, light and dark themes, `tokens.css`, filled risk tags, phone and laptop examples | **Selected (final)** 2026-11-08 with Public Sans → [guide v1.0](guide/README.md) |
| [06](rounds/06-clean-layer/README.md) | Clean layer: canvas + white cards, pill controls, lead-in text; work ↔ contracts proposal | Not selected: cleaner and invites browsing, but less centred on the data; bug fixes carried over |
