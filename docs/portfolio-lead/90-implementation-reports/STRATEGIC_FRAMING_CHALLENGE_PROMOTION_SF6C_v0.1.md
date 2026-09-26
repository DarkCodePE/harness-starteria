# Strategic Framing Challenge Promotion — SF-6C / KAN-27

Estado: `GO` para revisión humana de SF-6C en `feat/KAN-27-sf6c-challenge-promotion-transaction`.

## Alcance

- No se cambió Core, arquitectura, semántica de producto, Jira ni SF-6D.
- La promoción mantiene autoridad humana, scope server-owned, Challenge en `draft` y trace atómico.
- La migración es aditiva, sin backfill: enum, tabla, índices, uniques y FK `stateId` con `ON DELETE RESTRICT`.
- `strategicFrontId`, `challengeId` y `actorUserId` no tienen FK en el trace; `challengeId` y `(stateId, challengeCandidateId)` son únicos.

## Evidencia focalizada

- `strategic-framing.promotion.service.test.ts`: **26 tests PASS**.
  - authority: portfolio_lead + permiso + scoped grant; admin-only, sponsor-only, permiso ausente, membership/grant ausente y retry reautorizado tras revocación.
  - scope: matching, mismatch, state org null, Front org null, Front ausente; el scope se obtiene del estado/Front server-owned.
  - candidate eligibility: candidato ausente, fuentes vacías/desconocidas, disposición distinta, humanDecision ausente; grouped candidate conserva todos los source ids.
  - versioning: stale `expectedVersion`, cero writes.
  - idempotency: retry exacto, retry con versión posterior, cambios en Front/title/statement/type/objective/whyNow/successCriteria/rationale.
  - payload: title/statement blank y type ausente/invalid.
  - no-side-effects: state/version y campos de downstream permanecen sin mutación; no se configuran owner/sponsor/open call/publication.
- `strategic-framing.promotion.integration.test.ts`: **6 tests PASS** contra PostgreSQL disposable real.
  - rollback si falla trace tras crear Challenge;
  - rollback si falla Challenge;
  - dos requests exactos concurrentes: una identidad durable, 1 Challenge + 1 trace;
  - requests concurrentes con payload distinto: un éxito, un `PROMOTION_CONFLICT`, 1 Challenge + 1 trace;
  - retry exacto después de revocar `portfolio:write`: `PROMOTION_FORBIDDEN`, sin writes;
  - tabla, uniques, FK restrictiva y ausencia de FKs adicionales.

## Gates

- Provision disposable DB: **PASS**, `localhost:5433`, seed E2E completado.
- Migrations deploy: **PASS**, 42 migraciones aplicadas / sin pendientes.
- Migration status: **PASS**, schema up to date.
- Prisma validate: **PASS**.
- Prisma generate: **PASS** (un primer intento paralelo dio EPERM transitorio del engine Windows; repetición aislada PASS).
- Focused SF-6C: **32/32 PASS** (26 unitarios + 6 DB-backed).
- Strategic Framing completo: **104/104 PASS**, 11 files.
- Scoped auth: **42/42 PASS**, 3 files.
- Backend full: **1123 PASS, 78 SKIP**, 129 files PASS / 17 SKIP.
- Backend typecheck: **PASS**.
- Frontend typecheck: **PASS**.
- `git diff --check`: **PASS** (Git emitió solo warnings de permisos sobre el ignore global fuera del workspace).

## Defectos de implementación

Ninguno encontrado durante la validación. La única corrección de la fase de evidencia fue ajustar el conteo de la prueba concurrente para aislar fixtures y consultar uniques como índices PostgreSQL.

## Estado

No commit, no push, no cambio Jira y no inicio de SF-6D.
