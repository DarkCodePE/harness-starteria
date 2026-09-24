# Strategic Framing Implementation Sequence v0.1

**Estado:** `APPROVED EXECUTION PLAN` — SF-1 es la siguiente slice; ninguna slice posterior se ejecuta en este cambio.

| Slice | Scope | Exit evidence | Status at SF-0 |
|---|---|---|---|
| SF-0 | Contract + scenario freeze | Experience Contract, scenarios, checklist and traceability human-approved on 2026-09-24 | APPROVED; runtime not implemented |
| SF-1 | Current-state audit | Route/UI/service/state/AI/persistence/permissions/tests map classified | Not started |
| SF-2 | Strategic Framing Read Model | Read model aligned with contract and current authority | Not started |
| SF-3 | Editable Front Workspace | Direct structured editing and sufficiency feedback | Not started |
| SF-4 | Adaptive Lens Suggestions | Relevant, explainable, non-mandatory perspective suggestions | Not started |
| SF-5 | Gap Prioritization | Capacity/horizon-aware prioritization with observable remainder | Not started |
| SF-6 | Promote Gap â†’ Challenge | Explicit human confirmation with downstream boundaries preserved | Not started |
| SF-7 | Portfolio Home Integration | Future read-model reconciliation for outcome, health, drivers, gaps, Challenges, coverage, learning and decisions | Not started; PH-3A/PH-3B unchanged |
| SF-8 | E2E Harness | Direct, mixed, Copilot and negative boundary coverage | Not started |

**Status:** `APPROVED EXECUTION PLAN`  
**Human approval:** 2026-09-24  
**Next authorized slice:** SF-1 Current-State Audit  
No slice after SF-0 is executed by this approval materialization.

## Sequence guardrails

- SF-1 must audit current behavior before implementation slices alter it.
- No slice may create a canonical lens, observation or gap without ADR review.
- No slice may change Core, role authority, Initiative identity, lifecycle or Front â†’ Challenge cardinality silently.
- SF-7 is the first planned integration point with Portfolio Home; it does not authorize PH-3B.
- SF-8 must include no-Copilot, no-auto-Challenge, capacity-aware and downstream-boundary cases.

## SF-0 non-actions

This package does not modify frontend, backend, Prisma, Core, routes, endpoints, Copilot runtime, PH-3A or PH-3B. It does not execute SF-1.

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
SF-0
  → SF-1 Current-state Audit
  → SF-2 Strategic Framing Read Model
  → ...
```

If implementation requires a canonical Challenge without a Strategic Front,
stop and raise an ADR candidate. SF-0.1 does not execute SF-1.
