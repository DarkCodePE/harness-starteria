# Portfolio Entry Completion Fail-safe v0.1

Status: `IMPLEMENTED_UNVERIFIED`  
Slice: Portfolio Entry completion / handoff continuity  
Date: 2026-09-23

## Authority and boundary

The applicable authority is the Portfolio Entry Experience Contract and the
registered Portfolio Entry clarification/handoff subcontract. The Core Logic
Contract is absent in this checkout, so the following gap remains explicit:

```text
AUTHORITY_GAP: docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md is absent.
```

This slice does not change Core, AI authority, Question Planner semantics, or
Steps 0–4. It only changes failure handling, persistence of received input,
provider selection, and handoff materialization.

## Root cause

`POST /sessions/:id/messages` called the agent before `appendTurn`. A provider
failure therefore left the submitted answer only in the request process and
the UI could surface a 503 without a server-side recoverable input. The handoff
route then called a second live model before `saveHandoff`, making the provider
a second mandatory failure point.

## Critical path

Before:

```text
submit message → /messages → agent/model → validation → appendTurn
→ lifecycle transition → /handoff → handoff model → saveHandoff
```

There were up to two live provider calls after the last user answer: one
analysis call (including its technical retry) and one handoff-generation call.

After:

```text
submit message → persist pending input → primary (+ technical retry)
→ configured fallback → validation → appendTurn
→ deterministic handoff projection → saveHandoff
```

The handoff critical path now has zero mandatory live-provider calls. A live
handoff enrichment call is not used by the active route.

## Persistence design

Pending input is stored additively inside the existing `semanticState` JSON;
no Prisma schema or migration is required. It contains a stable input id,
value, lifecycle status, timestamps, and explicit `USER_DECLARED` provenance.
The conceptual statuses are `RECEIVED`, `ANALYSIS_PENDING`, `ANALYZED`,
`FAILED_RETRYABLE`, and `SUPERSEDED`. The active failed path exposes
`FAILED_RETRYABLE`; successful analysis records `ANALYZED` plus
`analysisVersion`. Pending input is never supplied as confirmed semantic
context.

The existing idempotency record and session CAS remain the commit boundary.
Persisting the pending state before analysis keeps the original revision so a
timeout after a successful append can still be recovered without duplicating
the turn.

## Fallback strategy

`ResilientStructuredModelAdapter` lets the primary adapter exhaust its existing
technical retry, then invokes a finite configured fallback for timeout,
transport, rate-limit, provider 5xx, and schema-invalid output. Auth/config
errors and request/domain errors do not fall through. The final result retains
the provider/model metadata from the adapter that produced it.

Fallback configuration is environment-based:

```text
PORTFOLIO_ENTRY_FALLBACK_PROVIDER
PORTFOLIO_ENTRY_FALLBACK_MODEL
PORTFOLIO_ENTRY_FALLBACK_API_KEY
PORTFOLIO_ENTRY_FALLBACK_BASE_URL
PORTFOLIO_ENTRY_FALLBACK_TIMEOUT_MS
```

## Degraded-state behavior

If primary, retry, and fallback fail, the input remains server-side with
`FAILED_RETRYABLE`; no turn is appended and no question is re-issued. The
client receives a recoverable DTO with “Reintentar análisis” and “Continuar
con lectura provisional”. The latter is available when prior structured
analysis is sufficient; it uses the deterministic handoff projection and
does not invent analysis.

## Handoff

The active handoff materializer is deterministic and schema-valid. It derives
wording only from persisted analysis, structured context, ambiguity/gap state,
and provenance. It visibly carries unresolved context and human confirmation
requirements through the existing handoff schema. A model may be reintroduced
as optional wording enrichment only if this deterministic projection remains
the save/display fallback.

## Versioning and provenance

Successful processing records a new `analysis_version` on the pending input
and appends a new turn. Existing turns and handoff versions remain immutable;
the session CAS/idempotency boundary prevents silent duplicate commits. A
future worker must mark a prior provisional handoff `SUPERSEDED` or
`requires_review` before replacing it; this slice does not overwrite existing
handoffs.

## Migration impact

No database migration. The change is additive to the existing JSON projection
and DTO. Prisma-generated types do not change. The fallback provider requires
environment configuration but is optional at boot; without it, deterministic
handoff and persisted degraded continuation still operate.

## Tests

Added implementation seams for provider fallback, pending input persistence,
deterministic handoff continuity, and idempotent retry recovery. The focused
backend suite passes: 85 tests passed and 23 database/provider integration
tests were skipped by their existing environment guards. Backend and frontend
typechecks pass.

The requested Portfolio Entry E2E was attempted but could not start because
Docker Desktop/the `postgres:16-alpine` disposable service is unavailable in
this environment. No E2E pass is claimed.

## Remaining risks

- The Core Contract authority gap remains open.
- This checkout does not prove an external fallback provider is configured or
  healthy.
- A background worker for later pending-input analysis and explicit
  `SUPERSEDED/requires_review` handoff transitions is not yet installed.
- Full provider-failure E2E requires the disposable database and controlled
  provider fixtures.
