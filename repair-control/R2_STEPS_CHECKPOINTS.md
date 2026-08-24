# R2 — Steps / Checkpoints Repair Contract

## 0. Control

- Program: MVP Remediation
- Remediation stage: R2 — Steps / Checkpoints
- Base commit: `7568fe8`
- Base status: `R1 CLOSURE GO`
- Branch: `repair/mvp-r2-steps-checkpoints`
- Worktree: `C:\Users\User\proyect-starteria\Dashboardstarteria-repair-r2`
- R0: CLOSED
- R1: CLOSED
- MVP status: MUST remain NO-GO until later closure stages and Full MVP Reaudit

This document is the implementation contract for R2.

R2 MUST NOT reopen R0 or R1 unless a regression directly caused by R2 is demonstrated.

---

# 1. Purpose

R2 must consolidate the existing persistent Adaptive Core as the primary Step/checkpoint engine for the pilot and connect checkpoint progression to the R1 Truth Foundation.

R2 does NOT create a new Step engine.

R2 does NOT redesign the Step 0–4 methodology.

R2 does NOT implement the R3 Decision Center.

R2 does NOT implement R4 Import / Portfolio, except for the minimum projection changes directly required to keep Step progression coherent.

Target journey:

Adaptive Core
→ active checkpoint
→ structured response
→ Truth Claim / Evidence / SourceRef / Validation
→ truth readiness
→ human checkpoint confirmation
→ checkpoint completed
→ Step contractual output
→ human Step output confirmation
→ target Step state
→ next Step configuration
→ next checkpoint materialization/prefill
→ downstream projection

---

# 2. Root causes in scope

## RC-STEP-01 — Checkpoint validation is partial sufficiency

Current behavior:

`confirmCheckpoint()`
→ `evaluateCheckpoint()`
→ required fields present
→ checkpoint may become `completed`

`evaluateCheckpoint()` currently verifies field presence using `hasValue()`.

That is structural completeness, not validated truth readiness.

A completed field MUST NOT automatically imply validated evidence.

### R2 required outcome

Checkpoint readiness must distinguish:

1. structural completeness;
2. evidence binding;
3. Truth validation readiness;
4. human confirmation.

Where a checkpoint requires validated support, structural completeness alone MUST NOT allow final confirmation.

---

## RC-STEP-02 — Legacy / adaptive paths coexist

Current behavior includes persistent Adaptive Core plus compatibility/reconstruction paths.

Backend exposes:

- `legacyFallback`

Frontend contains fallback patterns such as:

- `serverAdaptiveCore ?? ensureAdaptiveCoreForProject(project)`
- `resolveAdaptiveCoreForProject(project, serverCore)`
- reconstruction from `step0Data`
- reconstruction from Initial Review

These paths can produce an Adaptive representation without proving that it is the authoritative persistent server state.

### R2 required outcome

For the authenticated pilot Step journey:

**Persistent server Adaptive Core is authoritative.**

A server load failure MUST NOT silently become a locally reconstructed authoritative Step state.

Compatibility/reconstruction may remain only when:

- explicitly scoped;
- clearly distinguishable;
- non-authoritative for checkpoint confirmation/progression;
- unable to create false completed/unlocked states.

No silent mock/fallback behavior may be introduced.

---

## RC-EVID-02 — Evidence does not govern checkpoints

Current Adaptive behavior:

- `evidenceItems`
- `evidenceClassifications`
- `sourceRefs`

are normalized locally.

`normalizeEvidenceItems()` may generate:

- synthetic IDs such as `evidence-1`;
- textual `sourceRefs`;
- local classifications such as:
  - supports
  - contradicts
  - weak_signal
  - insufficient
  - context
  - new_uncertainty

`sourceRefsFrom()` accepts loose strings, IDs, URLs or names.

`buildStep1Output()` calculates local `sufficiency` from these classifications.

This is not equivalent to the R1 Truth Foundation.

### R2 required outcome

Where Adaptive claims validated evidence exists, the relevant evidence references must resolve to persistent R1 truth objects.

The system MUST preserve:

Claim ≠ Evidence ≠ SourceRef ≠ Validation.

A synthetic/string reference MUST NOT independently satisfy validated readiness.

---

# 3. Existing architecture R2 MUST reuse

R1 already introduced persistent Truth Foundation concepts:

- `SourceRef`
- `TruthClaim`
- `Evidence`
- `TruthValidation`
- `AttentionItem`
- `ImpactAssertion`

R2 MUST reuse them.

R2 MUST NOT introduce:

- AdaptiveTruthClaim;
- AdaptiveEvidence as a second truth entity;
- AdaptiveValidation as a parallel validation authority;
- another evidence-readiness model that competes with R1.

Existing R1 rule:

`getClaimReadiness(projectId, claimId)`

returns validated support only when:

`verificationState === 'supported'`

R2 may extend integration/service boundaries as needed, but MUST NOT weaken this invariant.

---

# 4. Truth invariants inherited from R1

These are non-negotiable.

## INV-R2-TRUTH-01

Claim ≠ Evidence ≠ Validation.

## INV-R2-TRUTH-02

AI cannot self-validate a final truth state.

## INV-R2-TRUTH-03

`supported` requires coherent Claim + Evidence + SourceRef according to R1 rules.

## INV-R2-TRUTH-04

`contradicted` does NOT satisfy validated-support readiness.

## INV-R2-TRUTH-05

`insufficient` does NOT satisfy validated-support readiness.

## INV-R2-TRUTH-06

Missing evidence remains missing evidence.

Copy, classification or field completion cannot erase the missing state.

## INV-R2-TRUTH-07

R2 must not silently convert loose Adaptive strings into validated Truth objects.

Any creation/binding must be explicit, persistent and traceable.

## INV-R2-TRUTH-08

`TECH-DEBT-TRUTH-01` remains deferred unless R2 demonstrates that changing contradicted-validation integrity is strictly required.

---

# 5. Checkpoint readiness model

R2 must separate four concepts.

## 5.1 Structural completeness

Question:

Have required checkpoint responses been supplied?

Existing `evaluateCheckpoint()` may continue to participate here.

Example result:

```ts
{
  structurallyComplete: true,
  missingFields: []
}
```

Structural completeness MUST NOT be named or treated as validated evidence readiness.

---

## 5.2 Truth binding

Question:

Do checkpoint responses that claim evidence/support resolve to persistent Truth Foundation objects?

Binding should be explicit enough to identify, as applicable:

- claimId;
- evidenceId/evidenceIds;
- sourceRefId/sourceRefIds;
- validation/readiness status.

Loose values such as:

- `evidence-1`
- arbitrary URLs;
- arbitrary labels;
- names;
- pasted strings

may remain descriptive source input, but MUST NOT satisfy persistent Truth readiness by themselves.

---

## 5.3 Truth readiness

Question:

Does the relevant claim satisfy the required validation condition?

For validated-support gates:

```text
satisfiesValidatedSupport === true
```

is required.

Truth states must have real effects:

### supported

May satisfy a validated-support requirement.

### contradicted

Must not satisfy validated-support readiness.

Must surface contradiction state in checkpoint/output context.

### insufficient

Must not satisfy validated-support readiness.

Must surface missing/insufficient state.

### unvalidated / missing

Must not satisfy validated-support readiness.

---

## 5.4 Human confirmation

Even when structural and Truth readiness pass, the existing human confirmation rule remains.

R2 must NOT replace the user confirmation with AI approval.

Target:

structural completeness
+
truth readiness when required
+
human confirm action
=
checkpoint completion

---

# 6. Checkpoint policy

Not every field in every checkpoint requires validated evidence.

R2 MUST NOT indiscriminately force a TruthClaim onto all questions.

Instead, R2 must define an explicit checkpoint evidence policy.

At minimum classify requirements as:

- `structural`
- `evidence_reference_required`
- `validated_support_required`
- `contradiction_must_be_resolved`
- `human_confirmation_required`

The policy must be deterministic and testable.

---

# 7. Minimum evidence-sensitive checkpoints

R2 implementation must inspect all checkpoint definitions CP-0.1 through CP-4.5.

At minimum, the following current checkpoints are evidence-sensitive and MUST NOT rely only on `hasValue()` where they claim evidentiary readiness:

## CP-1.3

Current required fields:

- `evidenceItems`
- `evidenceClassifications`
- `sourceRefs`

R2 expectation:

These fields cannot be considered validated merely because arrays/strings are non-empty.

Where the checkpoint claims support of the Step 1 hypothesis/focus, evidence must bind to Truth Foundation and the relevant claim readiness must govern support.

## CP-1.4

Uses synthesis and continuity.

The synthesis must not convert unresolved/contradicted/insufficient evidence into a "sufficient" result.

## CP-2.x

Any evidence used to justify alternative selection, selected bet or readiness must retain traceability to persistent sources.

R2 does not require every design preference to be a validated factual claim.

## CP-3.2 / CP-3.3

Execution/result evidence is materially evidence-sensitive.

Result interpretation must not claim validated support merely from textual `executionSourceRefs`.

## CP-3.4

Decision evidence references must remain traceable.

R2 stops before implementing the R3 decision governance model.

## CP-4.x

Evidence used for narrative/artifact traceability must not be upgraded into validated facts through string references.

---

# 8. Adaptive classification vs Truth status

Existing Adaptive classifications:

- supports
- contradicts
- weak_signal
- insufficient
- context
- new_uncertainty

may remain useful for UX/methodological interpretation.

They MUST NOT become a second validation authority.

R2 must define an explicit mapping/relationship.

Example principle:

```text
Adaptive classification = methodological interpretation
TruthValidation / TruthClaim.verificationState = validation authority
```

Therefore:

`classification === "supports"`

alone MUST NOT imply:

`TruthClaim.verificationState === "supported"`

And:

Adaptive `sufficiency === "sufficient"`

MUST NOT be emitted as validated sufficiency if the required Truth readiness is false.

---

# 9. Step 1 output contract

Existing `buildStep1Output()` must be preserved conceptually.

Current useful outputs include:

- validationFocus
- evidencePlan
- evidenceMap
- facts
- contradictions
- gaps
- learning
- updatedFocus
- hypothesisForStep2
- continuityDecision
- sufficiency
- evidenceSummary
- blocker
- actorRequired
- futureDecision
- sourceRefs
- challengeContribution

R2 must adjust the provenance/readiness of these values, not replace the whole output model.

## Required R2 behavior

If Truth readiness is required and not satisfied:

- output MUST NOT describe validated evidence as sufficient;
- contradiction/insufficiency must remain visible;
- unresolved truth state must survive into the output;
- Step confirmation/unlock must follow the explicit evidence policy.

No downstream Step may receive a falsely upgraded evidence state.

---

# 10. Contractual Step transition

Existing Step contractual transition is valuable and MUST be reused.

Observed pattern:

checkpoint sequence complete
→ Step output `draft`
→ user confirms Step output
→ output becomes `confirmed`
→ project currentStep changes
→ next AdaptiveStepConfiguration created
→ first checkpoint of next Step materialized
→ progress signal updated
→ projection synchronized

R2 MUST preserve this pattern.

R2 must NOT replace it with direct checkpoint-to-next-Step navigation.

---

# 11. Human output confirmation

Existing methods include:

- `confirmStep0Brief`
- `confirmStep1Output`
- `confirmStep2Output`
- `confirmStep3Output`
- `confirmStep4Output`

R2 must preserve explicit confirmation semantics.

Required invariant:

A draft Step output cannot become confirmed solely because an AI generated it.

---

# 12. Next Step configuration and prefill

R2 must make the transfer contract explicit and testable.

For a confirmed Step N output:

1. target Step state is persisted;
2. next `AdaptiveStepConfiguration` is persisted;
3. first checkpoint is materialized exactly once;
4. transferred context comes from the confirmed contractual output;
5. provenance of evidence/claims is retained;
6. progress signal reflects persisted state;
7. reloading from backend returns the same active checkpoint;
8. frontend does not need to reconstruct a different state locally.

The implementation MAY retain existing functions such as:

- `buildStep2MasterContext`
- `buildStepConfiguration`
- `materializeCheckpointTx`
- `syncInitiativeProgress`

when appropriate.

---

# 13. Idempotency

Existing idempotency behavior MUST remain.

R2 must test at minimum:

- duplicate checkpoint confirmation;
- duplicate Step output confirmation;
- duplicate next checkpoint materialization;
- duplicate next Step configuration where applicable.

A retry must not create:

- duplicate checkpoint responses;
- duplicate checkpoint instances;
- duplicate Step outputs;
- duplicate truth bindings;
- duplicate validation objects caused by the same action.

---

# 14. Single primary Adaptive path

For authenticated pilot Step pages:

## Required

Backend persistent Adaptive Core is the source of truth for:

- active Step;
- active checkpoint;
- completed checkpoints;
- Step configurations;
- Step outputs;
- progress signal;
- readiness relevant to progression.

## Forbidden

On failure to load persistent Adaptive Core, frontend MUST NOT silently render a reconstructed local core as if it were authoritative.

Acceptable behaviors include:

- explicit loading state;
- explicit error/retry state;
- clearly identified compatibility/read-only state if genuinely needed.

But reconstructed state MUST NOT permit authoritative confirmation/progression.

---

# 15. Legacy compatibility

R2 does not require deleting all legacy code.

R2 requires eliminating legacy/adaptive ambiguity from the **primary pilot journey**.

Any remaining compatibility path must be documented as one of:

- migration compatibility;
- read-only compatibility;
- explicit fallback for historical records.

It must not compete with persistent Adaptive Core for authoritative current progress.

`legacyFallback` must not hide a server integrity failure.

---

# 16. Portfolio projection boundary

R4 remains out of scope.

However, R2 may minimally modify projection code directly affected by Step state.

Current projection already prefers Adaptive progress in at least part of Portfolio.

R2 may ensure that a confirmed Step transition projects the correct:

- current Step;
- status;
- progress signal;
- blocker/readiness indication.

R2 MUST NOT implement:

- Import;
- Portfolio redesign;
- coverage engine;
- Decision Center;
- advanced reporting.

---

# 17. AttentionItem / blockers

R1 introduced durable `AttentionItem`.

R2 should use durable blockers where an evidence/readiness failure needs persistent operational attention.

R2 MUST NOT create a second blocker truth model.

The exact integration should remain minimal and directly related to checkpoint progression.

At minimum, R2 must ensure that:

- missing validated evidence cannot disappear because a field is filled;
- contradiction/insufficiency remains observable;
- any blocker used to prevent progression has an explicit exit condition.

---

# 18. Errors and API behavior

Checkpoint confirmation failures must be explicit and actionable.

Examples of acceptable categories:

- structural fields missing;
- referenced SourceRef not found;
- referenced Evidence not found;
- claim not found;
- claim unvalidated;
- claim contradicted;
- evidence insufficient;
- checkpoint not active;
- checkpoint already confirmed.

R2 must not collapse all Truth failures into generic:

`CHECKPOINT_INSUFFICIENT`

if doing so hides materially different remediation actions.

API errors must allow frontend to explain what is missing and what the user must do next.

---

# 19. Transaction integrity

Checkpoint completion must not persist partial invalid state.

Where confirmation requires Truth readiness:

The system must not leave:

- response persisted;
- checkpoint completed;
- next checkpoint created;

if the required Truth gate fails.

Likewise, Step output confirmation and next Step configuration must remain transactionally coherent.

---

# 20. No silent synthetic evidence

The following pattern cannot satisfy validated readiness:

```ts
sourceRefs: [`evidence-${index + 1}`]
```

unless that identifier resolves to an actual persistent object accepted by the Truth Foundation.

Synthetic IDs may be used as temporary UI/local identifiers only when clearly non-authoritative.

They MUST NOT masquerade as validated SourceRefs.

---

# 21. No silent URL/name truth upgrade

`sourceRefsFrom()` may continue to normalize display/input values if useful.

However, a URL, name or arbitrary string must not automatically become equivalent to:

`SourceRef.id`

R2 must make this boundary explicit.

---

# 22. R2 acceptance requirements

## R2-AC-01 — Structural vs Truth readiness

Given a structurally complete evidence-sensitive checkpoint,
when required Truth readiness is not satisfied,
then checkpoint confirmation is rejected.

## R2-AC-02 — Supported

Given a required claim with coherent evidence/source and validated `supported`,
when structural requirements are met and user confirms,
then the checkpoint may complete.

## R2-AC-03 — Contradicted

Given a required claim whose readiness is contradicted,
then validated-support checkpoint readiness is false.

## R2-AC-04 — Insufficient

Given insufficient evidence,
then validated-support checkpoint readiness is false.

## R2-AC-05 — Missing evidence

Given required evidence is absent,
then filling descriptive fields does not satisfy the gate.

## R2-AC-06 — Invalid loose SourceRef

Given an arbitrary string/synthetic reference not bound to persistent Truth objects,
then it cannot satisfy validated readiness.

## R2-AC-07 — Human confirmation

Even when Truth readiness passes,
the checkpoint/Step output requiring human confirmation is not auto-confirmed by AI.

## R2-AC-08 — Contractual output

Completing the final checkpoint produces the correct Step output draft exactly once.

## R2-AC-09 — Step confirmation

Confirming a Step output persists confirmed state and target currentStep coherently.

## R2-AC-10 — Next configuration

After confirmed Step N,
the next Step configuration is persisted and the correct first checkpoint is materialized exactly once.

## R2-AC-11 — Reload stability

After transition,
a fresh backend read returns the same Step/checkpoint state.

## R2-AC-12 — No authoritative frontend fallback

If persistent Adaptive Core cannot be loaded,
the primary pilot UI does not silently reconstruct an authoritative progress state.

## R2-AC-13 — Idempotency

Repeated confirmation with the same idempotency key does not duplicate persisted objects or advance twice.

## R2-AC-14 — Projection

The minimal downstream progress projection reflects the persisted Adaptive state after transition.

---

# 23. Test requirements

R2 implementation must add/adjust tests in layers.

## 23.1 Unit

At minimum:

- checkpoint structural evaluation;
- evidence policy;
- Truth binding/readiness integration;
- supported;
- contradicted;
- insufficient;
- missing evidence;
- synthetic reference rejection;
- local Adaptive classification cannot self-promote Truth state.

## 23.2 Adversarial

At minimum:

1. complete all required strings but no real Evidence;
2. pass `supports` classification with no validated claim;
3. pass fake `sourceRefs`;
4. pass an existing SourceRef from another project;
5. pass contradicted validation;
6. pass insufficient validation;
7. double-submit confirmation;
8. attempt stale/inactive checkpoint confirmation;
9. frontend server failure must not unlock local reconstructed progression.

## 23.3 Persistence integration

Use real disposable PostgreSQL.

Demonstrate:

checkpoint response
→ Truth objects/readiness
→ checkpoint completion
→ Step output draft
→ human confirmation
→ next Step config
→ first next checkpoint
→ reload
→ same persisted state

No in-memory-only proof is sufficient for R2 closure.

## 23.4 Existing Adaptive tests

Existing Adaptive Core tests must remain green except where an old test explicitly asserts behavior now prohibited by R2.

Any changed test must document why the previous expectation represented the R2 root cause.

---

# 24. Regression boundaries

R2 must verify no regression to R1 Truth Foundation.

At minimum rerun:

- R1 unit/adversarial Truth tests;
- R1 persistence integration;
- relevant migrations / disposable PostgreSQL path.

Known unrelated baseline defect:

`backend/shared/utils/__tests__/logger-redaction.test.ts`

expects `LOG_REDACT_PATHS` export.

This is pre-existing debt and MUST NOT be attributed to R2 unless R2 directly modifies/affects it.

---

# 25. Files likely affected

This is a discovery list, not authorization to rewrite all files.

Likely backend:

- `backend/modules/adaptive-core/adaptive-core.service.ts`
- Adaptive Core types/schemas if needed
- Adaptive Core tests
- Truth integration/service boundary
- possibly minimal Portfolio projection sync

Likely frontend:

- `front/src/features/adaptive-core/...`
- authenticated Step pages using local fallback
- error/loading handling around persistent Adaptive Core

Likely tests:

- Adaptive service tests
- Truth/Adaptive integration tests
- persistence integration
- frontend/domain tests for fallback authority

Codex must inspect actual call paths before modifying anything.

---

# 26. Explicit non-goals

R2 MUST NOT:

- rebuild Adaptive Core;
- create a new Step engine;
- redesign Step methodology;
- implement Decision Center;
- implement Import;
- redesign Portfolio Lead;
- implement reporting;
- build advanced impact governance;
- introduce new mock/fallback data;
- auto-validate claims with AI;
- collapse Claim/Evidence/Validation into one object;
- remove R1 Truth invariants;
- declare MVP GO.

---

# 27. Implementation strategy constraint

Prefer the smallest coherent integration over broad refactors.

Desired pattern:

existing Adaptive checkpoint
+
explicit evidence policy
+
Truth Foundation binding/readiness
+
existing transactional completion
+
existing Step output confirmation
+
existing next-Step configuration

Not:

replace Adaptive Core with a new architecture.

---

# 28. Evidence of completion required from Codex

Codex implementation report must include:

1. files changed;
2. root cause addressed by each change;
3. checkpoint evidence policy introduced;
4. exact Truth Foundation integration seam;
5. treatment of loose/synthetic sourceRefs;
6. behavior for supported;
7. behavior for contradicted;
8. behavior for insufficient;
9. behavior for missing evidence;
10. authoritative Adaptive path treatment;
11. fallback/legacy treatment;
12. tests added;
13. tests changed and why;
14. database/persistence validation results;
15. known remaining gaps;
16. confirmation that R3/R4 were not implemented;
17. confirmation that no commit/push/merge was performed.

---

# 29. R2 closure gate

R2 cannot be declared closed merely because tests pass.

Closure requires independent evidence that:

- Adaptive Core is the primary authoritative pilot Step engine;
- validated evidence actually governs evidence-sensitive checkpoint progression;
- fake/string evidence cannot satisfy validated readiness;
- supported/contradicted/insufficient have real progression effects;
- human confirmation remains required;
- final checkpoint → Step output → next Step transition persists correctly;
- reload preserves state;
- minimal Portfolio projection remains coherent;
- R1 Truth Foundation has not regressed.

Only after independent reaudit may the result be:

`R2 CLOSURE GO`

Until then:

`R2 IN PROGRESS`

and:

`MVP PILOT NO-GO`

---

# 30. Reaudit targets

R2 reaudit should focus only on requirements materially affected by R2.

Primary targets:

- `CTRL-EVID-001`
- `EVID-004`
- `CTRL-BLOCK-001`
- GP-B — Avanzar Iniciativa
- checkpoint/Step persistence and progression controls
- legacy/adaptive primary-route ambiguity

Expected direction:

`CTRL-EVID-001`
Level 2 → candidate Level 3

`EVID-004`
Level 2 → candidate Level 3

`GP-B`
Level 2 / PARTIAL → candidate Level 3

Do not upgrade levels without independent evidence.

---

# 31. Final R2 principle

A user does not advance because a form looks complete.

A user advances because the required information is structurally present, the required evidence is persistently traceable, the required truth state is actually ready, the human confirms the contractual output, and the resulting transition is persisted consistently.

That is the R2 boundary.
