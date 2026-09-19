# Portfolio Home Governance Pack v0.1

**Estado:** PH-0 documentation freeze / target authority for planning
**Alcance:** Portfolio Home V2 como superficie de lectura y gobernanza
**Runtime:** no implementado ni autorizado por este pack

**Core status:** Core v0.2 is the current factual authority. Core v0.3 is an
external reconciliation candidate only; see
`docs/reconciliation/CORE_0_CANDIDATE_RECONCILIATION.md`.

Este pack define la autoridad documental para Portfolio Home después de
Portfolio Bootstrap y antes de cualquier implementación técnica. No crea una
nueva fuente canónica de dominio, no reemplaza Core y no convierte una
implementación existente en autoridad.

## Autoridad y límites

```text
STARTERIA_AUTHORITY
        ↓
CORE LOGIC CONTRACT
        ↓
PORTFOLIO GOVERNANCE
        ↓
PORTFOLIO → INITIATIVE ACTIVATION / HANDOFF
        ↓
PORTFOLIO HOME GOVERNANCE
        ↓
TECH SPECS / IMPLEMENTATION
```

Portfolio Home es una read model gobernada. No es Initiative Core, no es un
launcher de Step 0 y no escribe directamente Step state.

## PH-0B semantic classification

Compatible with current Core v0.2 and retained as target/Experience-level
specification:

- Portfolio Home != Initiative workspace.
- Portfolio Home does not write Steps or silently activate them.
- AI recommends; human/domain authority decides.
- Sponsor is not a universal authority by default.
- Expected, observed and attributed contribution remain separate.
- Governance, attention, decision visibility and projection-based portfolio
  tracking remain read/governance concerns.

`CANDIDATE DEPENDENCY / ADR-RETEST REQUIRED`:

- exact Activation Readiness lifecycle and transitions;
- canonical ownership semantics and any new Decision Authority semantics;
- exact Challenge coverage/cardinality rules;
- exact `pre_start` lifecycle and technical representation;
- exact pre-Start/Step materialization boundary.

These dependencies remain proposed and must not be implemented or treated as
Core approval during PH-0.

## Document set

- [Governance Target](PORTFOLIO_HOME_GOVERNANCE_TARGET_v0.1.md)
- [Read Model Contract](PORTFOLIO_HOME_READ_MODEL_CONTRACT_v0.1.md)
- [Activation/Handoff Traceability](PORTFOLIO_HOME_TO_INITIATIVE_HANDOFF_TRACEABILITY_v0.1.md)
- [Acceptance Checklist](PORTFOLIO_HOME_ACCEPTANCE_CHECKLIST_v0.1.md)
- [Implementation Sequence](PORTFOLIO_HOME_IMPLEMENTATION_SEQUENCE_v0.1.md)

The existing Bootstrap documents in `../03-bootstrap-home/` remain the
Bootstrap slice authority/candidate set. This pack governs the Home read and
its boundary with Activation/Handoff; it does not duplicate those documents.

## PH-0 decision

Portfolio Home V2 is **target authority defined, runtime not certified**.
Activation/Handoff remains **documentation frozen, not implemented by PH-0**.
Any contradiction with Core or an approved ADR must be raised as a conflict;
this pack must not silently resolve it.
