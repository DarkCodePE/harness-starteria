# Strategic Framing Traceability Matrix v0.1

**Estado:** `APPROVED TRACEABILITY BASELINE` — `TBD` significa que no existe todavÃ­a una implementaciÃ³n o test verificado.

| Scenario ID | Contract rule | Expected state | UI capability | Application/domain capability | Acceptance test | Implementation slice |
|---|---|---|---|---|---|---|
| SF-MM-01 | Adaptive depth; no forced lenses; human promotion | Sufficient light framing; proposed Challenge | Direct editable workspace and sufficiency | TBD | Expert/direct no unnecessary path | SF-3, SF-6 |
| SF-MM-02 | Minimum relevant lenses; uncertainty remains visible | Observations/gaps with open uncertainty | Lens suggestions and observation states | TBD | Clear outcome / uncertain causes | SF-2, SF-4, SF-5 |
| SF-MM-03 | Reverse alignment is possible; human confirms Front | Candidate Front proposals and provenance | Portfolio-first grouping/alignment | TBD | Reverse alignment remains advisory | SF-2, SF-3, SF-7 |
| SF-MM-04 | Capacity-aware prioritization; gaps may remain observable | One prioritized candidate; other gaps observed | Focus recommendation and gap states | TBD | Limited capacity does not create one Challenge per gap | SF-5, SF-6 |
| SF-MM-05 | Adaptive DEEP; multiple relevant lenses/Challenges allowed | Complex Front with visible coverage and dependencies | Layered workspace and coverage | TBD | Corporate complexity without fixed completeness | SF-3, SF-4, SF-5, SF-6 |
| SF-MM-06 | Direct path is complete; structured state is record | Complete structured framing without chat | Full non-chat controls | TBD | No Copilot path completes framing | SF-3, SF-8 |
| SF-MM-07 | Specialized perspectives can activate adaptively | Specialized observation contribution | Specialized lens suggestion/control | TBD | Specialized perspective does not auto-create Challenge | SF-4, SF-5 |

**Status:** `APPROVED TRACEABILITY BASELINE`
**Human approval:** 2026-09-24
Application/domain capabilities and tests marked `TBD` remain `TBD`.

## Cross-cutting traceability

| Rule | Expected state | UI capability | Application/domain capability | Acceptance test | Slice |
|---|---|---|---|---|---|
| Observation â†’ driver/gap/opportunity â†’ prioritization â†’ human confirmation â†’ Challenge | Provenance and review state visible | Promote/confirm action | TBD | No automatic Challenge from lens, AI or gap | SF-5, SF-6 |
| Structured workspace is system of record | State exists outside conversation | Workspace reflects applied insights | TBD | Copilot insight can be applied or discarded | SF-3, SF-4, SF-8 |
| Copilot is advisory | Suggestions are non-canonical until accepted | Explainable suggestion UI | TBD | AI suggestion never silently canonicalizes | SF-4, SF-6 |
| Challenge is distinct from Invitation/Initiative/Steps | No downstream lifecycle side effect | Boundary-preserving action | TBD | Challenge promotion does not activate downstream flow | SF-6 |
| Portfolio Home future relation | Outcome, health, drivers, gaps, Challenges, coverage, learning, decisions consumable later | TBD; PH-3A unchanged | TBD | TBD | SF-7 |

| SF-MM-08 | Challenge-like input remains provisional until Front is resolved | Candidate Challenge-like state with unresolved/provisional parent | Problem, relevance and signal visible; no canonical promotion | Challenge-first does not create orphan Challenge or invented Front | SF-2, SF-3, SF-6 |
| SF-MM-09 | Reverse-align solution while separating signal types | Pending alignment with expected/observed/attributed contribution | Value path and uncertainty visible | No fabricated ROI or automatic Front/Challenge | SF-2, SF-3, SF-5, SF-7 |
| SF-BOUND-09 | Interpretation may question/reverse-align, never silently rewrite or confirm | Provenance and uncertainty preserved | Reviewable interpretation and existing structure | No silent rewrite/confirmation | SF-2, SF-3, SF-7 |
| SF-BOUND-10 | Challenge-like/initiative-like input may continue before parent is complete; canonical Challenge waits for Front | Provisional/pending alignment | Continue useful exploration without canonicalization | No orphan Challenge, inferred Front or forced strategy workshop | SF-2, SF-3, SF-6 |
| Strategic-level assessment | Scope is assessed as front_like/challenge_like/initiative_like/unresolved | Advisory classification with review state | Explainable level assessment | Wording alone cannot canonicalize domain objects | SF-2, SF-3 |
| Signal separation | Movement, contribution and business outcome are distinct | Expected/observed/attributed contribution remains explicit | Separate signal/proxy/value displays | No fabricated KPI, ROI or causality | SF-2, SF-5, SF-7 |
| Candidate Challenge → confirmed Front → canonical Challenge | Current schema requires `strategicFrontId` | Non-canonical candidate until explicit promotion | Front resolution and promotion checkpoint | No nullable FK, orphan row or inferred link | SF-6 |
| Bottom-up alignment | Initiative/solution/problem can reverse-align to broader context | Pattern/provisional parent with history preserved | Reviewable alignment proposals | Learning triggers review, not retroactive rewrite | SF-2, SF-3, SF-7 |
