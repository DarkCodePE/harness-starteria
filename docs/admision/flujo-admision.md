> HISTORICAL: ver ../../CURRENT_STATE.md. Documento legacy de admision; reemplazo vigente: ../../CURRENT_STATE.md y ../STARTERIA_AUTHORITY.md.

# Flujo de admisión / onboarding de iniciativas (Starteria)

> **Pregunta única que responde este archivo:** ¿Cómo entra una iniciativa al sistema y cómo se llenan los Pasos 0–4, tanto subiendo un PDF (autofill por agente) como manualmente?
>
> **Estado:** verificado contra código el 2026-06-19 (rama `main`). Fuente: investigación con 5 agentes + lectura directa de servicios, hooks, controladores y `front/prisma/schema.prisma`. Las 3 dudas abiertas se resolvieron con SPARC (ver §6); se detectó **BUG-001**.
> **Eje:** referencia técnica del flujo. Para el estado por feature ver [`feature_list.json`](./feature_list.json); para el historial ver [`claude-progress.md`](./claude-progress.md).

---

## 1. Resumen ejecutivo

El "proceso de admisión" de una iniciativa (lo que el participante ve como **Paso 0: Base estratégica inicial** dentro de **Recorrido del proyecto**) existe en **dos contextos de entrada distintos**:

| Contexto | ¿Hay proyecto al inicio? | Persistencia inicial | Entidad de trabajo |
|---|---|---|---|
| **A. App autenticada** | **Sí** — el proyecto ya está creado | Base de datos (`Project`) | `Project` (a.k.a. *iniciativa*) |
| **B. Público / anónimo** (`/public`) | **No** — primero hay un *draft* | `sessionStorage` del navegador | `PublicDraft` → `PilotLead` → `Project` |

**Conclusión clave (responde la duda original del equipo):** en el **contexto autenticado**, tanto el flujo de *subir PDF + autofill por agente* como el de *rellenado manual* operan sobre un **proyecto que ya existe**. El proyecto se crea **antes**, en `CreateProjectPage` (`POST /projects`). En el **contexto público** no hay proyecto al inicio: hay un draft en sesión, y el proyecto se materializa recién al registrarse (consume-claim).

> ⚠️ **Nota de nomenclatura:** el dominio usa dos nombres para la misma entidad. El servicio de pasos usa `projectId` y rutas `/projects/:id/...`; el servicio de autofill usa `initiativeId` y rutas `/initiatives/:id/...`. **Es el mismo id** — el controlador de PDFs lee `req.params.id` y lo pasa como `projectId`.

---

## 2. Entidades y máquinas de estado

Definidas en `front/prisma/schema.prisma`.

### `Project` (la iniciativa)
- `status: ProjectStatus = DRAFT` → `IN_PROGRESS` → `AI_REVIEW` → `ITERATION` → `EXPERT_SESSION_PENDING` → `STEP_APPROVED` → `COMPLETED`
- `currentStep: Int` — paso actual del recorrido.
- `step0Status: Step0Status = NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` (el Paso 0 vive en el propio `Project`, no en una fila `Step`).

### `Step` (Pasos 1–4)
- `status: StepStatus = BLOCKED` (default) → `NOT_STARTED` → `IN_PROGRESS` → `SUBMITTED` → `AI_FEEDBACK` → `ADJUSTED` → `EXPERT_SESSION_PENDING` → `APPROVED`.
- Cada Step tiene módulos (`ModuleStatus`).

### Autofill por PDF
- `InitiativePdf.status: PdfStatus`: `UPLOADED` → `PARSING` → `EXTRACTING` → `READY` (o `FAILED` / `DELETED`).
- `ExtractionRun.status: ExtractionRunStatus`: `PENDING` → `RUNNING` → `COMPLETED` (o `FAILED` / `COST_CAPPED`).
- `AutofillProposal.status: ProposalStatus`: `PENDING` → `CONFIRMED` / `EDITED` / `DISCARDED`. Cada propuesta lleva `ConfidenceBand` (`HIGH` / `MED` / `LOW`) y **procedencia** (`ProvenanceEntry`: PDF de origen, páginas, cita textual, score).

### Portafolio y público
- `InitiativePortfolioMeta` — puente `Project ↔ Challenge/reto`. `status: InitiativePortfolioStatus = en_step_0`.
- `PilotLead` — lead del flujo público; `status` (string) default `"submitted"`.

---

## 3. Contexto A — App autenticada

### 3.1 Prerrequisito: crear el proyecto (NO es parte del Paso 0)

El registro de proyecto se crea al pulsar **"Crear proyecto"**, antes de ver el "Recorrido del proyecto":

```
CreateProjectPage.tsx
  → AppContext.createProject()           (front/src/app/context/AppContext.tsx ~690-725)
    → projectService.create(body)        (front/src/app/services/projectService.ts ~40-46)
      → POST /projects
        → project.controller.ts::create  (backend/modules/projects/project.controller.ts ~20-28)
          → project.service.ts::createProject()  (backend/modules/projects/project.service.ts ~79-164)
            → tx.project.create(...)  // status DRAFT, step0Status NOT_STARTED,
                                      // owner como TeamMember(OWNER/ACTIVE),
                                      // crea los 4 Steps + módulos,
                                      // opcionalmente vincula challengeId vía InitiativePortfolioMeta
  → navigate(`/projects/${result.project.id}`)
```

A partir de aquí el id del proyecto existe en BD. La pantalla siguiente (`ProjectHomePage`) **asume** que existe: lee `projectId` de la URL y, si no lo encuentra, muestra *"Proyecto no encontrado"* (`ProjectHomePage.tsx:189,206`). No tiene lógica de creación.

### 3.2 Recorrido del proyecto (`ProjectHomePage`)

Es la pantalla del texto que ve el usuario ("Base estratégica inicial", "Recorrido del proyecto", "Paso actual: 0"). Desde aquí cuelgan **los dos métodos** de llenado:

- **PDF:** `const autofill = usePdfAutofill(project.id)` (`ProjectHomePage.tsx:238`) → renderiza `PdfInitiativeUploader` con `initiativeId={project.id}`.
- **Manual:** navega a `/projects/${project.id}/step/${step.number}` (`ProjectHomePage.tsx:401`).

Ambos parten de un `project.id` ya resuelto.

> 🆕 **Primer ingreso (Opción C, 2026-06-19):** en una iniciativa nueva (`step0Status === 'No iniciado'` y `overallProgress === 0`) ya **no** se muestra el uploader de PDF arriba del todo. En su lugar aparece `InitiativeStartChooser` (`front/src/app/components/InitiativeStartChooser.tsx`) con la elección *"¿Cómo quieres empezar?"*: **Empezar en blanco** (→ `openStep0()`) o **Tengo un documento** (→ revela el uploader vía `startMode='upload'`, con opción de volver). Usuarios recurrentes conservan el acceso directo al uploader.

### 3.3 Método 1 — Subir PDF + autofill por agente

Un agente IA lee los PDFs y **propone** valores para los campos de los Pasos 0–4; el usuario **confirma/edita/descarta cada campo**. No escribe nada directamente sin revisión.

**Ciclo de vida** (`front/src/app/hooks/usePdfAutofill.ts` + `front/src/app/services/pdfAutofillService.ts`):

```mermaid
sequenceDiagram
  participant U as Usuario
  participant H as usePdfAutofill (hook)
  participant S as pdfAutofillService
  participant B as Backend /initiatives/:id/pdfs

  U->>S: uploadPdf(initiativeId, file)        %% raw bytes, nombre en header X-File-Name
  S->>B: POST /initiatives/:id/pdfs           %% PdfStatus: UPLOADED→PARSING→EXTRACTING→READY
  B-->>S: { pdfId }
  H->>S: startExtractionRun(initiativeId, pdfId, scope)  %% scope: step0|step1..4|all
  S->>B: POST /initiatives/:id/pdfs/:pdfId/extract
  B-->>S: { runId }                           %% ExtractionRun: PENDING→RUNNING→COMPLETED
  loop polling (backoff exp., presupuesto ~120s; extracción real ~5min DeepSeek)
    H->>S: getExtractionRunStatus(initiativeId, runId)
  end
  H->>S: listProposals(initiativeId, runId)
  S-->>U: AutofillProposalDto[]  (proposedValue, confidenceBand, provenance)
  U->>S: confirmProposal / editProposal / (DELETE) discard   %% por campo (fieldPath)
```

- **Estados del hook** (`AutofillHookStatus`): `idle` → `running` → `done` / `failed` / `timeout`.
- **Errores tipados**: `AUTOFILL_TIMEOUT`, `AUTOFILL_RUN_NOT_FOUND`, `AUTOFILL_UNAUTHORIZED`, `AUTOFILL_COST_CEILING`, `AUTOFILL_UNKNOWN`.
- **Requiere proyecto existente:** el backend (`pdf.service.ts::uploadPdf`) llama `assertProject(projectId)` y lanza `PROJECT_NOT_FOUND` si no existe.
- **Endpoints** (documentados en la cabecera de `pdfAutofillService.ts`):
  - `POST /initiatives/:id/pdfs` (subida, `express.raw('application/pdf')`)
  - `POST /initiatives/:id/pdfs/:pdfId/extract`
  - `GET /initiatives/:id/pdfs/runs/:runId`
  - `GET /initiatives/:id/autofill-proposals`
  - `POST /initiatives/:id/pdfs/runs/:runId/proposals/:fp/confirm | /edit | /restore | /resolve-conflict`
  - `DELETE /initiatives/:id/pdfs/runs/:runId/proposals/:fp`

> ✅ **BUG-001 (RESUELTO, ver §6):** el backend autenticado devolvía el estado en **MAYÚSCULAS** (`COMPLETED`) mientras el hook `usePdfAutofill.ts:174` comparaba **minúsculas** (`'completed'`) → el polling no detectaba el fin. Corregido: el DTO ahora se normaliza a minúsculas vía `toWireStatus()`.

### 3.4 Método 2 — Rellenado manual

- **Paso 0:** `Step0Page.tsx` lee `projectId` de la ruta, busca el proyecto (~línea 374) y guarda con `updateStep0(project.id, data, 'Completado')` → `PATCH /projects/:id/step0` (`projectService.ts:75-85`). Backend `project.service.ts::updateStep0()` valida con `getProject(projectId)` (lanza `PROJECT_NOT_FOUND`).
- **Pasos 1–4:** `stepService.ts` — `saveStepData(projectId, n, data)` → `PUT /projects/:id/steps/:n/data`; `updateStepStatus`, `getStepData`, `requestAiReview`, `requestMentorSession`. **Todas exigen `projectId`.**

### 3.5 Modelo del Paso 0 (`step0/step0Config.ts`)

Dos **modos** según vínculo a portafolio (`getStep0Mode`): `independent` o `linked_to_challenge` (si `project.challengeLink.challengeId`). En modo vinculado hereda contexto del reto/frente (`buildInheritedChallengeContext`).

**Campos requeridos** (`getRequiredFieldKeys`): `initiativeFrame`, `primaryObjective`, `quePasaQueQuieres`, `impactWho`, `whyNowText`, `evidenceType`, `quienEscuchar`, `decisionRequested`.

**Opciones principales:** marco (`correccion`/`crecimiento`/`exploracion`/`mejora_proceso`), claridad, objetivo (eficiencia/experiencia/ingresos/riesgo/productividad/aprendizaje/otro), tipo de contribución, tipo de evidencia, stakeholders adicionales. El config también mantiene **mapeo a campos legacy** (`syncLegacyFields`, `legacyOriginFrom`, `legacyImpactFromObjective`).

### 3.6 Sponsor (opcional)

La UI permite agregar una persona que acompañe momentos clave ("No necesitas definirlo ahora"). Modelado vía `SponsorCheckpointStatus`. Es **opcional** y no bloquea el avance del Paso 0.

---

## 4. Contexto B — Flujo público / draft (`/public`)

El usuario anónimo puede empezar sin cuenta. **No se crea un `Project`**: se crea un `PublicDraft` temporal en `sessionStorage`.

```mermaid
flowchart TD
  A[PublicStartPage<br/>texto o PDF] -->|createPublicDraftFromInput/Upload| B[PublicDraft<br/>sessionStorage<br/>status: created]
  B --> C[/public/draft/:id/edit<br/>PublicProposalEditorPage]
  C -->|PDF: POST /public/pdf-extract con draftId| C
  C --> D[ProgressiveSignupPage<br/>submitPilotInterest draftId]
  D -->|POST /public/pilot-leads| E[PilotLead + pilotCode<br/>draft: pilot_interest_submitted]
  E --> F[Signup / Auth]
  F --> G[ContinuePilotPage<br/>consumePilotClaim]
  G -->|POST /public/pilot-leads/consume-claim| H[PilotClaimService.consume<br/>→ createProject + updateStep0<br/>desde snapshot del draft]
  H --> I[/projects/:projectId<br/>Proyecto REAL en BD]
```

Puntos clave:
- `PublicDraft` (`front/src/features/public-start/domain/types.ts`): estados `created | edited | pilot_interest_submitted | expired | discarded | converted`. Solo en sesión, anónimo.
- PDF público va a `POST /public/pdf-extract` con `draftId` (no `projectId`): `front/src/features/public-start/services/publicPdfAutofillService.ts`.
- El proyecto real se crea al **consumir el claim** tras el signup: `backend/modules/pilot-leads/pilot-claim.service.ts::consume()` → callback `createPilotProject` → `projectService.createProject()` + `updateStep0()` con `mapProposalToStep0Data(...)`. El proyecto queda sellado con `pilotLeadId` (idempotencia 1-a-1).

---

## 5. Mapa de archivos clave

### Frontend
| Archivo | Rol |
|---|---|
| `front/src/app/pages/CreateProjectPage.tsx` | UI de creación de proyecto (prerrequisito). |
| `front/src/app/context/AppContext.tsx` | `createProject()`, estado global de proyectos, tipos `Step0Data`. |
| `front/src/app/services/projectService.ts` | `create`, `getById`, `updateStep0`, `updatePosition`, … |
| `front/src/app/pages/ProjectHomePage.tsx` | "Recorrido del proyecto"; entrada a PDF y a Steps. |
| `front/src/app/pages/Step0Page.tsx` | Formulario manual del Paso 0. |
| `front/src/app/step0/step0Config.ts` | Opciones, modos, campos requeridos, mapeo legacy del Paso 0. |
| `front/src/app/pages/Step1Page..Step4Page.tsx` | Pasos 1–4. |
| `front/src/app/services/stepService.ts` | CRUD de pasos (`saveStepData`, `updateStepStatus`, …). |
| `front/src/app/services/pdfAutofillService.ts` | HTTP del autofill autenticado. |
| `front/src/app/hooks/usePdfAutofill.ts` | Orquestación del ciclo extract→poll→proposals. |
| `front/src/app/components/PdfInitiativeUploader.tsx` | Drag-drop de PDFs. |
| `front/src/app/services/autofillTelemetry.ts` | Telemetría del autofill. |
| `front/src/features/public-start/**` | Flujo público (draft, storage, pilot-lead). |
| `front/src/app/services/publicPdfAutofillService.ts` | Autofill PDF público (`/public/pdf-extract`). |
| `front/src/app/pages/public/*` | `PublicStartPage`, `PublicProposalEditorPage`, `ProgressiveSignupPage`, … |
| `front/src/app/pages/ContinuePilotPage.tsx` | Post-auth: consume el claim → crea proyecto. |

### Backend
| Archivo | Rol |
|---|---|
| `backend/modules/projects/project.{router,controller,service}.ts` | `POST /projects`, `PATCH /:id/step0`, steps. |
| `backend/modules/initiative-pdfs/pdf.{router,controller,service}.ts` | Autofill: subida, extracción, propuestas; `assertProject`. |
| `backend/modules/pilot-leads/pilot-{lead,claim}.{router,service}.ts` | Flujo público → conversión a proyecto. |
| `backend/modules/portfolio/initiative-progress.ts` | Estado de avance derivado (`en_step_0`, …). |
| `front/prisma/schema.prisma` | Modelos y enums (fuente de las máquinas de estado). |

---

## 6. Verificaciones resueltas (SPARC) y bug conocido

Las 3 dudas abiertas de la sesión 1 se resolvieron con SPARC (S/P/A/R) + pase adversarial (2026-06-19, alta confianza, ninguna refutada):

- ✅ **Autofill público = REAL** (no mock). El backend `public-pdf.router.ts` construye un `AiServiceClient` real que hace `fetch` a `${AI_SERVICE_URL}/api/v1/ai/pdf-extract` (`public-pdf.service.ts:146`, `ai-client.ts:78-102`); el front envía un POST real con FormData (`publicPdfAutofillService.ts:69-82`). El *mock* (`generateMockPublicDraftOutput`) se usa **solo en el flujo de TEXTO** (`createPublicDraftFromInput`) y en tests — **no** en el flujo PDF. → `feature_list.json: PUBLIC-PDF-AUTOFILL = implemented`.
- ✅ **`currentStep` = 1 al crear** (no 0). Asignación explícita en `project.service.ts:88` (`currentStep: 1`) que sobreescribe el `@default(0)` del schema (`schema.prisma:337`). Iniciales completos: `status: 'DRAFT'`, `currentStep: 1`, `step0Status: 'NOT_STARTED'`. El DTO `CreateProjectInput` no expone `currentStep`, así que el front nunca lo envía.
- ⚠️ **`ExtractionRunStatus`: NO hay mapeo en el flujo autenticado → BUG-001** (detalle abajo).

### BUG-001 — Desajuste de mayúsculas en el polling del autofill autenticado

**Severidad:** alta (rompía la detección de fin de extracción en el flujo **autenticado**). **Estado:** ✅ **RESUELTO** (2026-06-19, Opción A).

- El endpoint autenticado `GET /initiatives/:id/pdfs/runs/:runId` devuelve `toRunDTO(run)` con `status: row.status` **sin transformar** → enum de BD en **MAYÚSCULAS** (`PENDING|RUNNING|COMPLETED|FAILED|COST_CAPPED`). Ver `pdf.service.ts:84-89` y `:339`.
- El hook compara contra **minúsculas**: `usePdfAutofill.ts:174` (`runStatus === 'completed'`) y `:178` (`=== 'failed' || === 'cancelled'`). `'COMPLETED' === 'completed'` → `false`.
- **Consecuencia:** la rama de finalización nunca se ejecuta; el polling cae siempre en *"keep polling"* (`usePdfAutofill.ts:189`) hasta agotar el presupuesto de backoff → estado `timeout`. El usuario no ve el resultado aunque la extracción haya terminado en el backend (incluso vía webhook, que solo actualiza la BD en MAYÚSCULAS).
- **Contraste:** el flujo **público** SÍ mapea a minúsculas con su propio `mapUpstreamStatus()` (`public-pdf.service.ts:85-99`) y persiste `status: 'queued'|'running'|…` → por eso el público funciona y el autenticado no.
- **Estados muertos en el tipo del front (`pdfAutofillService.ts`):** `'partial'` no existe en ningún enum de backend (nunca se emite); `'queued'`/`'cancelled'` solo aplican al flujo público.
- **Nota sobre tests:** `pdf-autofill-integration.test.tsx` mockea estados en **minúsculas**, por lo que pasa en verde pese al desajuste real (test de tipo "wishful-thinking" — no detecta el bug).

**Fix aplicado (Opción A, 2026-06-19):** se normaliza el estado en un único punto del backend. Nueva función exportada `toWireStatus()` (`backend/modules/initiative-pdfs/pdf.service.ts`) mapea el enum de BD → minúsculas del wire (`PENDING→queued`, `RUNNING→running`, `COMPLETED→completed`, `FAILED/COST_CAPPED→failed`) y se usa en `toRunDTO`. El tipo del DTO pasó a `ExtractionRunWireStatus` (`pdf.types.ts`). El enum de BD sigue en MAYÚSCULAS; **el front no cambió** (ya esperaba minúsculas).

**Tests:** nuevo `__tests__/run-status-wire-mapping.test.ts` (6 casos, guard del contrato) + se corrigieron las aserciones "wishful" en MAYÚSCULAS de `integration-regression.test.ts` y `pdf.service.test.ts`. Verificado: **394/394 backend + 212/212 front**. `COST_CAPPED` se colapsa a `failed` en el wire (el front no tiene estado de cost-cap; el detalle queda en `errorReason`) — posible mejora futura: exponer un mensaje específico de límite de costo y alinear `errorMessage`/`errorReason`.
> HISTORICAL: ver `../../CURRENT_STATE.md`. Documento legacy de admision; reemplazo vigente: `../../CURRENT_STATE.md` y `../STARTERIA_AUTHORITY.md`.
