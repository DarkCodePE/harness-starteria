# STARTERIA — PORTFOLIO GOVERNANCE INTERACTION CONTRACT v0.1

**Estado:** CANDIDATE — complemento de arquitectura; no reemplaza Core, Authority ni ADRs.
**Ámbito:** Portfolio Lead ↔ Initiative Core ↔ Web/Copilot/MCP/API.
**Objetivo:** desacoplar Portfolio Lead de la UI de Steps para que todos los canales operen sobre la misma verdad canónica.

## 1. Principio rector

Portfolio Lead no debe depender de una página Step, una ruta Web concreta, actividad de UI ni un `currentStep` mantenido manualmente en Portfolio.

Debe depender de:

```text
Canonical Initiative State
+ Domain Events
+ Permissions
+ Versioned Context
+ Portfolio Projections
```

La autoridad pertenece al actor/rol, no al canal.

## 2. Arquitectura objetivo

```text
Web / Starteria Copilot / External Assistant via MCP / API / Connectors
                              │
                              ▼
                 Application / Domain Services
                              │
                              ▼
                    Canonical Initiative Core
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                      ▼
 InitiativeCycle/Steps     Evidence/Issues      Validations/Decisions
        │                     │                      │
        └─────────────────────┼──────────────────────┘
                              ▼
                   Domain Events / State
                              │
                              ▼
               PortfolioInitiativeProjection
                              │
                              ▼
              Portfolio Home / Attention / Decisions
```

No existe lógica paralela por canal.

## 3. Qué posee Portfolio

Portfolio puede gobernar:
- Portfolio Anchor / strategic intent;
- Strategic Fronts;
- Challenges;
- Challenge versions;
- coverage;
- activation candidates;
- accountability;
- attention/intervention;
- decision routing;
- executive reading/reporting;
- contribution expectations.

Portfolio NO posee el estado operativo interno de Steps.

## 4. Qué posee Initiative Core

Initiative Core es source of truth para:
- initiative lifecycle activo;
- current cycle;
- StepState 0–4;
- sufficiency;
- evidence;
- issues/blockers/dependencies;
- validations;
- change events;
- decision package;
- continuation route;
- benefit tracking refs.

Portfolio solo consume proyecciones/eventos de este estado.

## 5. PortfolioInitiativeProjection

Definir una proyección derivada y read-only:

```text
initiative_id
portfolio_lineage_ref
strategic_front_ref?
challenge_ref?
challenge_version_ref?
alignment_status
contribution_status
owner
team
activation_status
current_cycle_id
current_step
step_sufficiency
next_milestone
target_date?
evidence_summary
open_issues
pending_validation
pending_decision
expected_contribution
observed_contribution?
attributed_contribution?
last_material_event
requires_portfolio_attention
projection_version
generated_at
```

Regla:

```text
PortfolioInitiativeProjection != second source of truth
```

## 6. Domain Events

Portfolio debe reaccionar a eventos y estado, no a visitas de páginas.

Eventos candidatos:

```text
initiative_selected_for_activation
initiative_owner_assigned
initiative_invited
initiative_assignment_accepted
activation_readiness_changed
initiative_activated
cycle_started
step_started
step_requires_review
step_ready_for_review
validation_requested
validation_completed
evidence_added
critical_evidence_gap
issue_raised
issue_escalated
issue_resolved
challenge_context_changed
material_change_detected
impact_assessment_completed
realignment_required
decision_package_ready
decision_overdue
decision_registered
benefit_tracking_exception
```

## 7. Event envelope común

Todo evento material debe poder registrar:

```text
event_id
event_type
entity_type
entity_id
entity_version
actor_id
actor_role
interaction_channel
organization_id?
portfolio_scope_ref?
initiative_id?
cycle_id?
step_number?
before_ref?
after_ref?
source_refs[]
occurred_at
recorded_at
```

`interaction_channel`:

```text
web
starteria_copilot
external_assistant
api
import
connector
system
```

La autoridad depende de actor/rol + guards, no del canal.

## 8. Attention Queue

Portfolio Attention Queue debe ser event/state-driven.

Cada AttentionItem debe representar:

```text
situation
affected_scope
probable_impact
opened_at
operational_owner
support_or_decision_required
next_move_owner
deadline?
status
resolution?
source_event_refs[]
```

No generar atención porque una página no fue visitada o un formulario no está completo.

## 9. Permisos channel-independent

Todas las mutaciones materiales pasan por los mismos backend/domain guards.

Un external assistant no obtiene permisos propios; actúa con los permisos del usuario autenticado.

## 10. Commands semánticos

Preferir:

```text
selectPortfolioWorkItemForActivation()
assignInitiativeOwner()
acceptInitiativeAssignment()
evaluateActivationReadiness()
activateInitiative()
getInitiativeContext()
getCurrentCycle()
getCurrentStep()
submitContextUpdate()
addEvidence()
raiseIssue()
resolveIssue()
requestValidation()
approveStep()
prepareDecisionPackage()
registerAuthorizedDecision()
```

Evitar writes genéricos que salten reglas de dominio.

## 11. Versioning / concurrency

Mutaciones estratégicas/materiales deben soportar expected version.

```text
expected_version = 27
current_version = 29
→ conflict
→ refresh / explicit merge-review
```

Igual para Web, Copilot, external assistant y API.

## 12. Challenge changes

Cambio material:

```text
Challenge vN
→ human-confirmed material change
→ Challenge vN+1
→ ChangeEvent
→ affected initiatives
→ impact assessment
```

Resultados:

```text
no_change_needed
requires_review
realignment_required
scope_conflict
```

No reescribir iniciativas activas automáticamente.

## 13. Portfolio ↔ Step boundary

Portfolio nunca escribe StepState directamente.

```text
Portfolio
→ Activation Boundary
→ Initiative Core
→ InitiativeCycle
→ StepState
```

Nunca:

```text
Portfolio → Step 0
```

## 14. Bootstrap compatibility

Se mantiene:

```text
Portfolio Entry
→ Portfolio Anchor
→ Work Intake
→ Provisional Structuring
→ Human Review
→ PortfolioReading
```

Y:

```text
PortfolioBootstrapWorkItem != canonical Initiative
PortfolioReading != Initiative
StrategicConnection != proven contribution
```

Futura lineage:

```text
PortfolioBootstrapWorkItem
→ governed portfolio candidate
→ activation candidate
→ canonical Initiative
```

## 15. Existing/imported initiatives

No reiniciar una iniciativa existente por defecto en Step 0.

Target candidate:

```text
imported portfolio work item
→ activation
→ canonical Initiative
→ reconstruct_existing route
→ inherited evidence/context
→ retroactive gating
→ InitiativeCycle
```

## 16. Contribution

Separar:

```text
expected contribution
!= observed contribution
!= attributed contribution
```

## 17. Decisions

Separar `DecisionPackage` de `Authorized Decision`.

Step 4 prepara; la autoridad organizacional decide.

## 18. Web / MCP / External Assistant

Web y futuros canales externos usan los mismos services.

MCP es adapter del Product/Core API.

No debe contener:
- lógica Step propia;
- verdad Portfolio propia;
- lifecycle privado;
- business rules duplicadas.

## 19. Learning/memory boundary

```text
Operational truth
→ Product DB / Evidence / Events / Decisions
```

```text
Reusable patterns
→ Learning / memory layer
```

El learning layer nunca muta silenciosamente estado canónico.

## 20. Cambios mínimos requeridos en Portfolio Lead antes de Steps

### KEEP
- Portfolio Entry
- Portfolio Anchor
- Work Intake
- CSV/XLSX
- Strategic Connection
- Advancement Conditions
- Human Review
- PortfolioReading
- HOME_D/HOME_E

### ADAPT
- initiative status → projection del Initiative Core;
- Attention → event/state-driven;
- audit → interaction_channel;
- permissions → backend/domain-driven;
- strategic/material writes → version checks.

### NEW
- PortfolioInitiativeProjection;
- common event envelope;
- channel metadata;
- Portfolio ↔ Initiative read contract;
- Portfolio ↔ Initiative command boundary;
- version/concurrency contract.

## 21. No requerido todavía

No implementar aún:
- MCP productivo;
- Claude plugin;
- ChatGPT plugin;
- full event bus;
- redesign completo de Attention Queue;
- advanced benefit tracking.

## 22. Acceptance criteria

- [ ] Portfolio Bootstrap no cambia.
- [ ] Portfolio no escribe StepState directamente.
- [ ] Portfolio no depende de StepPage.
- [ ] Portfolio initiative status se deriva del Initiative Core.
- [ ] eventos registran actor y canal por separado.
- [ ] permisos son backend/domain-driven.
- [ ] external assistant no gana autoridad propia.
- [ ] no existe lifecycle duplicado por canal.
- [ ] version conflicts son detectables.
- [ ] Challenge changes no reescriben iniciativas activas.
- [ ] Portfolio ve blockers/validations/decisions originados en cualquier canal.
- [ ] Portfolio projection no es segunda source of truth.
- [ ] Bootstrap WorkItem nunca entra directamente a Step 0.

## 23. Regla de cierre

Antes de construir Steps debe poder responderse:

1. Source of truth de Initiative/Step: `Initiative Core`.
2. Cómo obtiene Portfolio ese estado: `PortfolioInitiativeProjection + Domain Events`.
3. ¿Un canal externo cambia la lógica?: No; invoca los mismos services/commands.
4. ¿Portfolio activa Step directamente?: No.
5. ¿AI inference se canonicaliza silenciosamente?: No.
