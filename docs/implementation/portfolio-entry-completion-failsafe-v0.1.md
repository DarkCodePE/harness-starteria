# Portfolio Entry Completion Fail-safe v0.1

Status: `IMPLEMENTED_VERIFIED_PENDING_E2E`  
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

## E2E regression and confirmed root cause

PR #47 reproduced a first `POST /public/portfolio-entry/sessions/:id/messages`
as HTTP 409. The exact path is confirmed: `persistPendingInput()` created a
session object at client revision `R`, while
`PrismaPortfolioEntrySessionRepository.saveSessionState()` requires the saved
object to be at `expectedRevision + 1`. The CAS conflict happened before model
analysis. The later `appendTurn()` and `markPendingInputFailed()` also reused
the client revision, which would be invalid after accepting input.

The PostgreSQL `E57P01` message occurs during CI cleanup after Playwright has
already failed and is not the root cause.

## Revision model before and after

Before, the request used `R` for pending persistence, analysis completion, and
failure persistence. Under Prisma CAS, pending persistence therefore failed
because a state mutation must carry `revision = expectedRevision + 1`.

After:

```text
client revision R
  -> pending input accepted at R+1
  -> analysis and turn committed at R+2
```

If the provider fails:

```text
client revision R
  -> pending input accepted at R+1
  -> FAILED_RETRYABLE persisted at R+2
```

The first `/messages` 409 is eliminated without bypassing CAS.

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

## Revision and persistence design

Pending input is stored additively inside the existing `semanticState` JSON;
no Prisma schema or migration is required. It contains a stable input id,
value, lifecycle status, timestamps, and explicit `USER_DECLARED` provenance.
The conceptual statuses are `RECEIVED`, `ANALYSIS_PENDING`, `ANALYZED`,
`FAILED_RETRYABLE`, and `SUPERSEDED`. The active failed path exposes
`FAILED_RETRYABLE`; successful analysis records `ANALYZED` plus
`analysisVersion`. Pending input is never supplied as confirmed semantic
context.

The existing idempotency record and session CAS remain the commit boundary.
The returned session from pending persistence supplies the expected revision
for every subsequent mutation. The exact progression is `R -> R+1` for
accepted input and `R+1 -> R+2` for either the analyzed turn or the persisted
retryable failure. Recovery uses the persisted pending input identifier,
pending status, message value, and turn evidence; it no longer assumes one
session mutation per request. A fresh idempotency key retries the same pending
input without creating a second logical turn.

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

## Tests run

The focused backend suite passes:

```text
npm run test:backend -- portfolio-entry.router.test.ts portfolio-entry-session.service.test.ts
19 router tests + 27 session tests = 46 passed
```

This covers first-submit revision progression, provider-failure persistence,
same-answer retry without duplicate turn, response-loss recovery, CAS race
protection, and existing router behavior. The Prisma integration suite now
contains an explicit `persistPendingInput`/`assertNextRevision` regression
case, but remains environment-gated. Frontend tests and
`front/e2e/portfolio-entry-conversion.spec.ts` still require the complete CI
database/browser environment.

The requested Portfolio Entry E2E was attempted but could not start because
Docker Desktop/the `postgres:16-alpine` disposable service is unavailable in
this environment. No E2E pass is claimed.

## Remaining risks

- The Core Contract authority gap remains open.
- This checkout does not prove an external fallback provider is configured or
  healthy.
- Prisma integration and full Playwright E2E still require the disposable
  PostgreSQL environment.
- A background worker for later pending-input analysis and explicit
  `SUPERSEDED/requires_review` handoff transitions is not yet installed.
- Full provider-failure E2E requires the disposable database and controlled
  provider fixtures.
