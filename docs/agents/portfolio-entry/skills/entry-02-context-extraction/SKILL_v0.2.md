# Starteria — Skill Contract: entry-02-context-extraction

**Documento:** `SKILL_v0.2.md`
**Skill ID:** `entry-02-context-extraction`
**Versión:** v0.2
**Estado:** PROPUESTO PARA TESTING
**Fecha:** 2026-09-10
**Tipo:** Skill Contract
**Agente padre:** Portfolio Entry Agent / Orchestrator
**Vertical slice:** Portfolio Entry

---

## 0. Autoridad

Este skill está subordinado a:

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados
3. `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
4. `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
5. `entry-01-intent-detection/SKILL_v0.2.md`

Este skill no redefine intents, estados, autoridad IA, dominio canónico ni lógica de Steps.

---

## 0.1. Cambios desde v0.1

Esta versión incorpora hallazgos derivados del testing de Portfolio Entry.

Cambios contractuales:

- se añade `operating_context`;
- se añade `success_conditions`;
- se añade `quality_guardrails`;
- se refuerza la fidelidad semántica entre lo declarado y lo estructurado;
- se diferencia contexto existente vs contexto deseado;
- se evita convertir recomendaciones del agente en contexto declarado;
- se permite actualizar contexto multi-turn sin sobrescribir silenciosamente información previa;
- se añaden reglas para manejar términos vagos de éxito o calidad.

### Trazabilidad de findings

- `FND-003` — pérdida o distorsión de contexto operativo existente;
- `FND-004` — términos de éxito/calidad relevantes pero insuficientemente definidos;
- `FND-009` — mezcla entre contexto declarado, inferencia y recomendación.

La evidencia detallada de estos findings debe vivir en:

`PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md`

Este documento conserva únicamente la decisión contractual resultante.

No se añaden todavía:

- budget acumulado de preguntas;
- handoff;
- diseño de experimento;
- reglas de Step 0.

---

## 1. Propósito

Transformar el lenguaje del usuario en **contexto provisional estructurado, fiel y trazable**, conservando:

1. qué declaró;
2. qué puede extraerse;
3. qué se infiere;
4. qué sigue siendo desconocido;
5. en qué entorno operativo está ocurriendo;
6. qué condiciones de éxito o guardrails ya expresó.

Debe responder:

> ¿Qué sabemos realmente sobre la situación del usuario y en qué contexto ocurre, sin convertir interpretación o recomendación en verdad?

---

## 2. Input

Input mínimo:

```text
raw_input: string
```

Input recomendado desde el orquestador:

```text
initial_entry_state
current_frame
primary_intent
secondary_intents
```

Input opcional en sesiones posteriores:

- contexto extraído previamente;
- provenance previa;
- ambiguities;
- contradictions;
- analysis version.

No requiere:

- objetos canónicos;
- RAG;
- archivos;
- fuentes externas;
- Project/Step.

---

## 3. Output conceptual

```text
ContextExtractionResult
├── extracted_context
│   ├── goal
│   ├── metric
│   ├── target
│   ├── baseline
│   ├── horizon
│   ├── problem
│   ├── opportunity
│   ├── solution
│   ├── portfolio_size
│   ├── initiatives_mentioned
│   ├── decision_need
│   ├── reporting_need
│   ├── constraints
│   ├── operating_context
│   ├── success_conditions
│   └── quality_guardrails
├── ambiguities
├── contradictions
├── missing_obvious_context
├── provenance
├── context_changes
└── status
```

### `status`

- `extracted`
- `partial`
- `insufficient_input`

---

## 4. Regla fundamental

Este skill debe mantener separadas estas capas:

```text
USER_DECLARED
EXTRACTED_FROM_USER_TEXT
AI_INFERRED
AI_SUGGESTED
UNKNOWN
```

Nunca debe colapsarlas.

En especial:

> Una recomendación útil no debe volver al contexto como si hubiera sido declarada por el usuario.

---

## 5. Provenance

Cada dato material debe conservar:

```text
origin
review_disposition
```

### Origin

- `USER_DECLARED`
- `EXTRACTED_FROM_USER_TEXT`
- `AI_INFERRED`
- `AI_SUGGESTED`

### Review disposition

- `UNREVIEWED`
- `USER_CONFIRMED`
- `USER_REJECTED`
- `SUPERSEDED`

Esta skill no puede producir `USER_CONFIRMED` por sí sola.

---

## 6. Fidelidad semántica

### CE-01 — No simplificar alterando el sentido

Si el usuario dice:

> Tenemos una aceleradora interna de innovación que ya opera globalmente.

No convertir en:

```text
"Necesitan crear una aceleradora global."
```

Debe preservarse:

```text
existing_program_or_process = aceleradora interna de innovación existente
geographic_scope = global
```

### CE-02 — Diferenciar existente vs deseado

Ejemplo:

```text
"Tenemos un programa interno pero no funciona bien."
```

No equivale a:

```text
"Necesitamos crear un programa interno."
```

### CE-03 — No convertir contexto en recomendación

Si el usuario dice:

> Compliance se revisa después.

No convertir automáticamente en:

```text
"Compliance debe ser filtro temprano."
```

Eso puede aparecer posteriormente como recomendación, pero no como contexto declarado.

---

## 7. Campos base

Se mantienen:

- `goal`
- `metric`
- `target`
- `baseline`
- `horizon`
- `problem`
- `opportunity`
- `solution`
- `portfolio_size`
- `initiatives_mentioned`
- `decision_need`
- `reporting_need`
- `constraints`

Reglas:

- no inventar;
- no completar por sentido común;
- no normalizar más de lo necesario;
- preservar contradicciones;
- preservar aproximaciones;
- no crear entidades canónicas.

---

## 8. `operating_context`

Nuevo campo para conservar el entorno en el que ocurre la necesidad.

Puede contener conceptualmente:

```text
operating_context
├── sector
├── existing_program_or_process
├── operating_model
├── geographic_scope
├── stage_context
├── relevant_roles
└── organizational_constraints
```

Solo extraer lo declarado.

### Ejemplo normativo

Input:

> Somos una farmacéutica internacional y trabajamos dentro de una aceleradora interna bajo un modelo de venture building.

Permitido:

```text
sector = farmacéutica
geographic_scope = internacional
existing_program_or_process = aceleradora interna
operating_model = venture building
```

No permitido:

```text
goal = crear una aceleradora
```

---

## 9. `success_conditions`

Captura condiciones que el usuario utiliza para describir qué significaría que la iniciativa, portfolio o sistema funcionara.

Ejemplos:

```text
"Queremos acelerar el lanzamiento."
→ success_condition = reducir tiempo de llegada al mercado
```

```text
"Queremos reducir riesgo antes de financiar."
→ success_condition = reducir incertidumbre antes de asignar presupuesto
```

No exige siempre una métrica.

---

## 10. `quality_guardrails`

Captura condiciones que no deben degradarse mientras se busca el objetivo.

Ejemplos:

```text
"sin perder calidad"
→ quality_guardrail = calidad
```

```text
"sin afectar precisión, fairness ni control humano"
→ quality_guardrails =
  - precisión
  - fairness
  - control humano
```

No convertir automáticamente estos guardrails en KPIs.

---

## 11. Términos vagos de éxito

Expresiones como:

- acelerar;
- mejorar;
- hacerlo mejor;
- reducir riesgo;
- sin perder calidad;
- garantizar éxito;
- hacerlo más eficiente;

pueden ser relevantes pero ambiguas.

La skill debe:

1. conservar el término;
2. marcar ambigüedad si su significado afecta la interpretación;
3. no inventar una métrica;
4. entregar el gap al Question Planner.

### Ejemplo normativo

Input:

> Queremos acelerar las ideas sin perder calidad.

Salida válida:

```text
success_conditions:
- acelerar las ideas

quality_guardrails:
- calidad

ambiguities:
- no está definido qué significa "acelerar"
- no está definido qué dimensión representa "calidad"
```

No esperado:

```text
target = reducir 30% el time-to-market
```

si el usuario nunca declaró ese valor.

---

## 12. Contexto operativo vs problema

No mezclar entorno con problema.

Ejemplo:

```text
sector = farmacéutica
```

no es un problema.

```text
confidencialidad restringe feedback real de clientes
```

sí puede ser una restricción o problema operativo.

---

## 13. Contexto operativo vs solución

Ejemplo:

> Trabajamos bajo venture building.

No significa:

```text
solution = venture building
```

Debe quedar en:

```text
operating_context.operating_model
```

---

## 14. Contexto operativo vs portfolio

Ejemplo:

> Tenemos una aceleradora con 30 ideas.

Puede extraerse:

```text
operating_context.existing_program_or_process = aceleradora
portfolio_size = 30
```

No crear automáticamente:

- Portfolio canónico;
- Program;
- Challenge;
- Initiative.

---

## 15. Actualización multi-turn

En sesiones posteriores, el contexto puede enriquecerse.

Ejemplo:

Turno 1:

> Queremos reducir riesgo en nuevas oportunidades.

Turno 2:

> Somos una farmacéutica internacional.

Turno 3:

> Esto ocurre dentro de una aceleradora global.

La skill debe acumular:

```text
goal
sector
existing_program_or_process
```

sin borrar información válida anterior.

---

## 16. `context_changes`

Cuando una nueva respuesta:

- agrega;
- corrige;
- contradice;
- reemplaza;

un dato previo, debe quedar trazable conceptualmente.

Ejemplo:

```text
context_changes:
- path: portfolio_size
  change_type: contradiction
  previous: 12
  current: ~20
```

No requiere todavía un schema técnico definitivo.

---

## 17. Correcciones del usuario

Si el usuario corrige explícitamente:

> No, no estamos creando una aceleradora; ya existe.

La skill debe:

- preservar el valor anterior como `SUPERSEDED`;
- actualizar el contexto;
- no mantener ambas interpretaciones como equivalentes.

---

## 18. `decision_need`

Se mantiene:

```text
decision_need = true
```

si el usuario declara necesidad de decidir.

Puede enriquecerse conceptualmente con:

```text
decision_object
decision_timing
decision_audience
```

solo cuando estén explícitos.

Ejemplo:

> El comité debe decidir qué ideas reciben presupuesto.

```text
decision_need = true
decision_object = asignación de presupuesto entre ideas
decision_audience = comité
```

---

## 19. `reporting_need`

Puede enriquecerse conceptualmente con:

```text
reporting_audience
reporting_purpose
reporting_timing
```

solo cuando el texto lo soporte.

---

## 20. Casos mínimos de aceptación

Los siguientes son ejemplos normativos del contrato, no evidencia de testing.

### Caso A — contexto operativo existente

Input:

> Esto forma parte de una aceleradora de innovación que ya existe dentro de la empresa.

Esperado:

```text
operating_context.existing_program_or_process
= aceleradora de innovación existente
```

No esperado:

```text
goal = crear aceleradora
```

### Caso B — términos vagos

Input:

> Queremos acelerar las ideas sin perder calidad.

Esperado:

```text
success_conditions = [acelerar las ideas]
quality_guardrails = [calidad]
ambiguities incluye significado de acelerar/calidad
```

No inventar métricas.

### Caso C — operating model

Input:

> Trabajamos bajo un modelo de venture building y las ideas pueden pasar de piloto local a implementación internacional.

Esperado:

```text
operating_context.operating_model = venture building
operating_context.geographic_scope = local → internacional
operating_context.stage_context = piloto → implementación
```

No convertir venture building en solución.

### Caso D — recomendación no declarada

Input:

> Compliance se revisa después del piloto.

Esperado:

```text
contexto declarado:
compliance se revisa después del piloto
```

No esperado:

```text
compliance debe ser filtro temprano
```

### Caso E — quality guardrails

Input:

> Queremos reducir esfuerzo sin afectar precisión, fairness ni control humano.

Esperado:

```text
goal = reducir esfuerzo

quality_guardrails =
- precisión
- fairness
- control humano
```

### Caso F — actualización multi-turn

Turno inicial:

> Tenemos muchas ideas y necesitamos priorizarlas.

Después:

> Esto ocurre dentro de una aceleradora interna existente.

Esperado:

- conservar necesidad de priorización;
- añadir operating context;
- no reinterpretar como creación de aceleradora.

### Caso G — contradicción

Input:

> Tenemos 12 iniciativas, aunque en realidad deben ser unas 20.

Esperado:

- contradicción preservada;
- no elegir un valor exacto silenciosamente.

---

## 21. Operaciones prohibidas

Esta skill no puede:

- cambiar intent como autoridad final;
- cambiar `initial_entry_state`;
- decidir `current_frame`;
- generar question plan;
- ejecutar reverse alignment;
- recomendar estrategia;
- diseñar operating model;
- diseñar experimento;
- definir gates;
- crear Project;
- activar Steps;
- consultar fuentes externas.

---

## 22. Boundary con Skill 01

Recibe:

```text
initial_entry_state
current_frame
primary_intent
secondary_intents
```

Puede usar estas señales para interpretar contexto, pero no para inventarlo.

---

## 23. Boundary con Skill 03

Entrega a Reverse Alignment:

- solution;
- initiatives mentioned;
- problem;
- opportunity;
- goal;
- metric/signal;
- operating context relevante;
- success conditions;
- quality guardrails;
- constraints;
- provenance.

Esto permite que reverse alignment comprenda una solución dentro de su entorno real.

---

## 24. Boundary con Skill 04

Entrega al Question Planner:

- extracted context;
- ambiguities;
- contradictions;
- success conditions;
- quality guardrails;
- operating context;
- missing obvious context;
- provenance.

Question Planner decide qué merece aclararse.

---

## 25. Criterios de aceptación

El skill cumple si:

- conserva fidelidad semántica;
- distingue existente vs deseado;
- captura operating context cuando se declara;
- captura success conditions;
- captura quality guardrails;
- no convierte recomendaciones en hechos;
- preserva provenance;
- preserva contradicciones;
- puede actualizar contexto multi-turn de forma trazable;
- no crea objetos canónicos;
- no invade Step 0.

---

## 26. Anti-patterns

No implementar:

- resumir contexto perdiendo el estado existente;
- convertir programa existente en programa por crear;
- traducir “acelerar” automáticamente a un KPI;
- convertir “calidad” en una métrica no declarada;
- mezclar recomendación con extracción;
- sobrescribir contexto previo sin trazabilidad;
- llenar campos vacíos por sentido común;
- convertir operating model en solución.

---

## 27. Decisiones reservadas para testing

No congelar todavía:

- schema exacto de `operating_context`;
- granularidad de `success_conditions`;
- granularidad de `quality_guardrails`;
- threshold para considerar un término vago como material;
- normalización de geography/stage;
- confidence score;
- prompt final;
- modelo IA.

---

## 28. Definition of Done

Antes de pasar a Skill 03 v0.2:

- [ ] `operating_context` aceptado;
- [ ] `success_conditions` aceptado;
- [ ] `quality_guardrails` aceptado;
- [ ] regla existente vs deseado aceptada;
- [ ] fidelidad semántica aceptada;
- [ ] actualización multi-turn aceptada;
- [ ] provenance reforzada aceptada;
- [ ] boundary con Skill 03 aceptada;
- [ ] no invasión de Step 0 aceptada.

---

## 29. Principio final

> Extraer contexto no significa simplificarlo hasta cambiar su sentido.

Y:

> Starteria debe recordar en qué realidad opera el usuario, no solo qué objetivo escribió.
