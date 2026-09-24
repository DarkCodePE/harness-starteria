# Strategic Framing Implementation Sequence v0.1

**Estado:** `CANDIDATE` â€” secuencia futura congelada en SF-0. Ninguna slice de esta lista se ejecuta en este cambio.

| Slice | Scope | Exit evidence | Status at SF-0 |
|---|---|---|---|
| SF-0 | Contract + scenario freeze | Experience Contract, scenarios, checklist and traceability reviewed | Documentation created; pending human review |
| SF-1 | Current-state audit | Route/UI/service/state/AI/persistence/permissions/tests map classified | Not started |
| SF-2 | Strategic Framing Read Model | Read model aligned with contract and current authority | Not started |
| SF-3 | Editable Front Workspace | Direct structured editing and sufficiency feedback | Not started |
| SF-4 | Adaptive Lens Suggestions | Relevant, explainable, non-mandatory perspective suggestions | Not started |
| SF-5 | Gap Prioritization | Capacity/horizon-aware prioritization with observable remainder | Not started |
| SF-6 | Promote Gap â†’ Challenge | Explicit human confirmation with downstream boundaries preserved | Not started |
| SF-7 | Portfolio Home Integration | Future read-model reconciliation for outcome, health, drivers, gaps, Challenges, coverage, learning and decisions | Not started; PH-3A/PH-3B unchanged |
| SF-8 | E2E Harness | Direct, mixed, Copilot and negative boundary coverage | Not started |

## Sequence guardrails

- SF-1 must audit current behavior before implementation slices alter it.
- No slice may create a canonical lens, observation or gap without ADR review.
- No slice may change Core, role authority, Initiative identity, lifecycle or Front â†’ Challenge cardinality silently.
- SF-7 is the first planned integration point with Portfolio Home; it does not authorize PH-3B.
- SF-8 must include no-Copilot, no-auto-Challenge, capacity-aware and downstream-boundary cases.

## SF-0 non-actions

This package does not modify frontend, backend, Prisma, Core, routes, endpoints, Copilot runtime, PH-3A or PH-3B. It does not execute SF-1.
