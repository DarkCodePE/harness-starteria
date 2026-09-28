# STARTERIA — PORTFOLIO → INITIATIVE OWNER HANDOFF VISUAL + UX WRITING CONTRACT v0.1

**Estado:** CANDIDATE FOR FREEZE  
**Versión:** v0.1  
**Fecha:** 2026-09-28  
**Vertical:** Portfolio Lead → Initiative Owner Handoff  
**Jira:** KAN-48  
**Scope:** Email → Invitation Landing → Accept / Reject → Activation Overview → Start  
**Hard boundary:** `Start / Empezar`  
**Fuera de alcance:** cualquier UI, Step, Cycle, navegación o comportamiento posterior a `Start`.

---

## 0. Propósito

Este documento traduce el contrato funcional del Handoff a una gramática visual, de interacción y UX Writing reutilizable.

No redefine:

- reglas de dominio;
- lifecycle canónico;
- permisos;
- autoridad humana/IA;
- Step 0–4;
- comportamiento posterior a `Start`.

Su objetivo es congelar **cómo debe sentirse, organizarse y comunicarse** el handoff antes de Technical Design.

Cadena de autoridad aplicada:

```text
STARTERIA_CORE_LOGIC_CONTRACT
→ ADRs aprobados
→ PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2
→ PORTFOLIO_TO_INITIATIVE_HANDOFF_ACCEPTANCE_CHECKLIST_v0.1
→ este Visual + UX Writing Contract
→ Technical Design
→ Implementation
```

---

# 1. Fuentes auditadas

Se auditaron como baseline de diseño:

- `STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`;
- `STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`;
- `STARTERIA_E2E_VISUAL_EXPERIENCE_ARCHITECTURE_v0.1.md`;
- `PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md`;
- `PORTFOLIO_TO_INITIATIVE_HANDOFF_ACCEPTANCE_CHECKLIST_v0.1.md`;
- `PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md`.

`STARTERIA_DESIGN_SYSTEM_DS08_ACTIVATION_INVITATION_REPORT.md` fue indicado como referencia deseada, pero **no está disponible en el set documental local usado para esta traducción**. Su ausencia no bloquea el freeze porque las reglas estructurales necesarias ya están contenidas en Design System, Page Anatomy y E2E Visual Architecture. Si DS08 reaparece, debe revisarse como validación/refinamiento y cualquier contradicción material debe hacerse explícita antes de implementar.

---

# 2. Decisión de arquitectura visual

## VUX-HO-001 — Handoff Shell es la anatomía estable pre-Start

Invitation Landing, estado post-Accept y Activation Overview usan una misma composición:

```text
HandoffShell
├── Simple Starteria header
├── Context label
├── Assignment identity / title
├── Supporting context
├── Primary meaning block
│   ├── qué recibí
│   ├── por qué importa
│   └── qué esperan de mí
├── Context / framework disclosure
├── Team / support disclosure
├── State-specific supporting content
└── Action area
```

La estructura no cambia de layout entre estados.

Cambian:

- status/context label;
- headline/supporting copy;
- cantidad de contexto revelado;
- primary CTA;
- acciones secundarias.

---

## VUX-HO-002 — No usar InitiativeWorkspacePage como shell antes de Start

El `InitiativeWorkspacePage` es una anatomía de trabajo estable para Initiative Overview / Steps.

Este vertical termina antes de entrar a ese workspace.

Además, Assigned Challenge puede no tener `initiative_ref`.

Por tanto:

```text
Invitation / Accepted / Ready to Start
→ InvitationPage-derived Handoff Shell

Start
→ HARD BOUNDARY

InitiativeWorkspace / Steps
→ downstream workstream
```

El Overview pre-Start puede reutilizar contenido/contexto del Overview existente, pero **no su navegación operacional, Step nav, Copilot persistente o layout de workspace**.

---

# 3. Auditoría KEEP / ADAPT / ADD / DO NOT USE

| Pattern / primitive | Treatment | Uso en Handoff |
|---|---|---|
| Design foundations/tokens | KEEP | Tipografía, spacing, radius, borders, focus, responsive |
| `Button` variants | KEEP | CTA primario, acciones secundarias, destructive en rechazo |
| `Card` | KEEP | Solo para agrupar contexto material; no proliferar cards |
| `Badge` / `DomainStatusBadge` | KEEP + restraint | Estado breve cuando aporte; nunca sustituir headline |
| `Dialog` | KEEP | Rechazo con justificación / confirmación focalizada |
| `Drawer` | KEEP | Progressive disclosure en móvil cuando sea necesario |
| `Alert` | KEEP | Identity mismatch, expired/revoked, error material |
| `PageHeader` primitives | ADAPT | Usar jerarquía, no header operacional completo |
| `NextAction` | ADAPT | Inspiración para “qué hago ahora”; no bloque adicional obligatorio |
| `EmailCommunicationPattern` | KEEP | Email de invitación y recordatorio |
| `InvitationPage` anatomy | KEEP + ADAPT | Base del Handoff Shell |
| `InitiativeWorkspacePage` | DO NOT USE pre-Start | Pertenece al bounded context posterior |
| `StructuredHandoff` | REVIEW/ADAPT | Puede inspirar composición, sin introducir IA innecesaria |
| Copilot panel | DO NOT USE by default | No aporta al job principal del Handoff |
| Step progress / Step route map | DO NOT USE | Fuera de scope y falso para Assigned Challenge |
| Dense dashboard cards | DO NOT USE | Contradice claridad/minimal density |
| New standalone layout per state | DO NOT USE | Viola Handoff Shell |
| `HandoffShell` composition pattern | ADD | Nuevo pattern de composición; no implica nueva primitive |

### Regla de implementación

`ADD HandoffShell` significa **añadir una composición de dominio reutilizable**, no autoriza automáticamente crear una nueva primitive o una segunda librería visual.

Technical Design debe auditar el código real antes de decidir si se implementa como:

- composición de primitives existentes;
- variant de InvitationPage;
- component reutilizable nuevo.

---

# 4. Dirección visual

El Handoff usa la dirección general:

```text
Strategic Calm + Intelligent Momentum
```

Aplicada aquí como:

```text
calm
→ suficiente espacio
→ neutralidad visual
→ jerarquía clara
→ contexto antes que controles

momentum
→ estado visible
→ siguiente acción inequívoca
→ transición clara entre revisar / aceptar / empezar
```

No debe sentirse:

- como dashboard;
- como formulario administrativo;
- como project charter;
- como pantalla de onboarding genérica;
- como experiencia gamificada;
- como celebración artificial;
- como chat con una tarjeta alrededor.

---

# 5. Density / container / layout

## VUX-HO-003 — Comfortable density

El Handoff usa `comfortable` density.

No utilizar `compact` como default.

## VUX-HO-004 — Narrow / standard content container

Recomendación inicial:

```text
Email               → email constrained width
Invitation/Handoff  → content.narrow o content.standard
```

No utilizar `workspace.full`.

## VUX-HO-005 — Sin sidebar operacional

Antes de `Start` no existe navegación Step ni sidebar de Initiative Workspace.

El foco está en una sola decisión.

---

# 6. Jerarquía cognitiva transversal

Todas las variantes deben respetar esta secuencia:

```text
1. Qué recibí
2. Por qué importa
3. Qué esperan de mí
4. Con qué marco cuento
5. Quién me ayuda
6. Qué hago ahora
```

Esta secuencia define **prioridad**, no componentes obligatorios.

No implementar seis cards solo porque existen seis preguntas.

---

# 7. Information density rules

## Above the fold

La primera lectura debe permitir reconocer:

- qué tipo de encargo es;
- Challenge / Initiative identity según aplique;
- por qué llega al usuario;
- rol esperado;
- estado actual;
- acción principal.

## Progressive disclosure

Mover a disclosure secundario:

- restricciones completas;
- contexto heredado extenso;
- equipo completo;
- metadata de Portfolio;
- historial del assignment;
- detalles de sponsor/support;
- provenance detallada.

## No inventar para completar la UI

Si un dato no existe:

- no generar texto AI para “rellenar”;
- no crear Initiative name en Assigned Challenge;
- no crear Step/progreso;
- no inferir deadlines, sponsor o restricciones no disponibles.

Ocultar el bloque opcional o comunicar una ausencia solo si es material para decidir/Start.

---

# 8. Handoff Shell — anatomy

```text
┌──────────────────────────────────────────────────────────────┐
│ STARTERIA / SIMPLE HEADER                                    │
├──────────────────────────────────────────────────────────────┤
│ CONTEXT LABEL + OPTIONAL STATUS                              │
│                                                              │
│ TITLE / ASSIGNMENT IDENTITY                                  │
│ Supporting copy                                              │
│                                                              │
│ PRIMARY CONTEXT                                              │
│ Qué recibiste                                                │
│ Por qué importa                                              │
│ Qué esperan de ti                                            │
│                                                              │
│ SECONDARY CONTEXT                                            │
│ Marco / restricciones / horizonte          [Ver más]         │
│ Equipo / apoyo                             [Ver más]          │
│                                                              │
│ STATE-SPECIFIC NOTE                                          │
│                                                              │
│ ACTION AREA                                                  │
│ [Primary CTA]                           Secondary action      │
└──────────────────────────────────────────────────────────────┘
```

### Rules

- same outer rhythm across all states;
- no nested-card stack;
- action area visually stable;
- secondary action never competes with primary;
- state-specific messages change without reflowing the full page;
- no persistent Copilot.

---

# 9. Assignment target variants

## 9.1 Assigned Initiative

Visible identity:

```text
Iniciativa
{initiative_name}

Reto relacionado
{challenge_name}
```

Can include when canonical:

- expected outcome / contribution;
- relevant constraints;
- horizon;
- known context/evidence summary;
- team;
- Portfolio Lead / support route.

Must not:

- duplicate Initiative;
- reset history;
- imply Step started;
- expose deep execution UI.

---

## 9.2 Assigned Challenge

Visible identity:

```text
Reto
{challenge_name}
```

Can include:

- strategic context;
- expected challenge outcome;
- relevant constraints/horizon;
- known context;
- team;
- Portfolio Lead/support.

Mandatory semantic cue:

> La iniciativa se formulará posteriormente a partir de este reto.

Do not show:

- invented Initiative name;
- empty Initiative card;
- Step number/status;
- initiative progress;
- “tu iniciativa” wording as if it already exists.

---

# 10. State model for the UI

The shell must support at least:

```text
invitation_public_preview
invitation_auth_required
invitation_identity_mismatch
invitation_ready_to_respond
accept_processing
accepted_ready_to_start
reject_dialog
rejected
expired
revoked
start_processing
```

These are **UI states**, not authorization to create new domain enums.

Technical Design maps them to canonical state.

---

# 11. Email experience

## Cognitive question

> ¿Quiero saber más?

## Job

Communicate one event, minimum context and one action.

## Anatomy

```text
STARTERIA

NUEVA ASIGNACIÓN

Title
What happened
Why it matters
Minimal assignment context

[Revisar asignación]

Por qué recibes este correo
```

## Information policy

Include:

- inviter identity/role when valid;
- assignment target kind;
- target name;
- one-line reason/context;
- primary CTA.

Do not include by default:

- confidential evidence;
- detailed Portfolio metadata;
- complete constraints;
- team personal data beyond what is needed;
- Accept/Reject controls.

---

# 12. Email copy — recommended baseline

## 12.1 Assigned Initiative

**Context label**  
`Nueva asignación`

**Title**  
`Te han asignado una iniciativa`

**Body**  
`{Portfolio Lead} te propone asumir la responsabilidad de “{Initiative}”, vinculada al reto “{Challenge}”. Revisa el contexto antes de responder.`

**CTA**  
`Revisar asignación`

**Footer reason**  
`Recibes este correo porque {Portfolio Lead} te invitó a asumir este trabajo en Starteria.`

---

## 12.2 Assigned Challenge

**Context label**  
`Nuevo reto asignado`

**Title**  
`Te han asignado un reto`

**Body**  
`{Portfolio Lead} te propone liderar el trabajo sobre “{Challenge}”. Revisa el objetivo y el contexto antes de responder. La iniciativa se formulará posteriormente a partir de este reto.`

**CTA**  
`Revisar asignación`

**Footer reason**  
`Recibes este correo porque {Portfolio Lead} te invitó a asumir este reto en Starteria.`

---

# 13. Invitation Landing — authenticated state

## Cognitive question

> ¿Quiero asumir este encargo?

## Context label

Preferred:

```text
ASIGNACIÓN
```

Do not use internal enum.

## 13.1 Assigned Initiative copy

**Title**  
`Te proponen liderar “{Initiative}”`

**Supporting copy**  
`Está vinculada al reto “{Challenge}”. Revisa qué se espera de ti y el contexto disponible antes de responder.`

**Role block**  
`Tu rol`  
`Initiative Owner`

`Liderarás este trabajo y coordinarás al equipo de ejecución.`

**Primary CTA**  
`Aceptar asignación`

**Secondary action**  
`No puedo asumirlo`

---

## 13.2 Assigned Challenge copy

**Title**  
`Te proponen liderar el reto “{Challenge}”`

**Supporting copy**  
`Revisa qué busca mover este reto, qué se espera de ti y con qué contexto cuentas antes de responder.`

**Role block**  
`Tu rol`  
`Initiative Owner`

`Liderarás el trabajo para abordar este reto. La iniciativa se formulará posteriormente.`

**Primary CTA**  
`Aceptar asignación`

**Secondary action**  
`No puedo asumirlo`

---

# 14. Invitation before authentication

A person may open the Invitation without an account/session.

The page may reveal enough non-sensitive context to answer:

> ¿Reconozco este encargo y quiero continuar para responder?

Do not expose full sensitive context before identity validation.

## Preferred copy

**Title**  
Use the same target-specific title when safe.

**Supporting note**  
`Para aceptar o rechazar esta asignación, primero necesitamos confirmar que eres la persona invitada.`

**Primary CTA**  
`Continuar para responder`

The auth flow is not a separate product journey; after successful authentication/registration the user returns to the same Invitation.

---

# 15. Identity mismatch

Use an `Alert` / focused state inside the same shell.

**Title**  
`Esta invitación corresponde a otra cuenta`

**Body**  
`La invitación fue enviada a {masked invited identity}. Para responder, inicia sesión con esa cuenta.`

**Primary CTA**  
`Cambiar de cuenta`

Do not show enabled Accept / Reject.

Do not allow the current account to claim the invitation.

---

# 16. Accept transition

Accept is a state transition, not a celebration screen.

During request:

```text
CTA disabled / loading
copy: Aceptando asignación…
```

Avoid:

- confetti;
- “¡Felicidades!”;
- motivational filler;
- redirecting immediately into Steps.

On success, the shell evolves in place to Activation Overview.

---

# 17. Activation Overview — common rules

## Cognitive question

> ¿Entiendo lo necesario para empezar?

## Preferred context label

```text
ASIGNACIÓN ACEPTADA
```

## Preferred title pattern

```text
Antes de empezar
```

This keeps the title valid for both target kinds.

**Supporting copy**  
`Revisa el objetivo, el marco de trabajo y quién te acompaña. Cuando estés listo, puedes empezar.`

Primary CTA:

```text
Empezar
```

---

# 18. Activation Overview — Assigned Initiative

## Primary identity

```text
{Initiative}
Iniciativa vinculada a {Challenge}
```

## Preferred content order

```text
1. Qué recibiste
   Initiative + Challenge

2. Por qué importa
   expected outcome / contribution

3. Qué esperan de ti
   ownership + responsibility

4. Con qué marco cuentas
   relevant constraints / horizon / inherited context

5. Quién te ayuda
   team + Portfolio Lead/support

6. Qué haces ahora
   Start explanation + CTA
```

## Start explanation

`Al empezar, Starteria registrará el inicio de este encargo y continuarás en la experiencia de desarrollo correspondiente.`

Do not mention Step 0 unless a higher-authority downstream contract later explicitly requires it at this boundary.

---

# 19. Activation Overview — Assigned Challenge

## Primary identity

```text
{Challenge}
Reto asignado
```

## Preferred content order

Same hierarchy as Assigned Initiative, but no Initiative block.

## Mandatory clarification

`Todavía no existe una iniciativa asociada a este encargo. La formularás posteriormente a partir del reto y del contexto disponible.`

## Start explanation

`Al empezar, Starteria registrará el inicio del trabajo sobre este reto y continuarás en el flujo correspondiente para desarrollarlo.`

Do not define the downstream flow in this contract.

---

# 20. Reject interaction

Reject is secondary on Invitation Landing but becomes the primary action inside a focused `Dialog`.

## Dialog

**Title**  
`¿No puedes asumir esta asignación?`

**Supporting copy**  
`Cuéntanos brevemente por qué. {Portfolio Lead} verá tu respuesta para decidir cómo continuar.`

**Field label**  
`Motivo`

**Placeholder**  
`Ej. No tengo capacidad disponible en este momento.`

**Validation**  
`Agrega un motivo antes de enviar tu respuesta.`

**Primary destructive action**  
`Confirmar rechazo`

**Secondary action**  
`Volver`

Never prefill or infer the reason.

---

# 21. Rejected state

Use same Handoff Shell.

**Context label**  
`ASIGNACIÓN RECHAZADA`

**Title**  
`Tu respuesta fue enviada`

**Supporting copy**  
`{Portfolio Lead} podrá revisar el motivo y responder. Este rechazo no cambia de responsable ni se reactiva automáticamente.`

If Portfolio Lead later leaves a response, show it as a clearly attributed message/disclosure.

Do not restore Accept/Start without a new valid business action.

---

# 22. Expired / revoked

## Expired

**Title**  
`Esta invitación venció`

**Body**  
`Ya no puedes responder desde este enlace. Contacta a {Portfolio Lead} si necesitas revisar una nueva asignación.`

## Revoked

**Title**  
`Esta asignación ya no está disponible`

**Body**  
`{Portfolio Lead} retiró esta invitación. No necesitas realizar ninguna acción.`

No Accept / Reject CTA.

---

# 23. Portfolio Lead projection — visual treatment

This contract does not redesign Portfolio Workspace.

Use existing Portfolio patterns.

Recommended composition:

```text
Assignment row / AttentionItem
├── Target: Challenge / Initiative
├── Initiative Owner
├── Handoff status
├── last material event
└── contextual action
```

For rejected assignment:

```text
Status: No aceptada
Reason: visible on expansion/detail
Primary contextual action: Responder
```

Use existing `DomainStatusBadge` semantics where appropriate.

Do not create a dedicated Handoff dashboard unless later validated.

Do not silently replace the owner from this state.

---

# 24. Status language

Internal state must not become user copy directly.

Recommended mapping:

| Internal | User-facing candidate |
|---|---|
| created | Preparando invitación |
| sent | Invitación enviada |
| viewed | Invitación revisada |
| accepted | Asignación aceptada |
| rejected | No aceptada |
| started | Trabajo iniciado |
| revoked | Invitación retirada |
| expired | Invitación vencida |

Exact wording can be tested without changing domain semantics.

---

# 25. CTA hierarchy

## Email

Primary:

```text
Revisar asignación
```

No Accept/Reject in email.

## Invitation

Primary:

```text
Aceptar asignación
```

Secondary:

```text
No puedo asumirlo
```

## Auth-required

Primary:

```text
Continuar para responder
```

## Activation Overview

Primary:

```text
Empezar
```

## Reject dialog

Primary/destructive:

```text
Confirmar rechazo
```

Secondary:

```text
Volver
```

No state should present Accept and Start simultaneously.

---

# 26. UX Writing rules

## Voice

Use:

- direct language;
- concrete verbs;
- short paragraphs;
- explicit actor when material;
- calm confirmation;
- user language over internal taxonomy.

Avoid:

- “activar experiencia”;
- “materializar iniciativa”;
- “transition lifecycle”;
- “handoff accepted”;
- “readiness achieved”;
- “¡Es hora de innovar!”;
- “¡Excelente decisión!”;
- “Tu aventura comienza ahora”.

Internal concepts may exist in logs/domain but should not lead the user-facing copy.

---

# 27. Terminology decisions

Preferred user-facing terms:

```text
Reto
Iniciativa
Asignación
Initiative Owner      // canonical role may remain visible
Equipo
Portfolio Lead        // if product already uses this role name
Empezar
Aceptar asignación
No puedo asumirlo
```

Avoid introducing synonyms across states such as:

```text
misión
brief
mandato
proyecto
challenge assignment
work package
```

unless a separate localization/terminology decision approves them.

---

# 28. Content length guardrails

Default visible copy target:

- headline: 1 line where possible;
- supporting copy: 1–2 short sentences;
- “why it matters”: 1–3 sentences;
- expected responsibility: max 3 concise bullets when bullets are needed;
- context summary: 3–5 key items before disclosure;
- team/support: names/roles, not biographies;
- primary CTA: 1–3 words when possible.

Do not turn inherited Challenge context into a long report.

---

# 29. Team presentation

Always make the Initiative Owner explicit.

Recommended hierarchy:

```text
Responsable
{Initiative Owner}

Equipo de ejecución
{member 1}
{member 2}
```

Observers may live behind disclosure and should not visually look like execution owners.

Do not display more than one person as “Owner”.

---

# 30. Support presentation

Default support route:

```text
Necesitas ayuda
{Portfolio Lead} es tu punto de contacto para contexto, acceso o coordinación antes de empezar.
```

Only show sponsor/other support roles when canonical and relevant.

Do not invent approvers or SLAs.

---

# 31. Responsive behavior

## Desktop

- centered narrow/standard shell;
- no side navigation;
- action area visually clear;
- disclosure content expands inline or in lightweight secondary surface.

## Tablet

- same hierarchy;
- secondary metadata can stack;
- no two-column dependency for comprehension.

## Mobile

- single-column;
- title/context remain first;
- primary CTA remains easy to reach;
- secondary action remains visually subordinate;
- disclosures stack;
- dialogs become responsive full-width/modal treatment when required;
- no hover-only information.

A sticky action region may be used on small screens only if it does not cover content and preserves accessibility.

---

# 32. Accessibility

Minimum:

- WCAG AA contrast target;
- semantic heading hierarchy;
- visible keyboard focus;
- full keyboard operability;
- CTA labels understandable out of context;
- Reject reason has visible label and associated error;
- Dialog focus is trapped and restored correctly;
- status never communicated by color alone;
- loading/processing state announced accessibly;
- identity mismatch/error messages are programmatically associated;
- touch targets appropriate for mobile;
- email CTA has meaningful accessible text.

---

# 33. Loading / retry / idempotency UX

## Accept

During request:

```text
Aceptar asignación
→ Aceptando…
```

Disable duplicate submission while request is pending.

If network failure with unknown outcome:

`No pudimos confirmar la respuesta. Revisa el estado antes de intentarlo de nuevo.`

Do not tell the user to re-submit blindly when state may already have changed.

## Start

During request:

```text
Empezar
→ Iniciando…
```

On retry, render canonical state returned by backend.

Never visually increment progress due to a local click before canonical success.

---

# 34. Error messages

## Generic load failure

`No pudimos cargar esta asignación. Intenta nuevamente.`

## Assignment changed

`Esta asignación cambió desde la última vez que la abriste. Actualizamos la información para que revises el estado actual.`

## Start no longer valid

`Esta asignación ya no puede iniciarse desde este estado.`

Do not expose raw enum/version conflict as primary message.

---

# 35. Motion

Allowed:

- subtle content/state transition after Accept;
- loading feedback;
- disclosure reveal;
- confirmation state change.

Avoid:

- celebratory animation;
- bouncing CTA;
- gradients implying AI processing where none exists;
- motion that hides state changes.

Respect reduced-motion preferences.

---

# 36. Analytics / experience signals for later implementation

This contract does not define analytics schema, but Technical Design should support measuring at least:

```text
email_cta_opened
invitation_viewed
auth_required_seen
identity_mismatch_seen
accept_started
accept_succeeded
reject_opened
reject_succeeded
activation_overview_viewed
start_clicked
start_succeeded
```

Potential UX measures:

- invitation → response conversion;
- accept vs reject;
- auth continuation success;
- time from invite to response;
- accepted → Start conversion;
- time accepted → Start;
- rejection reason completion failures;
- identity mismatch rate.

These events do not redefine domain events.

---

# 37. Explicit conflicts reconciled with older visual references

## Conflict VUX-C01 — “Tu iniciativa está lista” cannot be universal

Older E2E visual material assumes Acceptance/Start already has an Initiative.

That wording is invalid for Assigned Challenge.

Treatment:

```text
ADAPT
```

Use target-aware wording and common title `Antes de empezar`.

---

## Conflict VUX-C02 — Step 0→4 route map before Start

Older visual references show a Step route during Acceptance/Start.

This vertical has a hard boundary at Start and must not design Steps.

Treatment:

```text
REMOVE FROM THIS VERTICAL
```

No Step route map in Handoff Shell.

---

## Conflict VUX-C03 — Initiative Overview workspace shell

Existing implementation has an Initiative Overview route and workspace.

Using it as the universal pre-Start shell would fail for Assigned Challenge and introduce operational navigation too early.

Treatment:

```text
KEEP content concepts
ADAPT into Handoff Shell
DO NOT USE InitiativeWorkspace layout pre-Start
```

---

# 38. Design QA checklist

## Shared shell

- [ ] Invitation and Activation Overview use the same outer anatomy.
- [ ] Layout does not change simply because state changed.
- [ ] No operational sidebar pre-Start.
- [ ] No persistent Copilot pre-Start.

## Information hierarchy

- [ ] Target is identifiable in first viewport.
- [ ] Why it matters is visible before secondary metadata.
- [ ] Expected responsibility is explicit.
- [ ] Team/Support does not compete with the primary decision.
- [ ] Progressive disclosure handles secondary context.

## CTA

- [ ] One dominant primary CTA per state.
- [ ] Reject is secondary until its focused dialog opens.
- [ ] Accept and Start never appear as competing primary actions.

## Assigned Challenge

- [ ] No Initiative name/card/status is fabricated.
- [ ] No Step map/progress appears.
- [ ] Copy explicitly says Initiative will be formulated later.

## Auth

- [ ] Public view does not expose unnecessary sensitive information.
- [ ] Auth returns to same Invitation.
- [ ] Identity mismatch blocks response actions.

## Reject

- [ ] Reason is required.
- [ ] Copy explains Portfolio Lead will see the reason.
- [ ] Rejected state does not silently recover.

## Start

- [ ] Start explanation stays high-level.
- [ ] No downstream Step design appears.
- [ ] Successful Start is the final verification point for this visual contract.

## Responsive / accessibility

- [ ] Mobile preserves hierarchy.
- [ ] Primary CTA remains accessible.
- [ ] Keyboard/focus works.
- [ ] No state is color-only.
- [ ] Error and dialog semantics are accessible.

---

# 39. Mapping to Acceptance Checklist

This contract operationalizes primarily:

```text
BR-HO-031 — Shared Handoff Shell
BR-HO-032 — One primary cognitive job per state
BR-HO-033 — One dominant primary CTA
BR-HO-034 — Progressive information priority
BR-HO-035 — No project charter landing
BR-HO-036 — Voice
BR-HO-037 — No artificial motivation
BR-HO-038 — Email is for review, not acceptance
```

And verifies:

```text
AC-HO-038
AC-HO-039
AC-HO-040
AC-HO-041
AC-HO-042
AC-HO-043
AC-HO-044
AC-HO-045
AC-HO-046
AC-HO-047
AC-HO-073
```

---

# 40. Freeze gate for Technical Design

This visual/UX translation can be considered frozen when:

- [ ] HandoffShell anatomy is accepted.
- [ ] Assigned Initiative and Assigned Challenge copy differences are accepted.
- [ ] Email baseline is accepted.
- [ ] Invitation CTA hierarchy is accepted.
- [ ] Reject interaction is accepted.
- [ ] Activation Overview copy/hierarchy is accepted.
- [ ] “No InitiativeWorkspace before Start” decision is accepted.
- [ ] Step route map is confirmed out of scope.
- [ ] Responsive/accessibility rules are accepted.
- [ ] Code-level component audit is explicitly deferred to Technical Design, not skipped.
- [ ] DS08, if recovered, has been checked for material conflicts.

---

# 41. Technical Design handoff

Once frozen, Technical Design should answer:

1. Which existing React primitives/patterns implement each region of `HandoffShell`?
2. Can InvitationPage be extended without route-specific duplication?
3. Which current Initiative Overview content modules can be reused without adopting InitiativeWorkspace layout?
4. What data read model supplies each content block?
5. How are auth continuation and identity mismatch represented?
6. How is Reject dialog implemented and audited?
7. How are target-kind variants resolved without duplicated business logic in frontend?
8. How are loading/version conflicts rendered from backend state?
9. What tests enforce AC-HO-038..047 and AC-HO-073?
10. What changes, if any, trigger ADR review?

---

## Regla final

> Antes de Start, Starteria debe ayudar al Initiative Owner a comprender y aceptar un encargo con calma y claridad. La interfaz no debe simular que la ejecución ya comenzó, ni convertir un Challenge Assignment en una Initiative para poder dibujar la pantalla.
