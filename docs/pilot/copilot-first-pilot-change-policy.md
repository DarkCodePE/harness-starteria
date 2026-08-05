# Copilot-first Pilot Change Policy

## Cadence

Daily or after each session:

- review executions;
- review errors;
- review reconciliations;
- review access denials;
- review critical findings;
- confirm no duplicates;
- confirm no cross-tenant access.

Periodic review:

- case progress;
- metrics;
- findings;
- decisions;
- allowed changes;
- risks.

## Allowed During Pilot

- Bug fixes.
- Security fixes.
- Integrity fixes.
- Obvious usability blockers.
- Minor copy.
- Required instrumentation.

## Not Allowed During Pilot

- New capabilities.
- Major methodology changes.
- Broad redesigns.
- New integrations.
- Features requested by one user without evidence.

## Pause Immediately

- Duplicate StrategicFront creation.
- Cross-tenant access.
- Sensitive information exposure.
- Execution without approval.
- Audit trail loss.
- Migration or data corruption.
- Ambiguous execution that repeats automatically.
- Kill switch not functional.

## Pause For Investigation

- Elevated failure rate.
- Multiple stale executions.
- Users cannot understand approval.
- Frequent incorrect proposals.
- Uncontrolled operational impact.
- Support overload.

## Continue With Observation

- Minor doubts.
- Frequent but understandable editing.
- Copy issues.
- Visual issues without data loss.
- Clearly communicated out-of-scope requests.

## Pause Procedure

1. Disable `COPILOT_WRITE_ENABLED`.
2. Disable `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED` if execution is risky.
3. Disable `VITE_PORTFOLIO_COPILOT_ENABLED` if users must stop seeing the shell.
4. Preserve logs and AuditLog.
5. Inform pilot users through [PENDIENTE: canal de soporte].
6. Review affected data.
7. Decide reactivation only after owner approval.
