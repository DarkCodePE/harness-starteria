# Portfolio To Initiative Activation/Handoff

Status: ACTIVE / FROZEN FOR IMPLEMENTATION PLANNING.

Active Experience Contract:

`PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md`

The v0.1 contract is superseded for this bounded context and retained as a
historical reference for traceability. This authority promotion does not
authorize implementation, schema changes, route changes, or Step 0-4 changes.

Bounded context:

```text
Portfolio / Challenge
-> Invitation
-> Accept
-> Initiative Overview
-> Start
```

This folder is the documentary home for Portfolio -> Initiative Activation/Handoff.
It does not implement product runtime, Prisma, or Steps 0-4 behavior.

## Authority Relationship

The authority chain for this bounded context is:

```text
STARTERIA_AUTHORITY
        |
        v
STARTERIA_CORE_LOGIC_CONTRACT
        |
        v
PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT
        |
        v
PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT
        |
        v
Implementation / Tech Specs
```

The Experience Contract in this folder does not replace Core or the repository
Authority map. It governs only the user experience and lifecycle semantics for
Portfolio -> Initiative Activation/Handoff.

The Current State Audit in this folder is not functional authority. It is factual
evidence used to classify existing implementation as KEEP / ADAPT / NEW /
DEPRECATE / ADR CANDIDATE.

## Contract Set

- [Activation Experience Contract v0.2](PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md)
- [Superseded v0.1 historical reference](PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md)
- [Current State Audit](PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md)
- [Acceptance Checklist](PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md)

## Protected Invariants

```text
Invitation != Initiative
Accept != Start
Accept != Step 0 active
Owner assignment != Core active
Challenge link != Step initialization
```

Target lifecycle:

```text
Assignment -> Invitation -> Accept / Reject -> Activation Overview -> Start
```

For Assigned Challenge, Accept and Start do not create an Initiative in this
bounded context. Start is the hard boundary; downstream Initiative formulation
is outside this contract.

## ADR Candidates Pending

These are documented as unresolved and must not be silently decided in
implementation:

- Project vs Initiative identity.
- Technical representation of `pre_start`.
- Challenge coverage/cardinality if Core and handoff semantics conflict.
- Exact moment of Step materialization.
- Canonical ownership if current `Project.ownerId` prevents the target semantics.

## Historical / Adjacent References

- [Portfolio -> Steps single path audit](../../../PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md)
- [Portfolio Entry continuation ADR](../../product-adr/ADR-031-portfolio-entry-continuation-to-portfolio.md)
