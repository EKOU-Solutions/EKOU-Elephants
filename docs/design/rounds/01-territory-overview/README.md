# Round 01 — Territory overview

Status: **Reviewed — typography accepted; map semantics and error treatment superseded by Round 02**. Date: 2026-11-07. Task: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).

## Review question

Can a light, restrained EKOU identity support a readable map, amount legend and selected-territory detail without competing with the data?

## Scope

One responsive composition: national departmental map, a selected territory, illustrative contracted amount, legend, provenance and data-state messages. The top “Preview state” selector is a review tool, not a proposed product feature. The letter E is a placeholder identity mark, not an approved EKOU logo.

English review copy follows the working agreement. Citizen-facing Spanish localization remains pending. No risk scale, production data integration, complete component library or finalized map interaction is included.

## Files and reproduction

- `source.html`: editable composition, styles and local interactions.
- `assets/territories.json`: all 33 named units with deterministic fictional amounts; Antioquia starts at COP 12.4 trillion and Vaupés has no data.
- `assets/map-paths.svg`: projected vector path fragment derived from the geometry below, not an official cartographic asset.
- `build.py`: Python 3 standard library only; combines these sources into ignored `mockup.html` (inline canvas fragment) and `preview.html` (standalone offline preview).

From the repository root:

```sh
python3 docs/design/rounds/01-territory-overview/build.py
```

Open `preview.html` in a browser or `mockup.html` in the integrated visualization canvas. No server, package installation or network access is needed to use the generated preview. Do not edit the generated files; update the sources and rebuild.

## Geography and attribution

Source checked 2026-11-07: [geoBoundaries COL ADM1 metadata](https://www.geoboundaries.org/api/current/gbOpen/COL/ADM1/). Boundary ID `COL-ADM1-13589884`, represented year 2017, 33 administrative units. Source attribution: OpenStreetMap contributors / Wambacher; distributor geoBoundaries. License stated by source: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), with [OpenStreetMap attribution](https://www.openstreetmap.org/copyright).

Input: [simplified GeoJSON pinned to 9469f09](https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/COL/ADM1/geoBoundaries-COL-ADM1_simplified.geojson). Adaptation: reversed ring winding where the spherical feature area exceeded 2π, then projected using D3 7.9.0 `geoMercator().fitExtent([[18,18],[582,542]], collection)` and `geoPath(projection).digits(1)`. The paths retain source ISO names; they are not DANE identifiers. The derived boundary path asset remains under the source ODbL license. Keep attribution when reusing it.

All financial amounts, the period and update date are fictional. No claim about actual spending, risk or dataset completeness is made.

## Review checklist

- Is the data more prominent than the identity treatment?
- Is the selected territory obvious while its amount colour remains intact?
- Can a reader distinguish contracted amount from spending and risk?
- Is the missing-data treatment distinct from the lowest amount range?
- Can all territory values be accessed with keyboard and on mobile?
- Are title, amount, explanation and source ordered clearly?

## Validation

See `validation.md` for observed checks and limits. Partial acceptance and requested corrections are recorded below.

## Feedback and decisions

User feedback, 2026-11-07: typography is legible and clear. Error needs warning/danger semantics and a recognisable but calm failure treatment. Map must show potential risk signals, not contracted amount. Continue in [Round 02](../02-risk-signals/README.md); preserve this round as review history.
