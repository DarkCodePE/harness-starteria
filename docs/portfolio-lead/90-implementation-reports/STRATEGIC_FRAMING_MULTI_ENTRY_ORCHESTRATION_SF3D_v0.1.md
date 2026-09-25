# Strategic Framing — Multi-Entry Orchestration SF-3D v0.1

**Estado:** implementado en `feat/strategic-framing-sf3d-multi-entry-orchestration`; pendiente de revisión humana y certificación de entorno.

## Alcance

SF-3D agrega una única frontera `POST /api/v1/strategic-framing/states/from-source`.
Public Entry, Enterprise Direct y Existing Portfolio convergen en:

```text
source adapter → StrategicFramingReadService (SF-2)
              → StrategicFramingProvisionalStateService (SF-3B)
              → /portfolio/framing/:stateId (SF-3C)
```

No se modificaron Core, Prisma, migraciones, entidades canónicas, Copilot ni Portfolio Home.

## Entry modes

- `public_entry` consume una sesión Bootstrap existente y exige una primera lectura `HOME_D` o `HOME_E`; nunca crea una continuación ni salta Bootstrap. El CTA aparece únicamente después de esa lectura y reusa el estado provisional por sesión.
- `enterprise_direct` recibe intención declarada sin pedir clasificación Front/Challenge. Exige `Idempotency-Key`, conserva `user_declared` y deja la suficiencia provisional cuando falta contexto.
- `existing_portfolio` admite `strategic_front`, `challenge` e `initiative`. Lee el objeto canónico como evidencia, verifica la organización server-side y resuelve Challenge → Front e InitiativePortfolioMeta → Challenge → Front solo cuando la relación existe. Una iniciativa independiente queda fuera de este camino.

## Authorization and boundaries

El endpoint requiere autenticación y `portfolio:write`. La organización se obtiene desde `User.organizationId`; nunca se acepta del navegador. El workspace provisional sigue siendo el system of record. No hay escrituras de StrategicFront, Challenge, Project, InitiativePortfolioMeta, Step, Invitation ni CandidateChallenge, y no se añadió Copilot ni promoción canónica.

## `/portfolio/iniciar`

La superficie conserva la creación de iniciativa individual como camino independiente. Las opciones estratégicas se reconciliaron hacia `Estructurar una prioridad, reto o necesidad` y `Revisar algo que ya existe`; los shortcuts canónicos anteriores permanecen accesibles por sus URLs para compatibilidad.

## Evidence

- Backend SF-3D boundary: `backend/modules/strategic-framing/__tests__/strategic-framing.entry.router.test.ts`.
- Backend SF-3D adapters: `backend/modules/strategic-framing/__tests__/strategic-framing.entry.service.test.ts` (12 tests).
- Frontend direct-start idempotency and Existing Portfolio entry: `front/src/app/components/portfolio/__tests__/PortfolioLeadStartExperience.test.tsx`.
- SF-2/SF-3B/SF-3C and Bootstrap regression suites pass.
- Backend/frontend typecheck pass.
- Schema change: none; migration: none.

The direct-start client creates one key when a framing context is opened, reuses it
after a failed request, and creates a new key only when the user deliberately opens
a new context. The Existing Portfolio first UI still requires a manually entered
internal source ID; it does not yet list available records.

## Gaps for SF-3E

- End-to-end refresh/re-entry, provenance and no-canonicalization harness across all three modes.
- Production-like authorization and concurrent idempotency verification.
- Available-record picker for Existing Portfolio can evolve beyond the first ID-based UI.
- Runtime external certification remains pending.
