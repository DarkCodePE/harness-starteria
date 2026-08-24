# Copilot-first Incident Playbook

## Block 06D Incident Exercise Notes

Two incident exercises remain required with a human operator before pilot GO:

1. Functional incident: "The front was created, but I do not see it on the map."
2. Critical simulated incident: "A duplicate StrategicFront might be created."

Automated DR-16 reconstruction confirmed that the operator can technically reconstruct:

- `conversationId`
- `actionPlanId`
- `proposedActionId`
- approved version
- `actionExecutionId`
- created object reference
- AuditLog events

The human walkthrough must still verify communication, escalation, kill-switch decision making and closure language.

For suspected duplicate risk:

- Activate `COPILOT_WRITE_ENABLED=false` first to stop new writes while preserving read access.
- Review ActionExecution status and idempotency audit events.
- Confirm whether Portfolio contains one or more StrategicFront records for the approved action.
- Do not generate a new idempotency key to "test" the path.
- Reactivate writes only after the risk is understood and documented.

## Severity

- SEV-1: potential cross-tenant access, duplicated business object, sensitive data exposure.
- SEV-2: execution backlog stale, database outage, failed migration, Portfolio/Copilot discrepancy.
- SEV-3: feature flag mismatch, adapter unavailable in sandbox, projection refresh failure, elevated rate limits.

## Potential Duplicate StrategicFront

1. Set `COPILOT_CREATE_STRATEGIC_FRONT_ENABLED=false`.
2. Search by `ActionExecution.idempotencyKey`, `correlationId`, created object references and AuditLog.
3. Count `StrategicFront` rows in the affected `organizationId`.
4. Do not delete records until product owner confirms remediation.
5. Keep Copilot writes disabled until a regression test proves no duplicate path remains.

## Cross-tenant Access

1. Set `COPILOT_WRITE_ENABLED=false`.
2. Preserve logs and AuditLog.
3. Check all affected conversation, plan, action and execution IDs.
4. Confirm no response exposed data from another organization.
5. Escalate to security owner and product owner.

## Sensitive Data in Logs

1. Stop writes if the leak is active.
2. Identify log sinks and retention.
3. Verify global HTTP logger redaction, not only Copilot-specific redaction.
4. Confirm at minimum these fields are redacted: `authorization`, `cookie`, `set-cookie`, `x-internal-token`, `idempotency-key`, `accessToken`, `refreshToken`, `token`, `password`.
5. Run smoke in a non-production environment and inspect logs for `[REDACTED]`.
6. Rotate affected secrets if tokens/cookies were logged in any persistent sink.
7. Document legal/privacy follow-up.

## Support Simulation: Front Created But Not Visible

1. Ask for the correlationId or session timestamp; do not ask for passwords or tokens.
2. Locate `conversationId`, `actionPlanId`, `proposedActionId` and `actionExecutionId`.
3. Verify `ActionExecution.status` and `createdObjectReferences`.
4. Check whether the referenced `StrategicFront` exists in the same `organizationId`.
5. If the command completed and the front exists, treat the issue as projection/refresh until proven otherwise.
6. Do not reexecute the command to refresh the map; refresh the Portfolio read model or UI view.
7. Record the finding and escalation decision.

## Failed Migration

1. Keep flags off.
2. Run `npx prisma migrate status`.
3. Do not use `db push` to bypass migration review.
4. Roll forward with a corrective migration.

## Stale Executions

1. Check readiness and reconciler logs.
2. Review executions in `pending`, `validating`, `executing`, `manual_review_required`.
3. Do not reexecute ambiguous commands automatically.
4. Use a new idempotency key only for explicit manual retry.

## Portfolio/Copilot Discrepancy

1. Compare `ActionExecution.createdObjectReferences` with `StrategicFront`.
2. Verify same `organizationId`.
3. If evidence is incomplete, keep execution in manual review.

## Database Outage

1. Readiness should be 503.
2. Disable writes.
3. Restore DB connectivity and run migration status.
4. Let reconciler process stale executions after restart.

## Incorrect Feature Flag

1. Disable backend write flag first.
2. Disable frontend flag.
3. Verify allowlist.
4. Run smoke test only in a non-production controlled org.
