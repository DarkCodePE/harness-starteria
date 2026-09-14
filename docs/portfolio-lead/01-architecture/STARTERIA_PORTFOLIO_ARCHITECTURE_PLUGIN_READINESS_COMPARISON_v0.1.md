# Starteria — Portfolio Lead Architecture Comparison & External-Channel Readiness

**Documento:** `STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md`  
**Versión:** v0.1  
**Estado:** PROPUESTA PARA AUDITORÍA Y CONSOLIDACIÓN — NO ES AUTORIDAD SUPERIOR TODAVÍA  
**Fecha:** 2026-09-14  
**Ámbito:** Portfolio Lead + Strategic Fronts + Challenges + Initiative activation/tracking + alerts + decisions + relationship with Initiative Core/Web/MCP  
**Objetivo:** determinar qué debe mantenerse, ajustarse o añadirse en Portfolio Lead para que el Initiative Core pueda ser operado desde Web/Copilot/futuros plugins sin generar gaps de gobernanza.

---

# 0. Conclusión ejecutiva

**No se recomienda rediseñar el modelo conceptual de Portfolio Lead.**

La arquitectura actual ya apunta correctamente a:

```text
Organization Context
→ Strategic Front
→ Challenge
→ Challenge Activation
→ Initiative
→ Evidence / Decision
```

Y el Core v0.3 candidato ya incorpora los cambios más importantes:

- separación Portfolio accountability vs Initiative ownership;
- Activation Readiness antes de abrir un ciclo;
- seguimiento continuo de ciclo/Step/bloqueos/capacidad/evidencia/decisión;
- versionado de cambios materiales del Reto;
- `requires_review`/realignment de iniciativas afectadas;
- alertas y escalamiento;
- Brief de Iniciativa + Autoridad de Decisión de Negocio;
- responsabilidad conjunta de Portfolio Leads designados.

Por tanto, el cambio requerido es principalmente:

> **hacer que Portfolio Lead consuma el mismo estado/eventos gobernados del Initiative Core y dejar de depender de que el trabajo ocurra específicamente dentro de la UI web.**

---

# 1. Regla de autoridad

Este documento debe aplicarse bajo:

```text
Core Contract
→ ADRs aprobados
→ Experience Contracts
→ Agent/Skill Contracts
→ Tech Specs
→ PRDs
→ implementación
```

El Core v0.3 actualmente figura como **candidato / requiere re-test**. Este documento no debe convertir automáticamente sus puntos todavía experimentales en producción sin revisión.

---

# 2. Arquitectura actual documentada — baseline

Los PRDs de Portfolio Lead ya definen:

```text
Inicio
↓
Frentes Estratégicos
↓
Retos
↓
Activación del Reto
↓
Iniciativas vinculadas
↓
Evidencia y métricas
↓
Centro de decisión
↓
Reporte ejecutivo
↓
Aprendizaje
```

Objetos principales:

```text
Organization / Program
→ StrategicFront
→ Challenge
→ ChallengeActivation
→ Initiative
→ Evidence
→ Decision
→ Report
```

Y el Portfolio Lead debe responder:

```text
¿Qué quiere mover el negocio?
¿Qué Retos lo activan?
¿Qué iniciativas los abordan?
¿Qué evidencia existe?
¿Qué está bloqueado?
¿Qué decisión requiere atención?
```

Esta estructura **se mantiene**.

---

# 3. Qué cambia cuando Initiative Owners pueden trabajar fuera de la Web

Antes se puede asumir implícitamente:

```text
initiative activity
≈
activity inside Starteria UI
```

Con Web + future external assistants:

```text
initiative activity
can originate from:
- Starteria Web
- Starteria Copilot
- external assistant via Product MCP/API
- future connectors/imports
```

Por tanto Portfolio debe dejar de depender de señales de UI y depender de:

```text
Canonical Initiative State
+
Domain Events
+
Permissions
+
Versioned Context
```

La Home/Attention Queue debe ser **event/state-driven**, no “page-driven”.

---

# 4. Arquitectura objetivo Portfolio ↔ Initiative

```text
                       PORTFOLIO CORE

Organization Context
        │
        ▼
Strategic Front
        │
        ▼
Challenge + Challenge Version
        │
        ▼
Challenge Activation
        │
        ▼
Initiative Activation Readiness
        │
        ▼
Initiative Core
        │
        ├─ Cycle / Step State
        ├─ Evidence / Claims
        ├─ Issues / Alerts
        ├─ Validations
        ├─ Contribution
        └─ Decision Package
        │
        ▼
Portfolio Projection / Summary
        │
        ├─ Attention Queue
        ├─ Coverage
        ├─ Capacity
        ├─ Contribution
        ├─ Evidence confidence
        ├─ Pending decisions
        └─ Executive reporting
```

**Portfolio no duplica la iniciativa.** Consume una proyección/resumen estructurado del Initiative Core.

---

# 5. Comparativo CURRENT → TARGET

| Área | Arquitectura actual documentada | Ajuste necesario | Tratamiento candidato |
|---|---|---|---|
| Jerarquía | Frente → Reto → Iniciativa | mantener | KEEP |
| Multi-front/multi-challenge | soportado | mantener | KEEP |
| Challenge Activation | convocatoria/personas/squad | añadir conexión explícita con Initiative Activation Readiness | ADAPT |
| Initiative lifecycle | draft / Step states / blocked / decision | separar selected/owner_pending/resourcing/ready_to_activate/active | ADAPT |
| Ownership | Initiative Owner ejecuta | hacer aceptación explícita y auditable | ADAPT |
| Portfolio Lead accountability | gestiona portafolio | mantener separado de ejecución | KEEP / HARDEN |
| Portfolio tracking | Step + bloqueo + evidencia | consumir canonical state/event projection | ADAPT |
| Alerts | home “requiere atención” | formalizar objeto/evento y escalation owner | ADAPT / NEW |
| Challenge changes | edición del reto | version + ChangeEvent + impact on initiatives | NEW / ADAPT |
| Contribution | asociación frente/reto | Contribution Contract; expected vs observed vs attributed | ADAPT |
| Coverage | sin/parcial/suficiente | preservar; no confundir con impacto | KEEP / HARDEN |
| Decisions | centro de decisión | Decision Package + DecisionAuthority | ADAPT |
| Sponsor/authority | sponsor/challenge owner por PRD | autoridad configurable por tipo/threshold; revisar roles legacy | ADAPT |
| Evidence | visible por iniciativa | resumen consumido desde Evidence Core; no duplicar | ADAPT |
| Activity source | Web implícita | channel-independent events | NEW |
| Learning | biblioteca futura | conectar decision/evidence/learning pipeline, no gbrain como system of record | ADAPT / P1 |
| External plugin | no modelado | no lógica Portfolio específica en plugin; mismo Product API/Core | NEW, no P0 obligatorio |

---

# 6. Cambios que SÍ conviene considerar ahora

## 6.1 Initiative Activation Readiness como frontera Portfolio → Initiative

Portfolio Lead no debe pasar de:

```text
initiative selected
→ active Step 0
```

Debe existir:

```text
selected
→ owner_pending
→ owner accepted
→ resourcing/readiness
→ ready_to_activate
→ active cycle
```

Portfolio debe poder ver por qué una iniciativa todavía no está activa:

- owner no aceptó;
- capacidad insuficiente;
- falta contexto del mandato;
- restricciones pendientes;
- decision-to-enable no está clara.

---

## 6.2 Portfolio Projection en vez de duplicar Initiative State

Definir una lectura de portfolio construida a partir de Initiative Core:

```text
PortfolioInitiativeProjection
├── initiative_id
├── strategic_front
├── challenge + version
├── alignment_status
├── contribution_status
├── owner/team
├── activation_status
├── current_cycle
├── current_step
├── next_milestone
├── target_date / time_remaining
├── evidence_strength_summary
├── open_issues
├── capacity summary
├── expected_contribution
├── observed_contribution
├── attributed_contribution
├── pending_validation
├── pending_decision
├── last_material_event
└── requires_portfolio_attention
```

No crear una segunda tabla “portfolio initiative status” que pueda divergir de la iniciativa sin estrategia explícita de proyección.

---

## 6.3 Attention Queue basada en eventos y reglas

La Attention Queue no debe depender de que el Initiative Owner abra una página concreta.

Eventos candidatos:

```text
owner_acceptance_overdue
activation_blocked
blocker_raised
blocker_escalated
step_requires_review
validation_requested
challenge_changed
realignment_required
coverage_lost
decision_package_ready
decision_overdue
capacity_conflict
critical_evidence_gap
benefit_tracking_exception
```

Cada alerta debe registrar:

```text
situation
affected scope
probable impact
opened_at
operational owner
support/decision required
next-move owner
deadline
status/resolution
```

---

## 6.4 Challenge versioning e impact propagation

El Reto necesita versión actual y change history.

```text
Challenge v1
↓
material change confirmed
↓
Challenge v2 + ChangeEvent
↓
identify affected initiatives
↓
Impact Assessment
↓
no_change_needed
OR requires_review
OR realignment_required
OR scope_conflict
```

Portfolio debe visualizar:

- qué cambió;
- quién lo confirmó;
- cuántas iniciativas afecta;
- cuáles requieren acción;
- quién debe decidir la respuesta.

No reescribir automáticamente iniciativas activas.

---

## 6.5 Contribution Contract

La asociación jerárquica no prueba contribución.

Cada iniciativa debería poder expresar progresivamente:

```text
ContributionContract
├── initiative
├── challenge
├── strategic_front
├── expected_change
├── proposed_mechanism
├── intermediate_metric
├── front KPI/signal
├── contribution_type
├── expected_evidence
└── contribution_status
```

Estados candidatos:

```text
proposed
confirmed
observed
unsupported
superseded
```

Portfolio debe separar:

```text
expected contribution
≠ observed contribution
≠ attributed contribution
```

---

## 6.6 Decision Authority y Decision Package

Evitar codificar que “Sponsor siempre aprueba X”.

Usar conceptualmente:

```text
DecisionAuthority
├── person/group
├── organization_role
├── authorized_decision_types[]
├── scope
├── thresholds/conditions
├── approval_mode
└── effective_period
```

El Portfolio Lead recibe/revisa `DecisionPackage`, pero la autoridad final depende de configuración.

---

## 6.7 Event Log transversal

Portfolio necesita consumir eventos originados desde cualquier canal.

Registrar al menos:

```text
actor
role
channel
entity
entity_version
event_type
before/after refs
timestamp
```

Canales:

```text
web
starteria_copilot
external_assistant
api
import
connector
```

La autoridad pertenece al actor/rol, no al canal.

---

# 7. Cambios que NO son necesarios ahora

No crear por la futura alternativa plugin:

- un segundo Portfolio Lead UI para Claude;
- un Portfolio Agent paralelo con su propia verdad;
- un estado de Reto dentro de gbrain;
- una copia de Fronts/Challenges en el plugin;
- aprobación automática de cambios estratégicos desde LLM;
- sincronización Web↔Claude basada en copiar chats;
- un dominio `PluginPortfolio` separado.

El plugin futuro debe ser solamente otro canal que consume el Product/Core API.

---

# 8. Relación con el MCP actualmente descrito

No confundir:

```text
gbrain MCP
```

con:

```text
Starteria Product MCP / Product API adapter
```

El primero sirve para memoria/patrones/harness según la topología actual y explícitamente no debe convertirse silenciosamente en el system of record de negocio.

El segundo, si se implementa, debe llamar servicios de negocio protegidos por permisos para leer/escribir Initiative/Portfolio state autorizado.

Portfolio, Fronts, Challenges, Initiatives, Steps, approvals y decisions deben seguir viviendo en el backend de producto.

---

# 9. Portfolio Lead Home objetivo

La Home debería ser una **vista de intervención**, no un dashboard de actividad.

Preguntas principales:

```text
¿Qué requiere atención hoy?
¿Dónde falta cobertura?
¿Qué iniciativa está bloqueada y quién necesita intervenir?
¿Qué cambió materialmente desde mi última revisión?
¿Qué decisiones están listas/atrasadas?
¿Dónde hay conflicto de capacidad?
¿Qué evidencia/valor existe frente a la estrategia?
```

Bloques candidatos:

```text
Portfolio Health
Attention Queue
Pending Decisions
Challenge Changes / Realignment
Coverage gaps
Capacity conflicts
Evidence / contribution exceptions
Recent material events
```

No mostrar como señal principal:

```text
"85% completado"
```

si no explica suficiencia/evidencia/decisión.

---

# 10. Vista de Reto objetivo

Debe mostrar:

```text
Challenge
├── current version
├── strategic front
├── desired result
├── KPI / signal
├── scope
├── horizon
├── constraints
├── decision expected
├── activation status
├── Initiative coverage
├── Contribution status
├── open issues
├── recent material changes
└── pending decision
```

Cuando el Reto cambia:

```text
[Review impact on 4 initiatives]
```

no:

```text
"all initiatives updated"
```

---

# 11. Vista ejecutiva de Initiative desde Portfolio

Portfolio Lead no necesita entrar al workspace completo para gobernar.

Debe consumir:

```text
Executive Initiative View
├── what it is trying to move
├── strategic contribution
├── owner/team
├── activation/current cycle
├── current Step / next milestone
├── evidence confidence
├── blockers/risks/dependencies
├── expected vs observed contribution
├── material changes
├── review/decision requested
└── recommended intervention
```

Los detalles de ejecución siguen viviendo en Initiative Core/Steps.

---

# 12. Permisos y autoridad

Preparar la arquitectura para que los mismos guards se apliquen sin importar canal.

Ejemplos:

```text
Initiative Owner
→ update own initiative
→ add evidence
→ raise issue
→ request validation

Portfolio Lead
→ govern Fronts/Challenges
→ review portfolio projection
→ respond/escalate alerts
→ manage activation where authorized

Validator/Mentor/Challenge role
→ validate configured context/method

Decision Authority
→ register authorized decision
```

Un external assistant no obtiene permisos propios. Actúa con los permisos del usuario autenticado.

---

# 13. Version/concurrency

Portfolio también necesita version checks para cambios estratégicos.

Ejemplo:

```text
Portfolio Lead A opens Challenge v7
Portfolio Lead B confirms material change → v8
A tries to write based on v7
→ conflict / refresh / explicit merge-review
```

Esto es especialmente importante porque el Core candidato establece responsabilidad conjunta entre Portfolio Leads designados.

---

# 14. Aprendizaje y memoria

Separar:

```text
Operational truth
→ Product DB / evidence / events / decisions
```

from:

```text
Reusable organizational/product patterns
→ learning/memory layer
```

Portfolio puede beneficiarse de aprendizaje transversal:

- retos recurrentes;
- bloqueos recurrentes;
- patrones de capacidad;
- tipos de iniciativa con evidencia repetida;
- decisiones y resultados históricos;
- restricciones recurrentes.

Pero un patrón histórico nunca debe convertirse automáticamente en una verdad del Reto actual.

---

# 15. ¿Hace falta un nuevo contrato de Portfolio Lead?

**Sí, recomiendo un update/contrato complementario, no un Core nuevo.**

Nombre candidato:

```text
PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md
```

Responsabilidad:

```text
Portfolio canonical state
↕
Initiative projections/events
↕
Attention / intervention / decision
```

Debe definir:

- qué datos consume Portfolio desde Initiative Core;
- qué eventos generan atención;
- quién tiene autoridad para cada respuesta;
- cómo se gobiernan Challenge versions;
- cómo funciona impact assessment;
- cómo se representa Activation Readiness;
- cómo se separan coverage/contribution/impact;
- qué acciones son Portfolio vs Initiative;
- cómo se registran decisiones;
- cómo Web y futuros canales externos usan los mismos services/guards.

**No debería redefinir Step 0–4.**

---

# 16. Contratos/documentos a revisar

Auditar al menos:

```text
STARTERIA_CORE_LOGIC_CONTRACT.md
STARTERIA_AUTHORITY.md
Portfolio Lead V.2
Actualización v1
PRD Starteria V.3
STARTERIA_CRAZY8S_E2E_BASE_LOGIC
Experience Contracts Portfolio Entry
ADRs actuales
Tech Specs de Portfolio/Initiative si existen
```

Buscar especialmente inconsistencias en:

- Sponsor vs Challenge Owner vs Decision Authority;
- Portfolio Lead individual vs responsabilidad conjunta;
- Initiative status legacy vs Activation Readiness;
- Step percentage vs sufficiency;
- Challenge edit sin versioning;
- alertas sin owner/escalation;
- duplicación de Initiative state dentro de Portfolio;
- APIs que permitan bypass de authority;
- lógica embebida en frontend;
- reporting basado en estado manual/desactualizado.

---

# 17. KEEP / ADAPT / REPLACE / NEW — auditoría del repo

Codex debe completar factual:

| Área | Current implementation | Target | Treatment | Risk | ADR? |
|---|---|---|---|---|---|
| StrategicFront model | | | | | |
| Challenge model | | | | | |
| ChallengeActivation | | | | | |
| Challenge versioning | | | | | |
| Initiative assignment | | | | | |
| Owner invitation/acceptance | | | | | |
| Activation Readiness | | | | | |
| Portfolio Home | | | | | |
| Attention Queue | | | | | |
| Alert object/event | | | | | |
| Initiative executive projection | | | | | |
| Coverage | | | | | |
| Contribution | | | | | |
| Capacity | | | | | |
| Decision center | | | | | |
| DecisionAuthority | | | | | |
| Reports | | | | | |
| Learning/library | | | | | |
| Audit/events | | | | | |
| Permissions | | | | | |
| APIs/services | | | | | |

---

# 18. ADR policy

No requiere ADR por sí mismo:

- hacer Portfolio event-driven;
- consumir projections del Initiative Core;
- añadir channel metadata;
- añadir Product API/MCP adapter;
- mover lógica del frontend a services;
- implementar una regla ya aceptada en autoridad superior.

Revisar/proponer ADR si:

- cambia cardinalidad Front→Challenge→Initiative;
- hace Challenge opcional en dominio corporativo;
- cambia autoridad de Portfolio Lead/Sponsor/Decision Authority;
- permite IA confirmar alineamiento o decisión;
- modifica invariantes Core;
- cambia ciclos/Step semantics;
- crea una segunda source of truth;
- requiere migración canónica material incompatible.

---

# 19. Slices de implementación recomendados

## Slice PL-1 — Audit actual

- model map;
- routes/services;
- home + detail views;
- alerts;
- decisions;
- permissions;
- current event support.

## Slice PL-2 — Activation boundary

- assignment;
- invitation;
- owner acceptance;
- Activation Readiness;
- start cycle.

## Slice PL-3 — Portfolio projection

- initiative executive summary derived from Core;
- cycle/Step/evidence/issue/decision summary.

## Slice PL-4 — Attention Queue

- event-driven alerts;
- escalation ownership;
- resolution state.

## Slice PL-5 — Challenge versioning

- version/change event;
- affected initiatives;
- impact assessment;
- requires_review / realignment.

## Slice PL-6 — Contribution + Decision

- Contribution Contract;
- Decision Package;
- DecisionAuthority.

## Slice PL-7 — External-channel readiness

- same guards/services for Web and Product MCP;
- channel metadata;
- concurrency/idempotency;
- no new business logic inside plugin.

---

# 20. Acceptance / no-regression

- [ ] Portfolio and Initiative remain separate responsibilities.
- [ ] Portfolio does not duplicate canonical Initiative state.
- [ ] selecting an initiative does not silently activate a Step cycle.
- [ ] owner acceptance is visible/auditable.
- [ ] Challenge change creates version + change event.
- [ ] active initiatives are not rewritten automatically.
- [ ] affected initiatives can be `requires_review` / realignment.
- [ ] Portfolio sees blockers raised from any channel.
- [ ] Portfolio sees validation/decision requests from any channel.
- [ ] alerts identify owner and required intervention.
- [ ] contribution expected/observed/attributed remain separate.
- [ ] coverage is not treated as business impact.
- [ ] Decision Package is separate from authorized decision.
- [ ] permissions do not depend on interface/channel.
- [ ] multiple Portfolio Leads cannot silently overwrite strategic changes.
- [ ] external assistant cannot become source of truth.
- [ ] learning/pattern layer cannot silently mutate Portfolio canonical state.

---

# 21. Resultado esperado de auditoría

Antes de tocar arquitectura Portfolio, Codex debe entregar:

```text
1. Current Portfolio E2E factual map
2. Current object/cardinality map
3. Current ownership/authority map
4. Current challenge activation path
5. Current initiative assignment/activation path
6. Current tracking data source
7. Current alerts/escalation flow
8. Current decision flow
9. Current versioning/event support
10. KEEP / ADAPT / REPLACE / NEW matrix
11. Contract conflicts
12. ADR candidates
13. Implementation slices
14. Test/no-regression plan
```

---

# 22. Definición final propuesta

> **Portfolio Lead es la capa de gobernanza de estrategia, cobertura, capacidad, contribución, atención y decisión. No ejecuta los Steps ni duplica su estado. Consume proyecciones y eventos del Initiative Core, gobierna cambios de Frente/Reto, activa ownership/capacidad, interviene ante alertas y dirige Decision Packages a la autoridad correspondiente. Web y futuros asistentes externos son canales distintos sobre el mismo Core y los mismos guards.**

