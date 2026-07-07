# Registro de Progreso — Starteria

## Estado Verificado Actual

- Raíz del repositorio: `/home/orlando/Desktop/innova-app-yape/Dashboardstarteria`
- App: vive en `front/` (Vite + backend `tsx`); Prisma + Postgres vía `docker compose`.
- Ruta de inicio estándar: `npm run dev:all`
- Ruta de verificación estándar: `npm test`
- Ruta de verificación de referencia (e2e): `cd front && npm run docker:up && npm run test:e2e` — escenario register → login → create project → PDF upload+extract → assert UI en Step 0 (`front/e2e/pdf-autofill.spec.ts`).
- Característica inacabada de mayor prioridad actual: `portfolio-steps-integration` (milestone #7 — integrar portfolio-lead con el flujo de steps del participante).
- Bloqueador actual: ninguno registrado.

## Registro de Sesiones

### Sesión 001 — bootstrap del bucle operacional

- Fecha: 2026-06-23
- Objetivo: instanciar los archivos de seguimiento de larga duración (`feature_list.json`, `claude-progress.md`, `init.sh`, `session-handoff.md`) con datos reales de Starteria y cablear el bucle operacional en `CLAUDE.md`.
- Completado: creados los 4 archivos en la raíz del repo; añadida la sección "Bucle Operacional de Implementación de Larga Duración" a `CLAUDE.md`.
- Verificación ejecutada: baseline unit (`cd front && npm test`) ✅ — backend 42 archivos / 394 tests y front 35 archivos / 212 tests (606 en total, exit 0). E2E aún no corrido (requiere stack docker).
- Evidencia capturada: salida de `npm test` (606 passing); estructura de comandos derivada de `front/package.json`; features derivadas de `git log` y `front/src/app/routes.ts`.
- Commits: `5b5ed4b` (archivos de seguimiento + bucle operacional). Este registro de verificación: commit de seguimiento.
- Archivos o artefactos actualizados: `feature_list.json`, `claude-progress.md`, `init.sh`, `session-handoff.md`, `CLAUDE.md`, `docs/templates/CLAUDE.md` (plantilla corregida).
- Riesgo conocido o problema sin resolver: varias features mergeadas (`steps-empty-start`, `portfolio-persist-mutations`, `create-project-validation`) están en `in_progress` porque no tienen verificación ejecutable registrada en este tracker — no pasan la Puerta de Completación hasta capturarla.
- Mejor próximo paso: correr `./init.sh` para confirmar que la línea base (unit tests) pasa, y luego abrir la feature `portfolio-steps-integration`.

### Sesión 002 — completar los archivos del harness

- Fecha: 2026-07-02
- Objetivo: instanciar los archivos del harness que faltaban de `docs/templates/` y cablear sus reglas en `CLAUDE.md`.
- Completado: creados en la raíz `clean-state-checklist.md`, `evaluator-rubric.md` y `quality-document.md` con datos reales de Starteria; `CLAUDE.md` actualizado (paso 7 del inicio de sesión: leer quality-document; rúbrica en la Puerta de Completación; checklist en "Antes de Detenerte").
- Verificación ejecutada: ninguna de código (sesión solo de documentación/harness; no se tocó código de la app).
- Evidencia capturada: instantánea inicial de calidad en `quality-document.md` derivada de `feature_list.json` y el log de commits.
- Commits: (ver commit de esta sesión: harness completo).
- Archivos o artefactos actualizados: `clean-state-checklist.md`, `evaluator-rubric.md`, `quality-document.md`, `CLAUDE.md`, `claude-progress.md`.
- Riesgo conocido o problema sin resolver: siguen sin evidencia ejecutable las features `steps-empty-start` (#117), `portfolio-persist-mutations` (#104) y `create-project-validation` (#91); el e2e no forma parte de la baseline de `./init.sh`.
- Mejor próximo paso: abrir la feature `portfolio-steps-integration` (prioridad 1) siguiendo el bucle operacional completo.

### Sesión 003 — fix: landing pública pedía logeo al cargar

- Fecha: 2026-07-02
- Objetivo: la landing (`/`) expulsaba al visitante anónimo hacia `/auth` al cargar; DoD: landing visible sin logeo + fix desplegado vía CI/CD.
- Completado: fix en `front/src/app/services/api.ts` (el redirect a `/auth` tras refresh fallido ahora solo aplica en rutas protegidas — nuevo `isPublicPath()`) y en `PortfolioLeadContext` (hidratación gateada por `authLoading`/`isAuthenticated`; un anónimo no dispara llamadas autenticadas). Causa raíz: `RootLayout` monta `PortfolioLeadProvider` globalmente y su hidratación (#100) hacía `GET /portfolio/strategic-fronts` sin sesión → 401 → refresh fallido → `window.location='/auth'`.
- Verificación ejecutada: `./init.sh` (unit baseline) ✅ — 394 backend + 219 front (7 tests nuevos). CI del PR #124 ✅. CD run 28633924264 ✅ (tag `v2.14.3`). Prod: `https://starter-ia.com/` → 200 y el bundle `assets/index-D9txT19V.js` contiene `isPublicPath`.
- Evidencia capturada: registrada en `feature_list.json` → `landing-public-no-auth` (passing).
- Commits: `b96e3d7` (squash del PR #124; incluye también el commit del harness `ae1a847` de la sesión 002 porque la rama nació de él). Tag `v2.14.3`.
- Archivos o artefactos actualizados: `api.ts`, `api.test.ts`, `PortfolioLeadContext.tsx`, `PortfolioLeadContext.hydration.test.tsx` (nuevo), `feature_list.json`, `claude-progress.md`.
- Riesgo conocido o problema sin resolver: `usePortfolioData.ts` (hook alterno de portfolio) solo gatea por pathname `/auth`, no por sesión — hoy vive bajo rutas protegidas, pero si se reutiliza en una ruta pública repetiría el patrón. Sin verificación e2e dedicada de la landing anónima.
- Mejor próximo paso: retomar `portfolio-steps-integration` (prioridad 1), o capturar evidencia de las 3 features `in_progress` heredadas.

### Sesión 004

- Fecha: 2026-07-04
- Objetivo: abordar `portfolio-steps-integration` para que una iniciativa creada desde un reto se materialice como Project navegable con contexto heredado en Step 0.
- Completado: `ProjectService.createProject` acepta `challengeLink`, valida el reto, crea `Project`, crea `InitiativePortfolioMeta`, hereda frente/reto/squad/meta y prellena `step0Data`; `CreateProjectPage` prellena nombre/descripción desde el reto; `project.adapter` reconstruye `challengeLink` desde `portfolioMeta`; `usePortfolioData` adapta metas backend a iniciativas frontend.
- Verificación ejecutada: `cd front && npm test` exit 0; `./init.sh` exit 0; `npm run build` exit 0; `npm run build:backend` exit 0; `cd front && npm run test:portfolio-steps` exit 0.
- Evidencia capturada: build frontend exitoso (`vite build`), build backend exitoso, baseline `./init.sh` exit 0, prueba de integración `portfolio-steps-integration OK` validando Project + InitiativePortfolioMeta + Step 0 heredado + `challengeLink` frontend.
- Commits:
- Archivos o artefactos actualizados: `backend/modules/projects/project.schemas.ts`, `backend/modules/projects/project.service.ts`, `front/src/app/context/AppContext.tsx`, `front/src/app/services/project.adapter.ts`, `front/src/app/pages/CreateProjectPage.tsx`, `front/src/app/hooks/usePortfolioData.ts`, `feature_list.json`.
- Riesgo conocido o problema sin resolver: no queda bloqueador registrado para `portfolio-steps-integration`; queda pendiente un e2e navegador si se quiere cubrir UI completa.
- Mejor próximo paso: pasar al siguiente pendiente del tracker: capturar evidencia para `steps-empty-start`.

### Sesión 005 — épico initial-review (ADR-025): IR-00 + IR-B1 + WIP

- Fecha: 2026-07-06
- Objetivo: ejecutar la secuencia WIP del épico "revisión inicial guiada" (PRD) con validación adversarial + E2E.
- IR-ADR: `backend/docs/adr/ADR-025-...md` (rama `docs/adr-025-initial-review`, commit 70753bc). Decisión: capa pre-Project que reusa `createProject` (milestone #7); no duplica Project/Step.
- IR-00 (coordinación): trial-merge de #122 sobre main → **9 conflictos** + reescribe `project.service.ts` (264 líneas). #122 está detrás de main → **requiere rebase del hermano**. No se mergea por él. Registrado como `blocked`.
- IR-B1 (backend, **passing**): modelos Prisma `InitialReview` + `InitialReviewSnapshot` + `RouteConfirmation` + `Project.{origin,initialReviewSnapshotId}`. Reusa `ChallengeType`. Idempotencia `@@unique(reviewId)`. Commit ef57486 en rama `feat/initial-review-backend`.
- Verificación IR-B1: `prisma validate` OK · `db push` OK · `npm run verify:initial-review` (round-trip + idempotencia + relaciones + cleanup contra Postgres real) → ✅ · backend unit 397/397 sin regresión.
- WIP: `feature_list.json` +8 slices del épico (IR-00..IR-F3), IR-B1 `passing`, resto `not_started`/`blocked` con verificación adversarial + E2E.
- Riesgo/pendiente: IR-B4 extenderá `createProject` que #122 también reescribe → coordinar. IR-F1..F3 bloqueados hasta landear #122. Revisión adversarial del schema en curso.
- Mejor próximo paso: incorporar hallazgos de la revisión adversarial del schema; luego IR-B2 (InitialReviewService + REST).

### Sesión 006 — épico initial-review: BACKEND COMPLETO (IR-B1..B4)

- Fecha: 2026-07-06
- Objetivo: ejecutar la secuencia WIP con validación adversarial + E2E.
- **Todo el P0 backend DONE + passing** (rama `feat/initial-review-backend`, PR #128):
    - IR-B1 modelos Prisma (endurecidos por revisión adversarial: audit-trail Restrict, @@unique snapshot, snapshot congela contexto).
    - IR-B2 InitialReviewService + REST (unit 7/7 + e2e 2/2).
    - IR-B3 AiInitialCritiqueService + guardrails §25 (unit 7/7: ruta fija, ≤3 preguntas, tipo coercido, lenguaje validación neutralizado, no inventa evidencia).
    - IR-B4 confirm-route idempotente → createProject (REUSA #7 sin tocarlo → cero conflicto con #122) + Step0 prefill (unit 5/5 + e2e confirm-route).
- Verificación: backend unit **416/416**; e2e de la cadena completa (crear→snapshot→add-context→answers→confirm-route→Project navegable+prefill→idempotente) contra Postgres real (backend local :3002).
- ADR-025 en PR #127.
- BLOQUEADO (requiere rebase de #122 por el hermano, fuera de mi alcance): IR-00, IR-F1, IR-F2, IR-F3 (frontend debe construirse sobre el árbol post-#122).
- Follow-up cross-service: endpoint /initial-review del ai-service (Python) para activar IR-B3 real (flag INITIAL_REVIEW_AI=real; mock por defecto).
- Riesgo entorno: worktree reseteado 2× por rama externa ci/auto-deploy-on-main → todo pusheado a origin.
- Mejor próximo paso: que el hermano rebase #122; luego IR-F1..F3 cablean el FE a estas APIs reales.
