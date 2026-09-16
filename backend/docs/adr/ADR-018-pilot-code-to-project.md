# ADR-018: Redimir el código de piloto → autenticar → crear proyecto

## Status
Accepted — 2026-06-02

## Date
2026-06-02

## Context

El flujo de pilot lead (ADR-015) captura una propuesta anónima y entrega un
código `ST-PILOT-XXXX`. Hasta ahora redimir el código (`GET
/public/pilot-leads/:pilotCode`, "resume") solo rehidrataba un borrador en
`sessionStorage` y mandaba al flujo público de postulación — el usuario nunca
entraba a un workspace real ni se creaba un proyecto.

El objetivo: al confirmar el código, **autenticar al usuario, crear un Proyecto
con los datos del piloto y dejarlo en el dashboard** para continuar su iniciativa.

Tensión central de seguridad: el endpoint de resume **no devuelve PII**
(email/teléfono) a propósito — el código es un bearer token corto (4 chars,
~1.6M combinaciones, rate-limited) y no debe convertirse en un oráculo de
harvesting de correos. Por eso "email prellenado" no puede leer el email desde
la respuesta pública.

## Decision

Introducir un **claim token server-side, de un solo uso**, en vez de un JWT
stateless o de devolver el email al cliente:

1. **Emisión** — `POST /public/pilot-leads/:pilotCode/claim` (anónimo,
   rate-limited con el mismo limiter del resume). Resuelve el `pilotCode` → lead,
   acuña un token opaco de alta entropía (`crypto.randomBytes(32)`), guarda solo
   su **hash SHA-256** (modelo `PilotClaimToken`, mismo patrón que
   `RefreshToken.tokenHash`) con `expiresAt` (TTL 15 min). Devuelve **solo**
   personalización no-PII (`name`, `organization`, `proposal`, `hasProposal`) —
   nunca email/phone.
2. **Auth** — el frontend guarda el claim y enruta a `/auth`. El usuario inicia
   sesión o se registra (password o "Continuar con Google", reusando el auth
   existente). Si el email ya tiene cuenta, entra a esa cuenta.
3. **Consumo** — `POST /public/pilot-leads/consume-claim` (**autenticado**).
   Valida + consume el token (single-use vía `consumedAt`) e importa
   `PilotLead.proposal` a un **Proyecto del usuario autenticado**, reusando
   `ProjectService.createProject` + `updateStep0` y un mapper propuesta→Step0
   portado del front (`mappers.ts`). Redirige a `/projects/:id`.

**Idempotencia:** `Project.pilotLeadId @unique` + `PilotClaimToken.createdProjectId`
garantizan **un proyecto por lead** — un doble-submit o un reintento devuelven el
mismo proyecto, sin duplicar.

El proyecto se crea para **quien autentica** (el claim autoriza importar esa
propuesta a la cuenta resultante), así que el email nunca llega al cliente y la
identidad la elige el usuario.

## Consequences

- **+** El email del lead nunca se expone; el oráculo de PII no existe ni siquiera
  con el nuevo endpoint (el 404 es byte-idéntico al del resume).
- **+** Reusa auth, ProjectService y el mapper existentes — el cambio es wiring +
  un modelo y dos endpoints.
- **+** Single-use + TTL + idempotencia acotan el riesgo del token.
- **−** El email **no** queda prellenado en la pantalla de auth (el cliente no lo
  tiene). Aceptado: es el costo de no filtrar PII; la UX sigue siendo de un paso
  con Google.
- **−** El código sigue siendo de 4 chars; la mitigación es el rate-limiter.
  Alargar el sufijo en `createPilotCode` queda como endurecimiento futuro aislado.
- Schema aditivo (`PilotClaimToken`, `Project.pilotLeadId`) → `prisma db push`
  seguro (ADR del mecanismo de deploy).

## Related
ADR-015 (captura de pilot lead), PR #60/#66/#67 (notificación + resume), el
modelo `PilotLead.proposal`.
