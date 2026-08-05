# Copilot-first Controlled Pilot Charter

## Summary

Pilot name: Portfolio Copilot - Create Strategic Front controlled pilot.

Organization: [PENDIENTE: organizacion piloto]

Business owner: [PENDIENTE: owner de negocio]

Technical owner: [PENDIENTE: owner tecnico]

Support owner: [PENDIENTE: responsable de soporte]

Incident owner: [PENDIENTE: responsable de incidentes]

Start date: [PENDIENTE: fecha de inicio]

End date: [PENDIENTE: fecha de cierre]

Duration: 2 to 4 weeks proposed, pending confirmation.

## Problem

Validate whether Portfolio Leads can create coherent strategic fronts through a controlled Copilot flow without direct mutation by AI and with enough trust, traceability and control to justify continuing the Copilot-first strategy.

## Hypotheses

| ID | Hypothesis | Evidence needed | Quantitative metric | Qualitative evidence | Provisional threshold | Result | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H1 | Users understand what kind of request they can enter in Portfolio Copilot. | Session observation, first message, survey. | 4/5 clarity average; fewer than 2 facilitator interventions per session. | User explains task without re-training. | Provisional, not SLA. | [PENDIENTE] | [PENDIENTE] |
| H2 | Starteria identifies CreateStrategicFront intent and structures required fields without inventing information. | IntentAssessment, missing info, plan review. | 80% of controlled cases correctly routed; 0 invented critical fields accepted. | User confirms interpretation. | Provisional, not validated. | [PENDIENTE] | [PENDIENTE] |
| H3 | The Action Plan helps users review what will change before execution. | Plan viewed, interview, approval behavior. | 80% report Action Plan clarity >= 4/5. | User names what will change. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H4 | Users can edit proposals without constant Starteria help. | Edits, facilitator interventions. | 70% of edit-needed cases resolved by user. | User describes edit as understandable. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H5 | Human approval increases confidence and reduces perceived risk. | Approval/rejection, survey, interview. | Confidence before approve >= 4/5 in 70% of sessions. | User says approval boundary is clear. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H6 | Created StrategicFront matches message, edits and approved version. | ActionExecution, StrategicFront review. | 0 mismatches that reach production data. | Reviewer confirms fidelity. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H7 | User can leave, return and continue without losing conversation, Action Plan, approval or result. | Refresh case, recovery observation. | 100% recovery in controlled case. | User finds state without support. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H8 | Strategic front creation is important or frequent enough. | Interview and case selection. | At least 5 real controlled cases identified. | Users describe current pain. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H9 | Users would reuse Starteria for new cases. | Survey and interview. | Reuse intent >= 4/5 in 60% of participants. | User names a next case. | Provisional. | [PENDIENTE] | [PENDIENTE] |
| H10 | Organization has concrete reasons to continue to expanded or paid phase. | Sponsor/owner interview. | At least one continuation condition documented. | Decision maker states adoption requirements. | Provisional. | [PENDIENTE] | [PENDIENTE] |

## Users And Roles

Target users: 3 to 8 users.

Roles: existing roles only, initially `admin` or `mentor` for execution; observer roles can participate without execution if current permissions allow.

Recommended profiles:

- Portfolio Lead or strategy lead.
- Innovation or transformation lead.
- Collaborator who provides context.
- Sponsor or observer, only if current role allows safe access.

## Capability

Only capability: `CreateStrategicFront`.

Excluded: import, challenges, cohorts, readiness, decisions, real AI provider, global rollout and autoservice.

## Cases

Expected volume: 5 to 15 controlled cases. See `docs/pilot/copilot-first-pilot-cases.md`.

## Data

Allowed data: [PENDIENTE: datos permitidos].

Prohibited data: sensitive personal data, secrets, contractual confidential information not authorized for the pilot, credentials, regulated data and any information the pilot organization has not approved.

## Support

Channel: [PENDIENTE: canal de soporte].

Schedule: [PENDIENTE: horario de soporte].

Escalation: see `docs/pilot/copilot-first-pilot-support-model.md`.

## Risks

- Duplicate StrategicFront creation.
- Cross-tenant access.
- Execution without approval.
- Sensitive information in messages or logs.
- Misunderstood Action Plan.
- Support masking usability problems.
- E2E technical gate not yet green.

## Metrics

See `docs/implementation/copilot-first-pilot-scorecard.md`.

## GO/NO-GO

Technical GO: pending Block 05 E2E and validation.

Operational GO: pending organization, users, owners, support, data policy, dry run and session plan.

## Calendar

| Milestone | Target | Status |
| --- | --- | --- |
| Technical gate resolved | [PENDIENTE] | pending |
| Pilot organization confirmed | [PENDIENTE] | pending |
| Users confirmed | [PENDIENTE] | pending |
| Dry run completed | [PENDIENTE] | not executed |
| First user session | [PENDIENTE] | pending |
| Midpoint review | [PENDIENTE] | pending |
| Final report | [PENDIENTE] | pending |

## Closure

Close the pilot by freezing changes, generating the report, reviewing all executions and findings, completing interviews/surveys, classifying the decision as maintain, improve, pivot, expand or stop, and documenting next steps without rewriting original hypotheses.
