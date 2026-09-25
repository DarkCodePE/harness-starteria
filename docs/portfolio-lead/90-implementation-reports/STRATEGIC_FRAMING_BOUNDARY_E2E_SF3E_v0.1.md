# Strategic Framing Boundary E2E — SF-3E v0.1

**Estado:** `GO_WITH_GAPS`; harness implementado, ejecución Level B bloqueada por el entorno Docker.

## Alcance

Se añadió `front/e2e/strategic-framing-multi-entry.spec.ts`, reutilizando la configuración Playwright existente, el runner `front/scripts/run-e2e.ts` y la base de datos E2E desechable. No se modifican runtime productivo, Core, Prisma, migraciones, CI ni Copilot.

## Escenarios e invariantes

| Escenario | Cobertura |
|---|---|
| Enterprise Direct | estado provisional, `challenge_like` con padre no resuelto, provenance declarada, retry idempotente, workspace, corrección, refresh y guardia canónica |
| Stale write | versión N, actualización autorizada N+1, rechazo 409 sin overwrite y lectura explícita de la versión vigente |
| Existing Portfolio / Strategic Front | lectura por referencia, `sourceMode`, padre conocido, retry y valores/cantidades canónicas sin cambios |

La matriz completa de Public Entry, Challenge e Initiative queda como gap de ejecución/fixtures para una siguiente iteración del harness. En particular, el recorrido público requiere una sesión Bootstrap con lectura `HOME_D/HOME_E`; no se fabrica una fixture que relaje esa frontera.

## Autoridad y guardrails

```text
V2_CHANGE_GUARDRAIL_CHECK
- slice: SF-3E boundary verification
- Core change: NO
- ADR: NO
- schema/migration: NO
- productive runtime change: NO
- second E2E framework: NO
- canonical promotion: NO
```

## Pre-commit completeness check

Source modes and exact tests:

- `public_entry`: `public entry is gated by Bootstrap first reading and reuses one provisional state`
- `enterprise_direct`: `enterprise direct converges on one provisional workspace without canonicalization`
- `existing_portfolio`: `existing strategic front is read into provisional framing and remains unchanged`

Boundary mapping:

- `challenge_like + unresolved parent`: `enterprise direct converges on one provisional workspace without canonicalization`
- correction + history + refresh/re-entry: `public entry is gated by Bootstrap first reading and reuses one provisional state`
- provenance: Public Entry test; Enterprise Direct provenance assertion
- stale write rejected + explicit reload gets latest: `stale write is rejected and explicit reload obtains the latest version`
- no Copilot required: Public Entry and Enterprise Direct tests assert zero `/api/v1/copilot` requests
- no canonicalization: Public Entry, Enterprise Direct and Existing Portfolio canonical count guards
- cross-org denied: `cross-org existing Portfolio source is denied`
- independent initiative not attached: `independent initiative is rejected and is not attached`; skips only when the disposable seed lacks that fixture

The Public Entry test exercises the real chain: `/public/start` → authenticated continuation → Portfolio Bootstrap → published `HOME_D`/`HOME_E` reading → `Continuar a Strategic Framing` → `/portfolio/framing/:stateId`. It asserts the CTA is absent before the governed reading, no direct framing URL is entered, one SF state is reused, provenance/source refs survive, owner fields are not introduced, correction history survives refresh, and canonical counts remain unchanged.

Evidence levels:

- Level A hermetic/static evidence: `PASS` — spec TypeScript load check, Playwright discovery, backend/frontend typechecks, frontend build and `git diff --check`.
- Level B browser E2E execution: `BLOCKED_BY_ENVIRONMENT` — Docker daemon unavailable before disposable PostgreSQL provisioning.
- Level C production runtime certification: `NOT_RUN`.

Exact static commands:

```text
npx playwright test e2e/strategic-framing-multi-entry.spec.ts --list
PASS (0) FAIL (0) skipped (6)

npx tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck e2e/strategic-framing-multi-entry.spec.ts
TypeScript: No errors found
```

## Ejecución prevista

```text
npm run test:e2e -- e2e/strategic-framing-multi-entry.spec.ts
npm run test:backend -- strategic-framing
npm run test:front -- StrategicFraming
npm run typecheck:backend
npm run typecheck:front
npm run build
git diff --check
```

Resultados observados el 2026-09-25:

- `npm run test:e2e -- e2e/strategic-framing-multi-entry.spec.ts`: `NOT_RUN`; el runner no pudo levantar PostgreSQL porque el daemon Docker no está disponible (`//./pipe/docker_engine`, `postgres:16-alpine`).
- `npm run typecheck:backend`: PASS.
- `npm run typecheck:front`: PASS.
- `npm run build`: PASS, con warnings preexistentes de chunk grande/import dinámico.
- `npx playwright test ... --list`: el spec es reconocido; ejecución real no iniciada.
- `git diff --check`: PASS.

No se reporta Level B como PASS y no se declara certificación Level C.

## CI y gaps

Clasificación inicial: `LOCAL_HARNESS_ONLY`. No se modifica `.github/workflows/ci.yml`.

Gaps restantes: Public Entry gobernado completo, reverse alignment de Challenge e Initiative con fixtures canónicas, autorización cross-user/cross-org a nivel browser y certificación runtime externa. La brecha conocida de picker por ID manual de Existing Portfolio permanece `TECHNICAL_ONLY_GAP`.

## Required final report

```text
SF-3E STATUS: GO_WITH_GAPS

BRANCH: test/strategic-framing-sf3e-boundary-e2e
BASE HEAD: ancestor 094e348ac879b376034843aa2d89c90e778c26e9

AUTHORITY:
- Core change required: NO
- ADR required: NO
- schema change required: NO
- productive runtime changed: NO

HARNESS:
- dedicated SF-3E Playwright spec: YES
- existing Playwright infrastructure reused: YES
- second E2E framework introduced: NO
- CI classification: LOCAL_HARNESS_ONLY

TEST EXECUTION:
- SF-3E Playwright: NOT_RUN — Docker daemon unavailable before provisioning
- backend typecheck: PASS
- frontend typecheck: PASS
- frontend build: PASS
- git diff --check: PASS

PRODUCT BUGS DISCOVERED:
<none; no browser execution was possible>

IMPLEMENTATION REPORT:
docs/portfolio-lead/90-implementation-reports/STRATEGIC_FRAMING_BOUNDARY_E2E_SF3E_v0.1.md

FILES CHANGED:
- front/e2e/strategic-framing-multi-entry.spec.ts
- docs/portfolio-lead/90-implementation-reports/STRATEGIC_FRAMING_BOUNDARY_E2E_SF3E_v0.1.md

REMAINING GAPS:
Public Entry HOME_D/HOME_E path, Challenge/Initiative reverse alignment, browser authorization matrix, and Level B runtime execution → follow-up once Docker/PostgreSQL/Chromium are available.

READY FOR HUMAN REVIEW:
YES

READY TO COMMIT:
YES
```

## Pre-commit final status (2026-09-25)

```text
SF-3E PRE-COMMIT STATUS: GO_WITH_GAPS

SOURCE MODES:
- public_entry represented: YES
- enterprise_direct represented: YES
- existing_portfolio represented: YES

BOUNDARY COVERAGE:
- unresolved parent: PASS (Enterprise Direct)
- correction + history: PASS in harness; browser execution not run
- refresh/re-entry: PASS in harness; browser execution not run
- provenance: PASS in harness; browser execution not run
- stale write: PASS in harness; browser execution not run
- no Copilot: PASS in harness; browser execution not run
- no canonicalization: PASS in harness; browser execution not run
- authorization: PARTIAL — cross-org covered; cross-user/missing-permission browser matrix remains

PLAYWRIGHT:
- dedicated spec discovered: YES
- static/list validation: PASS
- browser execution: BLOCKED_BY_ENVIRONMENT
- exact blocker: Docker daemon unavailable at //./pipe/docker_engine before disposable PostgreSQL provisioning

VALIDATION:
- backend typecheck: PASS
- frontend typecheck: PASS
- frontend build: PASS
- git diff --check: PASS

FILES CHANGED:
- front/e2e/strategic-framing-multi-entry.spec.ts
- docs/portfolio-lead/90-implementation-reports/STRATEGIC_FRAMING_BOUNDARY_E2E_SF3E_v0.1.md

READY TO COMMIT:
YES
```
