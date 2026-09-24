# Starteria — HYP-005 Decision Readiness Map

**Estado:** `ITERATE`  
**Tipo:** hipótesis cognitiva experimental  
**Slice:** Portfolio Entry / Question Planning  
**Runtime productivo:** no modificado  
**Fecha:** 2026-09-23

## Boundary y autoridad

HYP-005 se deriva de los findings de testing de Portfolio Entry y se prueba
únicamente como read model y criterio de evaluación del harness. No es una
regla de producto aprobada.

- La autoridad Experience activa continúa siendo
  `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
- El stack v0.2 de Agent/Skills/Harness continúa en reconciliación candidata.
- El Core Contract continúa como candidata de gobernanza / requiere re-test.
- No existe autoridad aprobada que autorice un DecisionReadinessMap como
  objeto, entidad, DTO, prompt activo o comportamiento canónico.

Por tanto, esta hipótesis no promueve, reemplaza ni modifica contratos,
Core, Steps, prompts, permisos, rutas, backend o frontend.

## Definición experimental

La hipótesis es:

> Antes de elegir la siguiente pregunta, Question Planning mejora si reevalúa
> transversalmente la preparación para decisión, identifica el gap que más
> puede cambiar la decisión o el routing, y pregunta solo cuando ese gap es
> resoluble ahora.

El `DecisionReadinessMap` es un read model cognitivo experimental. No es un
objeto canónico, entidad de dominio, formulario, persistencia ni contrato de
intercambio. No exige completar todas sus dimensiones, no tiene que hacerse
visible al usuario y puede permanecer interno al harness. Su contenido debe
conservar provenance y distinguir lo declarado de lo inferido o sugerido.

### DecisionReadinessMap

```text
DecisionReadinessMap {
  RELEVANCE:
    why_attention_matters
    relevant_outcome
    why_now

  DECISION:
    decision_to_enable
    decision_maker
    recommender
    accountable_responder

  EXECUTION_REALITY:
    capacity
    ownership
    adoption
    dependencies
    structural_constraints

  EVIDENCE_AUTHORITY:
    known
    assumed
    evidence_required
    organizational_interpreter

  ROUTING:
    next_gap_route
    route_confidence
}
```

Los valores pueden ser `known`, `unknown`, `unresolved` o `AI_SUGGESTED`
cuando corresponda. `AI_SUGGESTED` nunca se convierte en verdad
organizacional sin autoridad o validación adecuada.

### CandidateGap

```text
CandidateGap {
  dimension
  description
  uncertainty
  decision_impact
  route_impact
  resolution_type
  evidence
}
```

`resolution_type` solo puede ser uno de:

```text
ASK_NOW
REQUIRES_ORGANIZATIONAL_INPUT
DEFER_TO_LATER_STAGE
NONCRITICAL
ALREADY_SUFFICIENT
```

No se define scoring numérico productivo. Para comparar casos, el harness
puede usar lenguaje ordinal (`más material`, `material`, `no material`) y
revisores humanos 1–5, sin convertirlo en una fórmula de runtime.

## Política experimental de planificación

En cada respuesta, antes de escoger una pregunta:

1. reevaluar las cinco dimensiones;
2. generar `CandidateGap`s;
3. identificar los gaps capaces de cambiar decisión o routing;
4. escoger el gap más material;
5. preguntar solo si su resolución es `ASK_NOW`;
6. detenerse si el contexto restante pertenece a otra etapa, fuente o
   autoridad.

No se continúa automáticamente el hilo de la pregunta anterior.

### Reglas H5

- **H5-R1 — Cross-dimension reassessment:** cada respuesta dispara una
  reevaluación de todas las dimensiones.
- **H5-R2 — Explicit unknown handling:** “no lo sé”, “no está definido”,
  “gerencia no lo ha dicho” o “no tengo esa información” cierra la pregunta
  repetitiva y clasifica el gap como `REQUIRES_ORGANIZATIONAL_INPUT` o
  `unresolved`; cualquier hipótesis queda marcada `AI_SUGGESTED`.
- **H5-R3 — Local-depth guard:** no se profundiza en la misma dimensión salvo
  que la pregunta pueda cambiar materialmente decisión, routing o suficiencia
  del handoff.
- **H5-R4 — Stop when route is clear:** un gap puede permanecer abierto y aun
  así detenerse si ya está claro dónde debe resolverse.
- **H5-R5 — Strategy is not always first:** KPI u objetivo estratégico no son
  la primera pregunta universal; manda el gap decision-critical.
- **H5-R6 — Operational signal is not automatically business value:** tiempo,
  precisión o satisfacción técnica no prueban por sí solos valor de negocio.
- **H5-R7 — Authority of interpretation:** flexibilidad, cumplimiento,
  ownership o autoridad organizacional requieren interpretación de una fuente
  con autoridad; el usuario o la IA no la convierten automáticamente en
  verdad formal.

## Invariantes y límites

El candidate debe mantener los invariantes activos del harness: una sola
pregunta user-facing por turno, respeto del budget, no repetición material,
provenance, no canonicalización, no Step leakage y handoff con incertidumbre
explícita.

No debe diseñar training, rollout, metodología de Mapping, experimento,
workflow redesign ni iniciativas canónicas. Si para validar HYP-005 hiciera
falta modificar un prompt activo, runtime, contrato, Core, Step o DTO
productivo, la prueba entra en `STOP / AUTHORITY_GAP`.

## Failure codes experimentales

Además de la taxonomía existente del harness, HYP-005 añade estos códigos:

```text
F-LOCAL-DEPTH
F-UNKNOWN-LOOP
F-CROSS-DIMENSION
F-PREMATURE-DEEPENING
F-ROUTING
F-UNNECESSARY-QUESTION
F-UNAUTHORIZED-INTERPRETATION
```

- `F-LOCAL-DEPTH`: profundización repetida en la misma dimensión sin impacto material nuevo.
- `F-UNKNOWN-LOOP`: se repite un gap después de un unknown explícito.
- `F-CROSS-DIMENSION`: no se reevalúan las cinco dimensiones antes de elegir.
- `F-PREMATURE-DEEPENING`: se profundiza antes de resolver un gap más material.
- `F-ROUTING`: se elige una etapa o fuente incorrecta para el gap.
- `F-UNNECESSARY-QUESTION`: se pregunta aunque el contexto sea suficiente o el route ya esté claro.
- `F-UNAUTHORIZED-INTERPRETATION`: una inferencia de usuario/IA se presenta como autoridad organizacional.

## HYP-005.1 — Decision dependency before routing

La iteración HYP-005.1 añade al `CandidateGap` experimental:

```text
current_decision_dependency:
  BLOCKING | CONSTRAINING | NON_BLOCKING | UNKNOWN

answerability:
  USER_CAN_ANSWER
  ORGANIZATIONAL_AUTHORITY_REQUIRED
  EXTERNAL_EVIDENCE_REQUIRED
  LATER_STAGE_DISCOVERY
```

También registra `execution_gap_classification`:

```text
CURRENT_DECISION_BLOCKER
CURRENT_DECISION_CONSTRAINT
LATER_STAGE_EXECUTION_DETAIL
NOT_EXECUTION_RELEVANT
```

La selección experimental ordena primero dependencia de decisión, después
answerability/authority, stage fit y routing. Antes de `ROUTE` o `STOP`, un
last-mile check puede reabrir una única pregunta si existe un gap actual,
user-answerable, material y resoluble con una pregunta acotada. No es una
regla productiva ni un cambio de contrato.

La iteración mantiene estado `ITERATE`: corrigió el routing prematuro de
ADV-HO-01 y ADV-HO-02, pero produjo cambios de acción respecto de expected
actions adversariales previos y requiere investigar `F-LAST-MILE-OVERASK`.

## HYP-005.2 — Decision sensitivity gate

La selección experimental añade a cada gap:

```text
decision_sensitivity:
  HIGH | MEDIUM | LOW | UNKNOWN

counterfactual_decision_test:
  plausible_answer_a
  plausible_answer_b
  decision_branching: YES | NO | UNCLEAR
  branching_reason

answer_shape:
  BOOLEAN | CATEGORY | BOUNDED_FACT | OPEN_EXPLORATION | ORGANIZATIONAL_CONFIRMATION
```

Un gap `CONSTRAINING` user-answerable solo se pregunta si su sensibilidad es
`HIGH`, o `MEDIUM` con respuesta acotada y efecto material sobre condiciones
del handoff. La exploración abierta se difiere o enruta. Los gaps `BLOCKING`
mantienen prioridad y no se debilitan por esta gate.

HYP-005.2 reduce los cambios de acción adversariales de cuatro a tres, pero no
elimina todas las señales de posible over-asking. El estado permanece
`ITERATE`.

## Criterio de interpretación

Las development fixtures sirven para descubrir fallos y ajustar la
representación experimental. Los holdouts se mantienen separados y sus
expected invariants no se cambian después de observar resultados. Pasar las
development fixtures no permite declarar `SUPPORTED`.
## HYP-005.3 — Counterfactual branch classification

La iteración `HYP-005.3` mantiene el estado `ITERATE` y modifica únicamente el
adapter determinista del harness. Con metadata coherente de consecuencias A/B,
la rama material precede a keywords, dimensión del gap y heurísticas de stage:

```text
ENABLEMENT_CHANGE → BLOCKING / HIGH
ROUTE_CHANGE      → BLOCKING / HIGH
CONDITION_CHANGE  → CONSTRAINING / MEDIUM (HIGH si material)
SCOPE_CHANGE      → CONSTRAINING / MEDIUM
DETAIL_CHANGE     → NON_BLOCKING / LOW
NO_MATERIAL_CHANGE→ NON_BLOCKING / LOW
UNKNOWN           → conserva la clasificación basada en evidencia
```

La regla evita suavizar automáticamente gaps de ejecución o capacidad por su
categoría. No crea autoridad de producto ni cambia contratos o runtime.

Failure codes añadidos: `F-BRANCH-TYPE-MISCLASSIFIED`,
`F-BLOCKER-DOWNGRADED` y `F-COUNTERFACTUAL-OVERUPGRADE`.

La revisión conversacional HYP-005 añade códigos harness-only:

```text
F-OVERSTRUCTURED
F-FRAMEWORK-VISIBLE
F-MULTIQUESTION-OVERLOAD
F-USER-JOB-DRIFT
F-QUESTION-WITHOUT-DECISION-VALUE
F-EXCESSIVE-ABSTRACTION
F-GENERIC-CONSULTING-TONE
F-ACTION-NOT-CLEARER
```
