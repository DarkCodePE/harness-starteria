# Strategic Framing Implementation Sequence v0.1

**Estado:** `APPROVED EXECUTION PLAN` — SF-1, SF-2, SF-3A y SF-3B tienen
evidencia separada en este checkout; SF-3C+ no están implementadas.

| Slice | Scope | Exit evidence | Status in this checkout |
|---|---|---|---|
| SF-0 | Contract + scenario freeze | Experience Contract, scenarios, checklist and traceability human-approved on 2026-09-24 | APPROVED contract |
| SF-1 | Current-state audit | Route/UI/service/state/AI/persistence/permissions/tests map classified | COMPLETED |
| SF-2 | Strategic Framing Read Model | Read model aligned with contract and current authority | IMPLEMENTED |
| SF-3A | Provisional-state decision | SF-owned provisional state decision and boundaries | APPROVED |
| SF-3B | Provisional persistence/application state | Durable provisional state, re-entry, human correction and history | IMPLEMENTED_UNVERIFIED |
| SF-3C | Editable Framing workspace/API boundary | Structured editing and sufficiency feedback beyond the application service | NOT IMPLEMENTED |
| SF-3D+ | Copilot/orchestration and later framing slices | Routes, UI, Copilot, canonical promotion and later integrations | NOT IMPLEMENTED |
| SF-4 | Adaptive Lens Suggestions | Relevant, explainable, non-mandatory perspective suggestions | Not started |
| SF-5 | Gap Prioritization | Capacity/horizon-aware prioritization with observable remainder | Not started |
| SF-6 | Promote Gap â†’ Challenge | Explicit human confirmation with downstream boundaries preserved | Not started |
| SF-7 | Portfolio Home Integration | Future read-model reconciliation for outcome, health, drivers, gaps, Challenges, coverage, learning and decisions | Not started; PH-3A/PH-3B unchanged |
| SF-8 | E2E Harness | Direct, mixed, Copilot and negative boundary coverage | Not started |

**Status:** `APPROVED EXECUTION PLAN`
**Human approval:** 2026-09-24
**Current implementation boundary:** SF-3B provisional persistence/application
state. SF-3C+ remains unimplemented.

## Sequence guardrails

- SF-1 must audit current behavior before implementation slices alter it.
- No slice may create a canonical lens, observation or gap without ADR review.
- No slice may change Core, role authority, Initiative identity, lifecycle or Front â†’ Challenge cardinality silently.
- SF-7 is the first planned integration point with Portfolio Home; it does not authorize PH-3B.
- SF-8 must include no-Copilot, no-auto-Challenge, capacity-aware and downstream-boundary cases.

## SF-0 non-actions

SF-0 documentation does not modify frontend, backend, Prisma, Core, routes,
endpoints, Copilot runtime, PH-3A or PH-3B. SF-1 through SF-3B are tracked as
separate implementation evidence; SF-3C+ remains outside the implemented
boundary.

## SF-0.1 amendment guardrails

`ADR REQUIRED NOW: NO`.

SF-1 must audit before implementation:

- reusable Entry interpretation and reverse-alignment logic;
- how Bootstrap/Anchor represents insufficient or provisional context;
- how imported Initiatives represent pending alignment;
- whether candidate Challenge can remain non-canonical without new persistence;
- current Strategic Front creation requirements and schema/domain constraints;
- reusable Copilot capability.

The implementation sequence remains:

```text
SF-0 approved contract
  → SF-1 completed current-state audit
  → SF-2 implemented read model
  → SF-3A approved provisional-state decision
  → SF-3B implemented provisional persistence/application state
  → SF-3C+ not implemented
```

If implementation requires a canonical Challenge without a Strategic Front,
stop and raise an ADR candidate. SF-0.1 does not authorize SF-3C+.
