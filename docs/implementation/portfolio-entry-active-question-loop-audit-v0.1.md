# Portfolio Entry — Active Question / Answer Resolution / Checkpoint Loop Audit v0.1

**Execution mode:** AUDIT ONLY. No runtime, frontend, backend, schema, test, branch, commit or push change was made for this audit.

**Observed baseline:** `7b82f14cfa4bbfe886b53de55dba932ff5ef79b0` (`origin/main` points to the same commit). The worktree already contained unrelated documentary changes before this audit; they were preserved.

**Authority reconciliation update (2026-09-19):** the v0.1 Logic Contract canonical path is now reconciled to `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`; the prior `docs/experience/...` mismatch below is retained as audit evidence only.

## 1. Executive summary

The observed loop has more than one contributing defect:

1. **Multiple questions per turn are allowed and exercised by the current runtime.** The planner/provider schema accepts 0–3 questions, the budget consumes every emitted question, persistence stores the whole batch, and the API/DTO exposes the batch. Existing tests explicitly expect three questions in one initial turn. This is incompatible with the stated product target of one user-facing active question with one textbox.
2. **The frontend has a confirmed stale-question rendering path.** `latestQuestions()` searches backward until it finds any non-empty `emittedQuestions` array. When the latest persisted turn has zero questions, the UI can display the previous turn's question again. `ConversationTrace` correctly shows all persisted questions, but `ConversationPanel` uses only `questions[0]`.
3. **Answer matching is not wired from the active-question UI.** `submitAnswer()` sends only revision, idempotency key and message. It does not send `matchedQuestionIds` or `respondedResolves`; the backend consequently persists empty arrays for normal frontend answers. The backend accepts those fields and stores them per turn when explicitly supplied, but does not promote `respondedResolves` into `answered_gaps`.
4. **`answered_gaps` is structurally persisted but functionally not resolved by answer submission.** It is passed into and reconstructed from runtime context, but the inspected flow has no write that derives it from the submitted answer or from `respondedResolves`. The model therefore normally receives `answered_gaps: []`.
5. **`previous_questions` is persisted and rehydrated correctly for exact/id deduplication.** The deterministic guard rejects the same ID or normalized identical text. There is no semantic deduplication, so a materially equivalent rewording with a new ID can pass. The prompt rule is the only protection for that semantic case.
6. **Checkpoint transition logic exists, but it is conditional on the planner returning a recognized stop signal or on budget/zero-emission conditions.** A repeated question can keep the session in `in_progress`; a zero-question `questions_required` quick turn transitions to `exploration_offered`, while a `sufficient_context` result does the same. Without production/live trace data, the exact manual turn that failed to expose the checkpoint is not uniquely reconstructable.

The strongest root-cause chain is therefore: **multi-question emission + no active-question identity/answer metadata in the frontend + no answered-gap promotion + semantic-repeat gap + stale fallback rendering**.

## 2. Authority reviewed

Reviewed in the requested order, with actual repository paths where the requested path was absent:

- `CURRENT_STATE.md`
- `STARTERIA_V2_MANIFEST.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` — **missing in this checkout**; the repository's current-state document identifies `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` as the factual Core authority.
- At audit time, `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` was missing; reconciliation now uses the physical canonical file at `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_VALUE_HANDOFF_TARGET_v0.1.md`
- `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
- `docs/agents/portfolio-entry/skills/entry-04-question-planner/SKILL_v0.2.md`
- `backend/modules/portfolio-entry-runtime/prompts/v0.2/entry-04-question-planner.md`
- `docs/implementation/portfolio-entry-clarity-checkpoint-visual-handoff-v0.1.md`

The governing documents currently allow a Quick Clarification budget of three questions, but do not establish a deterministic one-question-per-turn rule. The target in this audit is stricter and must not be redefined to fit the implementation.

## 3. Manual scenario

The reported sequence is treated as evidence from manual testing, not as a persisted production trace:

- Initial input: five audit-discovered internal challenges, with uncertainty about the first step.
- Q1: audit severity/risk/impact/deadline.
- Q2: list the five challenges, consequences and dependencies.
- Q3: identify the most urgent consequence.
- User answers Q3 with the delivery-claims rationale.
- The same or semantically equivalent Q3 appears again.
- The checkpoint is not visible.

The exact runtime payloads, question IDs, turn revisions, model stop reasons and persisted DTOs from that manual session are unavailable. The audit distinguishes observed, inferred and unknown values below.

## 4. Current question emission model

### Planner, schema and adapter

`entry-04-question-planner.md` says “Return 0 to 3 questions for the current turn.” Both runtime schemas enforce a maximum of three, not one:

- `backend/modules/portfolio-entry-runtime/domain/analysis.schema.ts:90-92`
- `backend/modules/portfolio-entry-runtime/model/provider-json-schemas.ts:156-158`

The live adapter sends the model the complete `sessionContext` and an `available_question_budget`, but does not add a one-question constraint:

- `backend/modules/portfolio-entry-runtime/agent/live-portfolio-entry-agent-adapter.ts:38-48`

### Budget application and persistence

`applyQuestionBudget()` filters exact duplicate IDs or normalized identical text, slices the result to the available budget, and maps every remaining planner question to a persisted `QuestionRecord`:

- `backend/modules/portfolio-entry-runtime/session/question-budget.ts:11-41`

`consumeQuestionBudget()` increments `quick_questions_asked` by `emitted_question_count`, not by turn or answer:

- `backend/modules/portfolio-entry-runtime/session/question-budget.ts:46-60`

The controller appends all emitted records to `previous_questions`, and the session service persists the runtime turn's complete `questions_asked` array as `emittedQuestions`:

- `backend/modules/portfolio-entry-runtime/session/session-controller.ts:82-89`
- `backend/modules/portfolio-entry-sessions/application/portfolio-entry-session.service.ts:245-255`

The DTO returns all persisted questions in each conversation turn:

- `backend/modules/portfolio-entry/portfolio-entry.dto.ts:86-100`

### Answers to the requested emission questions

1. **Can the planner emit 2 or 3 questions in one turn?** Yes.
2. **Does the schema permit it?** Yes, 0–3.
3. **Does runtime persist all?** Yes, the whole post-budget batch is persisted.
4. **Does budget consume each emitted question?** Yes. A batch of 3 consumes 3.
5. **Was Quick Clarification contractually designed for simultaneous questions?** The current contracts define a phase budget of up to 3 and a planner output of 0–3; they do not define a user-facing one-at-a-time interaction. The current technical behavior is therefore permitted, while the requested target is stricter.
6. **Is there a one-question user-facing guard?** No.
7. **Impact of changing to one emitted question per turn:** planner output/schema contract, budget application, controller transition behavior, DTO/UI semantics, and tests would all need coordinated adaptation. It would not by itself repair answer matching, semantic deduplication or stale fallback.

### Current map

```text
question_plan.questions[]
  -> applyQuestionBudget()
  -> emitted_questions[] / QuestionRecord[]
  -> consumeQuestionBudget(count)
  -> runtimeTurn.questions_asked
  -> appendTurn().emittedQuestions
  -> DTO conversation[].emittedQuestions
  -> ConversationTrace maps all; ConversationPanel selects [0]
```

## 5. Frontend active-question model

`latestQuestions()` walks backward from the last conversation turn and returns the first non-empty `emittedQuestions` batch:

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx:106-113`

`ConversationTrace` renders every question in every turn:

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx:160-181`

`ConversationPanel` calls `latestQuestions()` and selects only `questions[0]`:

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx:440-441`

Consequences:

1. The trace shows all questions from a multi-question batch.
2. The visible panel shows only the first question in that batch.
3. If the latest turn has no emitted questions, `latestQuestions()` falls back to an older batch.
4. The UI therefore has a confirmed stale-question rendering path.
5. The UI does not mark a question as answered from the persisted turn metadata before selecting it.
6. There is no persisted `activeQuestionId` in the DTO/session model. The active question is inferred from the fallback batch, which is incorrect when a new turn emits zero questions.
7. A persisted checkpoint is normally rendered through `nextAction === 'offer_guided_exploration'` before `ConversationPanel`; therefore stale question rendering alone should not hide a correctly mapped checkpoint. It can, however, hide an intermediate zero-question state when the backend remains `answer_clarification`/`in_progress`.

**Determination:** `STALE QUESTION RENDERING BUG = CONFIRMED` as a code-path defect. Whether it was the sole cause in the manual run is unknown.

## 6. Answer matching

### Actual request path

```text
activeQuestion = latestQuestions(session)[0]
  -> user types answer
  -> submitAnswer()
  -> submitPortfolioEntryMessage({ expectedRevision, idempotencyKey, message })
  -> POST /messages body without matchedQuestionIds/respondedResolves
  -> submitMessageBodySchema accepts optional fields
  -> service forwards undefined fields
  -> appendTurn stores [] / []
```

Evidence:

- `submitAnswer()` does not include either field: `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx:1195-1206`.
- The service forwards optional body fields: `backend/modules/portfolio-entry/application/portfolio-entry-experimental-session.service.ts:117-122`.
- The request schema permits both fields but does not require them: `backend/modules/portfolio-entry/portfolio-entry.schemas.ts:12-19`.
- The service defaults absent values to empty arrays when building the persisted turn: `backend/modules/portfolio-entry-sessions/application/portfolio-entry-session.service.ts:249-251`.

Answers to the requested matching questions:

1. **What IDs does the frontend send?** None in the active answer path.
2. **Only `activeQuestion.id`?** No.
3. **All IDs in the batch?** No.
4. **How is `respondedResolves` calculated?** It is not calculated in the frontend active-answer path.
5. **If backend emitted two and user answered one?** The normal frontend submits neither match nor resolve metadata; both remain unmarked at the persisted-turn level.
6. **Are both gaps accidentally marked?** Not by the inspected path.
7. **Are neither marked?** Yes, for normal frontend submissions.
8. **Does backend feed these into `answered_gaps`?** No. They are stored as turn metadata only; the session semantic projection is built from `runtimeContextAfter.answered_gaps`.
9. **Is information lost between requests?** The explicit per-turn fields are persisted if supplied, but the frontend never supplies them and the semantic answered-gap projection does not derive from them.

**Determination:** `matchedQuestionIds incorrect = CONFIRMED`; `respondedResolves incorrect/missing = CONFIRMED`; exact production payload values = UNKNOWN.

## 7. `answered_gaps` lifecycle

`answered_gaps` exists in `SessionContext`, is initialized empty, is carried through the persisted semantic state, and is reconstructed by `createSessionContextFromPersistedProjection()`:

- `backend/modules/portfolio-entry-runtime/domain/session.types.ts:26-37, 150-159`
- `backend/modules/portfolio-entry-runtime/session/single-turn-result.ts:4-22`
- `backend/modules/portfolio-entry-sessions/domain/portfolio-entry-session.types.ts:54-58, 131-135`
- `backend/modules/portfolio-entry/application/portfolio-entry-experimental-session.service.ts:455-464`

However, the inspected write path only derives the new semantic state from `result.final_context`; it does not merge `body.respondedResolves` or `body.matchedQuestionIds` into `answered_gaps`:

- `backend/modules/portfolio-entry-sessions/application/portfolio-entry-session.service.ts:225-238`
- `backend/modules/portfolio-entry-sessions/application/portfolio-entry-session.service.ts:249-254`

The controller also never updates `context.answered_gaps` from an incoming answer. Its only per-turn state update in this area is budget consumption and `previous_questions` append:

- `backend/modules/portfolio-entry-runtime/session/session-controller.ts:82-89`

Thus:

1. Gap writes: no answer-driven write found in the inspected production path.
2. Derivation from `respondedResolves`: no.
3. Persistence between turns: yes, as an empty or externally supplied projection.
4. Reconstruction: yes, from persisted semantic state.
5. Planner input: yes, through the full `sessionContext` payload.
6. Prompt awareness: yes, the planner skill instructs use of `answered_gaps`.
7. Can the model re-ask because state is empty? Yes.

**Determination:** `ANSWER RESOLUTION STATE BUG = CONFIRMED`.

## 8. `previous_questions` lifecycle

Every emitted question that survives budget/dedup filtering is appended to the runtime context and then persisted in `semanticState.previousQuestions`. On the next request, `contextFromSession()` passes that array back into the runtime context and live model payload.

Exact ID and exact normalized-text deduplication exists:

- `backend/modules/portfolio-entry-runtime/session/question-budget.ts:19-22, 42-44`

There is no deduplication by:

- `resolves` set;
- semantic similarity or intent;
- answer state;
- materially equivalent wording.

The “never repeat” rule is present in the planner prompt/skill, but prompt compliance is not deterministic enforcement. A new ID and a semantically equivalent wording can therefore pass the runtime filter.

**Determination:** `previous_questions correctly persisted = CONFIRMED`; `semantic repeat prevention = NOT PRESENT`; `F can be the model-side source of a repeated equivalent question = NOT SUPPORTED`; `G semantic planner repeat = LIKELY`.

## 9. Question budget semantics

`quickQuestionsAsked` represents **emitted questions**, not turns, responses or answered gaps. A multi-question turn increases it by the number emitted. Existing backend tests explicitly assert a first turn with `quickQuestionsAsked === 3` and `emittedQuestions.length === 3`:

- `backend/modules/portfolio-entry/__tests__/portfolio-entry.router.test.ts:110-114`

Therefore:

1. A turn emitting 2 increases the counter by 2.
2. A turn emitting 3 increases it by 3.
3. The UI can display “Aclaración 2 de hasta 3” after one user interaction if the runtime emitted two questions across turns or one batch followed by another answer; the count is not an interaction count.
4. The system can exhaust the limit before the user has had three sequential question-answer interactions.
5. This is consistent with the current technical contract, but inconsistent with the target contract of three sequential user-facing questions.

**Determination:** `H budget inconsistency = CONFIRMED relative to the target`; it is not an arithmetic bug in the current implementation.

## 10. Checkpoint transition

`transitionFromStructuredOutput()` handles these relevant cases:

- Quick Clarification + `stop_reason: sufficient_context` → `exploration_offered`.
- Other recognized ready stop reasons → `ready_for_handoff`.
- Quick budget overflow/zero emission under `questions_required` → `exploration_offered`.
- Guided Exploration with exhausted budget or zero emitted questions → `ended_with_uncertainty`.
- Otherwise, a question-emitting quick turn remains `in_progress`.

Evidence: `backend/modules/portfolio-entry-runtime/session/session-controller.ts:198-242` and `:295-303`.

The checkpoint UI is selected when the DTO exposes `nextAction === 'offer_guided_exploration'`; the component renders the requested “Ver mi propuesta de abordaje” and “Seguir aterrizando mi necesidad” choices:

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx:1391-1393`

Answers:

1. Planner signal needed for a Quick Clarification checkpoint: normally `status: no_questions_required` with a recognized stop reason, especially `sufficient_context`; budget exhaustion/zero emitted questions can also offer the checkpoint.
2. `questions_required` with no emitted questions: Quick mode offers checkpoint as `quick_budget_exhausted`; guided mode ends with uncertainty.
3. Budget exhausted: quick mode offers checkpoint when the overflow/zero-emission condition is met; no fourth emitted question is accepted by the budget filter.
4. `stop_reason: sufficient_context`: Quick mode transitions to `exploration_offered`, not directly to handoff.
5. Can a stale frontend question hide `exploration_offered`? Not when `nextAction` is correctly derived, because the offer branch renders first. It can hide a non-terminal zero-question/in-progress state. A DTO/status mismatch remains possible but is not supported by the inspected rendering order.
6. Can backend remain in progress on repeated answers? Yes, if the model keeps returning a new accepted question or a plan that does not trigger a ready/budget transition.
7. Semantic loop protection? No deterministic semantic-repeat or repeated-answer loop guard was found.
8. Technical cut-off? Yes: `MAX_TOTAL_USER_TURNS = 12`, `MAX_TOTAL_MODEL_CALLS = 20`, `MAX_EXPLORATION_ROUNDS = 3` in `session-safety-limits.ts`; these are safety guards, not a semantic checkpoint.
9. Why could a fourth question appear? The current budget should prevent a fourth emitted question in Quick Clarification. The apparent fourth question can be explained by the stale fallback rendering an old question, by a semantically new question passing deduplication, or by multi-question batches being perceived as sequential interactions. Exact cause for the manual run is unknown without logs.

**Determination:** checkpoint transition logic is present and has unit/integration coverage, but it does not guarantee convergence when the model semantically repeats and answer-resolution state is empty. `I checkpoint transition not reached = LIKELY`; `J checkpoint reached but stale panel hid it = NOT SUPPORTED by current render order, unless the DTO was stale/mapped incorrectly.`

## 11. Turn-by-turn trace

The following is a forensic trace. Values from the manual report are marked `INFERRED`; repository behavior is `KNOWN`; missing production payloads are `UNKNOWN`.

| Turn | userInput | emittedQuestions | question IDs | resolves | matchedQuestionIds | respondedResolves | answered_gaps before | answered_gaps after | quickQuestionsAsked | clarification_status | nextAction |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| T1 | Initial five-challenge statement (**KNOWN from scenario**) | Q1, Q2 (**INFERRED from manual report**) | **UNKNOWN** | **UNKNOWN** | N/A for initial input | N/A | `[]` (**KNOWN initial state**) | `[]` (**KNOWN: no answer merge found**) | 2 (**INFERRED if both emitted in one batch; runtime would count 2**) | `in_progress` (**INFERRED if questions emitted**) | `answer_clarification` (**INFERRED**) |
| T2 | Answer/continuation leading to prioritization (**UNKNOWN exact text**) | Q3 (**INFERRED**) | **UNKNOWN** | **UNKNOWN** | `[]` (**KNOWN for normal frontend path**) | `[]` (**KNOWN for normal frontend path**) | `[]` (**KNOWN unless non-UI caller supplied state**) | `[]` (**KNOWN from inspected state flow**) | 3 (**INFERRED; runtime counts emitted questions**) | `in_progress` (**INFERRED**) | `answer_clarification` (**INFERRED**) |
| T3 | Delivery-claims answer (**KNOWN semantically from report; exact payload UNKNOWN**) | Either repeated Q3 (**INFERRED**) or zero questions with stale UI (**POSSIBLE**) | New semantic ID or old visible ID (**UNKNOWN**) | **UNKNOWN** | `[]` (**KNOWN normal frontend path**) | `[]` (**KNOWN normal frontend path**) | `[]` (**KNOWN**) | `[]` (**KNOWN**) | If Q3 is accepted as new, budget should be exhausted; exact value **UNKNOWN** | `exploration_offered` if budget/stop branch fires; otherwise `in_progress` (**UNKNOWN**) | `offer_guided_exploration` if checkpoint persisted; otherwise `answer_clarification` (**UNKNOWN**) |
| T4 | “Ya te la respondí” (**KNOWN from report**) | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | `[]` (**KNOWN normal frontend path**) | `[]` (**KNOWN normal frontend path**) | `[]` (**KNOWN**) | `[]` (**KNOWN**) | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** |

This table cannot prove whether T3 was an actual backend repeat or a frontend stale fallback. Both paths are supported by the current code, while missing answer metadata and semantic deduplication make an actual backend repeat plausible.

## 12. Root cause classification

| Cause | Classification | Evidence / boundary |
|---|---|---|
| A. Multiple questions per turn | **CONFIRMED** | Schema max 3, budget consumes count, persistence stores batch, tests expect 3. Contributing cause relative to target. |
| B. Frontend stale `latestQuestions()` | **CONFIRMED** | Backward fallback returns prior non-empty batch after a zero-question latest turn. |
| C. `matchedQuestionIds` incorrect | **CONFIRMED** | Active frontend answer submits none. |
| D. `respondedResolves` incorrect | **CONFIRMED** | Active frontend answer submits none; persisted default is `[]`. |
| E. `answered_gaps` not persisted | **NOT SUPPORTED** as a serialization failure; **CONFIRMED** as an answer-resolution failure | The field is persisted/rehydrated, but no inspected path promotes submitted resolve metadata into it. |
| F. `previous_questions` not persisted | **NOT SUPPORTED** | Runtime append, semantic projection, DTO and rehydration all preserve it. |
| G. Planner semantically repeats question | **LIKELY** | Prompt prohibits repeats, but deterministic enforcement only checks ID/exact normalized text. |
| H. Budget inconsistency | **CONFIRMED** relative to target | Counter is emitted-question count, not sequential user-facing interactions. |
| I. Checkpoint transition not reached | **LIKELY** | Empty answer-resolution state and repeat/question-required outputs can keep controller in progress; exact stop output unavailable. |
| J. Checkpoint reached but frontend renders stale panel | **NOT SUPPORTED** by current branch order | Correct `offer_guided_exploration` renders before `ConversationPanel`; requires a stale/mismapped DTO to occur. |

## 13. Target contract recommendation

The target should be hardened to:

- maximum 1 emitted user-facing question per Quick Clarification turn;
- maximum 3 user-facing questions total;
- one answer resolves only the active question's `resolves`;
- a new persisted turn retires the prior active question;
- a zero-question turn never falls back visually to an old question;
- after an answer, emit one materially different question or offer checkpoint;
- “No lo sé todavía” preserves uncertainty and does not re-emit the same question;
- Guided Exploration remains explicit opt-in.

This requires coordinated adaptation, not a prompt-only change:

| Surface | Required evaluation |
|---|---|
| Planner prompt | State one-question output for Quick Clarification and preserve stop behavior. |
| Schemas | Enforce `questions.max(1)` for the relevant mode, or introduce a mode-specific normalized output contract. |
| Budget | Count emitted user-facing questions; prevent batch/turn ambiguity. |
| Session controller | Derive/accept answer resolution before next planning; guarantee zero-question checkpoint semantics. |
| Persistence | Persist active/answered relation, or define a deterministic derivation from the latest turn and response metadata. |
| DTO | Expose enough state for active question and answered status, or make derivation unambiguous. |
| Frontend | Send active question ID and resolves; render only the latest turn's questions; render zero-question state/checkpoint explicitly. |
| Tests | Add sequential single-question, answer mapping, semantic dedup, zero-question no-fallback and checkpoint tests. |

This is a behavior-contract change, not merely a visual fix. **ADR required: YES**, unless an existing approved product ADR explicitly authorizes this tightening. The audit found no such authorization in the reviewed slice documents.

## 14. KEEP / ADAPT / FIX matrix

| Area | Treatment | Rationale |
|---|---|---|
| Existing planner fields (`id`, `resolves`, reason, priority) | KEEP | Needed for resolution and traceability. |
| `previous_questions` persistence and DTO trace | KEEP | Current lifecycle is useful and largely correct. |
| Exact ID/text dedup | KEEP as baseline | Retain as a cheap guard, but do not treat it as semantic protection. |
| 0–3 simultaneous Quick questions | ADAPT | Normalize to one active user-facing question per turn. |
| `quickQuestionsAsked` emitted-count arithmetic | ADAPT | Preserve total-question semantics while making UI sequence explicit. |
| Frontend `latestQuestions()` backward fallback | FIX | It creates confirmed stale rendering. |
| Frontend answer request | FIX | Include active ID/resolves or a server-derived active-question contract. |
| `answered_gaps` projection | FIX | Define and implement deterministic promotion from accepted answer metadata. |
| Semantic repeat protection | FIX | Add deterministic relation-based/text-similarity or canonical gap enforcement; prompt-only protection is insufficient. |
| Checkpoint transition branches | KEEP / ADAPT | Preserve explicit checkpoint, but make zero-question and loop cases deterministic. |
| Safety limits | KEEP | Retain as backstop, not as user-facing convergence logic. |

## 15. Test gaps

### Covered today

- Planner/provider schema supports and validates question batches up to three.
- Runtime budget counts emitted questions and prevents a fourth emitted question after budget exhaustion.
- Exact repeated question ID/text is filtered.
- `previous_questions` is part of session context and persistence tests.
- Controller offers `exploration_offered` for `sufficient_context`.
- Guided Exploration choices and provisional-route transition are covered.
- Conversation trace renders persisted turns and internal metadata is not shown.
- Existing router test demonstrates three questions in one turn and explicit manual matching fields.

### Missing or insufficient

- No frontend test asserts that `submitAnswer()` sends the active question ID and resolves.
- Existing frontend test explicitly protects the absence of `respondedResolves`, which encodes the current defect rather than the target behavior.
- No `latestQuestions()` test for a latest zero-question turn proving no stale fallback.
- No test for zero-question `questions_required` followed by correct checkpoint visibility at the UI boundary.
- No semantic-equivalence repeat test using a new ID and reworded question.
- No test that one answer resolves only one active question when a legacy/malformed batch contains multiple questions.
- No test that `respondedResolves` promotes to `answered_gaps` and survives the next request.
- No test for “No lo sé todavía” preserving uncertainty without repeat.
- No test for a checkpoint after fewer than three sequential questions.
- No end-to-end test asserting the product target: one visible question, one textbox, one answer, then a different question or checkpoint.

The single regression test most likely to have detected the reported issue is:

> Submit a turn with one emitted question; submit an answer with that question's ID/resolves; have the next backend turn emit zero questions and `exploration_offered`; assert the request metadata, `answeredGaps`, `nextAction`, and that the UI displays the checkpoint and never the prior question.

## 16. Implementation slices

Diagnostic sequencing only; no implementation was performed:

1. **IA-01 — Active-question contract and answer metadata:** define the authoritative active question, request/DTO fields, and one-answer-to-one-resolve semantics.
2. **IA-02 — Single-question Quick Clarification:** constrain planner/runtime/persistence/UI to one user-facing question per turn and preserve total budget semantics.
3. **IA-03 — Answered-gap lifecycle:** deterministically validate and promote answered resolves into `answered_gaps`; feed the projection into the next planner call.
4. **IA-04 — Repeat prevention:** enforce ID, exact text, resolve-level and semantic-equivalence protections with a clear policy for ambiguity.
5. **IA-05 — Frontend active-question rendering:** remove backward fallback, handle zero-question turns, render checkpoint based on authoritative next action, and send active matching metadata.
6. **IA-06 — Regression/E2E evidence:** cover single-question sequencing, “No lo sé todavía,” semantic repeats, budget, checkpoint-before-three, persistence and stale-render prevention.

Recommended order: IA-01 → IA-03 → IA-02 → IA-04 → IA-05 → IA-06, with contract/ADR approval before code changes.

## 17. ADR required

**YES.** The proposed max-one-question-per-turn behavior changes the current Quick Clarification contract and the semantics of answer resolution. It should be recorded as an approved product decision before implementation.

## 18. Safe to implement

**NO — not from this audit alone.** The cause is mapped sufficiently to plan implementation, but the target-contract change, active-answer state semantics and ADR are not yet approved. PH-1/runtime implementation should not start under this audit-only result.

### Audit conclusion

```text
MULTIPLE QUESTIONS TODAY: YES
STALE QUESTION RENDERING: CONFIRMED
ANSWERED_GAPS CORRECTLY RESOLVED FROM FRONTEND ANSWERS: NO
PREVIOUS_QUESTIONS PERSISTED: YES
CHECKPOINT LOGIC PRESENT: YES
CHECKPOINT CONVERGENCE GUARANTEED: NO
TARGET SHOULD BE MAX 1 QUESTION PER TURN: YES
ADR REQUIRED: YES
SAFE TO IMPLEMENT: NO
```
