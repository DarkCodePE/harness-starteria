# Starteria — Portfolio Entry Test Findings Register

**Documento:** `PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md`
**Versión:** v0.2
**Estado:** ACTIVO / EVIDENCIA + HIPÓTESIS DE DISEÑO
**Fecha:** 2026-09-10
**Tipo:** Findings Register / Product Evidence
**Vertical slice:** Portfolio Entry

---

## 0. Propósito

Registrar de forma trazable:

1. qué problemas o patrones fueron realmente observados durante testing;
2. qué decisiones contractuales ya están suficientemente soportadas;
3. qué soluciones de diseño siguen siendo hipótesis y todavía deben probarse.

Este documento responde:

> ¿Qué sabemos por evidencia, qué decidimos a partir de esa evidencia y qué parte todavía estamos proponiendo como hipótesis?

No reemplaza:

- Agent Contracts;
- Skill Contracts;
- AI Harness;
- PRDs;
- ADRs.

---

# 1. Regla de trazabilidad

La cadena correcta es:

```text
TEST CASE / RUN
        ↓
OBSERVACIÓN
        ↓
FINDING
        ↓
DECISIÓN O HIPÓTESIS
        ↓
CONTRATO / DISEÑO
        ↓
NUEVO TEST
```

No toda solución propuesta después de un finding debe tratarse como evidencia.

Ejemplo:

```text
Finding comprobado:
las preguntas pueden convertirse en un loop.

Hipótesis de solución:
Quick Clarification + Guided Exploration.

Estado:
todavía debe probarse.
```

---

# 2. Convenciones

## 2.1. Finding IDs

```text
FND-001
FND-002
...
```

## 2.2. Hypothesis IDs

```text
HYP-001
HYP-002
...
```

## 2.3. Finding status

- `OBSERVED`
- `SUPPORTED`
- `CONFIRMED`
- `REJECTED`
- `SUPERSEDED`

## 2.4. Hypothesis status

- `PROPOSED`
- `TESTING`
- `SUPPORTED`
- `REJECTED`
- `SUPERSEDED`

## 2.5. Evidence strength

- `LOW`
- `MEDIUM`
- `HIGH`

## 2.6. Impact layer

- Agent Contract
- Skill 01 — Intent Detection
- Skill 02 — Context Extraction
- Skill 03 — Reverse Alignment
- Skill 04 — Question Planner
- Clarification Session
- Handoff / UX
- Harness
- Tech Spec
- Core / ADR

---

# 3. Findings activos

---

## FND-001 — Falta distinguir gobernanza de portfolio de gobernanza de una iniciativa

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Agent Contract / Skill 01

### Problema observado

`initiative_governance` absorbía necesidades cuyo objeto real era el sistema mediante el cual múltiples ideas o iniciativas:

- entran;
- son priorizadas;
- reciben presupuesto;
- avanzan;
- escalan;
- generan aprendizaje;
- llegan a decisiones.

### Evidencia

Casos ejecutados:

- `BAYER_CATALYST_001`
- `NESTLE_RD_001`
- `ZURICH_KASKO_001`

### Decisión soportada

Añadir:

```text
portfolio_governance
```

y mantener:

```text
initiative_governance
```

para una iniciativa concreta.

### Contratos impactados

- `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
- `entry-01-intent-detection/SKILL_v0.2.md`

---

## FND-002 — El estado de entrada se sobrescribe durante la conversación

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Agent Contract / Skill 01 / Harness

### Problema observado

La conversación puede evolucionar:

```text
problem_first
→ initiative_first / solution_first
```

o:

```text
strategy_first
→ portfolio_first
```

sin que eso signifique que el origen real de entrada cambió.

### Evidencia

- `NESTLE_RD_001`
- `TURNER_SPOT_001`
- `ZURICH_KASKO_001`

### Decisión soportada

Separar:

```text
initial_entry_state
current_frame
```

### Contratos impactados

- `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
- `entry-01-intent-detection/SKILL_v0.2.md`

---

## FND-003 — Pérdida o distorsión de contexto operativo existente

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Skill 02 / Handoff

### Problema observado

La estructuración podía perder información material como:

- programa existente;
- operating model;
- sector;
- alcance geográfico;
- etapa de operación;
- roles.

### Evidencia

Principal:

- `BAYER_CATALYST_001`

Señales adicionales:

- `NESTLE_RD_001`
- `ZURICH_KASKO_001`

### Decisión soportada

Añadir:

```text
operating_context
```

y reforzar:

```text
existing ≠ desired
```

### Contratos impactados

- `entry-02-context-extraction/SKILL_v0.2.md`

---

## FND-004 — Términos de éxito y calidad relevantes quedan subdefinidos

**Status:** SUPPORTED
**Evidence strength:** MEDIUM
**Impact layer:** Skill 02 / Skill 04

### Problema observado

Expresiones como:

- acelerar;
- mejorar;
- calidad;
- éxito;
- reducir riesgo;

pueden parecer claras, pero cambiar materialmente de significado según el usuario.

### Evidencia

- `NESTLE_RD_001`
- `BAYER_CATALYST_001`

### Decisión soportada

Añadir:

```text
success_conditions
quality_guardrails
```

y permitir que Question Planner aclare solo cuando sea material.

### Contratos impactados

- `entry-02-context-extraction/SKILL_v0.2.md`
- `entry-04-question-planner/SKILL_v0.2.md`

---

## FND-005 — La solución o iniciativa puede aparecer después del primer turno

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Skill 01 / Skill 03 / Agent Contract

### Problema observado

Reverse Alignment no puede depender únicamente del primer estado de entrada.

### Evidencia

Principal:

- `TURNER_SPOT_001`

### Decisión soportada

Permitir:

```text
late reverse alignment
```

usando:

```text
current_frame
+
contexto actualizado
```

sin sobrescribir:

```text
initial_entry_state
```

### Contratos impactados

- `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
- `entry-01-intent-detection/SKILL_v0.2.md`
- `entry-03-reverse-alignment/SKILL_v0.2.md`

---

## FND-006 — La interacción de preguntas puede convertirse en un loop

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Clarification Session / Skill 04 / Harness

### Problema observado

El sistema podía cumplir formalmente:

```text
<= 3 preguntas por output
```

y aun así generar múltiples rondas sucesivas sin que el usuario supiera:

- cuánto faltaba;
- cuándo terminaría;
- cuándo recibiría una síntesis útil.

### Evidencia

- `BAYER_CATALYST_001`
- `NESTLE_RD_001`

### Lo que la evidencia sí soporta

Debe existir gobierno de sesión por encima del Question Planner.

El usuario necesita:

- límites visibles;
- puntos de síntesis;
- una salida útil sin conversación infinita.

### Lo que la evidencia todavía NO demuestra

La evidencia no demuestra todavía que:

```text
Quick Clarification + Guided Exploration
```

sea necesariamente la mejor solución.

Esa propuesta se registra como:

```text
HYP-001
```

### Contratos impactados

- `entry-04-question-planner/SKILL_v0.2.md`
- `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`
- futuro Harness v0.2

---

## FND-007 — El handoff no muestra suficiente valor específico de Starteria

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Handoff / UX / Product Value

### Problema observado

Los cierres podían ser estratégicamente útiles pero sentirse como recomendaciones de un chatbot experto.

### Evidencia

Explícita:

- `BAYER_CATALYST_001`
- `NESTLE_RD_001`

Señales adicionales:

- `TURNER_SPOT_001`
- `ZURICH_KASKO_001`

### Lo que la evidencia sí soporta

El cierre debe hacer visible:

```text
qué entendió Starteria
qué quiere lograr el usuario
qué decisión necesita habilitar
qué sabemos
qué falta
cómo Starteria puede continuar el trabajo
```

### Hipótesis todavía por validar

- `recommended_approach`
- `alternative_approaches`
- `GapResolutionMap`

se registran como hipótesis de diseño, no como evidencia confirmada.

Ver:

```text
HYP-002
HYP-003
```

### Contratos impactados

- `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`
- futuro Harness v0.2

---

## FND-008 — Portfolio Entry puede invadir diseño de experimento / Steps posteriores

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Agent / Skill 03 / Skill 04 / Handoff / Harness

### Problema observado

Algunas salidas pasaban de identificar qué falta demostrar a diseñar:

- comparaciones;
- muestras;
- canales;
- thresholds;
- fichas de experimento;
- pilotos detallados.

### Evidencia

- `TURNER_SPOT_001`
- `ZURICH_KASKO_001`

### Decisión soportada

Portfolio Entry puede expresar:

```text
qué necesita aclararse
qué necesita demostrarse
```

pero no diseñar aún:

```text
cómo producir esa evidencia en detalle
```

### Contratos impactados

- `entry-03-reverse-alignment/SKILL_v0.2.md`
- `entry-04-question-planner/SKILL_v0.2.md`
- `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`

---

## FND-009 — Se mezclan declaraciones, inferencias y recomendaciones

**Status:** SUPPORTED
**Evidence strength:** HIGH
**Impact layer:** Skill 02 / Handoff / Harness

### Problema observado

Una recomendación razonable puede terminar próxima o mezclada con el contexto declarado.

### Evidencia

Principal:

- `BAYER_CATALYST_001`

Señales adicionales:

- `TURNER_SPOT_001`
- `ZURICH_KASKO_001`

### Decisión soportada

Mantener separadas:

```text
USER_DECLARED
EXTRACTED_FROM_USER_TEXT
AI_INFERRED
AI_SUGGESTED
```

y mantener review disposition.

### Contratos impactados

- `entry-02-context-extraction/SKILL_v0.2.md`
- `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`
- futuro Harness v0.2

---

# 4. Hipótesis de diseño activas

---

## HYP-001 — Quick Clarification + Guided Exploration reduce loops sin abandonar al usuario ambiguo

**Status:** PROPOSED
**Derived from:** `FND-006`

### Hipótesis

Una experiencia con:

```text
Quick Clarification
→ hasta 3 preguntas
→ síntesis / decisión
→ Guided Exploration opt-in si sigue existiendo ambigüedad
```

puede mantener baja fricción sin dejar sin ayuda al usuario que todavía no sabe bien qué quiere resolver.

### Qué debe demostrar el Harness

- menor sensación de interrogatorio;
- claridad sobre progreso;
- que usuarios ambiguos puedan ganar claridad;
- que Guided Exploration no se convierta en chat infinito;
- que el opt-in sea comprensible.

### Métricas candidatas

```text
quick_questions_total
guided_exploration_offered_when_needed
guided_exploration_opt_in
exploration_rounds
turns_to_first_useful_synthesis
turns_to_handoff
question_efficiency
```

---

## HYP-002 — Recommended Approach + Alternatives aumenta claridad y valor percibido

**Status:** PROPOSED
**Derived from:** `FND-007`

### Hipótesis

Después de entender suficientemente la necesidad, Starteria puede aportar más valor si muestra:

```text
recommended_approach
alternative_approaches
```

en vez de limitarse a repetir lo entendido.

### Condición de seguridad

Toda ruta propuesta debe conservar:

```text
origin = AI_SUGGESTED
review_disposition = UNREVIEWED
```

### Qué debe demostrar el Harness

- que la propuesta ayuda a ganar claridad;
- que no se siente prescriptiva sin evidencia;
- que las alternativas son materialmente distintas;
- que no convierte Portfolio Entry en consultoría exhaustiva.

### Métricas candidatas

```text
recommended_approach_quality
alternative_approach_relevance
clarity_gained
generic_chat_feeling
```

---

## HYP-003 — GapResolutionMap convierte incertidumbre en valor visible de producto

**Status:** PROPOSED
**Derived from:** `FND-007`, `FND-008`, `FND-009`

### Hipótesis

Los gaps generan menos frustración y más valor si Starteria puede mostrar:

```text
qué falta
↓
qué puede ayudar a estructurar
qué puede guiar
qué puede seguir
qué requiere input organizacional
qué requiere evidencia externa
↓
en qué parte de Starteria puede resolverse
```

### Riesgo

Sobreprometer que Starteria puede “resolver” evidencia que depende de:

- clientes;
- mercado;
- expertos;
- reguladores;
- decisiones internas.

### Qué debe demostrar el Harness

- mapping correcto;
- honestidad sobre capacidades;
- conexión comprensible entre Portfolio, Initiative y Steps;
- ausencia de Step leakage.

### Métricas candidatas

```text
gap_resolution_accuracy
starteria_value_visibility
step_leakage
capability_overclaim
```

---

## HYP-004 — Starteria puede ayudar a estructurar o mejorar aceleradoras/programas sin convertirse en “constructor de aceleradoras”

**Status:** PROPOSED
**Derived from:** `FND-003`, `FND-007`

### Hipótesis

Cuando el usuario quiere:

```text
crear
o
mejorar
```

una aceleradora, programa de innovación o sistema equivalente, Starteria puede ayudar a estructurar:

```text
objetivos
→ criterios
→ portfolio
→ iniciativas
→ ownership
→ KPIs/señales
→ evidencia
→ decisiones
```

sin afirmar que crea o ejecuta por sí sola la estructura organizacional.

### Regla crítica

Debe distinguir:

```text
existing_program_or_process
```

de:

```text
desired_program_or_process
```

### Qué debe demostrar el Harness

- fidelidad al estado existente/deseado;
- utilidad de la ruta propuesta;
- ausencia de sobrepromesa;
- correcta conexión con capacidades reales de Starteria.

---

# 5. Matriz resumen

| ID | Tipo | Estado | Origen | Cambio / hipótesis |
|---|---|---|---|---|
| FND-001 | Finding | SUPPORTED | Bayer, Nestlé, Zurich | Añadir `portfolio_governance` |
| FND-002 | Finding | SUPPORTED | Nestlé, Turner, Zurich | Separar initial/current frame |
| FND-003 | Finding | SUPPORTED | Bayer + señales | Añadir `operating_context` |
| FND-004 | Finding | SUPPORTED | Nestlé, Bayer | Success conditions / guardrails |
| FND-005 | Finding | SUPPORTED | Turner | Late reverse alignment |
| FND-006 | Finding | SUPPORTED | Bayer, Nestlé | Hace falta gobierno de sesión |
| FND-007 | Finding | SUPPORTED | Bayer, Nestlé + señales | Handoff debe mostrar valor Starteria |
| FND-008 | Finding | SUPPORTED | Turner, Zurich | Endurecer frontera pre-Step |
| FND-009 | Finding | SUPPORTED | Bayer + señales | Separar declaración/inferencia/sugerencia |
| HYP-001 | Hipótesis | PROPOSED | FND-006 | Quick Clarification + Guided Exploration |
| HYP-002 | Hipótesis | PROPOSED | FND-007 | Recommended Approach + Alternatives |
| HYP-003 | Hipótesis | PROPOSED | FND-007/008/009 | GapResolutionMap |
| HYP-004 | Hipótesis | PROPOSED | FND-003/007 | Soporte a aceleradoras/programas |

---

# 6. Regla para próximos tests

## Si un nuevo caso repite un finding

Añadir el case ID a su evidencia.

No crear otro finding innecesario.

## Si un test valida una hipótesis

Cambiar:

```text
PROPOSED
→ TESTING
→ SUPPORTED
```

solo cuando exista evidencia suficiente.

## Si una hipótesis falla

Marcar:

```text
REJECTED
```

o:

```text
SUPERSEDED
```

y registrar la alternativa nueva.

No editar retrospectivamente el finding para fingir que la hipótesis anterior nunca existió.

---

# 7. Regla de promoción contractual

```text
Finding soportado
→ puede justificar cambio contractual

Hipótesis propuesta
→ puede entrar a contrato experimental
→ pero debe permanecer explícitamente testeable
```

Un contrato marcado:

```text
PROPUESTO PARA TESTING
```

puede contener hipótesis.

Eso no las convierte en comportamiento validado.

---

# 8. Próxima validación requerida

Harness v0.2 debe separar:

```text
A. validación de reglas ya soportadas
B. validación de hipótesis nuevas
```

### A — reglas

- intent;
- current frame;
- context fidelity;
- provenance;
- reverse alignment;
- Step boundary.

### B — hipótesis

- Quick Clarification;
- Guided Exploration;
- Recommended Approach;
- Alternatives;
- GapResolutionMap;
- soporte a programas/aceleradoras.

---

# 9. Principio final

> Un finding describe lo que aprendimos. Una hipótesis describe lo que creemos que podría resolverlo.

Y:

> Starteria debe conservar ambas trazabilidades para no convertir decisiones de diseño en “evidencia” antes de haberlas probado.
