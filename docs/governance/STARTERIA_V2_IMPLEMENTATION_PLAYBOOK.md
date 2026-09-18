# STARTERIA — V2 Implementation Playbook

**Documento:** `STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`  
**Versión:** v0.1  
**Estado:** Playbook operativo obligatorio para implementación y migración V2  
**Fecha:** 2026-09-18  
**Repo objetivo:** `DarkCodePE/harness-starteria`  
**Aplicación:** Codex, Claude, desarrolladores, QA y cualquier agente que cambie producto, IA, frontend, backend, datos, rutas, Design System o tests.

---

# 1. Propósito

Este playbook define **cómo ejecutar cada cambio V2** sin:

- convertir una migración visual en una falsa migración funcional;
- conservar semántica V1 por comodidad técnica;
- usar código existente como autoridad;
- saltar de un requirement directamente a código;
- mezclar hipótesis, findings y reglas estables;
- dejar consumers V1 activos sin condición de retiro;
- hacer cambios grandes sin verdad de current state.

Regla principal:

> **Cada slice V2 debe pasar por verdad actual → autoridad → target → implementación → validación → retiro legacy.**

---

# 2. Documentos obligatorios antes de implementar

Leer en este orden:

1. `CURRENT_STATE.md`
2. `STARTERIA_V2_MANIFEST.md`
3. `docs/STARTERIA_AUTHORITY.md`
4. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
5. ADRs aprobados del slice
6. Experience Contract afectado
7. Agent / Skill Contracts aplicables
8. Tech Spec aplicable
9. `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md`
10. este Playbook
11. Design System V2 Baseline cuando exista impacto visual
12. implementación actual
13. tests actuales

Si falta un documento obligatorio para definir semántica:

```text
AUTHORITY_GAP
→ STOP functional implementation
→ audit / document gap
→ do not infer behavior from V1
```

---

# 3. Unidad de trabajo: V2 Implementation Slice

No implementar “V2” como un único proyecto masivo.

Toda modificación debe pertenecer a un slice acotado.

Ejemplos:

```text
LANDING_V4
PORTFOLIO_ENTRY
PORTFOLIO_ENTRY_HANDOFF
POST_ENTRY_CONTINUATION
PORTFOLIO_BOOTSTRAP
PORTFOLIO_HOME
STRATEGIC_FRONT
CHALLENGE
ACTIVATION_INVITATION
INITIATIVE_OVERVIEW
STEP_PLATFORM
```

Cada slice debe tener:

- autoridad;
- current-state truth;
- target V2;
- dependencias legacy;
- estrategia de adaptación/retiro;
- tests;
- E2E;
- status en Manifest.

---

# 4. Pipeline obligatorio

```text
0. SELECT SLICE
        ↓
1. READ AUTHORITY
        ↓
2. CURRENT-STATE TRUTH AUDIT
        ↓
3. CLASSIFY CURRENT SURFACE
        ↓
4. DEFINE V2 TARGET
        ↓
5. MAP LEGACY DEPENDENCIES
        ↓
6. DEFINE ADAPTER / MIGRATION PLAN
        ↓
7. DEFINE TESTS BEFORE CODE
        ↓
8. IMPLEMENT SMALLEST COMPLETE SLICE
        ↓
9. RUN CONTRACT + E2E VALIDATION
        ↓
10. RETIRE / DEPRECATE V1 CONSUMERS
        ↓
11. UPDATE MANIFEST + CURRENT STATE
        ↓
12. CLOSE SLICE
```

Ningún paso debe omitirse silenciosamente.

---

# 5. Step 0 — Select Slice

Antes de editar código registrar:

```text
SLICE_ID:
Goal:
User/job:
Entry boundary:
Exit boundary:
Affected routes:
Affected authority:
Expected product behavior change:
```

No mezclar en una misma slice:

- Portfolio Entry y Step redesign;
- Design System cleanup y dominio Core;
- auth refactor y experience migration;
- DB migration no requerida con cambio visual.

---

# 6. Step 1 — Authority Check

Responder:

```text
Which V2 authority defines this behavior?
```

Registrar paths exactos.

Clasificar cada fuente:

```text
STABLE_INVARIANT
ACTIVE_V2_BASELINE
SUPPORTED_FINDING
TESTABLE_HYPOTHESIS
CANDIDATE
HISTORICAL
SUPERSEDED
```

No usar una hypothesis como requirement estable.

No usar un implementation report como contrato.

---

# 7. Step 2 — Current-State Truth Audit

Antes de modificar una surface, mapear el comportamiento real.

Como mínimo:

```text
route
page/component
state
API
service
persistence
AI/runtime
permissions
analytics
redirects
consumers
tests
```

Output mínimo:

```text
CURRENT FLOW
UI
→ handler
→ API/service
→ persistence
→ downstream behavior
→ redirect/next state
```

Si un comportamiento no puede verificarse:

```text
UNKNOWN
```

No completar por inferencia.

---

# 8. Step 3 — Classification

Clasificar cada elemento tocado:

```text
KEEP
ADAPT
CONSOLIDATE
DEPRECATE
REMOVE
UNKNOWN
```

Y adicionalmente:

```text
SEMANTIC_OWNER:
V2 | LEGACY_COMPAT | UNKNOWN

MAY_DEFINE_NEW_BEHAVIOR:
YES | NO
```

`REMOVE` requiere consumer evidence.

---

# 9. Step 4 — Define V2 Target

El target debe describirse **sin depender de la implementación legacy**.

Formato:

```text
V2_TARGET

User:
Job:
Entry state:
Visible experience:
Structured state:
AI role:
Human authority:
System authority:
Exit state:
Prohibited behavior:
```

Luego comparar:

```text
CURRENT
vs
V2 TARGET
```

El gap resultante gobierna la implementación.

---

# 10. Step 5 — Legacy Dependency Map

Por cada dependencia legacy registrar:

```text
Dependency:
Why V2 needs it:
V1 assumptions:
Reusable infrastructure:
Semantic conflict:
Adapter required: yes/no
Retirement condition:
```

Especial atención a:

- redirects;
- `Project` / Initiative semantics;
- Step activation;
- auth continuation;
- role assignment;
- status transitions;
- PublicDraft/temporary state;
- canonicalization;
- challenge inheritance;
- tests V1.

---

# 11. Step 6 — Adapter Decision

Usar adapter cuando infraestructura reutilizable esté acoplada a semántica V1.

Preferir:

```text
V2 experience
→ V2 contract interface
→ adapter
→ reusable infrastructure
```

sobre:

```text
V2 experience
→ legacy service directly
```

Todo adapter debe declarar:

```text
legacy dependency
translation responsibility
blocked V1 semantics
owner
retirement condition
```

Un adapter temporal sin retirement condition es deuda no gobernada.

---

# 12. Step 7 — Tests Before Code

Antes de implementar definir:

## Contract tests

¿Qué reglas V2 deben ser verdaderas?

## Regression tests

¿Qué infraestructura válida no debe romperse?

## Negative tests

¿Qué comportamiento V1 no debe reaparecer?

## E2E

¿Qué journey completo prueba que V2 gobierna?

Clasificar tests existentes:

```text
V2_CONFORMANCE
V1_REGRESSION
COMPATIBILITY
HYPOTHESIS
UNKNOWN
```

---

# 13. Step 8 — Implementation

Reglas:

1. implementar el smallest complete slice;
2. no hacer big-bang rewrite;
3. no ampliar scope por conveniencia;
4. no cambiar Core silenciosamente;
5. no crear duplicate primitives/patterns;
6. no hardcodear business logic en Design System;
7. no hacer silent fallback a V1 semantics;
8. cualquier compatibility fallback debe ser visible y testeado.

---

# 14. Step 9 — Validation

Ejecutar cuatro gates del Migration Guardrail:

```text
Contract Gate
Dependency Gate
E2E Gate
Retirement Gate
```

Además verificar:

```text
Authority conformance
AI authority
human authority
provenance
route ownership
persistence semantics
permissions
visual status
negative V1 tests
```

---

# 15. Step 10 — Legacy Retirement

Después de activar V2:

Clasificar legacy restante:

```text
REMOVE_NOW
DEPRECATE
KEEP_COMPAT
UNKNOWN
```

Para `KEEP_COMPAT` registrar:

```text
consumer
reason
owner
replacement
retirement trigger
```

No cerrar el slice con legacy invisible.

---

# 16. Step 11 — Documentation Update

Toda implementación cerrada debe actualizar:

1. `STARTERIA_V2_MANIFEST.md`
2. `CURRENT_STATE.md` si cambió estado real del repo/producto
3. traceability del slice
4. implementation report si aplica
5. superseded/deprecated banners
6. tests/evidence references

No actualizar Authority salvo que cambie la cadena de autoridad.

---

# 17. Required Pre-Implementation Output

Antes de escribir código, el agente debe devolver:

```text
V2_IMPLEMENTATION_SLICE_PLAN

SLICE:
GOAL:
USER/JOB:
AUTHORITY:
MANIFEST_STATUS:
CURRENT_FLOW:
V2_TARGET:
LEGACY_DEPENDENCIES:
SEMANTIC_CONFLICTS:
KEEP:
ADAPT:
CONSOLIDATE:
DEPRECATE:
REMOVE:
UNKNOWN:
ADAPTERS_REQUIRED:
TESTS_BEFORE_CHANGE:
NEW_V2_TESTS:
E2E_PATH:
V1_NEGATIVE_TESTS:
RETIREMENT_CONDITIONS:
ADR_REQUIRED:
PROCEED: YES / NO
```

`PROCEED = NO` cuando exista authority gap o semantic owner desconocido material.

---

# 18. Required Closure Output

Al finalizar:

```text
V2_IMPLEMENTATION_SLICE_CLOSURE

SLICE:
AUTHORITY_SATISFIED:
V2_ROUTE_ACTIVE:
V2_STATE_ACTIVE:
V2_TESTS_PASS:
E2E_PASS:
V1_NEGATIVE_TESTS_PASS:
LEGACY_CONSUMERS_REMAINING:
COMPATIBILITY_ITEMS:
REMOVED_V1_ITEMS:
DEPRECATED_V1_ITEMS:
MANIFEST_UPDATED:
CURRENT_STATE_UPDATED:
OPEN_CONFLICTS:
SLICE_STATUS:
  PARTIAL
  V2_MIGRATED
  BLOCKED
```

---

# 19. Definition of V2_MIGRATED

Un slice solo puede tener:

```text
SLICE_STATUS = V2_MIGRATED
```

si:

- V2 authority gobierna;
- V2 route/surface está activa;
- V2 structured state es el estado operativo correcto;
- tests V2 protegen semántica;
- E2E V2 pasa;
- tests negativos impiden reintroducir V1;
- no quedan consumers V1 no documentados;
- compatibility restante tiene retirement condition;
- Manifest refleja el estado real;
- no existen authority conflicts abiertos.

---

# 20. Portfolio Lead protection

En corporate journey preservar:

```text
Portfolio
¿Estamos trabajando en las cosas correctas?
```

separado de:

```text
Steps
¿Estamos desarrollando correctamente esta iniciativa y generando evidencia suficiente para decidir?
```

No permitir que:

```text
solution_first
initiative_first
registration
public entry
```

se conviertan automáticamente en:

```text
Initiative Owner → Step 0
```

---

# 21. Design System implementation rule

Para frontend:

```text
Experience Contract
+
Design System V2
→ implementation
```

No:

```text
old screen
→ restyle
→ V2
```

Si una página contiene business logic legacy, primero separar lógica y presentación.

---

# 22. Step Platform special procedure

Initiative Overview y Steps requieren antes:

1. Current-State Truth Map;
2. UX option comparison;
3. Design System gap analysis;
4. human target decision;
5. Step Experience Contract;
6. migration plan;
7. implementation.

Hasta entonces:

```text
legacy Step UI != V2 visual authority
```

---

# 23. Branch / PR discipline

Preferir una branch por slice:

```text
docs/v2-baseline-consolidation
feat/v2-landing
feat/v2-portfolio-entry
feat/v2-handoff
feat/v2-portfolio-home
audit/v2-step-platform
feat/v2-initiative-overview
feat/v2-step-workspace
```

Cada PR debe declarar:

- slice;
- authority;
- legacy dependencies;
- tests;
- retirement impact;
- Manifest change.

No mezclar varios slices grandes en un PR.

---

# 24. First execution sequence

La migración V2 debe comenzar en este orden:

```text
1. baseline documental
2. Manifest / Authority / Guardrails / Playbook
3. Portfolio Entry v0.2 stack reconciliation
4. Landing V4 current-state comparison
5. Portfolio Entry runtime reconciliation
6. Handoff / continuation
7. Bootstrap / Portfolio Home
8. Strategic Front / Challenge
9. Activation / Invitation
10. Step Platform truth audit
11. Initiative Overview V2
12. Steps V2
13. V1 retirement gate
```

---

# 25. Final doctrine

> **No migramos pantallas: migramos comportamiento gobernado.**

> **No conservamos V1 porque funciona: conservamos únicamente infraestructura demostrablemente reusable.**

> **Un slice no está terminado hasta que V2 gobierna y el legacy restante está explícitamente controlado.**
