---
id: SPEC-003
title: "Integración landing público: pilot leads persistidos + refinamiento IA real"
status: draft
date: 2026-05-29
author: BHIL Architecture (Swarm)
sprint: S-03
parent: PRD-003
children:
  - TASK-011
  - TASK-012
  - TASK-013
  - TASK-014
adrs: [ADR-015-backend, ADR-016-backend, ADR-006, ADR-011-backend]
---

# SPEC-003: Landing público — pilot leads + refinamiento IA — Especificación técnica

## Specification summary

Esta especificación lleva a producción los cambios de la rama `feat/public-proposal-editor-ux` (PR #45). El frontend del editor master-detail, el one-pager preview y el `ProgressiveSignupPage` reescrito **ya existen** en la rama; esta SPEC define el trabajo de **backend + ai-service** necesario para que dejen de depender de `localStorage` y de la heurística mock:

1. **Pilot leads persistidos** — nuevo endpoint público `POST /api/v1/public/pilot-leads` + tabla `PilotLead` (Prisma) + notificación. El servicio frontend `publicPilotLeadService` cambia de `localStorage` a API, conservando localStorage como cache de idempotencia por `draftId`. (TASK-011 backend, TASK-012 frontend.)
2. **Refinamiento IA real** — nueva **chain LangChain stateless** en `ai-service` expuesta vía `routers/ai.py` (NO se registra en `langgraph.json` — ver ADR-006), con bridge HMAC en backend (patrón ADR-011). El editor reemplaza `buildSuggestion`/`generateMockPublicDraftOutput` por llamadas reales con fallback heurístico. (TASK-013 ai-service + backend bridge, TASK-014 frontend.)

Decidido en planeamiento: la integración entra **después** de mergear `feat-step1-architecture-capture-synthesis-v2` → `main` (Fase 0), y el flujo de conversión pública borrador→proyecto queda **removido** (ADR-015).

---

## End-to-end flow

### Flujo A — Refinamiento de campo IA (US-002)
1. **Front:** En `PublicProposalEditor.tsx` el usuario pulsa "mejorar con IA" en un campo. Front llama `POST /api/v1/public/refine-field` con `{ field, currentValue, draftContext }` (sin PII; el draft público es anónimo).
2. **Express (bridge):** Valida payload (Zod), aplica **rate-limit público** (reutiliza limiter de `public-pdf`) y tope de coste por IP/sesión, firma HMAC + `X-Request-Id` y reenvía a `POST {ai-service}/public/refine-field` (ADR-011).
3. **ai-service (chain LangChain):** Una chain stateless (no grafo) invoca el modelo (ADR-006) con prompt de refinamiento + `with_structured_output(FieldRefinement)` (Pydantic) y devuelve `{ suggestedValue, rationale, confidence }`.
4. **Express → Front:** Express valida el schema de salida y responde. Front muestra la sugerencia en estado `suggestion_available`; al aceptar pasa a `ai_refined`. Si cualquier paso falla/timeout, Front usa el **fallback heurístico** local (el actual `buildSuggestion`) marcando la sugerencia como local.

### Flujo B — Captura de pilot lead (US-004/005)
1. **Front:** `ProgressiveSignupPage` valida nombre+email+consentimiento (`canSubmit`), emite `pilot_interest_started` al abrir.
2. **Front → Express:** `POST /api/v1/public/pilot-leads` con `{ draftId, name, email, phone?, organization?, consentAccepted }`.
3. **Express:** Valida (Zod), exige `consentAccepted === true` (409 `PILOT_CONSENT_REQUIRED` si no), upsert por `draftId` (idempotencia), genera `pilotCode = ST-PILOT-XXXX`, persiste `PilotLead` con `consentAt = now()`, emite `AuditLog` `pilot.lead.captured`, dispara notificación (§notificación) y responde `{ id, pilotCode, status:'submitted', createdAt }`.
4. **Front:** Guarda el lead devuelto en `localStorage` (cache idempotencia + offline), muestra confirmación con `pilotCode`, emite `pilot_interest_submitted`. Ante error de red: conserva el formulario, reintenta y emite `pilot_interest_failed`.

---

## Component allocation

| Componente | TASK owner | ADR primario | Notas |
|---|---|---|---|
| Endpoint `POST /api/v1/public/pilot-leads` + controller/schemas | TASK-011 | ADR-015-backend | Patrón router público de `initiative-pdfs/public-pdf.*` |
| Prisma model `PilotLead` + migración | TASK-011 | ADR-015-backend §Data model | PII: email/phone; índice único por `draftId` |
| Notificación de nuevo lead | TASK-011 | ADR-015-backend §Notificación | Email/canal a definir (open question) |
| `publicPilotLeadService` localStorage → API | TASK-012 | ADR-015-backend | localStorage queda como cache idempotencia |
| Chain LangChain `public/refine-field` + schema Pydantic | TASK-013 | ADR-006 | Stateless, NO en `langgraph.json` |
| Bridge backend `POST /api/v1/public/refine-field` | TASK-013 | ADR-011-backend, ADR-016-backend | Rate-limit + tope coste |
| Editor: reemplazar mock por API + fallback | TASK-014 | ADR-016-backend | Fallback heurístico observable |

---

## Data model (PilotLead)

```prisma
model PilotLead {
  id            String   @id @default(uuid())   // UUIDv7 preferible
  draftId       String   @unique                // idempotencia por borrador
  pilotCode     String   @unique                // ST-PILOT-XXXX
  name          String
  email         String                          // PII
  phone         String?                         // PII
  organization  String?
  consentAccepted Boolean
  consentAt     DateTime
  status        String   @default("submitted")
  source        String   @default("public_landing")
  createdAt     DateTime @default(now())
  retentionUntil DateTime                        // política ADR-015
}
```

---

## API contracts

**`POST /api/v1/public/pilot-leads`**
- Req: `{ draftId: string, name: string, email: string, phone?: string, organization?: string, consentAccepted: boolean }`
- 201: `{ id, pilotCode, status, createdAt }`
- 409 `PILOT_CONSENT_REQUIRED` si `consentAccepted !== true`
- 422 envelope V1 si email inválido
- Rate-limited (público)

**`POST /api/v1/public/refine-field`**
- Req: `{ field: string, currentValue: string, draftContext: { challengeType?, ...campos no-PII } }`
- 200: `{ suggestedValue: string, rationale: string, confidence: number }`
- 429 si excede rate-limit/tope de coste → Front cae a fallback heurístico
- HMAC interno Express↔ai-service (ADR-011)

---

## Prerequisites & risks

- **PRE-1 (Fase 0):** `feat-step1` mergeado a `main`; field-model de `PublicDraftOutput` alineado front↔back↔ai.
- **PRE-2 (versiones):** Decidir si se sube `langchain>=1.3.1`/`langgraph>=1.2.1` (PRs dependabot #12/#13) antes de TASK-013. La chain nueva debe compilar con la versión elegida sin romper los 7 agentes deepagents existentes. Si se mantiene `>=0.3`/`>=0.2`, validar API de `with_structured_output`.
- **RISK-1 (PII):** email/phone en tabla → cifrado en reposo, no en logs, retención definida.
- **RISK-2 (coste/abuso):** endpoint IA público → rate-limit + tope de coste obligatorio antes de exponer.
- **RISK-3 (mock revivido):** mientras TASK-013 no termine, el editor sigue con heurística; marcar deuda y no dejarla indefinida (NFR-3 de PRD-003).
- **RISK-4 (código muerto):** `createProjectFromPublicDraft` y ruta `/auth/continue/:draftId` quedan sin uso desde el landing — confirmar y limpiar (ADR-015).

---

## Test strategy

- **Backend:** contract tests del endpoint de leads (consentimiento, idempotencia, envelope), unit del generador `ST-PILOT-*`.
- **ai-service:** test de la chain con structured output (schema válido), test de fallback ante timeout, eval de utilidad de sugerencias (N≥80) según ADR-006.
- **Frontend:** test de `publicPilotLeadService` (API + cache), test de fallback heurístico del editor, test de no-pérdida de datos ante fallo de red.
- **E2E:** flujo composer→editor→refinar→interés-piloto.
