# Discover

Output: `docs/design/discovery/brief.md`. It becomes the yardstick for audits and rounds.

## Before asking

Read the project `README.md`, `docs/fuentes-de-datos.md`, `docs/design/visual-direction.md`, the accepted guide (`docs/design/guide/README.md`) and any existing brief. Draft answers from them. Only ask what they leave open or what may have changed.

## Ask

One question per message, multiple choice with a recommended option first, free answer always allowed. Skip any question the documents already answer; say which source answered it.

1. **Audience and task.** For the general public and for the interested public (journalists, oversight groups, students, community leaders): what is the first concrete thing each must accomplish on the map?
2. **Device and context.** Main devices, connection quality, reading level to design for.
3. **Risk voice.** How strong may wording be? Words we must avoid. What a "low risk" label may and may not imply.
4. **Trust.** What makes the product look credible to a Colombian citizen; references that feel trustworthy or untrustworthy; what currently looks generic or "AI".
5. **Constraints.** Legal limits (TASK-08: natural persons), accessibility target, free-tier/performance limits, brand relationship with EKOU.
6. **Success.** How we will know the visual system works (a task a test user completes, an observed reaction, a metric from the README).

## Write back

Summarise in under 25 lines with three lists: **Said by the team**, **Taken from documents** (with file), **Assumed** (to confirm). Ask for corrections. Write `brief.md` only after the user confirms, with the date and who answered.

## Brief format

```markdown
# Design brief
Date: YYYY-MM-DD. Answered by: ...
## Audiences and first tasks
## Devices and reading level
## Risk voice (allowed / avoid)
## Trust signals
## Constraints
## Success criteria
## Open questions
```
