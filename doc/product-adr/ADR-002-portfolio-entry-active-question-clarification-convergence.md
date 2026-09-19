# ADR-002: Portfolio Entry active question, answer resolution and clarification convergence

> ACCEPTED: approved product decision. This ADR does not authorize runtime implementation by itself.

Estado: Aceptado  
Fecha: 2026-09-19  
Relaciona: `docs/implementation/portfolio-entry-active-question-loop-audit-v0.1.md`; `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`; `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_VALUE_HANDOFF_TARGET_v0.1.md`; `docs/agents/portfolio-entry/skills/entry-04-question-planner/SKILL_v0.2.md`

## 1. Context

Quick Clarification is the first conversational clarification mode of Portfolio Entry. Its product target is sequential and convergent:

```text
user context
  -> one active user-facing question
  -> one user response
  -> resolution processing
  -> reevaluation
  -> one different material question OR sufficiency checkpoint
```

The current repository audit found that the runtime accepts and persists up to three questions in one turn, the frontend displays only the first question, the active answer request does not send `matchedQuestionIds` or `respondedResolves`, `answered_gaps` is not promoted from the submitted answer, and `latestQuestions()` can fall back to a prior turn. Exact question/text deduplication exists, but semantic repeat protection does not.

The evidence is documented in:

`docs/implementation/portfolio-entry-active-question-loop-audit-v0.1.md`

This ADR closes the product/runtime boundary for active-question cardinality and answer resolution. It does not redefine Portfolio Entry purpose, Core, Steps, Portfolio Home, canonical initiatives, Portfolio Bootstrap, permissions, auth or provenance authority.

## 2. Problem

The current behavior can make one textbox appear to ask a question that was already answered. A planner batch may contain several questions, while the UI chooses `questions[0]`. A later turn with no new questions can cause the UI to walk backward and show an old question. At the same time, the normal frontend answer does not identify which question it answered, and the runtime does not derive `answered_gaps` from that answer.

This permits:

- multiple user-facing questions competing for one response;
- budget consumption without equivalent sequential user interactions;
- a question being answered without a durable answer identity;
- a gap being treated as unresolved even after a usable answer;
- “No lo sé todavía” being indistinguishable from an unanswered request at the resolution layer;
- semantic re-emission of a materially equivalent question with a new ID;
- apparent loops and delayed or absent sufficiency checkpoints.

## 3. Decision

### 3.1 Active-question cardinality

During `quick_clarification`, the runtime may internally identify multiple material gaps, but it may expose at most one user-facing question per turn:

```text
maximum emitted user-facing questions per Quick Clarification turn = 1
```

The selected question is the highest-priority material question after deterministic eligibility checks. Other gaps remain internal unresolved context and may be considered on the next reevaluation; they do not become simultaneous UI questions.

### 3.2 Question response identity

Every clarification answer associated with an active question must identify that question through the existing canonical field:

```text
matchedQuestionIds: string[]
```

For Quick Clarification, the valid cardinality for an answer is `0..1`:

- `0`: no active question was presented, or the message is a free-form continuation that is not being attributed to a question;
- `1`: the single active question being answered;
- more than `1`: invalid for the Quick Clarification interaction and must not be inferred or accepted as a multi-answer response.

The frontend must submit the active question ID when the user responds to an active question. The backend remains authoritative and must validate that the ID refers to an outstanding question in the session; client-provided IDs do not grant resolution by themselves.

### 3.3 Question answered versus gap resolved

These are distinct concepts:

```text
QUESTION_ANSWERED != GAP_RESOLVED
```

`QUESTION_ANSWERED` means the user response has been attributed to the active question, including an explicit uncertainty response.

`GAP_RESOLVED` means the response contains usable support for one or more `question.resolves` targets according to the resolution policy. The system must not infer resolution merely because non-empty text was submitted.

For:

```text
No lo sé todavía
```

the question is answered and must not be shown again, while its gap remains unresolved.

### 3.4 `respondedResolves` and `answered_gaps`

The canonical meanings are:

- `matchedQuestionIds`: question identity answered by the current message; normally zero or one in Quick Clarification.
- `respondedResolves`: the subset of the matched question's `resolves` targets for which the current response is usable enough to support resolution. It is turn-level evidence, not a claim that every text response resolves the gap.
- `answered_gaps`: the session-level set of canonical gap keys that have been resolved by usable responses. It contains resolved gaps only, not merely responded-to gaps and not unknown/uncertain gaps.

Resolution processing must therefore follow:

```text
active question
  + matchedQuestionIds[0]
  + response classification
  -> respondedResolves (possibly empty)
  -> answered_gaps := prior answered_gaps ∪ validated respondedResolves
```

An explicit unknown/insufficient response produces:

```text
matchedQuestionIds = [activeQuestion.id]
respondedResolves = []
answered_gaps unchanged
question marked answered / retired
```

The resulting `answered_gaps` and question-answer evidence must survive persistence and be available through `contextFromSession()` on the next request. No new ActiveQuestion database model is required by this decision.

### 3.5 Previous-question protection

A previously presented question must never become active again. Deterministic protection must be applied in this order where data is available:

1. same question ID;
2. overlapping `resolves` target where the target remains materially equivalent;
3. materially equivalent semantic wording, using a conservative deterministic strategy where feasible;
4. prompt guidance as an additional model behavior aid, never as the sole protection.

An answered question is retired even when its gap remains unresolved. The unresolved gap may be addressed by a different question that is materially distinct and does not simply reformulate the retired question to pursue the same missing answer.

### 3.6 Frontend active-question rule

The frontend must derive an active question only from the current/latest persisted turn that represents an outstanding question. It must not walk backward through conversation history to find a non-empty question batch.

If the newest state has no active question:

- render no old question as active;
- render the appropriate checkpoint, loading, empty or next-action state;
- keep prior exchanges available through `Ver conversación`.

Conversation history and active-question state are separate concerns.

### 3.7 Quick question budget

```text
quickQuestionsAsked = number of user-facing clarification questions actually presented
maximum = 3
```

One model turn cannot consume multiple Quick Clarification slots. Internal gap discovery and discarded lower-priority planner candidates do not consume the budget. A question counts when it becomes the active user-facing question for the persisted turn.

The budget may stop Quick Clarification before three questions. It must never require exactly three questions before sufficiency.

### 3.8 Convergence

After processing each answer, Quick Clarification must converge to exactly one of:

```text
A. one new materially different active question
B. exploration_offered / sufficiency checkpoint
C. technical or safety stop
```

It must not remain in an indefinite state where an answered question is active again. If no new question can be emitted and context is not sufficient, the session must use the explicit checkpoint/uncertainty path defined by the existing clarification contract rather than silently falling back to an old question.

### 3.9 Sufficiency checkpoint

The existing product checkpoint is preserved:

```text
Ya tengo suficiente claridad para proponerte un primer abordaje
```

Primary action:

```text
Ver mi propuesta de abordaje
  -> provisional_route
  -> ready_for_handoff
```

Secondary action:

```text
Seguir aterrizando mi necesidad
  -> guided_exploration
```

The checkpoint may appear after 0, 1, 2 or 3 user-facing questions. It does not require budget exhaustion or exactly three questions.

### 3.10 Boundaries

This decision does not redefine:

- Portfolio Entry purpose;
- Starteria Core;
- Steps or Adaptive Core;
- Portfolio Home;
- canonical Organization, StrategicFront, Challenge, Initiative, Project, Evidence or Decision objects;
- Portfolio Bootstrap;
- permissions or auth;
- provenance authority.

No canonical object is created by clarification or answer resolution.

## 4. Invariants

The following invariants are normative:

1. Quick Clarification exposes at most one user-facing question per turn.
2. The planner may identify multiple gaps internally, but only one can become active.
3. A Quick Clarification answer maps to zero or one `matchedQuestionIds`, never multiple.
4. A presented question is never reactivated after its turn, including after an unknown response.
5. `QUESTION_ANSWERED` and `GAP_RESOLVED` are separate states.
6. `respondedResolves` may be empty for a valid answered question.
7. `answered_gaps` contains resolved gap keys only.
8. `answered_gaps` is monotonic within a session except for an explicitly versioned correction/retraction path; this ADR introduces no silent removal.
9. `previous_questions` and answer evidence survive persistence and session reconstruction.
10. A zero-question latest turn never causes an older question to render as active.
11. `quickQuestionsAsked` counts presented user-facing questions, not planner candidates, model turns or responses.
12. Quick Clarification never exceeds three presented questions.
13. After an answer, the flow converges to a different active question, checkpoint, or technical/safety stop.
14. The checkpoint is permitted before the budget is exhausted.
15. Guided Exploration remains explicit opt-in.

## 5. State semantics

The minimum semantic distinction is:

| Concept | Meaning | Persistence location |
|---|---|---|
| Presented question | Question exposed to the user | `previous_questions`, turn `emittedQuestions` |
| Active question | The one outstanding question in the latest question-bearing turn | Derived from latest persisted turn; no new DB model required |
| Answered question | Active question identified by `matchedQuestionIds` in a later answer turn | Turn `matchedQuestionIds`; derivable across turns |
| Responded resolve | Resolve target supported by the answer classification | Turn `respondedResolves` |
| Resolved gap | Canonical gap already sufficiently answered | Session `semanticState.answeredGaps` / runtime `answered_gaps` |
| Unresolved gap | Gap still material and not in `answered_gaps` | Runtime/session unresolved context; not an answered gap |
| Unknown answer | Question answered, no supported resolution | Matched ID plus empty `respondedResolves`; `answered_gaps` unchanged |

The active question is a projection, not a new aggregate. If the projection cannot identify one outstanding question from the latest persisted turn, the safe result is “no active question,” not a historical fallback.

## 6. Answer-resolution semantics

The answer resolver must:

1. read the latest outstanding question;
2. validate `matchedQuestionIds` has cardinality 0 or 1;
3. reject a non-outstanding or historical ID as a match;
4. classify the response as usable, partial/uncertain, or unknown;
5. mark the matched question answered/retired in turn evidence;
6. emit only the supported subset of `question.resolves` as `respondedResolves`;
7. union only validated resolved targets into `answered_gaps`;
8. pass the resulting state to the next planner call.

No model or backend component may claim that a gap is resolved solely because:

- a message is non-empty;
- the user selected a submit button;
- a question ID was supplied without a usable answer;
- the model inferred a fact not supported by the response/provenance rules.

The exact classifier/threshold remains an implementation detail to be specified in the implementation slice, but its outputs must preserve the semantics above.

## 7. Budget semantics

The existing wire field names remain usable. The runtime semantics change as follows:

```text
planner candidates       -> not budget-consuming
discarded lower gaps     -> not budget-consuming
active presented question -> consumes 1
user response            -> does not consume another slot
checkpoint               -> consumes 0 slots
```

`quickQuestionsAsked` is therefore a count of user-facing question presentations. A model turn emitting a planner array of three candidates must be normalized to one active question before persistence and budget consumption.

## 8. Convergence rules

The controller must enforce:

- at most one normalized emitted question in Quick Clarification;
- no reactivation of the latest answered question;
- no semantic equivalent of a retired question when the same material gap is still unresolved;
- a checkpoint when sufficient context exists, even if the count is 0, 1 or 2;
- a technical/safety stop when convergence cannot be safely established;
- no silent automatic transition into Guided Exploration.

`sufficient_context` remains a valid planner stop signal. Budget exhaustion remains a valid reason to offer the checkpoint, but is not the only checkpoint trigger.

## 9. Frontend rendering rule

`PortfolioEntryExperience` must use the latest persisted turn as the sole source for the active question. It must not search backward through prior turns. The active panel must:

- render one question at most;
- send that question's ID in `matchedQuestionIds` for its answer;
- never send multiple IDs for a single textbox answer;
- render no old question when the newest turn has zero emitted questions;
- preserve `Ver conversación` as the historical trace;
- render `offer_guided_exploration` and its two checkpoint choices from the authoritative DTO action.

## 10. Compatibility

### 10.1 Wire/schema compatibility

The existing `questions[]` shape may remain for backward compatibility. No new ActiveQuestion database model or breaking replacement of `questions[]` is required.

The compatibility rule is:

```text
questions[] remains a transport/planner collection
runtime user-facing cardinality is normalized to <= 1 in Quick Clarification
```

The schema may continue to accept up to three legacy planner candidates during a staged migration, provided the runtime never persists or exposes more than one user-facing question in a new Quick Clarification turn. A later schema tightening to `maxItems: 1` may be introduced after all producers are migrated, but it is not required for the first compatible implementation.

### 10.2 Existing sessions

Existing sessions may contain multi-question turns. The new frontend must:

- choose no more than one outstanding question from the latest eligible turn;
- avoid reviving a historical batch after a newer zero-question turn;
- treat ambiguous legacy batches conservatively;
- send at most one match for a new answer.

The implementation slice must define how legacy multi-question turns are retired or selected without inventing that the user answered all questions.

### 10.3 Existing API fields

`matchedQuestionIds` and `respondedResolves` already exist in the request/persistence shapes. Their semantics and cardinality are tightened; no new endpoint is required. The server remains authoritative for validation and resolution.

## 11. Consequences

### Positive

- One textbox has one unambiguous question target.
- A question can be answered without implying its gap was resolved.
- “No lo sé todavía” preserves uncertainty without creating a repeat loop.
- Budget reflects user-facing interaction, not hidden planner batching.
- The frontend cannot render a historical question as current.
- Checkpoint behavior becomes reachable after sufficient context, not only after three questions.
- Existing conversation trace and persistence structures remain reusable.

### Costs and risks

- Runtime must normalize planner batches and define deterministic answer resolution.
- Existing tests that expect three emitted questions in one turn must be adapted.
- Legacy sessions with multi-question batches need conservative projection rules.
- Semantic deduplication is inherently imperfect and needs a safe deterministic boundary.
- The DTO may need a clearer active/answered projection even without a new database model.

## 12. Rejected alternatives

### 12.1 Keep three simultaneous questions and let the user answer one

Rejected. It violates the one-textbox target and makes identity/resolution ambiguous.

### 12.2 Rely on prompt wording alone to prevent repeats

Rejected. The audit confirmed exact ID/text protection but no deterministic semantic protection.

### 12.3 Walk backward to the latest non-empty question batch

Rejected. This is the confirmed stale-question rendering defect.

### 12.4 Treat every submitted response as resolving every `resolves` target

Rejected. It would incorrectly resolve gaps, especially for “No lo sé todavía” and partial answers.

### 12.5 Add a new ActiveQuestion database aggregate immediately

Rejected for the initial migration. Existing turns, `previous_questions`, `matchedQuestionIds` and semantic state can support the decision without a new model. Introduce a new model only if implementation evidence proves the projection cannot be made deterministic.

### 12.6 Require exactly three questions before checkpoint

Rejected. The existing product target allows sufficiency after 0, 1, 2 or 3 questions.

## 13. Implementation impact

| Surface | Classification | Impact |
|---|---|---|
| `entry-04-question-planner` | ADAPT | Keep internal multi-gap reasoning, but instruct/normalize one Quick Clarification user-facing output and distinct follow-up behavior. |
| Question plan schema | ADAPT | Preserve `questions[]` wire shape for compatibility; add runtime cardinality validation. Optional later `maxItems: 1` tightening. |
| Question budget | ADAPT | Consume one slot per presented active question, never planner batch size. |
| Session controller | FIX | Normalize output, process answer identity/resolution before reevaluation, enforce convergence and technical stop. |
| `SessionContext` | ADAPT | Preserve `previous_questions` and `answered_gaps`; add explicit answer/retirement projection only if needed by implementation, without a new DB model by default. |
| `answered_gaps` | FIX | Define as resolved gaps only and merge validated `respondedResolves` across turns. |
| `previous_questions` | ADAPT | Keep persistence; extend protection to resolve-level/material equivalence and answered-question retirement. |
| Persisted turns | ADAPT | Continue storing `emittedQuestions`, `matchedQuestionIds`, `respondedResolves`; ensure answer evidence and semantic state are consistent. |
| DTO | ADAPT | Preserve conversation trace; expose enough latest-turn/active state to avoid historical fallback. |
| `PortfolioEntryExperience` | FIX | Remove backward fallback, render only latest outstanding question, send active ID/resolves, render zero-question/checkpoint state. |
| `submitPortfolioEntryMessage` | ADAPT | Use existing fields; constrain Quick Clarification match cardinality to 0..1 and preserve compatibility for initial/free-form messages. |
| Tests | NEW / ADAPT | Add the required unit, integration, frontend and E2E coverage below; update tests that encode three simultaneous questions. |
| E2E | NEW | Verify sequential interaction, answer identity, unknown answer, checkpoint-before-three and no stale rendering. |
| Portfolio Entry purpose | NO CHANGE | Explicitly outside this ADR. |
| Core, Steps, Portfolio Home, canonical objects | NO CHANGE | Explicitly outside this ADR. |
| Permissions, auth, provenance authority | NO CHANGE | Explicitly outside this ADR. |

## 14. Required tests

At minimum:

1. Planner/runtime never exposes more than one user-facing Quick Clarification question per turn.
2. A single answer maps to the active question ID.
3. A question answered with a usable response cannot reappear.
4. “No lo sé todavía” marks the question answered but does not resolve its gap and does not repeat the same question.
5. An unresolved gap can remain unresolved while a different material question is selected.
6. `answered_gaps` persists correctly across append, read and next-request reconstruction.
7. `previous_questions` persists and protects by ID.
8. Resolve-level protection prevents a materially equivalent repeat where feasible.
9. A latest turn with zero questions does not render a stale prior question.
10. Quick Clarification permits at most three sequential user-facing questions.
11. Sufficient context after 1 question offers the checkpoint.
12. Sufficient context after 2 questions offers the checkpoint.
13. Sufficient context after 3 questions offers the checkpoint.
14. Provisional route reaches `ready_for_handoff`.
15. Guided Exploration remains opt-in.
16. A semantically repeated question is rejected, suppressed or replaced by a different material question.
17. A malformed multi-ID Quick Clarification answer is rejected or safely reduced to no match; it must never resolve multiple questions.
18. A legacy multi-question persisted turn does not cause multiple active UI questions.

## 15. Migration plan

1. Approve this ADR and record its status as `ACCEPTED` only through the repository's product governance process.
2. Freeze the target semantics in the applicable Portfolio Entry clarification/agent/skill contracts or their next approved versions.
3. Implement answer identity and resolution semantics using the existing request and turn fields; do not add an ActiveQuestion model initially.
4. Add server-side normalization/validation for one active Quick Clarification question and one match.
5. Update budget accounting to count presented questions only.
6. Update persistence/reconstruction so `answered_gaps` is the resolved-gap projection and survives requests.
7. Add deterministic repeat protection beyond exact ID/text where safe.
8. Update frontend active-question derivation and request payload.
9. Run unit, integration, frontend and E2E tests listed above.
10. Audit legacy multi-question sessions and document the compatibility projection before rollout.
11. Promote implementation/evidence status only after the approved validation gate; implementation does not itself change authority status.

## 16. Rollback considerations

Rollback must preserve persisted evidence and avoid reactivating retired questions:

- Keep existing turn records, `matchedQuestionIds`, `respondedResolves` and `answered_gaps` intact.
- Roll back code behind a versioned runtime/feature flag if necessary, not by deleting or rewriting history.
- Do not restore the frontend backward question fallback; it is independently unsafe.
- If answer-resolution classification is rolled back, preserve the last validated `answered_gaps` projection and mark subsequent resolution state as requiring reconciliation rather than silently clearing it.
- If legacy planner output is temporarily restored, continue applying the one-question user-facing normalization at the boundary.
- Re-run stale-question, persistence and convergence regressions before any broader rollback exposure.

## Decision status

```text
STATUS: ACCEPTED
IMPLEMENTATION AUTHORIZED: NO
RUNTIME CHANGED: NO
PRODUCT TARGET CHANGED: NO
```

## Acceptance record

Accepted on 2026-09-19 after final consistency review against the canonical Portfolio Entry Experience Contract, the current authority map and the factual Core Contract state. No conflict was found: this decision is subordinate to Core, does not modify Core or Steps, preserves `questions[]` for compatibility, and introduces no persistence model or breaking schema change.
