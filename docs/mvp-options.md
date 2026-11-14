# MVP scope · Explore Colombia

Status: scope selected by Jouler on 2026-11-14, including base suspicious patterns in the MVP.

## Product outcome

Citizens explore Colombia through an interactive map, select a municipality, understand its contracting summary, browse associated contracts and open a contract detail.

## Iteration 1 · Map, municipal contracts, detail and base patterns

- Interactive Colombia map and municipality selection.
- Municipality summary based on the tentative design.
- Contracts associated with the selected municipality.
- Contract detail based on the tentative design and available data.
- An initial set of suspicious-pattern signals in contracts and municipal/territorial summaries, where the reviewed definitions and available data support them. Explain what each signal means and distinguish missing inputs from no detected signal.
- Source and snapshot context sufficient to understand the information shown.

The detailed indicators, fields, business rules, API contracts and layouts are defined when their page is addressed. Existing mockups are references, not a finalized data contract. Contracted value and public spending must remain distinct concepts.

## Base patterns · Scope and existing work

Base suspicious patterns are included in the MVP. Esteban is working on their methodology in [TASK-07](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/8) and [PR #10](https://github.com/EKOU-Solutions/EKOU-Elephants/pull/10); use that work as the starting point rather than creating a competing catalogue.

The initial subset, formulas, thresholds, eligible records and territorial aggregation are agreed from that review and refined when each vertical slice needs them. This scope decision does not approve every proposed pattern, reproduce the analysis or claim that the alert system is already implemented. PR #10 defines and validates proposed patterns; production pipeline and interface integration are separate implementation work.

For the first release, show supported base signals with their explanation, source and snapshot context. Define aggregation before presenting municipal or department alerts. Signals indicate records that deserve review, not proof of corruption. Unavailable evidence must not appear as a low-risk result.

## Iteration 2 · Refine and extend patterns and alerts

- Iterate on the base patterns using observed data quality and feedback from the first release.
- Refine definitions, thresholds, coverage, territorial aggregation and how alerts are explained.
- Extend the pattern set and alert experience as supported by the data and agreed priorities.

Iteration 2 improves the initial signals and alert system; it is not the first introduction of suspicious patterns into the product.

## Delivery methodology

Use vertical slices: address each selected page from beginning to end, refining its business rules, data needs, API, design, implementation, error handling and applicable tests as needed. Complete and verify that page before moving to the next agreed slice.

Do not introduce a separate phase to design every page or build every backend endpoint ahead of the pages. The immediate work after defining this MVP is reviewing and advancing the existing cross-cutting tasks, not beginning page design.

Use the existing visual-system work and its page workflow in [PR #13](https://github.com/EKOU-Solutions/EKOU-Elephants/pull/13), rather than defining a new visual direction in this scope document.

## Existing cross-cutting work

GitHub [Project #3](https://github.com/orgs/EKOU-Solutions/projects/3) remains the task source. Consult it for current status:

- [TASK-03 · Architecture and archetype](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/4).
- [TASK-04 · CI/CD](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/5).
- [TASK-05 · Visual system](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).
- [TASK-06 · Ingestion ADR and POC](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/7).
- [TASK-08 · Public personal-data criteria](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/9), relevant to public contract detail.

## Alternatives considered

1. Municipality profile without a map: simpler entry point, not the selected direction.
2. Map exploration with municipal summary: selected and extended to include associated contracts and contract detail in iteration 1.
3. Investigation-focused entry point: not selected as the primary journey. Base suspicious patterns are nevertheless included in iteration 1; deeper refinement and expansion follow in iteration 2.

This document records MVP boundaries and the agreed delivery method. Detailed page specifications and task status belong to their existing workflows; no implementation or publication is claimed here.
