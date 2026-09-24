# Starteria — Current Decision / Later Work Boundary v0.1

Status: `HARNESS_ONLY_EXPERIMENTAL`

This focused stabilization preserves frozen Decision Readiness cognition and adds no broad cognition dimension. It clarifies how Conversion Readiness treats unresolved work in relation to the user's current job.

## Boundary rule

Before treating an unresolved item as a current conversion blocker, ask internally:

> If this remains unresolved today, does it prevent the user's current job from moving forward?

If the answer is no, the item must not reopen the current decision, trigger an Entry question, or lower conversion readiness.

## Internal item relation

Every unresolved item may be classified as:

- `CURRENT_DECISION_BLOCKER`: the current decision/action cannot responsibly move without resolving it.
- `CURRENT_DECISION_CONDITION`: preparation can continue, but the eventual current decision remains conditional on it.
- `LATER_WORK`: relevant work that belongs after the current decision or outside Entry; it does not reduce conversion readiness.
- `OPTIONAL_ENRICHMENT`: useful context that is unnecessary for the current job; it must not trigger a question.

These labels are internal and never visible to the user. The live focused schema adds `relation` to each internal open-item object. `open_items` may preserve later work for continuity, but only blocker/condition relations can determine `READY_WITH_OPEN_ITEMS`.

## Boundary examples

CR-03: provider, architecture and workflow are `LATER_WORK`; the decision to continue is already made, therefore conversion is `READY`.

CR-04: the current need is complete and a subsequent experiment is later work only when explicitly supported by the user. Do not manufacture a committee, sponsor, approval board, governance body or permission step.

CR-ADV-01: missing KPI is an open condition or later enrichment, not an automatic conversion blocker.

CR-ADV-04: missing evidence can remain an open condition while the objective, initiative and constraints are organized.

CR-ADV-05: architecture/provider detail is later work; do not deepen Entry questions merely because solution detail exists.

## Question suppression

Ask only when the answer would materially change what the user should do now. A question about later design, optional evidence or already-sufficient context is `UNNECESSARY`; a question about an unclear need may be `NECESSARY`.

## Public realization

Visible language should state what is clear, what genuinely matters now, and what can happen next. It may mention Starteria when that helps the user's continuation, but it must not use internal labels, explain architecture, or act as a sales CTA. `NOT_READY` must not receive a product-continuation push.

## Focused validation guardrail

```text
Decision Readiness modified: NO
Conversion cognition expanded: NO
Boundary relation clarified: YES
Scope: CR-03 x10, CR-04 x10, CR-ADV-01..05 x5
Target live calls: 45
Productive runtime modified: NO
Previous A/B artifacts overwritten: NO
```

