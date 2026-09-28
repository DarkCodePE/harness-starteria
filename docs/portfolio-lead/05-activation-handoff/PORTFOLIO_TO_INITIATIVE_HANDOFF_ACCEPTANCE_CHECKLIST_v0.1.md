# STARTERIA — PORTFOLIO → INITIATIVE OWNER HANDOFF ACCEPTANCE CHECKLIST v0.1

**Estado:** CANDIDATE FOR FREEZE  
**Versión:** v0.1  
**Fecha:** 2026-09-28  
**Vertical:** Portfolio Lead → Initiative Owner Handoff  
**Authority reference:** `PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.2.md`  
**Scope:** Portfolio Lead Assignment → Email → Invitation Landing → Accept / Reject → Activation Overview → Start  
**Hard boundary:** `Start / Empezar`  
**Fuera de alcance:** cualquier experiencia, estado, UI o lógica posterior a `Start`; Step 0–4; Adaptive Cycle; lógica interna de Initiative Core.

---

## 0. Propósito

Este checklist convierte el Experience Contract v0.2 en reglas de negocio y criterios verificables para:

- Delivery Translation;
- Jira traceability;
- Experience Design Translation;
- Technical Design;
- QA;
- Harness / E2E;
- PR review.

Regla de trazabilidad:

```text
Business Need
→ BR-HO-*
→ AC-HO-*
→ Jira issue
→ Technical slice
→ PR / commit
→ Test / Harness evidence
```

Jira registra ejecución y evidencia. Los contratos siguen siendo la autoridad de producto.

---

# 1. Scope / boundary rules

### BR-HO-001 — Scope begins at valid assignment
El vertical comienza cuando Portfolio Lead confirma una asignación válida de un Challenge o una Initiative existente.

### BR-HO-002 — Start is the hard boundary
El vertical termina cuando `Start / Empezar` se registra exitosamente.

### BR-HO-003 — No downstream design
Este vertical no define qué ruta, Step, Cycle, pantalla o comportamiento aparece después de `Start`.

### Acceptance Criteria

- [ ] **AC-HO-001** — Ningún artefacto del vertical implementa comportamiento Step 0–4.
- [ ] **AC-HO-002** — Ningún criterio de aceptación exige una pantalla posterior a `Start`.
- [ ] **AC-HO-003** — El resultado exitoso de `Start` puede entregarse a otro bounded context sin conocer su DOM, ruta o componentes.

---

# 2. Assignment modalities

### BR-HO-004 — Assigned Initiative
Portfolio Lead puede asignar una Initiative existente vinculada a un Challenge.

### BR-HO-005 — Assigned Challenge
Portfolio Lead puede asignar un Challenge a un Initiative Owner sin que exista todavía una Initiative.

### BR-HO-006 — Assignment is not the target
`Handoff Assignment ≠ Challenge ≠ Initiative`.

### BR-HO-007 — Challenge Assignment cannot fabricate Initiative
Enviar, abrir, aceptar o iniciar un Assigned Challenge no obliga a crear una Initiative dentro de este vertical.

### Acceptance Criteria

- [ ] **AC-HO-004** — Given una Initiative existente vinculada a Challenge, Portfolio Lead puede crear un Assigned Initiative que referencia esa misma Initiative.
- [ ] **AC-HO-005** — Given un Challenge sin Initiative resultante, Portfolio Lead puede crear un Assigned Challenge válido.
- [ ] **AC-HO-006** — Given Assigned Challenge, When se crea/envía/abre/acepta, Then `initiative_ref` puede permanecer vacío.
- [ ] **AC-HO-007** — Given Assigned Initiative, When se acepta, Then no se crea una Initiative duplicada.
- [ ] **AC-HO-008** — Portfolio no contabiliza un Challenge Assignment pendiente o aceptado como Initiative activa.

---

# 3. Team rules

### BR-HO-008 — Exactly one Initiative Owner
Todo assignment debe identificar exactamente un Initiative Owner.

### BR-HO-009 — Execution team maximum
El execution team contiene:

```text
1 Initiative Owner
+ 0–2 integrantes adicionales
= máximo 3 ejecutores
```

### BR-HO-010 — Observers excluded from execution cap
Observers/viewers permitidos por permisos no cuentan dentro del máximo de 3 ejecutores.

### BR-HO-011 — Portfolio Lead may propose team
Portfolio Lead puede definir inicialmente owner y hasta dos integrantes adicionales, pero nunca omitir el owner explícito.

### Acceptance Criteria

- [ ] **AC-HO-009** — No puede enviarse un assignment sin Initiative Owner explícito.
- [ ] **AC-HO-010** — No puede persistirse un execution team con más de 3 miembros ejecutores.
- [ ] **AC-HO-011** — Un observer adicional no provoca violación del límite de ejecutores.
- [ ] **AC-HO-012** — Añadir un segundo owner es rechazado por regla de negocio.

---

# 4. Invitation / identity

### BR-HO-012 — Invitation before account
Una persona puede recibir y abrir una Invitation aunque aún no tenga cuenta Starteria.

### BR-HO-013 — Auth required for response
Accept y Reject requieren autenticación.

### BR-HO-014 — Invited identity must match
Antes de Accept/Reject Starteria valida que la identidad autenticada corresponde a la identidad invitada.

### BR-HO-015 — Invitation context survives authentication
Login/registro no pierde el assignment ni cambia la invitación que el usuario estaba revisando.

### BR-HO-016 — Wrong identity cannot claim invitation
Una cuenta diferente no puede reasignarse silenciosamente la Invitation.

### Acceptance Criteria

- [ ] **AC-HO-013** — Un email sin cuenta Starteria puede recibir un enlace de Invitation.
- [ ] **AC-HO-014** — Una Invitation puede abrirse antes de login/register.
- [ ] **AC-HO-015** — Accept/Reject no se ejecuta con usuario no autenticado.
- [ ] **AC-HO-016** — Tras login/register correcto, el usuario vuelve a la misma Invitation/assignment.
- [ ] **AC-HO-017** — Si la identidad autenticada no corresponde al destinatario, Accept/Reject permanecen bloqueados.
- [ ] **AC-HO-018** — El mismatch de identidad no cambia recipient/owner automáticamente.

---

# 5. Accept semantics

### BR-HO-017 — Accept is explicit
Accept requiere acción explícita del Initiative Owner invitado.

### BR-HO-018 — Accept ≠ Start
Aceptar ownership no inicia ejecución.

### BR-HO-019 — Accept is idempotent/auditable
Reintentos técnicos no generan múltiples aceptaciones ni efectos duplicados.

### BR-HO-020 — Assigned Initiative Accept preserves Initiative
Accept de Assigned Initiative conserva la Initiative existente y su lineage.

### BR-HO-021 — Assigned Challenge Accept preserves absence of Initiative
Accept de Assigned Challenge registra responsabilidad sin materializar Initiative.

### Acceptance Criteria

- [ ] **AC-HO-019** — Given Invitation válida, When invited owner acepta, Then assignment queda `accepted`.
- [ ] **AC-HO-020** — `accepted_at` queda auditable.
- [ ] **AC-HO-021** — Accept no crea Step/Cycle ni marca trabajo como started.
- [ ] **AC-HO-022** — Dos requests equivalentes de Accept no producen dos transiciones materiales.
- [ ] **AC-HO-023** — Assigned Initiative conserva el mismo Initiative ID después de Accept.
- [ ] **AC-HO-024** — Assigned Challenge puede quedar accepted con `initiative_ref = null`.

---

# 6. Reject semantics

### BR-HO-022 — Reject requires reason
Reject no puede completarse sin una justificación material del invitado.

### BR-HO-023 — Rejection is visible to Portfolio Lead
Portfolio Lead puede ver estado y reason del rechazo.

### BR-HO-024 — Portfolio Lead may respond
Portfolio Lead puede registrar una respuesta al rechazo.

### BR-HO-025 — Response does not mutate ownership
Responder al rechazo no cambia owner, no acepta el assignment y no reactiva silenciosamente la invitación.

### BR-HO-026 — Reassignment is explicit
Cualquier nuevo owner, nuevo intento o nueva asignación requiere acción explícita y trazable.

### Acceptance Criteria

- [ ] **AC-HO-025** — Reject sin reason es rechazado.
- [ ] **AC-HO-026** — Reject con reason válido cambia el assignment a `rejected`.
- [ ] **AC-HO-027** — Portfolio Lead puede leer el rejection reason.
- [ ] **AC-HO-028** — Portfolio Lead puede registrar respuesta al rejection.
- [ ] **AC-HO-029** — Registrar respuesta no cambia automáticamente `initiative_owner`.
- [ ] **AC-HO-030** — Registrar respuesta no cambia automáticamente `rejected → accepted`.
- [ ] **AC-HO-031** — Cualquier nueva asignación posterior conserva trazabilidad del rechazo anterior.

---

# 7. Lifecycle

### BR-HO-027 — Canonical handoff states
El lifecycle mínimo debe distinguir semánticamente:

```text
created
sent
viewed
accepted
rejected
started
revoked
expired
```

### BR-HO-028 — Started requires accepted
`started` solo puede derivar de un assignment aceptado y vigente.

### BR-HO-029 — Rejected cannot silently recover
`rejected` no se transforma silenciosamente en accepted/started.

### BR-HO-030 — Revoked/expired cannot respond
Assignments revoked/expired no pueden Accept/Reject sin una decisión posterior válida.

### Acceptance Criteria

- [ ] **AC-HO-032** — `created → sent → viewed → accepted → started` es una ruta válida.
- [ ] **AC-HO-033** — `sent/viewed → rejected` es una ruta válida.
- [ ] **AC-HO-034** — `created/sent/viewed → revoked` es una ruta válida.
- [ ] **AC-HO-035** — `created/sent/viewed → expired` es una ruta válida.
- [ ] **AC-HO-036** — `viewed → started` sin Accept es rechazado.
- [ ] **AC-HO-037** — `rejected → started` sin nueva decisión explícita es rechazado.

---

# 8. Activation Overview / Handoff Shell

### BR-HO-031 — Shared Handoff Shell
Invitation Landing, post-Accept Overview y pre-Start Overview reutilizan la misma gramática visual.

### BR-HO-032 — One primary cognitive job per state

```text
Email       → ¿Quiero saber más?
Invitation  → ¿Quiero asumir este encargo?
Overview    → ¿Entiendo lo necesario para empezar?
```

### BR-HO-033 — One dominant primary CTA
Normalmente cada estado tiene un solo CTA visual primario.

### BR-HO-034 — Progressive information priority
La experiencia prioriza:

1. Qué recibí.
2. Por qué importa.
3. Qué esperan de mí.
4. Con qué marco cuento.
5. Quién me ayuda.
6. Qué hago ahora.

### BR-HO-035 — No project charter landing
La Invitation/Overview no debe convertirse en un Project Charter ni mostrar toda la metadata de Portfolio por defecto.

### Acceptance Criteria

- [ ] **AC-HO-038** — Invitation y Activation Overview usan un shell/pattern compartido o semánticamente equivalente.
- [ ] **AC-HO-039** — Invitation presenta Accept como CTA primario y Reject como acción secundaria.
- [ ] **AC-HO-040** — Activation Overview presenta Start como CTA primario.
- [ ] **AC-HO-041** — Información secundaria puede revelarse progresivamente sin competir con el CTA.
- [ ] **AC-HO-042** — Assigned Challenge no muestra Initiative ficticia, Step status ni progreso inventado.
- [ ] **AC-HO-043** — UI usa componentes/patterns existentes del Design System antes de crear nuevos equivalentes.

---

# 9. UX writing

### BR-HO-036 — Voice
El lenguaje es claro, conciso, cordial, humano, específico y orientado a acción.

### BR-HO-037 — No artificial motivation
No usar entusiasmo vacío, innovation jargon innecesario o estados técnicos internos como mensaje principal.

### BR-HO-038 — Email is for review, not acceptance
El email invita a revisar el encargo; no intenta resolver toda la aceptación desde el correo.

### Acceptance Criteria

- [ ] **AC-HO-044** — Email tiene un CTA principal equivalente a `Revisar asignación`.
- [ ] **AC-HO-045** — Invitation usa lenguaje comprensible sin exigir taxonomía interna.
- [ ] **AC-HO-046** — Overview explica qué ocurrirá al Start sin diseñar ni prometer Steps específicos.
- [ ] **AC-HO-047** — Estados internos/enums no son el copy principal user-facing.

---

# 10. Start boundary

### BR-HO-039 — Start is explicit
`Start` requiere acción explícita después de Accept.

### BR-HO-040 — Start works for both target kinds
El boundary semántico debe poder iniciar:

- trabajo sobre Existing Initiative;
- trabajo sobre Challenge Assignment.

### BR-HO-041 — Start is idempotent/auditable/version-aware
Double click, retry o request duplicado no genera múltiples inicios materiales.

### BR-HO-042 — Start ends this workstream
Después del `Start` exitoso este vertical no define comportamiento adicional.

### Acceptance Criteria

- [ ] **AC-HO-048** — Start antes de Accept es rechazado.
- [ ] **AC-HO-049** — Start sobre assignment revoked/expired es rechazado.
- [ ] **AC-HO-050** — Assigned Initiative puede registrar Start sin crear otra Initiative.
- [ ] **AC-HO-051** — Assigned Challenge puede registrar Start sin requerir Initiative preexistente.
- [ ] **AC-HO-052** — Reintentos de Start no duplican la transición ni eventos materiales.
- [ ] **AC-HO-053** — El test de este vertical termina al comprobar Start exitoso y sus efectos de handoff.

---

# 11. Portfolio Lead projection

### BR-HO-043 — Portfolio has handoff projection
Portfolio debe poder leer el handoff sin depender de DOM/rutas/components del Initiative workspace.

### BR-HO-044 — Projection is not source of truth
`PortfolioHandoffProjection` o equivalente es read model derivado.

### BR-HO-045 — Minimum projection
Debe proyectar al menos:

```text
challenge_ref
target_kind
initiative_ref?
initiative_owner
execution_team
handoff_state
accepted/rejected
rejection_reason?
portfolio_response?
started
last_material_event
version/timestamp
```

### Acceptance Criteria

- [ ] **AC-HO-054** — Portfolio Lead puede distinguir Assigned Initiative vs Assigned Challenge.
- [ ] **AC-HO-055** — Portfolio Lead puede ver Initiative Owner y execution team.
- [ ] **AC-HO-056** — Portfolio Lead puede ver accepted/rejected/started.
- [ ] **AC-HO-057** — Rejection reason aparece en la proyección cuando corresponde.
- [ ] **AC-HO-058** — Challenge Assignment sin Initiative no fuerza `PortfolioInitiativeProjection` falsa.
- [ ] **AC-HO-059** — La proyección puede reconstruirse desde estado/eventos canónicos sin writes paralelos de lifecycle.

---

# 12. Downstream integration boundary

### BR-HO-046 — Portfolio consumes semantic events
Portfolio recibe estado posterior mediante eventos/read models, no mediante frontend internals.

### BR-HO-047 — Downstream event vocabulary
El contrato de integración posterior debe poder expresar, como mínimo:

```text
initiative_started
step_entered
step_completed
blocker_raised
blocker_resolved
support_requested
decision_requested
relevant_progress_recorded
```

### BR-HO-048 — Challenge Assignment correlation
Cuando downstream formule una Initiative desde Assigned Challenge debe existir correlación:

```text
assignment_id → resulting initiative_id
```

### Acceptance Criteria

- [ ] **AC-HO-060** — Portfolio no lee DOM, pathname o component state para determinar progreso.
- [ ] **AC-HO-061** — La integración soporta eventos originados desde cualquier canal autorizado.
- [ ] **AC-HO-062** — Puede correlacionarse una Initiative creada downstream con el Challenge Assignment que la originó.
- [ ] **AC-HO-063** — Ningún evento downstream obliga a modificar Step 0–4 desde este vertical.

---

# 13. Channel / permission rules

### BR-HO-049 — Same lifecycle across channels
Web, Copilot, API y futuros adapters operan sobre el mismo estado y commands.

### BR-HO-050 — Authority belongs to actor/role
El canal no concede autoridad adicional.

### Acceptance Criteria

- [ ] **AC-HO-064** — Accept/Reject/Start aplican los mismos guards independientemente del canal.
- [ ] **AC-HO-065** — Un canal externo no puede saltar identidad, permisos o lifecycle.
- [ ] **AC-HO-066** — interaction_channel queda disponible para auditoría cuando corresponda.

---

# 14. No-regression / prohibited shortcuts

- [ ] **AC-HO-067** — Invitation no se modela como Initiative.
- [ ] **AC-HO-068** — Accept no se modela como Start.
- [ ] **AC-HO-069** — Assigned Challenge Accept no crea Initiative.
- [ ] **AC-HO-070** — No se crea Initiative vacía para aumentar coverage.
- [ ] **AC-HO-071** — Accept no activa Step 0.
- [ ] **AC-HO-072** — Reject no cambia ownership silenciosamente.
- [ ] **AC-HO-073** — No existe un layout independiente para cada estado si Handoff Shell puede resolverlo.
- [ ] **AC-HO-074** — Portfolio no mantiene un `currentStep` manual duplicado.
- [ ] **AC-HO-075** — No se crea nuevo aggregate/table Initiative por naming sin ADR.
- [ ] **AC-HO-076** — No se modifica Core, Step 0–4 ni autoridad IA/humana desde este vertical.

---

# 15. ADR triggers

Marcar `ADR REQUIRED` y detener el cambio afectado si Technical Design propone:

- modificar un Invariante Core;
- cambiar cardinalidades canónicas;
- cambiar la definición canónica de Challenge activo/cobertura;
- separar `Project` e `Initiative` como identidades canónicas nuevas;
- expandir autoridad IA u organizacional;
- modificar funciones Step 0–4 / Adaptive Cycle / gating;
- canonicalizar inferencias automáticamente;
- introducir una migración de dominio material.

### Acceptance Criteria

- [ ] **AC-HO-077** — Todo conflicto de autoridad detectado se registra explícitamente antes de implementar.
- [ ] **AC-HO-078** — Ningún ADR trigger se resuelve como refactor silencioso.

---

# 16. Jira traceability fields — minimum

Cada issue de este vertical debería registrar o enlazar:

```text
Vertical: Portfolio Lead → Initiative Owner Handoff
Authority artifact/version
BR-HO-* implemented
AC-HO-* verified
Treatment: KEEP | ADAPT | ADD
Affected surface/domain
Core impact: NONE | POTENTIAL_CONFLICT | ADR_REQUIRED
Dependencies
PR / commit
Tests / Harness evidence
Implementation report
```

## Definition of Done de un delivery issue

- [ ] Requirements/BR IDs identificados.
- [ ] AC IDs identificados.
- [ ] Authority artifact enlazado.
- [ ] No existe conflicto superior oculto.
- [ ] Implementación vinculada a PR/commit.
- [ ] Tests correspondientes ejecutados.
- [ ] Evidencia Harness/E2E registrada cuando aplica.
- [ ] Implementation report actualizado cuando aplica.

---

# 17. Freeze gate antes de Technical Design

No avanzar a Technical Design hasta que:

- [ ] Experience Contract v0.2 esté revisado/frozen.
- [ ] Este Acceptance Checklist esté revisado/frozen.
- [ ] KEEP / ADAPT / ADD esté reconciliado.
- [ ] Handoff Shell + UX Writing translation esté definida.
- [ ] Patterns existentes del Design System hayan sido auditados.
- [ ] Contrato downstream esté definido al nivel de interface/events, sin diseñar Steps.
- [ ] Jira traceability baseline exista.

---

## Regla final

> Un cambio del Handoff no está terminado porque la pantalla funcione. Está terminado cuando el requirement puede seguirse desde el contrato hasta Jira, implementación, prueba y evidencia sin alterar silenciosamente Core o Steps.
