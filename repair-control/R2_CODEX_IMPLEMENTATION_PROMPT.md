# R2 — Codex Implementation Prompt

## Context

You are working inside the Startería MVP remediation program.

Current stage:

- R0 Validation Environment: CLOSED
- R1 Truth Foundation: CLOSED
- R2 Steps / Checkpoints: IN PROGRESS
- R3 Decisions: NOT STARTED
- R4 Import / Portfolio: NOT STARTED
- R5 Pilot Closure: NOT STARTED
- Full MVP Reaudit: PENDING

Repository worktree:

`C:\Users\User\proyect-starteria\Dashboardstarteria-repair-r2`

Branch:

`repair/mvp-r2-steps-checkpoints`

Base commit:

`7568fe8`

R1 closure verdict:

`R1 CLOSURE GO`

MVP status MUST remain:

`MVP PILOT NO-GO`

Do NOT commit.
Do NOT push.
Do NOT merge.
Do NOT create or switch branches.
Do NOT modify unrelated worktrees.

---

# 1. Governing contract

Before changing code, read completely:

`repair-control/R2_STEPS_CHECKPOINTS.md`

That document is the governing repair contract for this implementation.

If this prompt and the repair contract appear to conflict, STOP implementation of the conflicting part and report the conflict rather than guessing.

Do not weaken any R1 invariant.

---

# 2. Mission

Repair the existing Startería Adaptive Core Step/checkpoint path so that:

1. persistent server Adaptive Core is the authoritative pilot Step engine;
2. checkpoint completion distinguishes structural completeness from Truth readiness;
3. evidence-sensitive checkpoints are governed by the R1 Truth Foundation;
4. loose strings, fake refs and synthetic evidence IDs cannot satisfy validated readiness;
5. supported / contradicted / insufficient / missing states have real progression effects;
6. human confirmation remains required;
7. the existing contractual Step flow remains:
   checkpoint sequence
   → Step output draft
   → human Step confirmation
   → next Step configuration
   → next checkpoint materialization/prefill;
8. reload returns the same persisted state;
9. minimal downstream projection stays coherent;
10. no R3 or R4 functionality is accidentally implemented.

This is an integration/remediation task.

It is NOT an architecture rewrite.

---

# 3. Known current implementation

Use these observations as reconnaissance anchors, but verify them in the code before changing anything.

## 3.1 Adaptive checkpoint confirmation

Known location:

`backend/modules/adaptive-core/adaptive-core.service.ts`

Known method:

`confirmCheckpoint(...)`

Current flow includes:

- `ensureInitialized(...)`
- idempotency check
- active checkpoint lookup
- `evaluateCheckpoint(...)`
- persistence of `adaptiveCheckpointResponse`
- checkpoint status → `completed`
- event `checkpoint_completed`
- next checkpoint progression and/or Step output draft creation

Current problem:

`evaluateCheckpoint(...)` currently tests required field presence with `hasValue()`.

That is structural sufficiency only.

It is NOT Truth readiness.

---

## 3.2 Truth Foundation

Known location:

`backend/modules/truth/truth.service.ts`

Known method:

`getClaimReadiness(projectId, claimId)`

Current invariant:

validated support is true only when:

`verificationState === 'supported'`

R1 already has persistent:

- SourceRef
- TruthClaim
- Evidence
- TruthValidation
- AttentionItem
- ImpactAssertion

Reuse this model.

Do not create parallel Adaptive truth entities.

---

## 3.3 Adaptive evidence normalization

Known methods:

- `normalizeEvidenceItems(...)`
- `sourceRefsFrom(...)`

Current behavior may:

- produce synthetic IDs such as `evidence-1`;
- normalize strings, URLs, IDs or names into textual refs;
- calculate local Adaptive evidence classifications;
- compute Step 1 `sufficiency` from local `supports`, `contradicts`, `insufficient`, `weak_signal`.

Current risk:

Adaptive local classification can appear sufficient without proving persistent Truth readiness.

---

## 3.4 Contractual Step transition already exists

Existing methods include:

- `confirmStep0Brief`
- `confirmStep1Output`
- `confirmStep2Output`
- `confirmStep3Output`
- `confirmStep4Output`

Known desired existing pattern:

checkpoint sequence complete
→ Step output `draft`
→ human confirmation
→ output `confirmed`
→ current Step advances
→ next Step configuration persisted
→ first checkpoint of next Step materialized
→ progress signal updated
→ initiative progress synchronized

Preserve this architecture.

Do not bypass it.

---

## 3.5 Frontend fallback ambiguity

Known frontend patterns include:

- `serverAdaptiveCore ?? ensureAdaptiveCoreForProject(project)`
- `resolveAdaptiveCoreForProject(project, serverCore)`
- reconstruction from `step0Data`
- reconstruction from Initial Review

Known files include areas under:

- `front/src/features/adaptive-core`
- `front/src/app/pages/InitiativeOverviewPage.tsx`
- `front/src/app/pages/ProjectHomePage.tsx`
- `front/src/app/pages/Step0Page.tsx`
- Step pages using Adaptive service calls

Problem:

server load failure or absence can silently become a locally reconstructed state that looks authoritative.

For the pilot journey, persistent server Adaptive Core must be authoritative.

---

# 4. Mandatory first phase — Inspect before editing

Before making any change, inspect and report internally the exact implementation seams.

At minimum inspect:

1. full `confirmCheckpoint(...)`;
2. full `evaluateCheckpoint(...)`;
3. checkpoint definitions CP-0.1 through CP-4.5;
4. `normalizeEvidenceItems(...)`;
5. `sourceRefsFrom(...)`;
6. Step 1 output construction;
7. Step 2 and Step 3 evidence-sensitive output construction;
8. R1 Truth service interfaces and tests;
9. Prisma relations for TruthClaim, Evidence, SourceRef, TruthValidation;
10. Adaptive Core input types for checkpoint confirmation;
11. frontend Adaptive loading/fallback logic;
12. initiative progress projection/synchronization;
13. all existing Adaptive Core tests touching checkpoint progression.

Do not start with a broad refactor.

First identify the smallest coherent integration boundary.

---

# 5. Required design rule — separate readiness layers

Implement a clear distinction between:

## A. Structural completeness

Required fields exist.

This may continue to use/adapt `evaluateCheckpoint()`.

It must NOT masquerade as validated evidence readiness.

## B. Evidence binding

Evidence-sensitive input must explicitly resolve to persistent Truth Foundation objects where validated evidence is claimed.

Examples of acceptable persistent identifiers:

- claimId
- evidenceId / evidenceIds
- sourceRefId / sourceRefIds

Do not assume every checkpoint needs every identifier.

Define the minimum deterministic contract needed per evidence-sensitive checkpoint.

## C. Truth readiness

When policy requires validated support:

`getClaimReadiness(...)`

or equivalent R1 logic must govern the result.

## D. Human confirmation

A passing readiness evaluation still requires the existing human confirmation action.

AI must not auto-validate or auto-confirm final truth.

---

# 6. Implement an explicit checkpoint evidence policy

Do not hard-code ad hoc Truth behavior deep inside random branches.

Create or centralize a deterministic policy that can answer:

- is this checkpoint structural-only?
- does it require evidence references?
- does it require validated support?
- must contradiction be resolved?
- is human confirmation required?

At minimum support policy categories equivalent to:

- structural
- evidence_reference_required
- validated_support_required
- contradiction_must_be_resolved
- human_confirmation_required

The exact TypeScript shape is your implementation choice.

Keep it minimal and testable.

Do not over-engineer.

---

# 7. Evidence-sensitive minimum scope

Inspect all checkpoints, but at minimum correctly handle:

## CP-1.3

Current fields include:

- evidenceItems
- evidenceClassifications
- sourceRefs

A non-empty array/string is not enough for validated readiness.

A local classification `supports` must not self-promote Truth state.

## CP-1.4

Synthesis/continuity must not turn unresolved, contradicted or insufficient Truth state into validated sufficiency.

## CP-2.x

Evidence used to justify alternatives, selected bet or readiness must retain persistent provenance where it is presented as evidence.

Do NOT require validated Truth for ordinary design preferences unless the contract logically needs it.

## CP-3.2 / CP-3.3

Execution/result evidence and interpretation are materially evidence-sensitive.

Textual `executionSourceRefs` alone must not create validated support.

## CP-3.4

Decision evidence references must remain traceable.

Do not implement R3 Decision Center governance here.

## CP-4.x

Narrative/artifact evidence must preserve provenance and must not be upgraded from arbitrary strings into validated facts.

---

# 8. Adaptive classifications remain interpretive

The following existing Adaptive classifications may remain:

- supports
- contradicts
- weak_signal
- insufficient
- context
- new_uncertainty

But enforce:

Adaptive classification = methodological interpretation

Truth Foundation state = validation authority

Therefore:

`classification === 'supports'`

must NOT imply:

`verificationState === 'supported'`

And local:

`sufficiency === 'sufficient'`

must not represent validated sufficiency if required Truth readiness fails.

Where useful, separate:

- methodological sufficiency;
- validated support/readiness.

Do not overload one field with both meanings if that causes ambiguity.

---

# 9. Loose and synthetic refs

Current patterns such as:

`evidence-1`

or arbitrary:

- URL
- name
- string
- label

must not satisfy validated Truth readiness unless explicitly persisted and resolved according to R1.

Preserve display/input normalization if useful.

But never treat a textual normalized value as equivalent to a persistent `SourceRef.id`.

If changing `sourceRefsFrom()` would create broad regressions, keep it for display/legacy interpretation and add a separate persistent-binding path for readiness.

Prefer that over breaking all current output structures.

---

# 10. Truth integration seam

Prefer a small, explicit integration layer.

Examples of acceptable implementation approaches:

- Adaptive service calls a reusable Truth readiness service/helper;
- a focused checkpoint Truth evaluator resolves claim/evidence/source objects;
- existing TruthService is injected/reused if current module architecture supports it cleanly.

Avoid:

- duplicating R1 validation rules in Adaptive Core;
- direct scattered Prisma truth queries across many checkpoint branches;
- a second readiness authority.

If direct Prisma reads are unavoidable because of current architecture, centralize them in one focused method and preserve R1 invariants.

---

# 11. Transaction behavior

A Truth gate must be evaluated before invalid checkpoint completion persists.

If validated readiness fails, do not leave partial progression such as:

- checkpoint response written as confirmed;
- checkpoint marked completed;
- next checkpoint created;
- Step draft created.

If you need to persist non-final draft/input for UX reasons, distinguish it explicitly from confirmed checkpoint progression.

Do not silently change current persistence semantics unless required.

---

# 12. Error behavior

Introduce explicit actionable errors for materially different failure modes.

Do not reduce all Truth failures to:

`CHECKPOINT_INSUFFICIENT`

Examples of useful distinctions:

- structural required field missing;
- Truth binding missing;
- referenced claim not found;
- referenced evidence not found;
- referenced source not found;
- cross-project reference;
- claim unvalidated;
- claim contradicted;
- evidence insufficient;
- checkpoint not active.

Reuse current AppError patterns and codes consistently.

Do not expose sensitive internals.

---

# 13. Step output behavior

Do not rewrite the Step output system.

For Step 1 especially, preserve useful existing structure such as:

- validationFocus
- evidencePlan
- evidenceMap
- contradictions
- gaps
- learning
- updatedFocus
- hypothesisForStep2
- continuityDecision
- evidenceSummary
- blocker
- actorRequired
- futureDecision
- sourceRefs
- challengeContribution

But ensure output cannot claim validated sufficiency from local classification alone when the checkpoint policy requires Truth support.

Preserve unresolved/contradicted/insufficient state downstream.

---

# 14. Next Step and prefill

Preserve the existing confirmed-output transition.

After Step N confirmation verify:

1. Step output is confirmed exactly once;
2. project currentStep is correct;
3. next AdaptiveStepConfiguration is persisted;
4. first checkpoint is materialized exactly once;
5. transferred context comes from the confirmed Step output;
6. evidence provenance survives transfer;
7. progress signal reflects persistent state;
8. reload returns the same active Step/checkpoint.

Do not create a second `next_checkpoint_prefill` subsystem if current materialization/configuration already serves this purpose.

Make the existing behavior explicit and testable instead.

---

# 15. Frontend authority repair

For authenticated pilot Step progression:

Persistent server Adaptive Core is authoritative.

Inspect every primary Step/journey surface that can fall back to:

`ensureAdaptiveCoreForProject(...)`

or equivalent reconstruction.

Required behavior on backend load failure:

- loading state, error state and/or retry;
- no silent reconstructed authoritative state;
- no local fallback that can unlock/confirm progression.

You MAY keep local builders for:

- previews;
- migration compatibility;
- tests;
- explicitly read-only legacy display;

but they must not govern authoritative current progress in the pilot flow.

Do not delete compatibility code unnecessarily.

---

# 16. Legacy fallback

Backend `legacyFallback` may remain only if its purpose is explicit and it does not hide current-state integrity failure.

Inspect:

`ensureInitialized(...)`

and the logic around existing/raw Adaptive Core reconstruction.

Determine whether it is:

- migration compatibility;
- bootstrap for historical data;
- normal current journey fallback.

Then make the smallest change necessary so that pilot progression cannot silently diverge from persistent Adaptive state.

Document retained compatibility behavior in code comments/tests only where useful.

---

# 17. AttentionItem scope

R1 already provides durable `AttentionItem`.

Use it only if needed for persistent evidence/readiness blockers.

Do not build a new blocker subsystem.

If introduced into R2 progression:

- keep it minimal;
- define explicit exit condition;
- avoid duplicate blockers on retries;
- resolve/update coherently when readiness changes.

If existing error/readiness state is enough for R2 acceptance, do not force unnecessary AttentionItem complexity.

---

# 18. Portfolio boundary

R4 is out of scope.

Only modify Portfolio/projection code if required to maintain consistency after an Adaptive Step transition.

Allowed minimum:

- current Step projection;
- initiative status;
- progress signal;
- blocker/readiness signal if already supported.

Do not implement:

- import;
- portfolio redesign;
- challenge coverage engine;
- reporting;
- advanced portfolio governance.

---

# 19. Tests — mandatory

Do not finish implementation without tests.

## 19.1 Adaptive / Truth unit tests

Add focused tests proving:

1. structural completeness can pass while Truth readiness fails;
2. validated supported claim allows required checkpoint progression;
3. contradicted claim blocks validated-support progression;
4. insufficient claim blocks validated-support progression;
5. unvalidated/missing claim blocks progression;
6. fake sourceRef cannot satisfy readiness;
7. synthetic `evidence-1` cannot satisfy readiness;
8. local `supports` classification alone cannot satisfy Truth readiness;
9. cross-project Truth references are rejected;
10. human confirmation remains required.

## 19.2 Idempotency tests

Prove:

- same checkpoint idempotency key does not duplicate response/progression;
- next checkpoint is not duplicated;
- Step output draft is not duplicated;
- Step output confirmation does not create duplicate next Step config.

Keep existing idempotency tests green.

## 19.3 Contractual transition tests

At least one representative end-to-end service path must prove:

final checkpoint
→ Step output draft
→ Step output confirm
→ next Step config
→ first checkpoint materialized
→ persisted reload returns same state.

Prefer Step 1 → Step 2 because it exercises evidence transfer.

Also preserve existing tests for other Step transitions.

## 19.4 Frontend tests

Add or update tests proving:

backend Adaptive load failure
≠
silent authoritative local reconstruction.

A user must not be able to progress based only on reconstructed fallback state.

## 19.5 R1 regression tests

Rerun Truth Foundation tests.

Do not weaken them to make R2 pass.

---

# 20. Real persistence validation

R2 closure requires real database evidence.

Use the existing disposable PostgreSQL / clean persistence path established in R1.

Do not claim persistence success from mocks only.

Demonstrate at minimum:

persistent Truth objects
→ checkpoint readiness evaluation
→ checkpoint completion
→ Step output draft
→ human Step confirmation
→ next Step config
→ next checkpoint
→ reload
→ consistent state.

If the repository already has an integration harness for this, extend/reuse it.

Do not invent an unrelated harness unless necessary.

---

# 21. Known baseline debt

Known pre-existing issue:

`backend/shared/utils/__tests__/logger-redaction.test.ts`

expects `LOG_REDACT_PATHS` but the export is missing.

Do not fix this as part of R2 unless your own changes directly require touching that code.

If it fails during broad test execution, report it explicitly as pre-existing baseline debt.

Do not attribute it to R2.

---

# 22. Forbidden scope expansion

Do NOT:

- rebuild Adaptive Core;
- create a new Step engine;
- redesign Step 0–4;
- implement R3 Decision Center;
- implement R4 Import;
- redesign Portfolio Lead;
- build reporting;
- implement advanced impact governance;
- add silent mocks/fallbacks;
- auto-validate claims;
- allow AI to confirm final truth;
- merge Claim/Evidence/Validation into one entity;
- weaken `supported` readiness semantics;
- solve unrelated tech debt;
- make cosmetic mass-refactors.

---

# 23. Work style

Use small coherent patches.

After each major seam, re-run the smallest relevant test set before continuing.

Recommended implementation order:

1. checkpoint evidence policy;
2. Truth binding/readiness evaluator;
3. integrate into `confirmCheckpoint`;
4. adapt Step 1 output sufficiency/provenance;
5. inspect/adapt CP-2/CP-3/CP-4 evidence-sensitive propagation minimally;
6. repair authoritative frontend loading behavior;
7. persistence/projection consistency;
8. tests;
9. full relevant regression.

Do not perform a giant rewrite in one patch.

---

# 24. Required final verification

Before reporting completion, run and report:

## A. Git diff/status

Show:

- changed files;
- no unrelated worktree/branch changes;
- no commit.

## B. Focused unit tests

Adaptive Core + Truth integration.

## C. Existing Adaptive Core suite

Relevant service/domain tests.

## D. R1 Truth regression

Truth service unit/adversarial tests.

## E. Frontend focused tests/typecheck

At minimum for files changed.

## F. Real PostgreSQL persistence integration

Use existing R1/R2-compatible harness.

## G. Migration sanity

If no schema migration is required, explicitly say so.

If a migration is required, justify why existing R1 schema cannot support the R2 binding before adding one.

Prefer no migration if current R1 entities already provide required relationships.

---

# 25. Definition of done for implementation phase

Do not declare `R2 CLOSURE GO`.

Your implementation phase is complete only when you can provide evidence for all of the following:

- structural and Truth readiness are distinct;
- evidence-sensitive checkpoint progression is Truth-governed;
- fake/synthetic refs do not validate;
- supported passes where required;
- contradicted blocks;
- insufficient blocks;
- missing/unvalidated blocks;
- human confirmation remains;
- Step output contract remains intact;
- next Step config/checkpoint persists;
- reload is stable;
- frontend no longer silently treats reconstruction as authoritative in primary pilot progression;
- R1 remains green;
- no R3/R4 scope was implemented.

Final status from Codex should be:

`R2 IMPLEMENTATION READY FOR REVIEW`

NOT:

`R2 CLOSURE GO`

and NOT:

`MVP GO`

---

# 26. Required final report format

Return a structured report with exactly these sections:

## 1. Implementation status

Use one of:

- `R2 IMPLEMENTATION READY FOR REVIEW`
- `R2 IMPLEMENTATION BLOCKED`

Explain why.

## 2. Files changed

List every changed file and purpose.

## 3. Root causes addressed

Map changes to:

- RC-STEP-01
- RC-STEP-02
- RC-EVID-02

## 4. Checkpoint evidence policy

Explain the implemented policy and which checkpoints are evidence-sensitive.

## 5. Truth Foundation integration

Explain:

- binding;
- readiness;
- supported;
- contradicted;
- insufficient;
- missing/unvalidated;
- cross-project protection.

## 6. Synthetic / loose source reference behavior

Explain exactly what happens to:

- `evidence-1`;
- arbitrary strings;
- URLs;
- names;
- persistent SourceRef IDs.

## 7. Contractual Step transition

Explain how:

checkpoint
→ output draft
→ human confirmation
→ next Step
→ next checkpoint

works after the repair.

## 8. Frontend authoritative path

Explain what changed in fallback/reconstruction behavior.

## 9. Idempotency

List tests and guarantees.

## 10. Tests run

For each command:

- exact command;
- PASS/FAIL;
- relevant counts where available.

## 11. Real persistence validation

Describe exact PostgreSQL scenario and result.

## 12. R1 regression status

State Truth Foundation regression result.

## 13. Baseline/unrelated failures

List pre-existing failures separately.

## 14. Remaining gaps

Be explicit.

Do not hide PARTIAL behavior.

## 15. Scope guard confirmation

Explicitly confirm:

- no R3 Decision Center implemented;
- no R4 Import/Portfolio implementation beyond minimum projection compatibility;
- no Adaptive Core rebuild;
- no new truth authority;
- no commit;
- no push;
- no merge.

## 16. Git status

Paste final `git status --short` and branch/HEAD.

---

# 27. Final instruction

Implement the smallest coherent R2 repair that makes evidence-sensitive Step progression trustworthy.

Do not optimize for number of changed files.

Optimize for integrity:

**field completion is not evidence, evidence is not validation, and progression is not valid until the required truth state and human confirmation are both satisfied.**
