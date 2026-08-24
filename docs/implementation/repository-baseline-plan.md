# Repository Baseline Plan - Copilot First Foundation

## Block 06A Database Isolation

E2E and pilot dry run must not use `starteria_db`.

Use:

- `starteria_e2e` via `E2E_DATABASE_URL`;
- `starteria_pilot_dry_run` via `PILOT_DRY_RUN_DATABASE_URL`;
- `PILOT_REPORT_DATABASE_URL` for report reads.

See `docs/implementation/e2e-database-strategy.md` and `docs/implementation/local-database-baseline-assessment.md`.

Fecha de auditoria: 2026-07-25
Branch auditada: `feat/copilot-first-foundation`
Alcance: linea base tecnica reproducible. No se implementaron funcionalidades Copilot-first.

## Actualizacion 2026-07-26 - cierre deuda TypeScript frontend

Objetivo ejecutado: dejar `npm run typecheck:front` en verde con correcciones minimas de tipos, sin modificar comportamiento funcional, UX, backend, Prisma, `AuthPage.tsx`, E2E ni funcionalidades Copilot-first.

### Resultado go/no-go

| Area | Estado | Evidencia |
| --- | --- | --- |
| Typecheck frontend | GO | `npm run typecheck:front` ejecuta `tsc -p tsconfig.front.json --noEmit` y finaliza con exit 0. |
| Typecheck completo | GO | `npm run typecheck` ejecuta frontend y backend, ambos con exit 0. |
| Tests y builds de validacion | GO | `test:front`, `npm test`, `build` y `build:backend` finalizaron con exit 0. |
| Errores restantes TypeScript frontend | Ninguno | No quedaron errores TS bajo `tsconfig.front.json`. |

### Errores iniciales agrupados por causa

| Categoria | Archivos afectados | Causa | Contrato canonico | Correccion minima |
| --- | --- | --- | --- | --- |
| Google button y `locale` | `src/app/components/auth/GoogleSignInButton.tsx` | Prop `locale` no existe en el wrapper tipado actual de Google Login. | Props publicas del componente instalado. | Quitar la prop no soportada sin cambiar flujo de login. |
| Respuestas discriminadas `success/error` | `DashboardPdfDropzone.tsx`, `CreateProjectPage.tsx`, `InitialReviewResultPage.tsx` | Narrowing insuficiente sobre unions success/error. | Envelope discriminada por `success: true | false`. | Usar `result.success === false` antes de leer `error`. |
| Portfolio status y tipos canonicos | Portfolio lead domain/components/pages | Maps visuales incompletos frente a unions canonical + legacy; literales inferidos como `string`. | `src/features/portfolio-lead/domain/types.ts` y helpers de selectors/copy. | Tipar maps como `Partial<Record<...>>` con fallback, anotar retornos literales y mantener status existentes. |
| Tipos/imports faltantes | Portfolio lead, telemetry, main import | Imports ausentes o imports `.tsx` no permitidos por `tsconfig.front.json`. | Exports existentes de dominio/contexto y resolucion TS normal. | Agregar imports faltantes y cambiar `./app/App.tsx` a `./app/App`. |
| Props de componentes | Step 1 V2, mentor feedback, autosave | Uso existente no coincidia con interfaces publicas. | Props reales que ya consumen las pantallas. | Declarar props opcionales usadas y pasar estructuras completas esperadas. |
| Step pages | `Step0Page.tsx`, `Step1Page.tsx`, `Step4Page.tsx` | Literales locales mas amplios/estrechos que contratos de pagina. | Tipos de `AppContext`, Step 1 modules y unions Step 4. | Reutilizar `enrichProject`, tipar ids locales y validar strings antes de setear unions. |
| Tests TypeScript | `usePortfolioData`, PDF autofill contract/upload | Fixtures e imports no alineados al contrato actual. | `InitiativePortfolioStatus`, `InitiativeStepProgressState`, default export de `api`. | Corregir fixtures canonicos y acceder a DTOs tipados sin cast a `Record`. |
| Public editor statuses | `PublicFieldDropdown.tsx` | Dropdown usaba alias `complete/needs_improvement` que no pertenecen al contrato exportado. | `PublicEditorQuestionStatus` de `PublicQuestionCard` usado por `PublicProposalEditor`. | Alinear copy e iconos a `confirmed/review/missing/ai_refined/suggestion_available`. |

### Fuentes canonicas elegidas

| Contrato | Fuente canonica |
| --- | --- |
| Project enriquecido para pantallas | `enrichProject` en `src/app/context/AppContext.tsx`. |
| Portfolio lead status, coverage y card models | `src/features/portfolio-lead/domain/types.ts`, `rules.ts`, `copy.ts` y `selectors.ts`. |
| Public editor question status | `PublicEditorQuestionStatus` exportado por `PublicQuestionCard.tsx`, consumido por `PublicProposalEditor.tsx`. |
| PDF autofill DTO/API client | `pdfAutofillService.ts` y default export de `src/app/services/api.ts`. |
| Step 0 autosave | Contrato de `useAutosave`/`AutosaveIndicator`. |

### Correcciones aplicadas

- Se removio `locale` de Google Login porque el paquete instalado no lo declara.
- Se cambio el narrowing de respuestas `success/error` a comparacion explicita contra `false`.
- Se completaron imports y props faltantes sin cambiar la UI.
- Se mantuvieron valores canonicos/legacy existentes de portfolio y se agregaron fallbacks visuales para mapas parciales.
- Se reutilizo `enrichProject` para que Step 0 reciba el mismo `Project` enriquecido que el flujo normal del contexto.
- Se corrigieron fixtures TS invalidos: `avanzando` -> `en_step_1` y `completed` -> `completado`.
- Se alineo el dropdown publico al vocabulario real del editor publico.

### Archivos modificados

| Archivo | Motivo |
| --- | --- |
| `src/app/components/auth/GoogleSignInButton.tsx` | Prop no soportada por tipos del SDK. |
| `src/app/components/DashboardPdfDropzone.tsx` | Narrowing explicito success/error. |
| `src/app/pages/CreateProjectPage.tsx` | Narrowing explicito success/error. |
| `src/features/initial-review/pages/InitialReviewResultPage.tsx` | Narrowing explicito success/error. |
| `src/app/context/AppContext.tsx` | Exportar `enrichProject` para fallback tipado de Step 0. |
| `src/app/pages/Step0Page.tsx` | Usar `enrichProject`, contrato actual de autosave e indicador. |
| `src/app/pages/Step1Page.tsx` | Tipar ids locales de modulos usados por la pagina. |
| `src/app/components/step1-architecture/step1Legacy.ts` | Preservar literales canonicos de capturas. |
| `src/app/components/step1-research-v2/Step1ResearchModuleV2.tsx` | Declarar props opcionales ya usadas. |
| `src/app/pages/Step4Page.tsx` | Validar strings antes de asignarlos a unions. |
| `src/app/pages/DashboardPage.tsx` | Comparar contra status canonico `Draft`. |
| `src/app/pages/InitiativeOverviewPage.tsx` | Pasar snapshot id solo cuando es string. |
| `src/app/pages/MentorPanelPage.tsx` | Completar timestamp requerido para feedback. |
| `src/features/initiative-review/services/initialReviewTelemetry.ts` | Declarar dimension opcional existente. |
| `src/features/portfolio-lead/domain/types.ts` | Completar campos usados por cards/selectors. |
| `src/features/portfolio-lead/domain/constants.ts` | Import canonico faltante. |
| `src/features/portfolio-lead/domain/selectors.ts` | Anotar retornos literales de cards. |
| `src/features/portfolio-lead/context/PortfolioLeadContext.tsx` | Evitar adaptadores redundantes sobre objetos ya tipados. |
| Portfolio lead cards/pages | Maps visuales parciales con fallback. |
| `src/features/public-start/components/PublicFieldDropdown.tsx` | Alinear estados al contrato publico canonico. |
| `src/main.tsx` | Import sin extension `.tsx`. |
| Tests frontend de portfolio/PDF | Fixtures canonicos e imports correctos. |

### Resultados exactos de comandos

| Comando | Resultado |
| --- | --- |
| `npm run typecheck:front` | GO. `tsc -p tsconfig.front.json --noEmit` exit 0. |
| `npm run typecheck` | GO. `typecheck:front` y `typecheck:backend` exit 0. |
| `npm run test:front -- --reporter=dot --silent` | GO. 39 archivos / 272 tests. |
| `npm test` | GO. Backend 49 archivos / 440 tests; frontend tambien pasa. Persisten warnings React `act(...)`/`forwardRef` ya conocidos. |
| `npm run build` | GO. Vite build exit 0; 2611 modules transformed; persisten warnings de chunk >500 kB y `api.ts` importado dinamica y estaticamente. |
| `npm run build:backend` | GO. `tsc -p tsconfig.backend.json` exit 0. |

### Errores restantes y decisiones de producto

No quedan errores TypeScript frontend. No se detecto una ambiguedad de producto que obligue a cambiar comportamiento. Riesgos restantes: warnings de tests React y warnings de build por chunk grande/import dinamico siguen fuera del alcance de esta correccion de tipos.

## Actualizacion 2026-07-26 - tooling reproducible y E2E local

Objetivo ejecutado: formalizar comandos de lint/typecheck, quitar la dependencia implicita de Playwright sobre `localhost:80`, agregar orquestacion E2E local y documentar el procedimiento de desarrollo. No se implementaron funcionalidades Copilot-first, no se modifico `schema.prisma`, no se cambio `AuthPage.tsx` y no se ampliaron las correcciones backend existentes.

### Resultado go/no-go

| Area | Estado | Evidencia |
| --- | --- | --- |
| Lint baseline | GO | `npm run lint` ejecuta `scripts/lint-baseline.ts` y pasa. |
| Typecheck backend | GO | `npm run typecheck:backend` ejecuta `tsc -p tsconfig.backend.json --noEmit` y pasa. |
| Typecheck frontend | NO-GO | `npm run typecheck:front` expone deuda TypeScript previa en frontend. No se oculto con exclusiones ni se intento un refactor masivo. |
| E2E infraestructura | Implementado, no ejecutable en esta maquina | `npm run test:e2e` ahora orquesta Postgres, Prisma, seed, backend, Vite y Playwright desde terminal limpia. La ejecucion local fallo porque Docker Desktop/daemon no esta disponible y no hay Postgres alternativo en `5433`. |
| Linea base completa | NO-GO | Bloqueada por errores funcionales/tipado frontend existentes bajo `tsc`, no por backend ni por tooling agregado. |

### Scripts finales

| Script | Comando | Proposito |
| --- | --- | --- |
| `npm run lint` | `tsx scripts/lint-baseline.ts` | Lint minimo reproducible con herramientas instaladas: no focused tests y no acceso directo a ai-service fuera del bridge. |
| `npm run typecheck` | `npm run typecheck:front && npm run typecheck:backend` | Typecheck completo formal. |
| `npm run typecheck:front` | `tsc -p tsconfig.front.json --noEmit` | Typecheck TS del frontend `src/**/*.ts(x)`. |
| `npm run typecheck:backend` | `tsc -p tsconfig.backend.json --noEmit` | Typecheck TS backend sin emitir `dist`. |
| `npm run test:e2e` | `tsx scripts/run-e2e.ts` | Orquesta dependencias y ejecuta Playwright. |

### Arquitectura E2E

`front/scripts/run-e2e.ts` es la orquestacion default:

1. Usa `docker compose up -d postgres` salvo `E2E_SKIP_DOCKER=true`.
2. Ejecuta `npx prisma db push` y `npm run db:seed`.
3. Levanta backend con `npx tsx ../backend/server.ts`.
4. Espera `GET /api/health`.
5. Levanta Vite con `npx vite --host 127.0.0.1 --port 5173 --strictPort`.
6. Espera disponibilidad real del frontend.
7. Ejecuta `npx playwright test`.
8. Cierra backend y frontend al terminar.

Playwright ya no usa `http://localhost` puerto 80 por defecto. `front/playwright.config.ts` usa `E2E_BASE_URL || http://127.0.0.1:5173`. El puerto 80 queda documentado como ruta Docker/Nginx legacy de `docker-compose.yml`, no como requisito arquitectonico para desarrollo local.

### E2E: dependencias por spec

| Spec | Tipo | Requiere |
| --- | --- | --- |
| `initial-review-api.spec.ts` | API | Backend, Postgres, auth register/login, mock generator por defecto. |
| `initial-review-chat.spec.ts` | API | Backend, Postgres, auth, chat events; IA real solo con `E2E_REAL_AI`. |
| `initial-review-company-context.spec.ts` | API | Backend, Postgres, empresas, auth; determinista sin `E2E_REAL_AI`. |
| `initial-review-prd-audit.spec.ts` | UI + API | Frontend, backend, Postgres, auth, flujo initial-review. |
| `public-start-access.spec.ts` | UI anonima | Frontend y backend accesible via proxy `/api`; sin auth. |
| `public-pdf-autofill.spec.ts` | UI anonima + PDF | Frontend, backend, storage local, ai-service o fallback visible de fallo. |
| `pdf-autofill.spec.ts` | API setup + UI | Auth, Project, PDF upload, extraction bridge, Step 0 UI. |
| `portfolio-steps-integration.spec.ts` | API | Seed con `admin@starteria.io`, backend, Postgres. |
| `team-inheritance.spec.ts` | API | Seed con `admin@starteria.io`, backend, Postgres. |

### Puertos y variables

| Variable | Default | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/starteria_db` | Prisma/backend local. |
| `JWT_SECRET` | `e2e-dev-secret-do-not-use-in-prod` en runner E2E | Auth backend. |
| `PORT` / `E2E_BACKEND_PORT` | `3001` | Backend Express. |
| `E2E_FRONTEND_PORT` | `5173` | Vite para Playwright. |
| `E2E_BASE_URL` | `http://127.0.0.1:5173` | Base URL Playwright/API contexts. |
| `E2E_BACKEND_HEALTH_URL` | `http://127.0.0.1:3001/api/health` | Espera de backend. |
| `E2E_SKIP_DOCKER` | `false` | Si `true`, no arranca Postgres Docker. |
| `VITE_API_URL` | `/api/v1` | Frontend usa proxy de Vite hacia backend. |
| `VITE_FEATURE_PDF_AUTOFILL` | `true` | Habilita flujos PDF en E2E. |
| `INITIAL_REVIEW_AI` | vacio | Mock/fallback determinista. |

### Limpieza de artefactos

`.gitignore` ahora cubre:

- `front/test-results/`
- `front/playwright-report/`
- `playwright-report/`
- `test-results/`
- `tmp-backend-*.log`
- `tmp-frontend-*.log`
- `*.webm`
- `*.trace.zip`
- `**/trace.zip`
- `**/screenshots/`
- `**/videos/`

No se eliminaron fixtures intencionales. `front/test-results/.last-run.json` es artefacto generado por Playwright.

### Typecheck frontend: fallos bloqueantes actuales

`npm run typecheck:front` falla por errores de producto/tipado preexistentes. Grupos principales:

| Grupo | Ejemplos |
| --- | --- |
| Contratos frontend desincronizados | Status enum/canonical en portfolio lead, challenge cards, strategic fronts. |
| Narrowing insuficiente en resultados union | `createProject`/`DashboardPdfDropzone`/`InitialReviewResultPage` leen `.error` sin narrowing reconocido por TS. |
| Tipos faltantes o imports rotos | `InsightLine`, `PortfolioLeadState`, `StrategicFrontStatusCanonical`, import `api` nombrado. |
| Step pages con literales fuera del dominio | `Step1ModuleId` recibe `"D"`/`"S"`, `Step4` strings hacia setters tipados. |
| Tests frontend incluidos en `src` | Algunos casts de mocks/DTOs requieren alineacion de tipos, no cambios de assertions. |

Estos fallos no son infraestructura E2E y no se resolvieron porque implicarian tocar muchas superficies funcionales fuera de esta tarea.

### Troubleshooting

Prisma EPERM en Windows: si `npm run db:generate` falla con `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp* -> query_engine-windows.dll.node`, cerrar procesos Node/Prisma/Vite que mantengan cargado el DLL y reintentar. No modificar `schema.prisma` para resolver este bloqueo.

Puertos ocupados: para dev local usar `PORT` o `E2E_BACKEND_PORT` para backend y `E2E_FRONTEND_PORT` para frontend. Si Docker falla, revisar `80`, `3001`, `5433` y `8001`; si ya existe Postgres usable, ejecutar `E2E_SKIP_DOCKER=true` con `DATABASE_URL` explicito.

### Resultados de validacion 2026-07-26

| Comando | Resultado |
| --- | --- |
| `npm run db:generate` | GO. Prisma Client generado; warnings de `package.json#prisma` deprecado y override por `prisma.config.ts`. |
| `npm run lint` | GO. `Baseline lint passed.` |
| `npm run typecheck` | NO-GO. Falla en `npm run typecheck:front`; no llega a backend dentro del script compuesto. |
| `npm run typecheck:front` | NO-GO. Falla con errores TS en Google button props, unions `success/error`, portfolio statuses/canonical types, Step pages, imports faltantes y tests TS. |
| `npm run typecheck:backend` | GO. `tsc -p tsconfig.backend.json --noEmit` exit 0. |
| `npm run build:backend` | GO. `tsc -p tsconfig.backend.json` exit 0. |
| `npm run build` | GO. Vite build exit 0; warnings de chunk >500 kB y `api.ts` importado dinamica y estaticamente. |
| `npm test` | GO. Backend: 49 archivos / 440 tests. Frontend incluido en el script tambien pasa; persisten warnings React `act(...)`/`forwardRef`. |
| `npm run test:front -- --reporter=dot --silent` | GO. 39 archivos / 272 tests. |
| `npm run test:e2e` | NO-GO infraestructura local. El runner inicia, pero `docker compose up -d postgres` falla: Docker daemon/pipe no disponible (`dockerDesktopLinuxEngine` no existe). Reintento elevado confirma el mismo bloqueo. `localhost:5433` no tiene Postgres alternativo. |

## Actualizacion 2026-07-25 - estabilizacion build backend

Objetivo ejecutado: dejar `npm run build:backend` en verde con correcciones minimas de TypeScript, sin tocar UI, schema Prisma, tests desactivados ni funcionalidades Copilot-first.

### Resultado backend

| Check | Estado | Evidencia |
| --- | --- | --- |
| Prisma Client `InitialReviewChatEvent` | Resuelto por regeneracion parcial | Tras ejecutar `npm run db:generate`, los errores TS de `InitialReviewChatEvent`, `InitialReviewChatRole`, `InitialReviewChatEventKind` e `initialReviewChatEvent` ya no aparecen en `npm run build:backend`. |
| `npm run build:backend` | GO | `tsc -p tsconfig.backend.json` finalizo con exit 0. |
| `npm run db:generate` | Riesgo abierto | Falla con `EPERM` al renombrar `front/node_modules/.prisma/client/query_engine-windows.dll.node.tmp*` a `query_engine-windows.dll.node`. El schema cargo correctamente y los tipos quedaron disponibles para typecheck, pero el comando no queda reproducible en esta maquina mientras el DLL este bloqueado. |

### Errores corregidos

| Error previo | Causa | Deuda previa | Cambio minimo aplicado |
| --- | --- | --- | --- |
| `InitialReviewChatEvent` no exportado por `@prisma/client` | Prisma Client local desincronizado con `front/prisma/schema.prisma`, que si contiene modelo y enums ADR-026 | Si | Se ejecuto `npm run db:generate`; aunque termino con `EPERM` en el engine DLL, los tipos generados eliminaron esos errores del build backend. No se modifico schema. |
| `string[]` no asignable a `SubscriptionStatus[]` en entitlement | `ACTIVE_STATUSES` estaba inferido como strings y luego forzado con casts | Si | `ACTIVE_STATUSES` ahora usa `SubscriptionStatus.ACTIVE` y `SubscriptionStatus.TRIALING` desde `@prisma/client`. |
| Casts de delegates Prisma a mocks Vitest en billing | Los tests reemplazan `prisma` con `vi.fn`, pero el import conserva tipos de delegate Prisma reales | Si | Se tiparon mocks con `MockFn` y cast localizado `unknown` con comentario de justificacion: el runtime esta reemplazado por `vi.mock`. |
| `AuthenticatedRequest.headers` no tipado en PDF controller | El controller necesitaba leer headers Express, pero el typecheck no los reconocia sobre `AuthenticatedRequest` | Si | Se lee `headers` desde `req as Request`, manteniendo el comportamiento y evitando cambiar tipos compartidos. |
| Mock calls posiblemente vacias en pilot-leads notifier tests | Acceso directo a `send.mock.calls[0][0]` y desestructuracion de llamadas sin validar | Si | Helpers `firstSentMessage` y `sentMessages` validan existencia antes de leer `MailMessage`. |
| Generic `Function` no satisface firma callable en steps test | Uso de `Parameters<typeof StepService.prototype['constructor']>[0]` generaba restriccion incompatible | Si | El fake Prisma se castea al contrato esperado `PrismaClient`, manteniendo el fake minimo del test. |

### Archivos modificados en esta estabilizacion

| Archivo | Motivo |
| --- | --- |
| `backend/modules/billing/entitlement.service.ts` | Tipar estados activos con enum Prisma. |
| `backend/modules/billing/__tests__/grandfather.test.ts` | Tipar mocks Prisma reemplazados por `vi.mock`. |
| `backend/modules/billing/__tests__/seed-plans.test.ts` | Tipar mocks Prisma reemplazados por `vi.mock`. |
| `backend/modules/initiative-pdfs/pdf.controller.ts` | Acceso tipado a headers Express. |
| `backend/modules/pilot-leads/__tests__/pilot-lead.notifier.test.ts` | Acceso seguro/tipado a mensajes enviados por mock mailer. |
| `backend/modules/steps/__tests__/step.service.test.ts` | Firma de fake Prisma compatible con constructor de `StepService`. |
| `docs/implementation/repository-baseline-plan.md` | Registro de estabilizacion, comandos y riesgos. |

### Resultados exactos de comandos finales

| Comando | Directorio | Resultado |
| --- | --- | --- |
| `npm run db:generate` | `front/` | Falla: Prisma carga schema/config, pero Windows devuelve `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp* -> query_engine-windows.dll.node`. |
| `npm run build:backend` | `front/` | OK: `tsc -p tsconfig.backend.json` exit 0. |
| `npm test` | `front/` | OK: backend 49 archivos / 440 tests; frontend tambien pasa dentro del script. Persisten warnings React ya registrados como deuda. |
| `npm run test:front -- --reporter=dot --silent` | `front/` | OK: 39 archivos / 272 tests. |
| `npm run build` | `front/` | OK: Vite build en 14.71s; persisten warnings de chunk >500 kB y dynamic import de `api.ts` que no separa chunk por imports estaticos. |

### Errores restantes y riesgos abiertos

| Riesgo | Estado | Siguiente accion recomendada |
| --- | --- | --- |
| `npm run db:generate` no reproducible por `EPERM` en `query_engine-windows.dll.node` | Abierto | Cerrar procesos Node/Prisma que bloqueen el DLL o regenerar en entorno limpio antes de CI/CD. No requiere cambio de schema demostrado. |
| Warnings frontend `act(...)` / `forwardRef` | Abierto, no incluido en esta tarea | Mantener como deuda frontend; no bloquea backend. |
| Playwright `localhost:80` | Abierto, fuera de alcance | No se trabajo E2E en esta tarea por restriccion explicita. |
| Lint/typecheck frontend dedicados | Abierto, fuera de alcance | No se agregaron scripts nuevos por restriccion explicita. |

## Estado actual

El repositorio operativo esta dentro de `Dashboardstarteria/front`. En la raiz de `Dashboardstarteria` no existe `package.json`, por lo que los comandos `npm` de producto deben ejecutarse desde `front/`.

Stack identificado:

| Capa | Tecnologia actual | Evidencia |
| --- | --- | --- |
| Frontend | Vite 6, React 18, React Router 7, TypeScript, Tailwind 4, Radix UI, MUI, lucide-react, axios | `front/package.json`, `front/vite.config.ts`, `front/src` |
| Backend | Node 20, Express 4, TypeScript/tsx, Zod, Pino, Helmet, CORS | `front/package.json`, `backend/server.ts`, `backend/app.ts`, `backend/config/index.ts` |
| Persistencia | PostgreSQL, Prisma 6.19, storage local para PDFs | `front/prisma/schema.prisma`, `docker-compose.yml`, `backend/config/index.ts` |
| Auth | JWT access token en memoria, refresh cookie, Google Identity opcional | `front/src/app/services/api.ts`, `backend/modules/auth` |
| IA | `ai-service` FastAPI externo en `8001`, bridge backend por token compartido, OpenRouter opcional | `docker-compose.yml`, `backend/modules/ai`, `ai-service/` |
| Tests | Vitest backend, Vitest frontend/jsdom, Playwright E2E chromium | `front/vitest.backend.config.ts`, `front/vitest.front.config.ts`, `front/playwright.config.ts` |
| Build | Vite para frontend, `tsc -p tsconfig.backend.json` para typecheck backend, Docker usa esbuild para bundle backend | `front/package.json`, `Dockerfile.backend`, `Dockerfile.frontend` |

## Scripts y comandos reales

Los scripts disponibles estan en `front/package.json`:

| Comando | Proposito | Estado actual |
| --- | --- | --- |
| `npm run dev` | Levanta Vite frontend | Esperado en `http://localhost:5173` |
| `npm run dev:backend` | Levanta backend con `tsx watch ../backend/server.ts` | Esperado en `http://localhost:3001` |
| `npm run dev:all` | Levanta frontend y backend con `concurrently` | Usa puertos 5173 y 3001 |
| `npm run build` | Build frontend Vite | Pasa |
| `npm run build:backend` | Typecheck backend con TypeScript | Falla |
| `npm test` | `test:backend` + `test:front` | Pasa |
| `npm run test:front` | Vitest frontend | Pasa |
| `npm run test:e2e` | Playwright chromium | Falla si no hay stack en `localhost:80` |

No existen scripts `lint` ni `typecheck` separados. El typecheck existente es `npm run build:backend`. No hay `tsconfig.json`, `tsconfig.app.json` ni `tsconfig.node.json` en `front/`; Vite transpila frontend sin una fase dedicada de typecheck.

## Puertos, servidores y variables

| Servicio | Como se levanta | Puerto local | Variables relevantes |
| --- | --- | --- | --- |
| Frontend dev | `cd front && npm run dev` | `5173` | `VITE_API_URL`, `VITE_FEATURE_PDF_AUTOFILL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_ENABLE_INITIAL_REVIEW` |
| Backend dev | `cd front && npm run dev:backend` | `3001` | `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `LOCAL_STORAGE_DIR`, `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`, `INITIAL_REVIEW_AI` |
| Frontend Docker | `cd front && npm run docker:up` o `docker compose up -d` desde raiz repo | `80` | Build args/env `VITE_API_URL`, `VITE_FEATURE_PDF_AUTOFILL` |
| Backend Docker | `docker compose up -d backend` | `3001` | Variables de `docker-compose.yml`; `JWT_SECRET` requerido en produccion |
| Postgres Docker | `docker compose up -d postgres` | `5433 -> 5432` | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` |
| AI service Docker | `docker compose up -d ai-service` | `8001` | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `AI_SERVICE_INTERNAL_TOKEN`, `BACKEND_WEBHOOK_URL` |

`front/src/app/services/api.ts` usa `VITE_API_URL || '/api/v1'`. En dev local, si se usa `VITE_API_URL=/api/v1`, Vite proxyea `/api` a `http://localhost:3001` mediante `front/vite.config.ts`.

## Por que Playwright usa localhost:80

`front/playwright.config.ts` define:

```ts
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost';
```

No hay `webServer` configurado. Por eso `npm run test:e2e` no levanta frontend ni backend; asume que el stack Docker ya esta arriba y que el frontend Nginx sirve en `http://localhost` puerto 80. Esta expectativa esta alineada con `docker-compose.yml`, donde `frontend` publica `"80:80"`.

Cuando el puerto 80 no tiene servidor, todos los E2E fallan con `ECONNREFUSED ::1:80` o `net::ERR_CONNECTION_REFUSED`.

## Procedimiento E2E reproducible

Procedimiento Docker esperado:

1. Desde `Dashboardstarteria`, preparar `.env` con al menos `JWT_SECRET` y credenciales Postgres compatibles con `docker-compose.yml`.
2. Ejecutar desde `front/`: `npm run db:generate` si el cliente Prisma local esta desactualizado.
3. Desde `Dashboardstarteria`: `docker compose up -d --build postgres backend frontend ai-service`.
4. Verificar disponibilidad:
   - Frontend: `http://localhost`
   - Backend health: `http://localhost:3001/api/health`
5. Desde `front/`: `npm run test:e2e`.

Procedimiento dev alternativo:

1. Levantar Postgres en `5433`.
2. Desde `front/`: `npm run db:generate && npm run db:push && npm run db:seed`.
3. Desde `front/`: `npm run dev:all`.
4. Ejecutar: `E2E_BASE_URL=http://localhost:5173 npm run test:e2e`.
5. En Windows PowerShell usar: `$env:E2E_BASE_URL='http://localhost:5173'; npm.cmd run test:e2e`.

## Resultados de comandos

| Comando | Directorio | Resultado | Observaciones |
| --- | --- | --- | --- |
| `npm run build` | `front/` | OK | Vite build completo en ~19s. Advierte chunk principal > 500 kB y un dynamic import de `api.ts` que no separa chunk porque el modulo tambien se importa estaticamente. |
| `npm run build:backend` | `front/` | Falla | TypeScript falla en tests backend, billing, initial-review, pdf controller, pilot-leads y steps. |
| `npm test` | `front/` | OK | 49 archivos backend + 39 archivos frontend; total observado: 440 backend y 272 frontend cuando se ejecutan por separado/concatenado. Hay warnings React en frontend. |
| `npm run test:front -- --reporter=dot --silent` | `front/` | OK | 39 archivos, 272 tests. |
| `npm run test:e2e` | `front/` | Falla | 16/16 tests fallan por `http://localhost` puerto 80 no disponible. |
| `npm run` | `front/` | OK | Lista scripts; confirma ausencia de `lint` y typecheck frontend dedicado. |
| `Test-Path package.json` en raiz | `Dashboardstarteria/` | False | No hay package raiz. |
| `Test-Path front/tsconfig*.json` | `Dashboardstarteria/` | False para frontend comunes | Solo existe `front/tsconfig.backend.json`. |

## Fallos y causas raiz

| Area | Fallo | Causa raiz | Deuda previa | Archivos involucrados | Correccion minima |
| --- | --- | --- | --- | --- | --- |
| Backend typecheck | Casts Prisma delegate -> mocks Vitest dan TS2352 | Los tests convierten delegates Prisma tipados directamente a tipos `Mock`, tipos incompatibles bajo TS actual | Si | `backend/modules/billing/__tests__/grandfather.test.ts`, `backend/modules/billing/__tests__/seed-plans.test.ts` | Cambiar casts a doble cast `as unknown as Mock...` o definir helpers de mock Prisma tipados. |
| Backend typecheck | `string[]` no asignable a `SubscriptionStatus[]` | Array de estados de suscripcion inferido como strings | Si | `backend/modules/billing/entitlement.service.ts` | Tipar explicitamente como `SubscriptionStatus[]` o usar constantes enum de Prisma. |
| Backend typecheck | `InitialReviewChatEvent`, roles y kind no exportados por `@prisma/client`; `initialReviewChatEvent` no existe en cliente | `front/prisma/schema.prisma` si contiene el modelo/enums, pero el Prisma Client instalado/generado no refleja el schema actual | Si, o cambio upstream no materializado localmente | `front/prisma/schema.prisma`, `backend/modules/initial-review/initial-review.service.ts`, `front/node_modules/.prisma/client` | Ejecutar `npm run db:generate` y volver a correr `npm run build:backend`. Si persiste, validar migracion/schema contra version de Prisma. |
| Backend typecheck | `headers` no existe en `AuthenticatedRequest` | Tipo compartido de request autenticado no extiende suficientemente Express Request para controladores que leen headers | Si | `backend/modules/initiative-pdfs/pdf.controller.ts`, tipo `AuthenticatedRequest` | Hacer que `AuthenticatedRequest` extienda/importa Express `Request` o tipar el controller con request Express compatible. |
| Backend typecheck | Tests de notifier con tuple/mock call posiblemente undefined | Acceso a llamadas de mock sin guardas o tipos no nulos | Si | `backend/modules/pilot-leads/__tests__/pilot-lead.notifier.test.ts` | Extraer helper `getMockCall(index)` que valide existencia o usar assertions no-null localizadas tras expectativa de llamada. |
| Backend typecheck | Generic `Function` no satisface firma callable | Tipo generico demasiado amplio en test de steps | Si | `backend/modules/steps/__tests__/step.service.test.ts` | Reemplazar `Function` por `(...args: any[]) => any` o firma exacta del metodo espiado. |
| E2E | 16/16 fallan con `ECONNREFUSED ::1:80` | Playwright no levanta servidores y default `baseURL` es `http://localhost`; el stack Docker/frontend puerto 80 no estaba disponible | No es bug funcional probado; es brecha de procedimiento | `front/playwright.config.ts`, `docker-compose.yml`, `front/e2e/*.spec.ts` | Documentar prerequisitos o agregar `webServer` opcional controlado por env. No cambiar tests para ocultar fallo. |
| Front test quality | Warnings `act(...)` en `CompanyContextSelector`/Radix Popper y warning `forwardRef` en DialogOverlay | Tests disparan updates async fuera de `act`; componente UI usado por Radix no reenvia ref | Si | `front/src/app/components/company-context/CompanyContextSelector.tsx`, `front/src/app/components/ui/dialog.tsx`, `front/src/features/initiative-review/__tests__/InitiativeReviewFlow.test.tsx` | Ajustar tests con `await waitFor`/`userEvent` completo y convertir `DialogOverlay` a `forwardRef` si aplica. |
| Tooling | No hay lint script | Baseline carece de verificacion estatica de estilo/errores comunes | Si | `front/package.json`, config ESLint ausente | Agregar ESLint en una tarea posterior si se acepta modificar tooling. |
| Tooling | No hay typecheck frontend dedicado | Vite build no hace typecheck TS completo del frontend | Si | `front/package.json`, tsconfig frontend ausente | Agregar `tsconfig.json`/`tsconfig.app.json` y script `typecheck:front` en una tarea posterior. |

## Orden recomendado de correccion

1. Regenerar Prisma Client localmente y verificar si desaparecen los errores de `InitialReviewChatEvent`.
2. Corregir errores TypeScript pequenos y localizados en tests backend: casts de billing, mock calls de pilot-leads, generic de steps.
3. Corregir el tipado de `SubscriptionStatus[]` en `entitlement.service.ts`.
4. Corregir el tipo de `AuthenticatedRequest` o el tipo del controller PDF.
5. Ejecutar `npm run build:backend` hasta dejar typecheck en verde.
6. Formalizar procedimiento E2E: documentar Docker como camino default o agregar `webServer` opt-in para dev local.
7. Ejecutar E2E con stack real y registrar fallos funcionales, si aparecen.
8. Atender warnings frontend `act(...)`/`forwardRef` sin desactivar tests.
9. Definir `lint` y typecheck frontend como mejora de tooling, despues de estabilizar backend.

## Comandos esperados para baseline estable

Desde `Dashboardstarteria/front`:

```powershell
npm.cmd run build
npm.cmd run build:backend
npm.cmd test
npm.cmd run test:front
```

Para E2E con Docker desde `Dashboardstarteria` y luego `front`:

```powershell
docker compose up -d --build postgres backend frontend ai-service
cd front
npm.cmd run test:e2e
```

Para E2E dev local desde `front`:

```powershell
npm.cmd run dev:all
$env:E2E_BASE_URL='http://localhost:5173'
npm.cmd run test:e2e
```

## Criterios de aceptacion

| Criterio | Estado actual | Criterio objetivo |
| --- | --- | --- |
| Frontend build | Cumple | `npm run build` exit 0 sin errores; warnings de chunk documentados o reducidos. |
| Backend typecheck | No cumple | `npm run build:backend` exit 0 sin usar flags ignore ni excluir tests. |
| Unit/integration tests | Cumple con warnings | `npm test` exit 0; warnings React reducidos o justificados. |
| Front tests | Cumple con warnings | `npm run test:front` exit 0; warnings reducidos. |
| E2E | No cumple sin prerequisitos | `npm run test:e2e` exit 0 despues de levantar stack documentado. |
| Lint | No disponible | Script `lint` definido y ejecutable, si se aprueba incorporar tooling. |
| Typecheck frontend | No disponible | Script frontend typecheck dedicado, si se aprueba incorporar tooling. |

## Archivos que deberan modificarse para estabilizar

Correcciones minimas probables:

| Archivo | Motivo |
| --- | --- |
| `backend/modules/billing/__tests__/grandfather.test.ts` | Casts de mocks Prisma incompatibles. |
| `backend/modules/billing/__tests__/seed-plans.test.ts` | Casts de mocks Prisma incompatibles. |
| `backend/modules/billing/entitlement.service.ts` | Tipado de estados de suscripcion. |
| `backend/modules/initiative-pdfs/pdf.controller.ts` o tipo compartido de auth request | Acceso tipado a `headers`. |
| `backend/modules/pilot-leads/__tests__/pilot-lead.notifier.test.ts` | Acceso seguro/tipado a llamadas de mocks. |
| `backend/modules/steps/__tests__/step.service.test.ts` | Firma callable concreta en lugar de `Function`. |
| `front/prisma/schema.prisma` y/o cliente Prisma generado | Verificar sincronizacion schema -> client para `InitialReviewChatEvent`. |
| `front/playwright.config.ts` | Opcional: `webServer` opt-in o mejor validacion de prerequisitos. |
| `front/package.json` | Opcional: scripts de lint/typecheck frontend. |
| `front/src/app/components/ui/dialog.tsx` | Opcional: `forwardRef` para evitar warning con Radix. |
| `front/src/features/initiative-review/__tests__/InitiativeReviewFlow.test.tsx` | Opcional: estabilizar updates async en tests. |

## Archivos tocados en esta tarea

Creado:

- `docs/implementation/repository-baseline-plan.md`

No se modifico codigo funcional, no se agregaron pruebas y no se tocaron migraciones.

Efectos colaterales de ejecucion:

- `front/test-results/.last-run.json` fue actualizado por Playwright.
- `front/test-results/*` genero artefactos de fallos E2E: screenshots, videos, traces y `error-context.md`.
