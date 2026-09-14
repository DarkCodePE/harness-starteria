# STARTERIA — PORTFOLIO_BOOTSTRAP_HOME_TECH_SPEC_v0.1

**Versión:** v0.1  
**Estado:** PROPUESTO PARA REVISIÓN TÉCNICA  
**Vertical slice:** Portfolio Bootstrap + Home V1  
**Usuario principal:** Portfolio Lead  
**Tipo:** Technical Specification  
**Autoridad funcional:** `PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md`  
**Auditoría base:** `PORTFOLIO_BOOTSTRAP_HOME_IMPLEMENTATION_AUDIT_v0.1.md`

---

# 0. Objetivo

Implementar únicamente el thin vertical slice:

```text
PortfolioEntryContinuation
→ B0 Continue from Entry
→ B1 Confirm / Complete Portfolio Anchor
→ B2 Bring Existing Work
→ B3 AI Provisional Structuring
→ B4 Human Material Review
→ B5 Publish First Portfolio Reading
→ Portfolio Home projection
```

El resultado debe permitir que un Portfolio Lead pase de:

> “Starteria entendió qué quiero mover”

A:

> “Starteria ya está ordenando el trabajo real alrededor de esa intención y me muestra qué falta o qué podría impedir avanzar.”

---

# 1. Out of scope explícito

NO implementar en este spec:

- Initiative Owner invitation;
- invitation acceptance;
- Activation Readiness completa;
- Initiative activation;
- Step 0–4;
- Project creation desde Bootstrap;
- Initiative Core;
- Copilot orchestration completa;
- Copilot conversation persistence;
- CSV/XLSX import en P0;
- PDF/PPT/Notion/Jira connectors;
- maturity score;
- readiness score;
- Challenge redesign;
- Challenge optionality en Core;
- reports;
- resource allocation engine;
- notification engine;
- team collaboration workflow;
- Contribution Requests;
- overlap engine avanzado;
- real-time integrations.

---

# 2. Invariantes técnicos obligatorios

```text
AI_SUGGESTED != USER_CONFIRMED
AI_INFERRED != CANONICAL
persisted != canonical
PortfolioBootstrapWorkItem != Project
PortfolioBootstrapWorkItem != active Initiative
initiative exists != initiative activated
initiative activated != Step active
Portfolio Home != Initiative Workspace
Portfolio Home != Step launcher
```

Cualquier implementación que viole una de estas reglas debe fallar tests contractuales.

---

# 3. Decisiones técnicas cerradas

## TS-D01 — Persistencia propia para Bootstrap

No guardar estado mutable de Bootstrap dentro de `PortfolioEntryPortfolioContinuation` como JSON evolutivo.

`PortfolioEntryPortfolioContinuation` permanece como snapshot/source de transferencia desde Entry.

Crear bounded context propio:

```text
portfolio-bootstrap
```

con persistencia separada.

## TS-D02 — B5 no crea Project ni Steps

B5 publica una lectura gobernable del portafolio.

No crea:

- `Project`;
- Step 0;
- StepProgress;
- Initiative Core entities.

Si se necesita representar trabajo confirmado dentro del portfolio, utilizar `PortfolioBootstrapWorkItem` / equivalente de dominio Portfolio.

## TS-D03 — P0 intake

P0 soporta:

- paste text;
- manual entry;
- explicit “no initiatives yet”.

No soporta todavía:

- CSV;
- XLSX;
- PPT;
- PDF;
- connectors.

## TS-D04 — Anchor sufficient

`anchor_sufficient` requiere:

```text
interpretable desired outcome / priority
+
minimum context to organize work
+
(decision_to_enable known OR business signal known/proxy)
+
no critical unresolved contradiction changing meaning
```

No requiere:

- baseline;
- target;
- sponsor;
- full strategic front;
- confirmed KPI.

## TS-D05 — Human authority P0

Confirmaciones materiales de Bootstrap requieren capability:

```text
portfolio:write
```

Esto no equivale a autoridad para inversión, cierre o escalamiento.

## TS-D06 — Navegación

Mantener rutas legacy.

Actualizar navegación visible progresivamente hacia:

```text
Inicio
Prioridades
Iniciativas
Decisiones
Reportes
```

Challenge/Reto permanece accesible desde contexto, no necesariamente como primary nav.

---

# 4. Arquitectura propuesta

```text
Portfolio Entry
    │
    ▼
PortfolioEntryPortfolioContinuation
    │
    ▼
PortfolioBootstrapService
    │
    ├── PortfolioBootstrapSession
    ├── PortfolioAnchor
    ├── PortfolioBootstrapWorkItem
    ├── StrategicConnection
    ├── AdvancementCondition
    ├── ProposedMutation
    └── PortfolioReading
    │
    ▼
PortfolioBootstrapProjection
    │
    ├── homeState
    ├── bootstrapPhase
    ├── nextBestAction
    ├── known / pending / conflicting
    └── attention signals
    │
    ▼
PortfolioLeadHomePage
```

Separación obligatoria:

```text
portfolio-bootstrap bounded context
        ↓ only after human-confirmed publish when appropriate
portfolio canonical services
```

---

# 5. Modelo de dominio P0

## 5.1 PortfolioBootstrapSession

```ts
type PortfolioBootstrapSession = {
  id: string;
  organizationId?: string;
  userId: string;
  sourceContinuationId?: string;
  status:
    | 'active'
    | 'awaiting_anchor_review'
    | 'awaiting_work_intake'
    | 'awaiting_structuring'
    | 'awaiting_material_review'
    | 'reading_published'
    | 'abandoned';
  bootstrapPhase:
    | 'B0_CONTINUE'
    | 'B1_ANCHOR'
    | 'B2_WORK_INTAKE'
    | 'B3_PROVISIONAL_STRUCTURING'
    | 'B4_MATERIAL_REVIEW'
    | 'B5_FIRST_READING';
  homeState:
    | 'HOME_A'
    | 'HOME_B'
    | 'HOME_C'
    | 'HOME_D'
    | 'HOME_E'
    | 'HOME_F';
  createdAt: string;
  updatedAt: string;
};
```

## 5.2 PortfolioAnchor

```ts
type PortfolioAnchor = {
  id: string;
  bootstrapSessionId: string;
  outcomeStatement: string;
  contextSummary?: string;
  decisionToEnable?: string;
  businessSignalStatus:
    | 'confirmed'
    | 'proxy'
    | 'suggested'
    | 'unknown'
    | 'conflicting';
  businessSignalValue?: string;
  status:
    | 'anchor_insufficient'
    | 'anchor_provisional'
    | 'anchor_sufficient'
    | 'anchor_confirmed'
    | 'anchor_conflicting';
  sourceRefs: string[];
  provenanceStatus:
    | 'raw_entry'
    | 'extracted'
    | 'ai_inferred'
    | 'ai_suggested'
    | 'user_confirmed';
  confirmedBy?: string;
  confirmedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};
```

Regla: `anchor_confirmed` requiere acción humana explícita.

## 5.3 PortfolioBootstrapWorkItem

```ts
type PortfolioBootstrapWorkItem = {
  id: string;
  bootstrapSessionId: string;
  rawLabel: string;
  proposedName?: string;
  proposedPurpose?: string;
  sourceType:
    | 'pasted_text'
    | 'manual_entry'
    | 'entry_context';
  status:
    | 'detected'
    | 'needs_review'
    | 'confirmed_in_portfolio'
    | 'rejected'
    | 'pending';
  currentStateHint?:
    | 'idea'
    | 'candidate'
    | 'active'
    | 'paused'
    | 'completed'
    | 'unknown';
  ownerCandidate?: string;
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
};
```

`confirmed_in_portfolio` NO crea Project.

## 5.4 StrategicConnection

```ts
type StrategicConnection = {
  id: string;
  bootstrapSessionId: string;
  workItemId: string;
  anchorId: string;
  status:
    | 'confirmed_alignment'
    | 'probable_alignment'
    | 'partial_alignment'
    | 'alignment_unknown'
    | 'possible_misalignment'
    | 'confirmed_misalignment'
    | 'out_of_current_priority';
  rationale?: string;
  provenanceStatus:
    | 'ai_inferred'
    | 'ai_suggested'
    | 'user_confirmed';
  sourceRefs: string[];
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

IA no puede crear `confirmed_alignment`.

## 5.5 AdvancementCondition

```ts
type AdvancementCondition = {
  id: string;
  bootstrapSessionId: string;
  workItemId?: string;
  type:
    | 'business_signal'
    | 'decision_path'
    | 'critical_dependency'
    | 'required_context'
    | 'ownership_visibility';
  status: string;
  statement: string;
  severity:
    | 'info'
    | 'attention'
    | 'blocking';
  movementAffected?: string;
  provenanceStatus:
    | 'extracted'
    | 'ai_inferred'
    | 'ai_suggested'
    | 'user_confirmed';
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
};
```

No almacenar un readiness score agregado.

## 5.6 ProposedMutation

```ts
type ProposedMutation = {
  id: string;
  bootstrapSessionId: string;
  targetType:
    | 'portfolio_anchor'
    | 'work_item'
    | 'strategic_connection'
    | 'advancement_condition';
  targetId?: string;
  mutationType:
    | 'create'
    | 'update'
    | 'classify'
    | 'link'
    | 'unlink'
    | 'confirm'
    | 'reject';
  currentValue?: unknown;
  proposedValue: unknown;
  rationale?: string;
  sourceRefs: string[];
  provenanceStatus:
    | 'ai_inferred'
    | 'ai_suggested';
  uncertainty?: 'low' | 'medium' | 'high';
  materiality:
    | 'low'
    | 'material';
  confirmationRequired: boolean;
  status:
    | 'proposed'
    | 'reviewed'
    | 'confirmed'
    | 'rejected'
    | 'superseded'
    | 'expired';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5.7 PortfolioReading

```ts
type PortfolioReading = {
  id: string;
  bootstrapSessionId: string;
  anchorId: string;
  version: number;
  summary: string;
  totalWorkItems: number;
  confirmedConnections: number;
  uncertainConnections: number;
  signalGapCount: number;
  unresolvedDependencyCount: number;
  decisionPathGapCount: number;
  overlapCandidateCount: number;
  primaryAttentionItems: string[];
  nextBestAction: string;
  generatedFromVersion: number;
  publishedBy: string;
  publishedAt: string;
};
```

Debe ser versionado.

---

# 6. Persistencia Prisma propuesta

Entidades separadas:

```text
PortfolioBootstrapSession
PortfolioAnchor
PortfolioBootstrapWorkItem
PortfolioStrategicConnection
PortfolioAdvancementCondition
PortfolioBootstrapProposedMutation
PortfolioReading
```

Relaciones:

```text
User
  └── PortfolioBootstrapSession

PortfolioEntryPortfolioContinuation
  └── PortfolioBootstrapSession

PortfolioBootstrapSession
  ├── PortfolioAnchor
  ├── WorkItems[]
  ├── StrategicConnections[]
  ├── AdvancementConditions[]
  ├── ProposedMutations[]
  └── PortfolioReadings[]
```

---

# 7. Versionado

Versionar al menos:

- PortfolioAnchor;
- PortfolioReading;
- ProposedMutation lifecycle.

P0 puede evitar event sourcing completo.

Mínimo:

- version number;
- createdAt;
- updatedAt;
- actor;
- previous state where material.

No sobrescribir cambios materiales silenciosamente.

---

# 8. Backend bounded context

Ruta propuesta:

```text
backend/modules/portfolio-bootstrap/
```

Archivos sugeridos:

```text
portfolio-bootstrap.router.ts
portfolio-bootstrap.controller.ts
portfolio-bootstrap.service.ts
portfolio-bootstrap.repository.ts
portfolio-bootstrap.schemas.ts
portfolio-bootstrap.types.ts
portfolio-bootstrap.rules.ts
portfolio-bootstrap.projection.ts
portfolio-bootstrap.audit.ts
```

Opcional:

```text
portfolio-bootstrap-ai.service.ts
```

solo cuando B3 use IA real.

---

# 9. Backend responsibilities

## PortfolioBootstrapService

Responsable de:

- crear/reusar sesión de Bootstrap;
- derivar anchor inicial desde Continuation;
- actualizar anchor provisional;
- registrar intake manual/texto;
- guardar work items provisionales;
- persistir ProposedMutations;
- aplicar confirmaciones humanas;
- generar PortfolioReading;
- resolver fase/homeState;
- no escribir Project/Steps.

## PortfolioBootstrapRepository

Solo persistence.

No contener reglas de negocio.

## PortfolioBootstrapProjection

Deriva:

- `bootstrapPhase`;
- `homeState`;
- `nextBestAction`;
- summary para frontend;
- attention candidates P0.

---

# 10. Reglas de derivación B0–B5

## B0

Trigger:

- usuario llega a `/portfolio/inicio` con Continuation;
- o sesión de Bootstrap activa existente.

Acciones:

1. recuperar Continuation;
2. crear/reusar BootstrapSession;
3. derivar PortfolioAnchor provisional;
4. persistir provenance;
5. calcular anchor status.

Exit: Anchor disponible.

## B1

Si `anchor_insufficient`:

pedir solo información que falta para volverlo interpretable.

Si `anchor_sufficient`:

permitir confirmar/corregir.

No requerir baseline/target.

Exit:

```text
anchor_sufficient OR anchor_confirmed
```

## B2

Inputs P0:

### Paste

Texto libre con una o varias iniciativas/trabajos.

### Manual

Agregar ítems uno por uno.

### None

Declarar:

```text
no_existing_work = true
```

Exit:

- work items detectados;
- o no-existing-work explícito.

## B3

Jobs cognitivos:

1. work item extraction;
2. strategic relation proposal;
3. gap extraction;
4. advancement-condition detection.

Output:

- ProposedMutations;
- nunca escritura canonical.

Exit:

- al menos una propuesta revisable;
- o análisis explícito sin propuestas.

## B4

Acciones humanas:

- confirm;
- correct;
- leave pending;
- reject.

Solo mutaciones confirmadas se aplican al estado gobernado de Bootstrap.

Exit:

- material proposals revisadas;
- pending explícito permitido.

## B5

Generar `PortfolioReading`.

No crear Project.

No abrir Steps.

Exit:

```text
reading_published
→ HOME_D
```

---

# 11. Home state resolver

Implementar una función pura:

```ts
resolvePortfolioHomeState(input): HomeState
```

Orden conceptual:

```text
continuation exists + no resolved anchor
→ HOME_A

anchor insufficient/provisional
→ HOME_A

anchor sufficient + no work
→ HOME_B

work detected + material review pending
→ HOME_C

reading published + no urgent attention
→ HOME_D

reading published + attention items
→ HOME_E

decision-ready signal
→ HOME_F
```

---

# 12. Next-best action resolver

Función pura:

```ts
resolveNextBestPortfolioAction(state): NextBestAction
```

Prioridad:

```text
critical information conflict
→ resolve conflict

anchor insufficient
→ complete anchor

anchor sufficient + no work
→ bring existing work

staging pending review
→ review proposed structure

blocking advancement condition
→ review blocker/dependency

decision required
→ review decision

reading published
→ review attention
```

Regla:

Nunca devolver por defecto:

- “Crear primer frente”;
- “Crear primer reto”;
- “Empezar Step 0”.

---

# 13. APIs P0

Base:

```text
/api/v1/portfolio-bootstrap
```

## Session

```http
POST /sessions/from-continuation
GET  /sessions/:sessionId
```

## Anchor

```http
PATCH /sessions/:sessionId/anchor
POST  /sessions/:sessionId/anchor/confirm
```

## Work intake

```http
POST /sessions/:sessionId/work-items/paste
POST /sessions/:sessionId/work-items/manual
POST /sessions/:sessionId/work-items/none
GET  /sessions/:sessionId/work-items
```

## Provisional structuring

```http
POST /sessions/:sessionId/analyze
GET  /sessions/:sessionId/proposed-mutations
```

## Review

```http
POST /sessions/:sessionId/proposed-mutations/:mutationId/confirm
POST /sessions/:sessionId/proposed-mutations/:mutationId/reject
PATCH /sessions/:sessionId/proposed-mutations/:mutationId
```

## Reading

```http
POST /sessions/:sessionId/readings
GET  /sessions/:sessionId/readings/latest
```

## Projection

```http
GET /sessions/:sessionId/home-projection
```

Response conceptual:

```ts
type PortfolioBootstrapHomeProjection = {
  sessionId: string;
  bootstrapPhase: BootstrapPhase;
  homeState: HomeState;
  anchor: PortfolioAnchorView;
  knownItems: unknown[];
  pendingItems: unknown[];
  conflictingItems: unknown[];
  workItems: PortfolioWorkItemView[];
  proposedMutations: ProposedMutationView[];
  attentionItems: PortfolioAttentionItem[];
  firstReading?: PortfolioReadingView;
  nextBestAction: NextBestAction;
};
```

---

# 14. API guardrails

Toda mutation endpoint:

- requiere auth;
- requiere `portfolio:write`;
- registra actor;
- audita cambio material;
- usa idempotency key en operaciones sensibles;
- nunca crea Project/Step.

---

# 15. B3 AI integration

P0 puede soportar:

```text
deterministic parser + AI optional
```

pero debe compartir mismo output contract.

IA no devuelve:

- canonical IDs creados;
- Project;
- Steps;
- confirmed alignment.

---

# 16. Frontend structure

Añadir:

```text
front/src/features/portfolio-lead/bootstrap/
```

Archivos recomendados:

```text
domain/
  types.ts
  rules.ts
  selectors.ts
  provenance.ts

services/
  portfolioBootstrapClient.ts

components/
  PortfolioAnchorCard.tsx
  PortfolioAnchorReview.tsx
  PortfolioWorkIntake.tsx
  PortfolioWorkItemReviewCard.tsx
  ProposedMutationReview.tsx
  PortfolioFirstReading.tsx
  PortfolioBootstrapAttention.tsx

state/
  usePortfolioBootstrap.ts
```

---

# 17. Integración con PortfolioLeadHomePage

`PortfolioLeadHomePage` deja de componer siempre el dashboard tradicional.

Debe recibir una projection:

```text
HOME_A
HOME_B
HOME_C
HOME_D
HOME_E
HOME_F
```

y renderizar experiencia contextual.

Evitar lógica de dominio compleja dentro del componente.

---

# 18. Reutilización de UI existente

## KEEP / REUSE

- `PortfolioWelcomeBanner`
- `PortfolioAttentionQueueSection`
- empty-state patterns
- card patterns
- `ProvenancePopover`
- autofill confirm/edit interaction patterns

## UPDATE

- `PortfolioPrimaryActionRail`
- `StrategicObjectivesOverview`
- welcome copy
- nav

## DEPRECATE AS MAIN

- `PortfolioLeadStartExperience`

---

# 19. Navigation P0

Visible:

```text
Inicio
Prioridades
Iniciativas
Decisiones
Reportes
```

No eliminar rutas legacy.

---

# 20. Canonicalization boundary

## Pre-canonical

Puede persistir:

- Anchor provisional;
- WorkItem detectado;
- AI proposals;
- unresolved conditions;
- ProposedMutation.

## Governed Bootstrap state

Puede persistir:

- Anchor confirmado;
- WorkItem `confirmed_in_portfolio`;
- StrategicConnection confirmado;
- conditions confirmadas.

## Canonical Portfolio domain

Solo escribir en Core canonical objects mediante acción explícita futura o flujo específico.

P0 no obliga a hacerlo en B5.

---

# 21. Audit events P0

```text
portfolio_bootstrap_session_created
portfolio_anchor_derived
portfolio_anchor_updated
portfolio_anchor_confirmed
portfolio_work_intake_started
portfolio_work_items_detected
portfolio_bootstrap_analysis_completed
portfolio_mutation_proposed
portfolio_mutation_confirmed
portfolio_mutation_rejected
portfolio_reading_published
portfolio_home_state_changed
```

---

# 22. Analytics P0

```text
portfolio_bootstrap_viewed
portfolio_anchor_reviewed
portfolio_anchor_corrected
portfolio_work_pasted
portfolio_work_manual_added
portfolio_no_existing_work_selected
portfolio_structuring_reviewed
portfolio_structuring_correction_made
portfolio_first_reading_viewed
portfolio_attention_item_opened
```

Métricas:

- time_to_first_portfolio_value;
- anchor_correction_rate;
- proposal_confirmation_rate;
- AI correction rate;
- next_action_success_rate;
- dropoff B0→B5.

---

# 23. Unit tests obligatorios antes de UI

## Anchor

- derive anchor from confirmed Continuation;
- insufficient when only vague intent exists;
- sufficient with outcome + decision;
- sufficient with outcome + business signal;
- conflicting when source meaning materially conflicts;
- no StrategicFront creation.

## Home state

- HOME_A;
- HOME_B;
- HOME_C;
- HOME_D;
- HOME_E;
- HOME_F.

## Next action

No devuelve:

- create first front;
- create challenge;
- Step 0.

## Canonicalization

- AI_SUGGESTED cannot set USER_CONFIRMED;
- AI_INFERRED cannot set CANONICAL;
- ProposedMutation requires human confirm when material;
- rejected mutation changes no governed state.

---

# 24. Backend integration tests

## Continuation

- session created from valid continuation;
- reload returns same active session;
- no Project created;
- no StrategicFront created;
- no Challenge created;
- no Step created.

## Work intake

- pasted work persists as provisional;
- manual item persists;
- no-work state persists.

## Analysis

- creates ProposedMutations;
- does not canonicalize.

## Review

- confirm requires `portfolio:write`;
- reject preserves history;
- corrected proposal records actor.

## Reading

- can publish with pending non-critical gaps;
- reading version increments;
- no Project/Step created.

---

# 25. E2E P0

```text
Portfolio Entry
→ Registration/Claim
→ Portfolio Continuation
→ /portfolio/inicio
→ HOME-A
→ review anchor
→ HOME-B
→ paste existing work
→ HOME-C
→ review proposed structuring
→ confirm material items
→ publish first reading
→ HOME-D
```

Assertions:

- context survives reload;
- provenance visible;
- one clear next action;
- no Step CTA;
- no “Crear iniciativa individual”;
- no auto-created StrategicFront/Challenge/Project;
- confirmed work visible in reading;
- missing business signal visible when applicable.

---

# 26. Hard-fail E2E

FAIL si Home:

- abre Step 0;
- muestra HMW;
- propone experimento;
- pide prototipo;
- muestra Test Card;
- crea Project por confirmar work item;
- crea StrategicFront automáticamente;
- marca AI relation as confirmed;
- usa readiness score opaco;
- vuelve a `/portfolio/iniciar` como entry principal.

---

# 27. Migration plan

## Migration 1

Añadir tablas Bootstrap.

No modificar:

- Project;
- Step;
- Challenge;
- StrategicFront semantics.

## Backfill

No requerido para P0.

Existing users sin Bootstrap session:

```text
on Portfolio Home visit
→ derive state from canonical Portfolio
→ HOME_D/E when portfolio already populated
```

No forzar Bootstrap completo a usuarios existentes con portfolio real.

---

# 28. Existing-user compatibility

Si un usuario ya tiene:

- StrategicFronts;
- Challenges;
- Initiatives;

y no tiene BootstrapSession:

```text
bootstrap_not_required
→ derive operational Home
```

---

# 29. Error handling

## Continuation missing/invalid

Fallback:

```text
portfolio existing?
→ operational Home

no portfolio?
→ neutral bootstrap start
```

## AI failure B3

Preservar work items.

Permitir:

- retry analysis;
- manual review;
- continue without AI if enough info.

## Mutation confirm failure

No optimistic canonical state without server confirmation.

---

# 30. Security

- auth mandatory;
- tenant/org scope;
- capability `portfolio:write`;
- source data isolated per organization;
- audit material confirmation;
- no prompt leakage;
- no cross-tenant sourceRefs;
- AI receives only permitted context.

---

# 31. Idempotency

Requerir idempotency en:

- create session from continuation;
- anchor confirm;
- work paste batch;
- analysis trigger;
- mutation confirm;
- reading publish.

---

# 32. Performance P0

Objetivos sugeridos:

- Home projection p95 < 2.5s;
- anchor update p95 < 800ms;
- manual work add p95 < 800ms;
- reading load p95 < 2s;
- AI analysis p95 < 10s target, non-blocking fallback.

---

# 33. File plan

## KEEP

```text
front/src/app/routes.ts
front/src/app/services/portfolioService.ts
backend/modules/portfolio/*
backend/modules/portfolio-entry-continuation/*
front/src/app/components/autofill/*
adaptive-core/*
portfolio-entry-conversion/*
```

## UPDATE

```text
front/src/app/pages/PortfolioLeadHomePage.tsx
front/src/app/components/portfolio/PortfolioLeadHomeExperience.tsx
front/src/features/portfolio-lead/context/PortfolioLeadContext.tsx
front/src/features/portfolio-lead/domain/types.ts
front/src/features/portfolio-lead/domain/selectors.ts
front/src/features/portfolio-lead/domain/rules.ts
front/src/app/layout/PortfolioLeadLayout.tsx
```

## ADD

```text
front/src/features/portfolio-lead/bootstrap/*
backend/modules/portfolio-bootstrap/*
Prisma bootstrap models
bootstrap unit tests
bootstrap backend integration tests
portfolio-bootstrap Playwright E2E
```

## DEPRECATE AS MAIN

```text
front/src/app/pages/PortfolioLeadStartPage.tsx
front/src/app/components/portfolio/PortfolioLeadStartExperience.tsx
```

No borrar en P0.

---

# 34. Recommended PR sequence

## PR-1 — Contract tests + pure domain

- bootstrap types;
- anchor rules;
- home state resolver;
- next action resolver;
- tests.

No DB.

## PR-2 — Prisma + backend session/anchor

- schema;
- migration;
- repository;
- session from continuation;
- anchor endpoints;
- integration tests.

## PR-3 — HOME-A / HOME-B

- client;
- hook/state;
- Home projection;
- anchor experience;
- work intake shell.

## PR-4 — Work intake

- paste;
- manual;
- none;
- persistence;
- tests.

## PR-5 — B3 provisional structuring

- analysis contract;
- AI/deterministic adapter;
- ProposedMutation persistence.

## PR-6 — B4 material review

- confirm;
- correct;
- reject;
- provenance;
- audit.

## PR-7 — B5 First Portfolio Reading

- reading generator;
- HOME-D;
- initial attention.

## PR-8 — E2E hardening

- Playwright;
- reload;
- idempotency;
- anti-drift;
- regressions.

---

# 35. Definition of Done

El slice se considera implementado cuando:

1. Continuation crea/reusa BootstrapSession.
2. Home reconoce contexto previo.
3. Anchor se deriva sin crear StrategicFront.
4. Usuario puede corregir/confirmar anchor.
5. Usuario puede pegar/agregar trabajo.
6. Work items quedan provisionales.
7. IA propone relaciones/gaps sin canonicalizar.
8. Usuario confirma/rechaza/corrige mutaciones materiales.
9. B5 genera PortfolioReading.
10. Home muestra primera lectura.
11. Missing business signal puede aparecer.
12. Unresolved dependency puede aparecer.
13. Missing decision path puede aparecer.
14. Next-best action es contextual.
15. No Project creado.
16. No Step creado.
17. No Challenge creado automáticamente.
18. No StrategicFront creado automáticamente.
19. Reload preserva estado.
20. Audit/provenance íntegros.
21. Material Initiative Owner drift = 0.
22. Browser E2E pasa.

---

# 36. ADR Candidates

## ADR-CANDIDATE-01

Solo si se decide que `Challenge/Reto` deja de ser obligatorio en el modelo canónico.

Este Tech Spec no lo modifica.

---

# 37. Principio técnico final

> **Portfolio Bootstrap persiste comprensión, trabajo provisional, propuestas y confirmaciones sin saltar prematuramente al dominio canónico de ejecución.**

Y:

> **La Home proyecta estado gobernado; no inventa ni decide por sí misma la estructura del portafolio.**
