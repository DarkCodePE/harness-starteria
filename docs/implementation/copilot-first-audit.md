# Copilot-first PRD Audit

Fecha de auditoria: 2026-07-25

Alcance: lectura completa de `docs/prds/copilot-first-v1/` y auditoria del repositorio actual. No se implementaron cambios funcionales.

## Resumen ejecutivo

Starteria ya tiene una base real para iniciativa guiada, Step 0-4, Portfolio Lead, autenticacion, Prisma/PostgreSQL, AI bridge, PDF autofill, contexto de empresa, billing y tests unitarios/integracion. El paquete Copilot-first no esta implementado como arquitectura transversal: no existen entidades `CopilotConversation`, `CopilotActionPlan`, `ProposedAction`, `ActionExecution`, Capability Registry ni comandos de dominio idempotentes expuestos para orquestacion conversacional.

El flujo actual es "dashboard/form-first con asistencias IA puntuales", no "Copilot-first". Hay persistencia parcial en Portfolio Lead, pero tambien fixtures y acciones frontend-only que aparentan funcionalidad. El mayor riesgo para implementar PRD-00A es acoplar un chat directo a los stores actuales y permitir mutaciones sin preview, aprobacion, idempotencia y comando de dominio.

## Stack actual

| Capa | Stack actual | Evidencia |
| --- | --- | --- |
| Frontend | React 18, Vite 6, React Router 7, TypeScript, Tailwind 4, MUI, Radix, lucide-react, axios | `front/package.json`, `front/src/app/routes.ts`, `front/src/main.tsx` |
| Backend | Express 4, TypeScript, Prisma Client, Zod, pino, helmet, cors | `backend/app.ts`, `backend/server.ts`, `backend/modules/*` |
| Persistencia | PostgreSQL via Prisma. Schema vive en `front/prisma/schema.prisma`; backend usa `backend/shared/db/prisma.ts` | `front/prisma/schema.prisma` |
| Auth | Email/password, Google OAuth, JWT/refresh tokens, roles `participante`, `mentor`, `admin`, `sponsor`, `colaborador`, `viewer` | `backend/modules/auth/*`, `front/src/app/services/auth.service.ts` |
| IA | AI service externo detras de bridge backend; endpoints de refinamiento, PDF extraction, initial-review real opcional; fallback mock para initial-review | `backend/modules/ai/bridge.service.ts`, `backend/modules/public-ai/*`, `backend/modules/initial-review/*` |
| Testing | Vitest backend/front, Testing Library, Supertest, Playwright E2E | `front/package.json`, `front/vitest.*.config.ts`, `front/e2e/*` |

## Mapa de rutas actual

| Ruta | Layout | Pantalla | Estado funcional |
| --- | --- | --- | --- |
| `/` | `RootLayout` | `LandingPage` | Publica |
| `/auth` | `RootLayout` | `AuthPage` | Auth |
| `/auth/continue/:draftId` | `PublicLayout` | `ProgressiveSignupPage` | Conversion publica |
| `/public/start` | `PublicLayout` | `PublicStartPage` | Draft publico + PDF/local storage |
| `/public/start/initiative` | `PublicLayout` | `PublicInitiativeStartPage` | Entrada publica |
| `/public/continuar` | `PublicLayout` | `PublicResumeWithCodePage` | Claim piloto |
| `/public/draft/:draftId/edit` | `PublicLayout` | `PublicProposalEditorPage` | Editor publico |
| `/public/draft/:draftId/result` | `PublicLayout` | `PublicProposalResultPage` | Resultado publico |
| `/dashboard` | `AppLayout` | `DashboardPage` | Dashboard autenticado |
| `/initiatives/new` | `AppLayout` | `InitiativeReviewStartPage` | Revision inicial API real |
| `/initiatives/review/:reviewId` | `AppLayout` | `InitiativeReviewResultPage` | Snapshot + confirm-route |
| `/initiatives/:projectId/overview` | `AppLayout` | `InitiativeOverviewPage` | Overview post-confirmacion |
| `/projects/new` | `AppLayout` | `CreateProjectPage` | Creacion legado |
| `/projects/:projectId` | `AppLayout` | `ProjectHomePage` | Home iniciativa |
| `/projects/:projectId/step/0..4` | `AppLayout` | `Step0Page` a `Step4Page` | Core Steps |
| `/projects/:projectId/evidencias`, `/evidencias` | `AppLayout` | `EvidenciasPage` | Evidencia |
| `/companies` | `AppLayout` o portfolio | `CompaniesPage` | Contexto empresa |
| `/mentor`, `/admin`, `/perfil` | `AppLayout` | paneles administrativos/personales | Existente |
| `/portfolio/inicio` | `PortfolioLeadLayout` | `PortfolioLeadHomePage` | Home portfolio sin Copilot |
| `/portfolio/iniciar` | `PortfolioLeadLayout` | `PortfolioLeadStartPage` | Arranque/atajo portfolio |
| `/portfolio/frentes-estrategicos` | `PortfolioLeadLayout` | `PortfolioLeadStrategicFrontsPage` | Frentes |
| `/portfolio/retos` | `PortfolioLeadLayout` | `PortfolioLeadChallengesPage` | Retos |
| `/portfolio/iniciativas` | `PortfolioLeadLayout` | `PortfolioLeadInitiativesPage` | Iniciativas |
| `/portfolio/decisiones` | `PortfolioLeadLayout` | `PortfolioLeadDecisionsPage` | Decisiones |
| `/portfolio/salida-ejecutiva` | `PortfolioLeadLayout` | `PortfolioLeadExecutiveOutputPage` | Output ejecutivo |
| `/portfolio/sponsors`, `/portfolio/reportes` | `PortfolioLeadLayout` | `PortfolioLeadSectionPage` | Secciones genericas/parciales |

## Flujo actual de Portfolio Lead

1. `PortfolioLeadProvider` inicializa estado con mocks si `enableDemoData` esta activo y, al autenticar, hidrata desde `/api/v1/portfolio/strategic-fronts`.
2. Home (`PortfolioLeadHomePage`) muestra welcome banner, acciones primarias, mapa estrategico, snapshot ejecutivo y actividad reciente.
3. Acciones estructuradas permiten crear/editar frentes y retos, cambiar activacion, publicar reto, gestionar invitaciones/squad, editar metadatos de iniciativa y generar output ejecutivo.
4. El backend persiste `StrategicFront`, `Challenge`, `ChallengeInvitation`, `ChallengeSquadMember`, `ChallengeTeamMember`, `InitiativePortfolioMeta`, `InitiativeOverlap`, `ExecutiveOutput`.
5. No existe Copilot principal, Action Plans pendientes, aprobacion parcial, ejecucion por comando de dominio, ni proyeccion conversacion-dashboard.

## Flujo actual de creacion de iniciativas

| Entrada | Flujo | Persistencia | Observacion |
| --- | --- | --- | --- |
| `/initiatives/new` | Texto libre -> `createReview` -> snapshot -> resultado -> `confirm-route` -> Project -> Overview | `InitialReview`, `InitialReviewSnapshot`, `RouteConfirmation`, `Project`, `Step`, `Module`, `InitiativePortfolioMeta` si aplica | Es el flujo mas cercano a PRD-02. Por defecto backend usa mock determinista salvo `INITIAL_REVIEW_AI=real`. |
| `/projects/new` | Formulario legado -> `ProjectService.createProject` | `Project`, `Step`, `Module`, `TeamMember` | Crea Step 1-4 y Step 0 solo como data/status en Project, no como `Step` numero 0. |
| Reto Portfolio -> iniciativa | `ProjectService.createProject` con `challengeLink` o `challengeId` | Project + meta portfolio + team heredado | Parcialmente integrado con reto/frente. |
| Public start | Draft anonimo en browser + pilot lead/claim posterior | `PilotLead`, `PilotClaimToken` solo al capturar/claim; draft original local | Muchas pantallas publicas usan local/session storage hasta conversion. |

## Componentes reutilizables de conversacion/IA

No hay componente de chat conversacional reutilizable ni shell Copilot. Reutilizables actuales:

| Componente/servicio | Uso actual | Reutilizable para Copilot-first |
| --- | --- | --- |
| `InitiativeComposer` | Entrada de revision inicial autenticada | Base para captura de texto/contexto, no historial conversacional |
| `InitialReviewResultPage` y cards | Interpretacion, preguntas, ruta, confirmacion | Patrones de preview/confirmacion |
| `FeedbackIAPanel`, `MentorVirtualPanel`, `MentorSupportModal` | Asistencia IA/mentor en Steps | UI de feedback, no orquestador |
| `PublicAIAssistPanel`, `PublicProposalEditor` | Refinamiento publico de propuesta | Patron aceptar/editar sugerencias |
| `AutofillField`, `AutofillHydrator`, `ProvenancePopover` | Propuestas IA por campo con confirmacion | Muy util para fuente/confianza/propuesta antes de escribir |
| `PortfolioLeadHomeExperience` | Home ejecutivo, attention queue visual | Superficie destino para proyeccion, no Copilot |

## Servicios y endpoints IA actuales

| Endpoint | Servicio | Persistencia | Estado frente a PRD-08 |
| --- | --- | --- | --- |
| `POST /api/v1/ai/refine-field` | Authenticated AI bridge -> `RefineFieldService` | Usage metering; no mutacion directa | Parcial: bridge y metering, no Capability Registry |
| `POST /api/v1/public/refine-field` | Public refine | No business persistence | Parcial: fallback local en frontend |
| PDF authenticated/public | `initiative-pdfs` + ai-service + webhook | `InitiativePdf`, `PdfExtractionRun`, `PdfFieldProposal` | Parcial: fuente/confianza/propuestas, confirmacion por campo |
| Initial review | `InitialReviewService` + generator real/mock | `InitialReviewSnapshot` | Parcial: snapshot y rutas, default mock |
| Company context extraction | `companies/context-ai-client.ts` | `ContextSource`, `ContextExtractionRun`, entries | Parcial por contexto empresa |

No existen endpoints `POST /copilot/conversations`, `/messages`, `/assess`, `/action-plans/:id/approve`, `/execute` ni `/retry`.

## Mapa de entidades

| Dominio PRD | Entidades actuales | Gaps |
| --- | --- | --- |
| Usuarios/permisos | `User`, `Role`, `TeamMember`, `ChallengeTeamMember`, `Organization`, `OrganizationMember`, auth middleware `authenticate`, `requireRole`, entitlements | No hay rol `portfolio_lead` real; permisos por capability no existen |
| Workspaces | `Company`, `Organization`, `Project`, `Cohort`, campos `organizationId` | No existe `Workspace` con tipos `initiative/personal_strategic/team/portfolio`, conversion ni selector progresivo |
| Frentes | `StrategicFront` | Falta comando idempotente/audit/capability |
| Retos | `Challenge`, invitations, squad, team | Parcial: status y activacion, sin Action Plan |
| Iniciativas | `Project`, `InitiativePortfolioMeta`, `InitialReview`, `RouteConfirmation` | No hay `Initiative` separada de Project; Step 0 no es `Step` persistido |
| Steps | `Step`, `Module`, `FeedbackIA`, `Run`; `Project.step0Data/step0Status` | Configuracion por ruta adaptativa no modelada |
| Evidencia | `Evidence`, `InitiativePdf`, `PdfFieldProposal`, context sources | Evidencia no versionada por contexto PRD-04 |
| Context/versioning | `CompanyContextVersion`, `InitiativeContextSnapshot`, `InitialReviewSnapshot` | No existe `InitiativeContextVersion` ni `ContextChangeRequest` |
| Valor/decision | `ExecutiveOutput`, `PortfolioDecisionItem` frontend/mock, sponsor fields | No hay `ValueCase`, `ReadinessAssessment`, `Handoff`, `Decision` persistidos como PRD-07 |
| Cohortes | `Cohort` simple ligada a Project/User | No hay CandidateBacklog, CapacityPlan, PrioritizationAssessment, CohortSelection |
| Copilot | Ninguna entidad | Falta todo el bounded context Copilot |

## Mapa de dependencias recomendado

```text
Feature flags
  -> Copilot bounded context (schemas + storage + audit)
    -> Capability Registry (PRD ownership + permissions)
      -> PRD-02 assessment adapter
      -> PRD-06 command adapters for CreateStrategicFront/CreateChallenge
      -> ActionPlan preview/approval/execution
        -> dashboard projection in Portfolio Home
          -> PRD-05/04/10/07 extensions
```

Dependencias tecnicas existentes:

```text
front services -> /api/v1/* -> Express routers -> service classes -> Prisma
AI callers -> backend/modules/ai/bridge.service.ts -> ai-service
Initial review -> InitialReviewService -> generator mock/real -> RouteConfirmationService -> ProjectService
Portfolio Lead -> PortfolioLeadContext -> portfolioService -> PortfolioService -> Prisma
```

## Matriz PRD -> requisito -> codigo

| PRD | Requisito/capacidad | Codigo actual | Estado | Evidencia | Gap | Dependencia | Riesgo |
| --- | ------------------- | ------------- | ------ | --------- | --- | ----------- | ------ |
| PRD-00A | Shell conversacional en Home Portfolio Lead | No existe | not_started | `PortfolioLeadHomePage` solo renderiza banner/acciones/mapa | Crear UI conversacional, historial y estados | Feature flag + Copilot API | Romper Home si se reemplaza en vez de coexistir |
| PRD-00A | Intent assessment + capability routing | Initial-review diagnostica una entrada inicial | partial | `backend/modules/initial-review/*` | No sirve como router transversal ni devuelve capabilities PRD | PRD-02/08 | Duplicar logica en chat |
| PRD-00A | Action Plan versionado con acciones dependientes | No existe | not_started | Sin modelos Copilot en Prisma | Modelos, schemas, endpoints y UI | Capability Registry | IA podria mutar sin aprobacion |
| PRD-00A | Preview, aprobacion total/parcial, editar/rechazar | Autofill/initial-review tienen confirmaciones puntuales | partial | `AutofillField`, `InitialReviewResultPage` | No hay aprobacion por accion ni payload editable general | ActionPlan | Aprobaciones inconsistentes |
| PRD-00A | Ejecucion idempotente por comandos de dominio | Route confirmation tiene idempotencia; billing usage tambien | partial | `RouteConfirmation.reviewId @unique`, `UsageEvent.dedupeKey` | No hay idempotency ledger de Copilot ni command handlers | Domain commands | Doble click puede duplicar frentes/retos |
| PRD-00A | Dashboard projection y errores parciales | Portfolio actualiza estado optimista y revierte en errores | partial | `PortfolioLeadContext.persistCreate/persistUpdate` | No hay `ActionExecution` ni proyeccion auditable | Portfolio services | Chat podria afirmar exito sin confirmacion |
| PRD-00A | Audit log y permisos por capability | `AuditLog` existe; roles por router | partial | `front/prisma/schema.prisma`, `portfolio.router.ts` | No se escribe audit log por accion Copilot; no capability permissions | Auth + Registry | Brecha enterprise |
| PRD-01 | Crear iniciativa independiente | Existe | implemented_unverified | `ProjectService.createProject`, `/projects/new`, `/initiatives/new` | Step 0 modelo inconsistente | Tests unitarios pasan, E2E bloqueado | Legacy puede divergir del nuevo flow |
| PRD-01 | Personal Strategic Workspace | No existe como workspace tipado | not_started | Sin modelo `Workspace` | Modelar workspace progresivo | Schema backward-compatible | Sobrecargar Project/Company |
| PRD-01 | Team Workspace | Parcial via TeamMember/ChallengeTeamMember | partial | `TeamMember`, `ChallengeTeamMember` | No workspace team ni conversion | Auth/RBAC | Permisos ambiguos |
| PRD-01 | Portfolio Workspace | Parcial via Portfolio Lead + Organization | partial | `/portfolio/*`, `StrategicFront`, `Challenge` | No `Workspace.type=portfolio` ni selector | Org model | Tenant isolation incompleta |
| PRD-01 | Recomendacion de workspace | Initial-review sugiere ruta/tipo de reto, no workspace real | partial | `InitialReviewSnapshot` sin Workspace | Reglas PRD-01 + UI "como gestionarlo" | PRD-02 | Crear iniciativas prematuras |
| PRD-01 | Conversion sin perdida | No existe | not_started | Sin `convertedFromWorkspaceId` | Conversion commands y snapshots | PRD-04 | Perdida de historico |
| PRD-02 | Entrada libre para distintas clases de trabajo | Existe en `/initiatives/new` | partial | `InitiativeComposer`, `createReview` | No cubre portfolio_operation/read_only_query | PRD-00A | Interpretar todo como iniciativa |
| PRD-02 | Maximo tres preguntas adaptativas | Parcial | partial | `strategicQuestions` mock/real, tests front | No enforcement transversal | Generator/schema | Preguntas duplicadas entre motores |
| PRD-02 | Corregir interpretacion/versionar | Add-context versiona snapshot; seleccion tipo reto limitada | partial | `addContext`, `InitialReviewSnapshot.version` | No diff/before-after general | PRD-04 | Versiones incompletas |
| PRD-02 | Confirmacion crea snapshot y abre Overview | Existe para initial-review | implemented_unverified | `RouteConfirmationService`, `InitiativeOverviewPage` | E2E no verificado por servidor ausente | ProjectService | Bug no detectado en integracion real |
| PRD-02 | Funcionar fuera de onboarding | No existe | not_started | Sin router Copilot | Adapter de assessment reutilizable | PRD-00A | Duplicacion |
| PRD-02 | Diferenciar fuente/inferencia/supuesto | Parcial en PDF/autofill/context | partial | `PdfFieldProposal`, context entries | No contrato uniforme en review | PRD-08 | Confianza no auditable |
| PRD-03 | Core Step 0-4 | Parcial | partial | `Step0Page` y `Step1Page`-`Step4Page`; `DEFAULT_STEPS` crea 1-4 | Step 0 no es `Step` en tabla; rutas adaptativas no modeladas | ProjectService | Cambiar Step model rompe pantallas |
| PRD-03 | Dashboard adaptativo por ruta | No implementado | not_started | Steps fijos: "Claridad", "Disenar", "Probar", "Contar" | `StepRouteConfiguration` y copy por route | PRD-02 | Implement/handoff forzado a ideacion |
| PRD-03 | Ancla de contexto vigente | Parcial | partial | `StepWorkspaceShell`, `Project.step0Data`, breadcrumbs portfolio | No `ContextVersion` vigente | PRD-04 | Contexto se edita silenciosamente |
| PRD-03 | Gating por criterios de cierre | Parcial legacy | partial | `StepStatus`, modules, status mapper | No gates por route/validator/evidence | Rules engine | Steps desbloqueados por progreso simple |
| PRD-03 | Gantt/plan como output Step 2 | No verificado | not_started | `Step2Page` contiene ideacion/test card | Falta route `plan_coordinate` | PRD-02 | Usuarios de proyecto reciben ideacion |
| PRD-03 | Outputs versionados | No existe de forma general | not_started | Step data JSON sobrescribe | OutputVersion model | PRD-04 | Perdida de historial |
| PRD-04 | Contexto maestro versionado | Parcial para empresa/revision inicial | partial | `InitialReviewSnapshot`, `InitiativeContextSnapshot` | Falta `InitiativeContextVersion` actual | Schema + services | Cambios post-creacion sobrescriben |
| PRD-04 | Proponer cambio y mostrar impacto | No existe | not_started | Sin `ContextChangeRequest` | UI/servicio impact assessment | PRD-00A/03 | Pivot rompe Steps sin aviso |
| PRD-04 | Nueva version, reabrir Steps, conservar evidencia | No existe | not_started | `Evidence` no tiene contextVersionId | Migration backward-compatible | Step engine | Evidencia mal atribuida |
| PRD-04 | Crear iniciativa derivada | No existe | not_started | Sin link origin/derived excepto `origin` simple | Derived command | ProjectService | Duplicacion manual sin trazabilidad |
| PRD-05 | Diagnostico de granularidad | No existe como motor | not_started | Sin `ScopeAssessment` | Crear bounded service | PRD-02/08 | Iniciativas sobredimensionadas |
| PRD-05 | Descomposicion editable/confirmable | No existe | not_started | Sin `DecompositionProposal` | UI + commands | PRD-00A | IA podria crear estructura incorrecta |
| PRD-05 | Trazabilidad a fuente | Parcial PDF/import-like | partial | `PdfFieldProposal.sourceText/sourceRef`, public drafts | No aplica a descomposicion portfolio | ImportSession | Fuente original perdida |
| PRD-05 | Initiative group/paraguas | No existe | not_started | Sin `initiativeGroupId` | Schema | PRD-03 | Usar Step 0-4 en paraguas por error |
| PRD-06 | Crear frentes y retos | Existe parcialmente | implemented_unverified | `portfolioService`, `PortfolioService`, routes POST | E2E no corrio por servidor ausente; sin idempotencia/audit | Auth + DB | Doble submit/roles |
| PRD-06 | Portfolio Home centro de decision | Parcial | partial | `PortfolioLeadHomePage`, summary/attention visual | No Copilot, propuestas pendientes ni cohortes reales | PRD-00A/10 | Home visual sin operacion conversacional |
| PRD-06 | Importar Excel/CSV/texto | No implementado para Portfolio | not_started | Solo PDF autofill/public flows | ImportSession/ImportedItem faltan en Prisma | PRD-05/08 | Mock de "importar" como proximamente |
| PRD-06 | Bandeja clasificacion | Tipos existen frontend, sin persistence | not_started | `ImportSession`, `ImportedItem`, `FieldMapping` solo TS | Backend/schema faltante | Import engine | UI puede aparentar publicacion |
| PRD-06 | Bloqueos con actor/condicion | Parcial como campos de iniciativa/mock | partial | `mainBlocker`, attention queue derivada | No `Blocker` persistido | Portfolio meta | Reporte no auditable |
| PRD-06 | Detalle ejecutivo | Parcial | partial | `InitiativeExecutiveDetailDrawer`, `ExecutiveOutput` | Readiness/value/handoff incompletos | PRD-07 | Decision sin sustento completo |
| PRD-06 | Chat y atajos comparten reglas | No existe | not_started | Atajos llaman services directos | Commands compartidos | PRD-00A | Flujos paralelos |
| PRD-07 | KPI/baseline/meta por iniciativa | Parcial | partial | `InitiativePortfolioMeta.mainMetric`, `StrategicFront.mainKpi` | Falta `ValueCase` formal | Portfolio meta | No distinguir valor declarado/validado |
| PRD-07 | Readiness assessment | No existe persistente | not_started | Algunos copy/cards ejecutivos | `ReadinessAssessment` model/service/UI | PRD-08 | Recomendaciones no defendibles |
| PRD-07 | Decision center / brief | Parcial | partial | `ExecutiveOutput`, `/portfolio/decisiones` | No `Decision` formal ni approval | Portfolio | Comite sin trazabilidad |
| PRD-07 | Handoff workflow | No existe | not_started | Status `transferido` en output | `Handoff` model/workflow | PRD-04/06 | Transferencias por texto |
| PRD-07 | Beneficio 30/60/90 | No existe | not_started | Sin modelo | Benefit review model | ValueCase | Impacto realizado no medible |
| PRD-08 | AI bridge unico | Parcial | partial | `bridge.service.ts` dice ser single entrypoint | No enforcement observado de eslint; no Copilot contract | Backend config | Llamadas IA dispersas futuras |
| PRD-08 | Output estructurado con fuentes/confianza | Parcial | partial | PDF proposals, initial review DTO, refine field | No contrato comun AIRecommendation | Shared types | QA no compara outputs |
| PRD-08 | Guardrails: IA no escribe directo | Parcial | partial | Autofill requiere confirmar campo; route-confirm crea Project tras confirmacion | Portfolio acciones no pasan por ActionPlan | PRD-00A | Chat futuro podria escribir directo |
| PRD-08 | Capability Registry | No existe | not_started | Sin `CopilotCapability` | Registry + tests golden | PRD-00A | Routing opaco |
| PRD-08 | Golden datasets | Parcial tests unitarios de generators | partial | `initial-review/__tests__`, no dataset transversal | Crear datasets etiquetados | QA | No medir precision por PRD |
| PRD-09 | Piloto Calidda end-to-end | No implementado como paquete | not_started | No fixtures/casos Calidda detectados | Dossier piloto, datos anonimizados | PRD-06/07/08 | Prometer funciones no listas |
| PRD-09 | Dossier TI | Parcial ADRs tecnicos | partial | `backend/docs/adr/*`, `docs/architecture-*` | Matriz disponible/parcial/workaround/roadmap | Arquitectura | Bloqueo enterprise |
| PRD-09 | Importar -> alinear -> readiness -> brief | No existe completo | not_started | Import portfolio/readiness faltan | PRD-06/07 | Piloto requiere concierge |
| PRD-10 | Cohortes con periodo/capacidad | Parcial legado | partial | `Cohort` tiene name/date/isActive; Admin endpoints list/KPIs | No capacidad/criterios/selection | Schema | Confundir cohortes admin con operaciones portfolio |
| PRD-10 | Candidate backlog | No existe | not_started | Sin `CohortCandidate` | Model + UI | PRD-06/05 | Candidatas se pierden |
| PRD-10 | Priorizacion explicable/combinacion | No existe | not_started | Sin `PrioritizationAssessment` | AI + deterministic rules | PRD-08 | Ranking opaco |
| PRD-10 | Confirmacion humana y versionado seleccion | No existe | not_started | Sin `CohortSelection` | Command + audit | PRD-00A | Selecciones no auditables |
| PRD-10 | Home con cohortes/capacidad | No existe real | not_started | Home no muestra cohortes activas reales | UI + endpoints | PRD-06 | Capacidad queda fuera del portfolio |

## Comportamiento legado que podria romperse

| Area | Riesgo |
| --- | --- |
| `/projects/new` y `ProjectService.createProject` | El flujo legado crea Step 1-4, no Step 0 como fila. Cambiarlo directamente puede romper Step pages y tests. |
| `/initiatives/new` | Ya existe revision inicial autenticada con snapshot/confirm-route. Un Copilot inicial no debe reemplazarlo sin feature flag. |
| Portfolio Lead | `PortfolioLeadContext` mezcla hidratacion real y mocks/fallbacks. Cambiar estado global puede ocultar datos reales o reactivar fixtures. |
| Roles | Backend usa `admin`/`mentor` para mutaciones portfolio. Introducir `portfolio_lead` requiere migracion y compatibilidad. |
| PDF autofill | Tiene confirmacion por campo y provenance. Copilot no debe saltarse ese gate. |
| Public flow | Usa local/session storage y pilot code. No debe convertirse automaticamente en business data sin consentimiento/auth. |
| Billing/entitlements | AI refine y exec_export estan medidos. Nuevas capacidades IA deben declarar feature/usage event. |

## Mocks o simulaciones que aparentan persistencia

| Area | Codigo | Observacion |
| --- | --- | --- |
| Portfolio fixtures | `front/src/features/portfolio-lead/domain/mockData.ts` | Pobla Home si `enableDemoData`; puede confundirse con datos reales. |
| Portfolio hydration fallback | `PortfolioLeadContext` | Si API falla o esta vacia, conserva fixtures si demo activo. |
| `loadChallengeCoverageDemo` | `PortfolioLeadContext` | Crea iniciativas/decisiones en memoria; no persiste. |
| Activation inputs/recommendation note/message draft | `PortfolioLeadContext` | Varios campos son frontend-only y no se guardan. |
| `updateInitiativeMeta` sin `challengeId` | `PortfolioLeadContext` | Hace optimistic update local y retorna sin persistir si iniciativa no esta ligada a reto. |
| Initial review legacy feature | `front/src/features/initial-review/*` | Usa `initialReviewStorage` local, no esta en rutas actuales principales. |
| Public drafts | `publicDraftStorage`, `publicDraftService` | Draft anonimo vive en browser; solo `PilotLead` persiste cuando se captura lead. |
| IA en Step 1/2 | `Step1Page`, `Step2Page` | Generaciones heuristicas/locales por UI, no siempre ai-service ni persistencia estructurada. |

## Feature flags propuestos

| Flag | Default | Uso |
| --- | --- | --- |
| `feature.copilotPortfolioHome` | off | Mostrar shell Copilot en `/portfolio/inicio` sin retirar acciones actuales. |
| `feature.copilotActionPlans` | off | Habilitar creacion/preview/aprobacion de Action Plans. |
| `feature.copilotExecuteCommands` | off | Permitir ejecucion de comandos aprobados; mantener dry-run si off. |
| `feature.copilotCreateStrategicFront` | off | Primera vertical PRD-00A/06. |
| `feature.copilotImportPortfolio` | off | Importacion conversacional, inicialmente draft-only. |
| `feature.scopeAssessment` | off | PRD-05 antes de publicar/descomponer. |
| `feature.contextVersioning` | off | PRD-04 en updates post-confirmacion. |
| `feature.portfolioCohortsV2` | off | PRD-10 sin tocar cohortes admin legadas. |
| `feature.readinessDecisionV2` | off | PRD-07 sin alterar `ExecutiveOutput` actual. |
| `feature.aiRealInitialReview` | env existente `INITIAL_REVIEW_AI` | Mantener real/mock controlado para PRD-02. |

## Orden tecnico recomendado

1. Definir contratos compartidos: `CopilotIntent`, `CopilotCapability`, `CopilotActionPlan`, `ProposedAction`, `ActionExecution`, schemas Zod y estados.
2. Agregar migraciones backward-compatible para tablas Copilot y audit/idempotency, sin tocar tablas legacy.
3. Crear Capability Registry estatico con `CreateStrategicFront` como primera capacidad.
4. Implementar Action Plan en modo dry-run: assessment mock/heuristico + preview + aprobacion sin ejecucion.
5. Implementar `CreateStrategicFrontCommand` idempotente reutilizando `PortfolioService`, con audit y projection links.
6. Montar shell Copilot en Home Portfolio bajo `feature.copilotPortfolioHome`, manteniendo cards/atajos.
7. Endurecer tests: unitarios de registry/router/executor, integracion de comando idempotente, E2E con dev server configurado.
8. Expandir a `CreateChallenge`, `StartImport` y `AssessScope`.
9. Implementar PRD-04 antes de permitir updates conversacionales sobre objetos confirmados.
10. Agregar PRD-10 y PRD-07 como bounded contexts separados, sin sobrecargar `Cohort`/`ExecutiveOutput` legacy.

## Linea base de comandos

| Comando | Resultado real |
| --- | --- |
| `npm run lint` | Falla: no existe script `lint`. Primer intento con `npm` tambien choco con `npm.ps1` bloqueado por ExecutionPolicy; rerun con `npm.cmd`. |
| `npx tsc --noEmit` | Falla: no hay `tsconfig.json` en `front/`; TypeScript imprime ayuda y sale 1. |
| `npm run build:backend` | Falla TypeScript. Errores en tests de billing/pilot-leads/steps, `entitlement.service.ts` con `string[]` vs `SubscriptionStatus[]`, y `pdf.controller.ts` con `AuthenticatedRequest.headers`. |
| `npm test` | Pasa. Backend: 48 files, 423 tests. Frontend: pasa en ejecucion combinada; resumen separado abajo. |
| `npm run test:front -- --reporter=dot` | Pasa: 38 files, 235 tests. Warnings React `act(...)` en `AutofillField`/`CompanyContextSelector` y ref warning en `DialogOverlay`. |
| `npm run build` | Pasa: Vite build en 15.21s. Warnings: chunk JS 3.7 MB y import dinamico/estatico mezclado de `api.ts`. |
| `npm run test:e2e` | Falla: 15/15 tests fallan por `ECONNREFUSED` a `http://localhost` / `localhost:80`; no habia app/backend levantados para Playwright. |

Total unit/integration reportado: 658 tests pasando (423 backend + 235 frontend). E2E bloqueado por ambiente, no por asercion funcional de producto.

## QA manual sugerido para la linea base

1. Levantar stack real desde `front/` con `npm run dev:all` y confirmar puertos usados por Playwright o ajustar `baseURL`.
2. Login con usuario admin/mentor y abrir `/portfolio/inicio`.
3. Crear un frente desde `/portfolio/frentes-estrategicos`; refrescar y verificar que persiste.
4. Crear un reto bajo el frente; cambiar modalidad, owner/sponsor y publicar; refrescar y verificar.
5. Crear una iniciativa desde `/initiatives/new`; confirmar ruta; verificar `/initiatives/:id/overview` y Step 0 precargado.
6. Desde Step 0, validar que propuestas de PDF/autofill requieren confirmacion por campo antes de escribir.
7. Verificar que acciones demo como `loadChallengeCoverageDemo` no se presentan como persistidas.
8. Ejecutar E2E con servicios activos y revisar si los 15 fallos se resuelven o quedan fallos reales.

## Riesgos y deuda tecnica

- Copilot-first requiere un bounded context nuevo; intentar implementarlo solo en frontend generaria mutaciones no auditables.
- Hay inconsistencias de modelo: `Project` representa iniciativa, Step 0 vive en `Project.step0Data`, y Step 1-4 viven en `Step`.
- Typecheck backend no pasa aunque tests si pasan; eso reduce confianza para cambios grandes.
- Portfolio Lead usa roles `admin/mentor` para mutar; falta rol enterprise real.
- La Home portfolio no contiene Copilot ni Action Plans, aunque los PRDs la definen como entrada principal.
- Varias capacidades visuales son mocks o optimistic-only; deben etiquetarse o migrarse antes de usarlas en Copilot.
- E2E no esta autoarrancando servidores o baseURL apunta a `localhost:80`; la verificacion end-to-end esta bloqueada.

## Estado honesto

Auditoria completa para el alcance solicitado. Implementacion funcional del paquete Copilot-first: parcial/no iniciada segun PRD. El repositorio tiene piezas reutilizables valiosas, pero aun no cumple la arquitectura transversal PRD-00A.
