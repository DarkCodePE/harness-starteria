# Portfolio Lead Documentation Index

Status: canonical documentation index
Date: 2026-09-15
Repository scope: public documentation/harness snapshot, not certified production runtime

This folder is the starting point for Portfolio Lead documentation. It indexes authority, current contracts, target candidates, implementation reports, known legacy risks, and the next bounded context without relying on conversational history.

## A. What Portfolio Lead Is

Portfolio Lead governs:

```text
strategy
coverage
capacity
contribution
attention
decision
```

Portfolio Lead answers:

```text
Are we dedicating effort to the right initiatives, connected to the right priorities, with enough visibility and evidence to decide what to do next?
```

Portfolio Lead does not execute Steps, does not replace Initiative Core, and does not turn Portfolio Home into an Initiative workspace or Step launcher.

## B. Authority Order

Use this order when documents disagree:

```text
Core Contract
-> Authority / approved ADRs
-> Experience Contracts
-> Agent/Skill Contracts
-> Tech Specs
-> implementation reports
-> PRDs
-> prompts / historical notes
```

Important:

- Target candidates are not automatically authority.
- Current implementation does not invalidate higher authority.
- Implementation prompts are historical execution aids, not source of truth.
- The repo may contain historical runtime folders; they do not authorize product evolution by themselves.

Primary authority map:

- [Starteria Authority](../STARTERIA_AUTHORITY.md)
- [Current State](../../CURRENT_STATE.md)
- [Core Logic Contract](../core/STARTERIA_CORE_LOGIC_CONTRACT.md)

## C. Current Implementation Status

| Capability | Status |
| --- | --- |
| Portfolio Entry | GO |
| Continuation | GO |
| Bootstrap B0-B5 | GO |
| Manual/Paste Work Intake | GO |
| CSV Import | GO |
| XLSX Import | GO |
| Provisional Structuring | GO |
| Human Material Review | GO |
| PortfolioReading | GO |
| HOME_D / HOME_E | GO |
| PG-1 Projection | GO |
| PG-2 Events / interaction_channel | GO |
| PG-4 Permissions | GO |
| Portfolio -> Initiative Activation/Handoff H-0 | GO documentation freeze; not implemented |

The GO entries are factual implementation-report status, not a claim that every target candidate has become approved authority.

## D. Channel-Independent Architecture

```text
Web / Copilot / External Assistant / API / Import
              |
              v
      same domain services
              |
              v
       Initiative Core
              |
              v
PortfolioInitiativeProjection
              |
              v
         Portfolio Lead
```

Channel is provenance and interaction context. Channel is not authority.

## E. Canonical vs Derived

Canonical / governed:

- Portfolio Bootstrap governed state
- Initiative Core state
- Domain events
- permissions

Derived:

- PortfolioInitiativeProjection
- PortfolioReading as portfolio snapshot/reading

Not canonical:

- AI suggestion
- UI state
- plugin memory
- external assistant private state
- implementation prompts

## F. Current Invariants

```text
PortfolioBootstrapWorkItem != canonical Initiative
PortfolioReading != Initiative
Portfolio does not write StepState directly
interaction_channel != authority
PortfolioInitiativeProjection != second source of truth
AI_SUGGESTED != USER_CONFIRMED
AI_INFERRED != CANONICAL
persisted != canonical
initiative exists != initiative activated
initiative activated != Step active
Portfolio Home != Initiative workspace
Portfolio Home != Step launcher
```

## G. Current Known Legacy Risks

Do not reactivate these as the canonical Portfolio Lead flow:

- `Project.currentStep` legacy lifecycle field.
- `Project.step0Status` legacy Step 0 field.
- `Step` / `Module` legacy Step path.
- `InitiativePortfolioMeta.status` and `InitiativePortfolioMeta.currentStep` as editable lifecycle state.
- Historical Challenge -> Project -> Step path.
- Frontend-derived Portfolio attention/next-action selectors as UX only, not domain authority.

The current safe direction is: Core state and events win; projections read and explain, they do not govern.

## H. Next Bounded Context

NEXT:

```text
Portfolio -> Initiative Activation/Handoff
```

H-0 documentation freeze:

- [Activation Experience Contract](05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md)
- [Current State Audit](05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md)
- [Acceptance Checklist](05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md)

Authority relationship:

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

The Current State Audit is outside the authority chain. It is evidence for KEEP /
ADAPT / NEW / DEPRECATE only.

ADR candidates still unresolved:

- Project vs Initiative identity.
- Technical representation of `pre_start`.
- Challenge coverage/cardinality if Core and handoff semantics conflict.
- Exact moment of Step materialization.
- Canonical ownership if current `Project.ownerId` prevents the target semantics.

Activation/Handoff is not implemented by this documentation freeze.

## I. Document Map

Authority:

- [Starteria Authority](../STARTERIA_AUTHORITY.md)
- [Current State](../../CURRENT_STATE.md)
- [Core Logic Contract](../core/STARTERIA_CORE_LOGIC_CONTRACT.md)
- [Product ADR index](../product-adr/ADR-INDEX.md)

Architecture:

- [Portfolio architecture/plugin readiness comparison](01-architecture/STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md)
- [Portfolio -> Steps single path audit](../../PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md)
- Steps architecture target: not found in this repository; see [Document Inventory](DOCUMENT_INVENTORY.md).

Entry:

- [Portfolio Entry logic contract](../experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md)
- [Portfolio Entry acceptance checklist](../experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md)
- [Portfolio Post-Entry Continuation contract](../experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md)
- [Portfolio Entry agent contract](../agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md)
- [Portfolio Entry AI harness](../ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md)

Bootstrap/Home:

- [Bootstrap/Home logic contract](03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md)
- [Bootstrap/Home implementation audit](03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_IMPLEMENTATION_AUDIT_v0.1.md)
- [Bootstrap/Home tech spec](03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_TECH_SPEC_v0.1.md)
- [Bootstrap/Home E2E validation report](../../PORTFOLIO_BOOTSTRAP_HOME_E2E_VALIDATION_REPORT_v0.1.md)
- [Bootstrap import validation report](../../PORTFOLIO_BOOTSTRAP_IMPORT_VALIDATION_REPORT_v0.1.md)

Channel Independence / PG:

- [Portfolio governance interaction contract](04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md)
- [Channel independence audit](../../PORTFOLIO_GOVERNANCE_CHANNEL_INDEPENDENCE_AUDIT_v0.1.md)
- [PG-1 projection report](../../PORTFOLIO_INITIATIVE_PROJECTION_IMPLEMENTATION_REPORT_v0.1.md)
- [PG-2 domain event envelope report](../../DOMAIN_EVENT_ENVELOPE_IMPLEMENTATION_REPORT_v0.1.md)
- [PG-4 permission guard consolidation report](../../PERMISSION_GUARD_CONSOLIDATION_REPORT_v0.1.md)

Activation/Handoff:

- [Activation/Handoff local index](05-activation-handoff/README.md)
- [Activation Experience Contract](05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md)
- [Current State Audit](05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md)
- [Acceptance Checklist](05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md)
- [Portfolio Entry continuation ADR](../product-adr/ADR-031-portfolio-entry-continuation-to-portfolio.md)
- [Portfolio -> Steps single path audit](../../PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md)
- No `STARTERIA_NEXT_CHAT_HANDOFF_CONTEXT.md` was found in this repository.

Reports and archive:

- [Implementation reports](90-implementation-reports/)
- [Prompts archive](99-archive/prompts/)
- [Full document inventory](DOCUMENT_INVENTORY.md)

## J. PG Closure Status

PG-1:

```text
GO
Projection source = Initiative Core
Projection writable = NO
Derived on read = YES
Core wins over legacy status
```

PG-2:

```text
GO
Common event envelope = YES
interaction_channel = YES
actor/channel separated
cross-channel semantics = PASS
```

PG-4:

```text
GO
backend/domain authority consolidated
frontend-only material guards = NO
route-only bypass = NO
cross-channel permissions equivalent
```

## K. Portfolio Bootstrap Current Truth

Current flow:

```text
Portfolio Entry
-> Continuation
-> Anchor
-> Work Intake
-> Provisional Structuring
-> Human Review
-> PortfolioReading
-> HOME_D/E
```

Work Intake:

```text
manual
paste
CSV
XLSX
```

Safety:

```text
StrategicFront auto-created: NO
Challenge auto-created: NO
Project auto-created: NO
Step auto-created: NO
InitiativePortfolioMeta auto-created: NO
Initiative activated: NO
```
