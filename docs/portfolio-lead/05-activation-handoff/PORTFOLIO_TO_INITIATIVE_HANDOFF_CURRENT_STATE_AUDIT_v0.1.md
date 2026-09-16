# STARTERIA â€” PORTFOLIO â†’ INITIATIVE HANDOFF CURRENT STATE AUDIT v0.1

**Fecha:** 2026-09-15
**Estado:** AUDIT ONLY â€” no implementación
**Bounded context:** Portfolio / Challenge â†’ Invitation â†’ Accept â†’ Initiative Overview â†’ Start
**Fuera de alcance:** comportamiento interno Step 0â€“4 después de `Start`

## 1. Executive summary

La base existente de Starteria es reutilizable, pero el E2E objetivo todavía no existe como una única ruta canónica.

El repositorio ya contiene:
- StrategicFront / Challenge y lifecycle de reto gobernado backend-side;
- ChallengeInvitation, ChallengeSquadMember y ChallengeTeamMember;
- Sponsor/contexto de Frente y Reto;
- Project como identidad actual de iniciativa en producción;
- TeamMember por Project;
- InitiativePortfolioMeta;
- una ruta Project/Initiative Overview;
- integración Reto â†’ Project con herencia de contexto;
- infraestructura consolidada de permisos/proyección/eventos según los slices PG ya cerrados.

Sin embargo, la ruta actual `Reto â†’ createProject(challengeLink)` materializa demasiado pronto un Project, crea OWNER activo para el usuario autenticado, prellena Step 0, crea Steps 1â€“4 y registra PortfolioMeta como `en_step_0`. Esto contradice el E2E acordado, donde deben distinguirse:

`Invitation â†’ Accept responsibility â†’ Initiative draft/pre_start â†’ Start â†’ Initiative Core`.

Por tanto, la recomendación es **ADAPTAR la base existente y crear un bounded context explícito de handoff**, no reconstruir Portfolio ni Steps.

## 2. Authority / guardrails

Jerarquía aplicable:

`Core â†’ ADRs â†’ Experience Contracts â†’ Agent/Skill â†’ Tech Specs â†’ PRDs â†’ implementación`.

Guardrails:
- Portfolio no escribe StepState directamente.
- Initiative Core sigue siendo source of truth del lifecycle/Steps tras Start.
- IA/canal externo no obtiene autoridad propia.
- Invitación no equivale a Initiative activa.
- Accept no equivale a Start.
- Start es la frontera con el siguiente E2E.
- Sponsor es contexto ejecutivo; no se asume Decision Authority universal.
- Existing/imported initiative debe soportar reconstrucción/gating retroactivo.

## 3. Target experience baseline acordado

### 3.1 Dos caminos desde Portfolio

**A. Existing Initiative**

`Challenge/Portfolio â†’ seleccionar iniciativa existente â†’ invitar por email â†’ Accept â†’ owner accepted â†’ Initiative Overview â†’ Start`

**B. Challenge-only**

`Challenge â†’ invitar por email â†’ Accept â†’ crear Initiative draft/pre_start â†’ Initiative Overview â†’ Start`

No crear Initiative por enviar una invitación.

### 3.2 Una sola superficie

Una única superficie evoluciona por estado:

1. `Invitation Overview`
2. `Initiative Overview` después de Accept
3. continúa como Home de iniciativa durante el Core

No crear una cadena de páginas Invitation â†’ Readiness â†’ Overview separadas.

### 3.3 Información pre-Accept / pre-Start

Debe permitir responder:
1. ¿De qué trata el reto y por qué importa?
2. ¿Qué esperan de mí?
3. ¿Qué resultado/métrica/señal quiere mover el negocio?
4. ¿Qué horizonte y esfuerzo esperado existen?
5. ¿Trabajo solo o puedo formar equipo?
6. ¿Qué apoyo/dependencias conocidas existen?
7. ¿Cómo empiezo y cuál es la ruta 0â€“4?
8. ¿Cómo me ayuda Starteria y puedo trabajar desde Web/Copilot/LLM conectado?

## 4. Current implementation inventory

### 4.1 Challenge lifecycle â€” KEEP + ADAPT

Existe una máquina de estados backend-side para Challenge con estados legacy:
- draft
- listo_para_activar
- activo_interno
- publicado
- recibiendo_iniciativas
- con_iniciativas_activas
- pendiente_de_decision
- pausado
- cerrado

La transición está protegida por servidor. Esto debe conservarse.

Gap: no existe estado/semántica explícita para el período `inviting / awaiting owner acceptance` del nuevo E2E. Debe evaluarse si puede representarse con estados actuales sin cambiar dominio o si requiere adaptación/ADR.

### 4.2 ChallengeInvitation â€” ADAPT

Existe `ChallengeInvitation` con:
- `value: string`
- status: `pendiente | notificado | confirmado | declinado`

Esto es base útil para invitación por email, pero hoy no expresa suficientemente:
- recipient_email tipado/normalizado;
- claim/auth identity;
- invited existing initiative vs challenge-only;
- invitation token / single-use claim;
- viewed;
- accepted con ownership explícito;
- revoked;
- expired;
- inviter;
- message/provenance;
- owner_can_invite;
- channel-independent invitation read/action.

### 4.3 Challenge team â€” KEEP + ADAPT

Existe `ChallengeTeamMember` con `userId` opcional o `label` libre y roles OWNER/EDITOR/VIEWER, además de ACTIVE/PENDING.

Es reutilizable para compatibilidad con personas externas/no registradas, pero no debe confundirse con el nuevo ownership de Initiative.

### 4.4 Initiative team â€” ADAPT

Existe `TeamMember` por Project y resolución de owner/equipo. La implementación actual de iniciativa requiere User real para overrides y crea owner activo al crear Project.

Target MVP:
- core team máximo 3 como business rule/config, no Core invariant;
- Portfolio Lead decide `owner_can_invite`;
- owner + hasta 2 core members;
- personas adicionales pueden ser VIEWER/Observer;
- stakeholders/fuentes/validadores/dependencias no deben transformarse automáticamente en team members.

### 4.5 Reto â†’ Initiative actual â€” REMOVE FROM CANONICAL HANDOFF / ADAPT

`ProjectService.createProject(userId, { challengeLink })` actualmente:
- valida Challenge;
- hereda contexto del Reto;
- crea Project DRAFT;
- asigna inmediatamente al usuario autenticado como OWNER/ACTIVE;
- fija `currentStep = 0` y `step0Status = IN_PROGRESS` para challenge-linked;
- crea Steps 1â€“4 y módulos;
- crea `InitiativePortfolioMeta` con `status = en_step_0`;
- prellena Step 0 desde Challenge;
- puede heredar team/squad.

Esta operación no puede ser la operación canónica del nuevo handoff porque colapsa:

`Accept + Initiative creation + owner assignment + Start + Step initialization`.

Debe preservarse como infraestructura reutilizable donde tenga sentido, pero desacoplarse de la transición Portfolio â†’ Owner.

### 4.6 Existing Overview â€” KEEP + ADAPT

Existe `/initiatives/:projectId/overview` con `InitiativeOverviewPage`, además de `/projects/:projectId` y rutas Steps.

Esto es una base fuerte para cumplir la decisión de â€œuna sola superficieâ€. Recomendación: adaptar/absorber la experiencia nueva sobre esta superficie o un route alias estable, en lugar de crear otra landing post-accept.

Falta una vista equivalente accesible mediante invitation token antes de que exista/sea reclamado un Project del owner.

### 4.7 Sponsor â€” KEEP SEMANTICS + ADAPT UI

El modelo actual ya conserva sponsor en StrategicFront/Challenge metadata y sponsor touchpoints en InitiativePortfolioMeta.

Target:
- mostrar Sponsor como contexto ejecutivo;
- no asumir que Sponsor es Decision Authority;
- pending invitation challenge-only no cuenta como Initiative;
- al Accept challenge-only aparece Initiative draft/pre_start;
- al Start pasa al Core.

### 4.8 Support / dependencies â€” ADAPT

El Challenge ya tiene inputs de activación para dependency y otros factores. El target no debe obligar al Portfolio Lead a nombrar personas/contactos/SLA antes de invitar.

Pre-start:
- mostrar dependencias conocidas si existen;
- mostrar Portfolio Lead como ruta de soporte;
- permitir una acción simple `Solicitar apoyo`;
- no construir workflow tipo ServiceNow/Jira.

Dependencias concretas pueden emerger en Steps.

### 4.9 External LLM / plugin channel â€” NEW

La auditoría previa del repo concluye que no existe arquitectura transversal Copilot/conversacional: no existen conversaciones/action plans/capability registry/command surface completa para esa experiencia.

Para este bounded context no es necesario crear lógica de negocio separada por LLM. Se requiere una superficie de comandos/read-model channel-independent que permita, como mínimo:
- `getMyStarteriaEntrySummary()`
- `listMyPendingInvitations()`
- `getInvitationOverview()`
- `sendInvitationQuestionToPortfolio()`
- `acceptInvitation()`
- `declineInvitation()`
- `getInitiativeOverview()`
- `startInitiative()`

El mensaje inicial del LLM debe derivarse del estado real, por ejemplo:
`1 reto pendiente + 2 iniciativas activas`, no un saludo genérico.

## 5. Current â†’ target gap matrix

| Area | Current | Target | Treatment |
|---|---|---|---|
| Challenge lifecycle | Backend state machine exists | Represent waiting/invitation without false active initiative | ADAPT |
| Invitation storage | Generic value + 4 statuses | Email-first, claimable, versioned, revoke/expire/view/accept | ADAPT |
| Email delivery | No canonical handoff flow found | Traceable invite email even if user exists | NEW |
| Existing-account alert | Not found for this flow | In-app pending invitation | NEW |
| LLM entry | No transversal implementation | Contextual pending invites/initiative state | NEW |
| Existing initiative assignment | Legacy Project team/meta patterns | Invite owner without starting Steps | ADAPT |
| Challenge-only assignment | Challenge invitations exist | Do not create Initiative until Accept | ADAPT |
| Accept | `confirmado` exists but not ownership contract | Accept responsibility; create pre_start Initiative only when needed | NEW/ADAPT |
| Start | Current challengeLink createProject enters Step0 | Explicit boundary into Initiative Core | NEW/ADAPT |
| Overview | InitiativeOverviewPage exists | Same surface before/after accept/start | KEEP + ADAPT |
| Sponsor | Existing fields/touchpoints | Executive context, not universal approver | KEEP + HARDEN |
| Team | Several team models | owner_can_invite + max 3 core MVP + observer | ADAPT |
| Support | Activation dependency fields | Simple support route + known dependencies | ADAPT |
| Existing initiative reconstruction | Partial/import logic exists | Start routes to reconstruct_existing | KEEP + ADAPT |
| Permissions | Existing consolidated backend permission direction | Same across Web/LLM | KEEP |
| Events/channel | Existing common event direction | Add invitation/accept/start events | ADAPT |

## 6. Conflicts / ADR candidates

### CONFLICT-A â€” current challenge-linked creation starts Step 0 too early

**Current:** `createProject(challengeLink)` creates Project, OWNER, Step structures, Step0 IN_PROGRESS and meta `en_step_0`.

**Target:** invitation and acceptance occur before Start; only Start enters Initiative Core.

**Treatment:** ADAPT. Do not use this operation directly from invitation Accept.

**ADR:** likely NO if this is an experience/domain-service refactor that preserves Core invariant. YES only if Project identity/cardinality must materially change.

### CONFLICT-B â€” Challenge active/coverage semantics

Older Portfolio design allows activating/inviting before an Initiative exists. Core candidate says active Challenge should maintain initiative coverage.

Current code has statuses that can represent activation/receiving without active initiatives, but names are legacy.

**Candidate resolution:** use an activation/receiving state while invites are pending; only report active initiative coverage after Accept creates/links Initiative.

**ADR:** REVIEW REQUIRED if this changes canonical definition of â€œactive Challengeâ€; otherwise clarify via Experience/Tech contract.

### ADR-CANDIDATE â€” Project vs Initiative identity

Production code uses `Project` as current Initiative identity. Do not create a new Initiative table simply to match naming.

If implementation proposes separating Project and Initiative identities, this is a material domain migration â†’ ADR required.

## 7. No-regression rules

The implementation must not:
- reopen Portfolio Bootstrap;
- replace PortfolioInitiativeProjection with writable duplicate lifecycle;
- bypass PermissionAuthorityService/domain guards;
- make channel determine authority;
- create Initiative when an invite is merely sent;
- activate Step 0 on Accept;
- create an LLM-specific lifecycle;
- treat Sponsor as automatic decision authority;
- force existing initiatives to restart from scratch;
- introduce detailed dependency/work-request workflows in this bounded context.

## 8. Recommended implementation slices

### H-0 â€” Contract + acceptance checklist
Freeze the experience agreed in chat into an authoritative Experience Contract before code.

### H-1 â€” Invitation domain hardening
Extend/reconcile ChallengeInvitation into a claimable invitation model:
- email recipient;
- invitation target kind (`challenge_only | existing_initiative`);
- challenge/initiative refs;
- inviter;
- status machine;
- expiry/revoke;
- owner_can_invite;
- audit/events/idempotency.

No Step changes.

### H-2 â€” Invitation delivery + claim/auth
- email sent for all recipients;
- logged-in user also gets in-app alert;
- anonymous/non-user can authenticate/claim invitation;
- same invitation ID/state preserved.

### H-3 â€” Unified Invitation / Initiative Overview
Adapt existing overview patterns to render:
- challenge/strategic context;
- sponsor;
- mission;
- metric/signal;
- horizon/effort if known;
- team policy;
- support;
- known dependencies;
- visible Steps route;
- existing initiative context when applicable.

No second post-accept landing.

### H-4 â€” Accept command
Existing Initiative:
- accept owner responsibility on existing Initiative.

Challenge-only:
- create/promote current Project identity as Initiative `draft/pre_start`;
- attach lineage/context;
- do NOT create active Step state / cycle.

### H-5 â€” Team policy
- owner_can_invite;
- core team max 3 as MVP config/business rule;
- observer access;
- email invitations for additional members;
- no complex specific-participant workflow.

### H-6 â€” Support interaction
Single `requestPortfolioSupport()` semantic command + message/thread/reference.
No enterprise ticket engine.

### H-7 â€” Start boundary
Introduce one explicit semantic command, conceptually `startInitiative()`:
- validates only true hard blockers;
- is idempotent/version-aware;
- emits event;
- routes to `new_from_challenge` or `reconstruct_existing`;
- then hands control to next bounded context.

Do not design internal Step behavior in this slice.

### H-8 â€” Channel-independent tool surface
Expose H-1/H-4/H-6/H-7 reads/commands through same services for Web and future Product MCP/plugin.
Contextual LLM entry reads pending invitations/active initiatives; no duplicated business logic.

## 9. Test matrix required before GO

Minimum tests:
1. invite unknown email â†’ no Initiative created;
2. invite existing account â†’ email + in-app alert;
3. invite visible via external channel read;
4. challenge-only Accept â†’ exactly one draft/pre_start Initiative;
5. existing-initiative Accept â†’ no duplicate Initiative;
6. Accept does not activate Step/cycle;
7. Start is idempotent;
8. Start from new challenge enters new route;
9. Start existing/imported enters reconstruction route;
10. revoked/expired invitation cannot be accepted;
11. owner_can_invite false prevents team invite in all channels;
12. core team limit enforced backend-side;
13. Sponsor visibility does not imply approval authority;
14. external assistant cannot bypass user permission;
15. Portfolio projection only reflects active Step state after Start.

## 10. Final recommendation

**GO to implementation planning, not directly to coding yet.**

The architecture is sufficiently understood, and the repo has substantial reusable infrastructure. Before implementation, create/freeze:

`PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md`

or equivalently a single handoff Experience Contract that includes the decisions from this audit and the agreed UX.

Then implement H-1 â†’ H-8 incrementally, with H-7 (`Start`) as the explicit boundary. The next E2E begins only after `Start`.
