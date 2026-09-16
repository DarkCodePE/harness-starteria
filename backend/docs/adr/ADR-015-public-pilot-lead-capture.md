# ADR-015: Captura de interés en piloto reemplaza la conversión pública borrador→proyecto

## Status
Proposed — 2026-05-29

## Date
2026-05-29

## Context

El landing público (rama `feat/public-proposal-editor-ux`, PR #45, commit `5c07280`)
reescribió `ProgressiveSignupPage.tsx` eliminando el flujo que convertía a un
visitante anónimo en usuario autenticado con proyecto:

```
ANTES (main):
  visitante → redacta borrador → register/login (o Google) →
  createProjectFromPublicDraft(draftId) → navigate(/projects/:id/step/0)

AHORA (PR #45):
  visitante → redacta borrador → formulario de interés en piloto →
  publicPilotLeadService.submitPilotInterest() → localStorage
```

Starteria está en fase de **pilotos cerrados**: el objetivo del landing no es
onboarding self-service masivo, sino **identificar y contactar interesados
cualificados**. El nuevo flujo encaja con esa estrategia, pero hoy persiste los
leads **solo en `localStorage`** (`starteria.publicPilot.leads`): no hay backend,
no hay notificación al equipo, y los datos se pierden si el usuario limpia el
navegador. Además captura **PII** (email, teléfono) y un **consentimiento** que
hoy no se almacena de forma auditable.

Adicionalmente, eliminar la conversión pública deja **código potencialmente
muerto** en `main`: `createProjectFromPublicDraft` (AppContext) y la ruta
`/auth/continue/:draftId`, ambos usados solo desde el landing.

**Decision question:** ¿Cómo persistimos los leads de interés en piloto de forma
segura y auditable, y qué hacemos con el flujo de conversión pública que el
pivote elimina?

## Decision

1. **Persistir los pilot leads en backend** mediante un endpoint público
   `POST /api/v1/public/pilot-leads` y una tabla Prisma `PilotLead`, siguiendo el
   patrón de router público ya establecido en `modules/initiative-pdfs/public-pdf.*`
   (rate-limit, sin auth, validación dura). `localStorage` se conserva solo como
   **cache de idempotencia y resiliencia offline** por `draftId`, no como store
   autoritativo.
2. **Remover del landing la conversión pública borrador→proyecto.** El visitante
   anónimo ya no crea cuenta ni proyecto desde el landing. Es una decisión
   **reversible**: si un piloto futuro requiere self-service, se reintroduce.
3. **Consentimiento obligatorio y auditable:** no se persiste ningún lead sin
   `consentAccepted === true`; se guarda `consentAt` (timestamp). Email/teléfono
   se tratan como PII (cifrado en reposo, nunca en logs en claro).
4. **Notificación de nuevo lead** al equipo (canal/email — mecanismo concreto en
   SPEC-003 §notificación) para que el seguimiento del piloto sea humano y real.
5. **Limpieza de código muerto:** auditar y retirar `createProjectFromPublicDraft`
   y `/auth/continue/:draftId` si no quedan otros consumidores. Si los hay, se
   documenta y se conservan.

## Consequences

**Positivas**
- Los leads dejan de ser efímeros; el funnel de piloto se vuelve medible y accionable.
- PII y consentimiento quedan bajo control (auditoría, retención, no-logging).
- Endpoint reutiliza el substrato público existente (bajo coste de implementación).

**Negativas / costes**
- Se pierde el funnel de conversión self-service del landing (decisión de producto
  asumida). Métricas/usuarios que dependieran de ese camino dejan de aplicar.
- Nueva superficie pública → riesgo de spam/abuso: requiere rate-limit (heredado).
- Manejo de PII añade obligaciones (retención, borrado, no-exposición).

## Compliance / privacy

- Consentimiento explícito con timestamp obligatorio (US-005, PRD-003).
- Retención: `retentionUntil` por lead; valor por defecto a definir con producto
  (propuesta: 180 días) y proceso de purga.
- PII (email, phone) no aparece en respuestas públicas ni en logs.

## Alternatives considered

- **Mantener solo localStorage** — rechazado: leads efímeros, sin seguimiento, sin
  consentimiento auditable.
- **Reusar el endpoint de auth/registro** — rechazado: el pivote es precisamente
  no crear cuentas; un lead de piloto no es un usuario.
- **Coexistir lead + conversión a cuenta** — descartado por producto en
  planeamiento (pivote a pilotos); se documenta como reversible.

## Related
- PRD-003, SPEC-003
- ADR-011 (frontend↔ai-service bridge — patrón de seguridad reutilizado en el endpoint IA hermano)
- ADR-014 (Google OAuth — login autenticado, fuera de este flujo)
- ADR-016 (endpoint público de refinamiento IA — hermano de este pivote)
