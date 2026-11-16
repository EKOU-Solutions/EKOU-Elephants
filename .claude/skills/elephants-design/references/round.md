# Round

Output: a new `docs/design/rounds/NN-short-name/` built from the accepted audit findings.

## Start

- Next number after the highest existing round; short kebab-case name for the hypothesis.
- Base it on the selected round or the guide; copy what you change into the new folder. Never edit an earlier round or the accepted guide in place.
- One hypothesis per round. If the accepted findings pull in different directions, propose separate rounds.

## Folder contract

Same as earlier rounds:

- `README.md`: status, date, task link, previous round, feedback addressed, hypothesis, what changes, decisions and open questions, files and reproduction, sources, link to validation.
- `source.html` and small `assets/` (own copies of geometry and fixtures), `build.py` using the Python standard library only.
- `.gitignore` for generated previews; generated files are never edited by hand.
- `validation.md`: what was observed, at which widths, which checks passed, and limits (what was not checked).

## Build

Use `frontend-design` for the plan and its self-critique (spend boldness in one place; remove template tells); `impeccable shape` is an optional second plan. Use `dataviz` for map and legend work. Re-run the audit's critique and accessibility passes on the result before reporting.

## Finish

- Add the round to the review log in `docs/design/README.md` as "Proposed — awaiting review".
- Serve the previews locally for the user (`python3 -m http.server` in the round folder) and give the URLs.
- Report what changed, what was verified, and the decisions the user still has to make. Do not commit.
