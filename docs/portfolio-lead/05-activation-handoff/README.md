# Portfolio To Initiative Activation/Handoff

Status: H-0 documentation freeze for next implementation bounded context.

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

- [Activation Experience Contract](PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md)
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
Invitation -> Accept -> pre_start -> Start -> Initiative Core
```

Do not freeze the technical representation of `pre_start` in H-0. The functional
definition is:

```text
Initiative exists + responsibility accepted + Core not started
```

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
