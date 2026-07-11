# Company context for initiatives

## Scope

Implements the MVP path for reusable company context:

- Personal and organization-scoped companies.
- Areas under a company.
- Versioned company context.
- Immutable initiative context snapshots.
- URL and file sources with extraction runs.
- Context score calculated in backend.
- Initial-review flow can carry a selected company/area and creates the initiative snapshot when the route is confirmed.

## Backend

Routes are mounted under:

- `/api/v1/companies`
- `/api/v1/initiatives/:initiativeId/company-context`
- `/api/v1/initiatives/:initiativeId/context-notes`
- `/api/v1/initiatives/:initiativeId/context-export`

The company module follows the existing router/controller/service shape and returns the standard `{ success, data }` envelope.

Authorization is resource-based:

- Personal owner can edit their company.
- Approved company members can read.
- OWNER/CURATOR/EDITOR can edit.
- OWNER/CURATOR/admin can publish and review contributions.
- Admin can access all companies.

## Data model

Migration: `front/prisma/migrations/20260711120000_company_context/migration.sql`.

Main tables:

- `Company`
- `CompanyMembership`
- `CompanyContextVersion`
- `CompanyContextEntry`
- `CompanyArea`
- `CompanyAreaContext`
- `ContextSource`
- `ContextExtractionRun`
- `InitiativeContextSnapshot`
- `InitiativeContextNote`
- `CompanyContribution`

Snapshots use restrictive foreign keys so initiative history is not removed when a company changes later.

## Extraction

Website extraction runs in backend with SSRF protection before any fetch:

- Only `http` and `https`.
- DNS validation.
- Local/private IP and metadata endpoint blocking.
- Manual redirect handling.
- Redirect, timeout and response-size limits.

The backend stores raw/clean content and calls ai-service:

- `/api/v1/ai/context-extract`
- `/api/v1/ai/context-extract-file`

The ai-service worker treats content as untrusted data and returns inferred entries. It does not execute or obey instructions inside documents.

LinkedIn is best effort only. It never logs in, bypasses blocks, solves captchas or accesses private pages. If blocked, the source is marked `BLOCKED`.

Files:

- PDF is parsed in ai-service with `pypdf`.
- DOCX is parsed from OOXML text.
- Markdown is read as sanitized text.
- DOC binary is rejected unless a safe conversion pipeline is added later.

## Context score

`backend/modules/companies/context-score.ts` centralizes "Nivel de contexto disponible".

Weights:

- Coverage: 60
- Evidence: 25
- Freshness/consistency: 15

Levels:

- `INITIAL`: 0-29
- `BASIC`: 30-59
- `USEFUL`: 60-79
- `SOLID`: 80-100

The score never blocks initiative creation.

## Initial-review integration

`/initiatives/new` stores an optional `companyContext` selection on `InitialReview` and `InitialReviewSnapshot`. `confirm-route` passes the selection to `ProjectService.createProject`, which creates `InitiativeContextSnapshot` in the same transaction as the project.

Later company changes do not mutate old initiative snapshots. Manual sync is available through:

`POST /api/v1/initiatives/:initiativeId/company-context/sync`

## Environment

Optional variables:

- `CONTEXT_SOURCE_MAX_BYTES`
- `CONTEXT_WEB_MAX_BYTES`
- `CONTEXT_WEB_TIMEOUT_MS`
- `CONTEXT_WEB_MAX_REDIRECTS`

Defaults are defined in `backend/modules/companies/context-utils.ts`.
