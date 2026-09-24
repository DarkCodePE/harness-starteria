# Starteria — Cognitive Stability Boundary Review v0.1

Status: `ITERATE`

This review is evaluation-only. No prompt, fixture, evaluator, schema,
conversational realizer, productive runtime, or Decision Readiness cognition
was modified.

## Evidence boundary

The live artifacts preserve `selected_material_gap`, `next_action`,
`routing_target`, `deferred_gaps`, `stop_rationale` and visible realization
fields. They do not preserve separate fields named `answerability`,
`decision_dependency`, `decision_sensitivity` or `why_not_ask`. Those dimensions
are therefore not claimed as directly observed; conclusions use the preserved
gap/action/route data and the fixture context only.

## CF-02 — priority outcome

The selected gap is stable in meaning: the outcome that should govern priority
is not defined. The action varies between ASK and
REQUIRE_ORGANIZATIONAL_INPUT. The fixture explicitly states that direction has
not defined the result and the user does not know it.

Classification: `STRICT_ACTION_REQUIRED` —
`REQUIRE_ORGANIZATIONAL_INPUT`.

An ASK action risks asking the user to invent or speculate about management's
priority. Decision loss for ASK instead of organizational input: `MATERIAL`.
Organizational input instead of ASK has `MINOR` loss at most because it may be
slower if the user happens to know an answer, but it preserves authority and
truth provenance.

Focused rerun: ASK=3, REQUIRE_ORGANIZATIONAL_INPUT=7. The action boundary
remains insufficiently precise in the live candidate, despite the fixture not
being genuinely ambiguous.

Evaluator recommendation: `STRICT_ACTION` with invariants:

- do not invent management intent;
- preserve the organizational dependency;
- do not ask the user to supply an unknown priority;
- move toward an explicit authority confirmation.

## CF-05 — operational authority

The selected gap is stable in meaning: the person or role authorized to approve
the pilot's move to operation is not identified. The initial fixture says that
nobody is clear on who decides; its expected continuation asks for designation
by the responsible authority.

Classification: `STRICT_ACTION_REQUIRED` —
`REQUIRE_ORGANIZATIONAL_INPUT`.

ASK instead of organizational input would risk making the user guess who has
formal authority. Decision loss for ASK instead of organizational input:
`MATERIAL`. Organizational input instead of ASK has `MINOR` loss at most.

Focused rerun: REQUIRE_ORGANIZATIONAL_INPUT=10. The earlier ASK=2/5 was not
reproduced and is best treated as sampling variability around an insufficiently
explicit action boundary, not as an acceptable alternative for this fixture.

Evaluator recommendation: `STRICT_ACTION` with invariants:

- preserve the authority gap;
- do not invent a sponsor, committee or approver;
- do not ask the user to speculate;
- make the designation request the next valid action.

## CF-11 — initiative ready for committee

All runs preserve the same material reading: there is no immediate gap for the
declared goal of presenting the initiative to the committee. The remaining
experiment design belongs to a later stage. STOP and ROUTE differ mainly in
whether that later-stage path is surfaced now.

Classification: `BOTH_ACTIONS_ACCEPTABLE`.

Decision loss is `MINOR` in either direction:

- STOP instead of ROUTE may omit a useful explicit handoff, but the committee
  presentation path remains clear from the fixture;
- ROUTE instead of STOP surfaces later work that is already known and does not
  block the current entry decision.

Focused rerun: ROUTE=7, STOP=3. This is acceptable alternative-action
variation, not a proven cognitive failure.

Evaluator recommendation: `INVARIANT_BASED` with invariants:

- no unnecessary question;
- no unresolved blocker hidden;
- current committee presentation remains clear;
- later experiment work is not treated as a current entry blocker;
- any surfaced route must remain bounded to the next stage.

## Decision-loss summary

| Case | Alternative | Loss | Reason |
|---|---|---|---|
| CF-02 | ASK instead of organizational input | MATERIAL | Pressures the user to invent an authority-owned priority. |
| CF-02 | Organizational input instead of ASK | MINOR | Can be slower if the user unexpectedly knows the answer. |
| CF-05 | ASK instead of organizational input | MATERIAL | Risks speculative identification of formal authority. |
| CF-05 | Organizational input instead of ASK | MINOR | May defer a fact the user could know, while preserving authority. |
| CF-11 | STOP instead of ROUTE | MINOR | Later handoff may be less explicit, but current goal remains clear. |
| CF-11 | ROUTE instead of STOP | MINOR | Surfaces known later work without blocking the current decision. |

## Focused rerun

Artifact: `PORTFOLIO_ENTRY_COGNITIVE_STABILITY_FOCUSED_RERUN_v0.1.json`

```text
population: CF-02, CF-05, CF-11 × 10 = 30
valid: 30/30
provider errors: 0
presentation duplication: 0
semantic envelope failures: 0
```

| Case | Action distribution | Invariant preservation |
|---|---|---|
| CF-02 | ASK=3, REQUIRE_ORGANIZATIONAL_INPUT=7 | Preserved gap and authority dependency; ASK remains a material boundary error. |
| CF-05 | REQUIRE_ORGANIZATIONAL_INPUT=10 | Preserved authority dependency; no reasoning regression observed. |
| CF-11 | ROUTE=7, STOP=3 | Preserved no-current-gap and later-stage distinction; both actions acceptable. |

## Conclusion

Rule-boundary issue found: **YES**. CF-02 and CF-05 need a stronger explicit
unknown/authority boundary, but that is not changed in this review.

Fixture ambiguity found: **YES**, specifically CF-11's valid STOP versus ROUTE
choice. CF-02 and CF-05 are not materially ambiguous about ownership of the
missing truth.

Cognition change required now: **NO**. The evidence supports an evaluator
distinction between strict-action cases and invariant-based cases before any
cognition change is authorized.

Hypothesis status: `ITERATE`.

Recommended next step: preserve strict-action invariants for CF-02/CF-05 and
invariant-based evaluation for CF-11 in a future evaluation design; only then
consider a separately authorized cognition-boundary experiment.
