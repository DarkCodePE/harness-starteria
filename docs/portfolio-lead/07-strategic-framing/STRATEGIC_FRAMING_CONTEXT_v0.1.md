# STARTERIA_STRATEGIC_FRAMING_NEXT_CHAT_CONTEXT_v0.1

**Propósito:** contexto mínimo suficiente para continuar en un nuevo chat el diseño del bounded context Strategic Framing de Startería sin perder decisiones previas.

**Fecha:** 2026-09-20

---

# 1. Autoridad factual

Repositorio canónico:

`DarkCodePE/harness-starteria`

Core factual vigente:

`doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`

Estado:

`v0.2 — Base fundacional revisada / Por validar`

Core v0.3:

- external reconciliation candidate;
- NOT current authority;
- requiere ADR + evidencia original + re-test antes de promoción.

Reporte de reconciliación:

`docs/reconciliation/CORE_0_CANDIDATE_RECONCILIATION.md`

---

# 2. Estado Portfolio Home

Cerrado:

- PH-0: GO
- PH-1: GO
- PH-2: GO
- PH-3A: READY FOR HUMAN REVIEW / aprobado conceptualmente con refinamientos

Read model principal:

`GET /api/v1/portfolio/home`

Conceptual:

```text
PortfolioHomeReadModel
├── portfolioReading
├── governance
├── strategicUnits[]
├── attention[]
├── pendingDecisions[]
├── recommendations[]
└── generatedAt
```

Portfolio Home target:

```text
1. Portfolio Reading
2. Requiere tu atención
3. Mapa de trabajo estratégico
4. Decisiones pendientes
5. Recommendation / Startería insight cuando sea material
```

La Home no es solo una bandeja de pendientes. Debe evolucionar hacia un marco de seguimiento estratégico continuo.

---

# 3. Nuevo bounded context: Strategic Framing

Objetivo:

Diseñar cómo Startería transforma una intención expresada en Portfolio Entry en una estructura estratégica suficientemente clara y accionable, sin obligar al usuario a seguir una metodología rígida.

Target conceptual:

```text
Portfolio Entry
        ↓
Strategic Framing
        ↓
Frente Estratégico
        ↓
Strategic Lenses relevantes
        ↓
Drivers / Gaps / Opportunities
        ↓
Priorización
        ↓
Retos activos
        ↓
Iniciativas
        ↓
Evidencia / Aprendizaje / Decisiones
        ↓
actualización del Frente
```

---

# 4. Decisiones ya acordadas

## 4.1 Frente Estratégico

Un Frente representa:

> el resultado estratégico que la organización quiere mover.

Debe contener como mínimo:

- desired outcome;
- KPI / signal;
- baseline/target cuando existan;
- horizon;
- constraints/material context;
- governance owner.

No debe requerir obligatoriamente múltiples Retos.

Un Frente puede ser pequeño y enfocado.

Ejemplo válido:

```text
1 Frente
2 lenses relevantes
1 Reto
1 Iniciativa
```

También puede ser complejo:

```text
1 Frente
5 lenses relevantes
4 Retos
12 Iniciativas
```

---

## 4.2 Strategic Lenses

Los lentes NO son:

- formularios obligatorios;
- entidades jerárquicas del dominio;
- un checklist;
- un Reto;
- una obligación de cobertura.

Son perspectivas analíticas adaptativas.

Librería candidate:

- Value / Outcome
- Customer / Opportunity
- Process / Capability
- Learning / Evidence
- Financial
- Culture / Organization
- Technology
- Risk / Compliance
- Ecosystem / Partners

Startería debe activar solo los lentes materialmente relevantes al contexto.

Regla:

> Startería starts with the minimum number of lenses needed to explain the outcome.

Un lente puede:

- no producir ningún Reto;
- producir una observación;
- generar uno o varios gaps;
- contribuir junto con otros lentes a un mismo Reto.

---

## 4.3 Adaptive depth

La profundidad del framing debe ser adaptativa.

Conceptual:

```text
LIGHT
STANDARD
DEEP
```

No necesariamente visible al usuario.

Factores:

- claridad del outcome;
- complejidad;
- horizonte;
- capacidad disponible;
- número de iniciativas;
- dependencias;
- incertidumbre;
- urgencia.

### LIGHT

Para:

- outcome claro;
- poco tiempo;
- baja complejidad;
- capacidad limitada.

Target:

```text
Outcome
→ 1–2 drivers
→ 1 Reto prioritario
→ 1–2 Iniciativas
```

### STANDARD

Para:

- varias iniciativas;
- incertidumbre moderada;
- varias áreas.

### DEEP

Para:

- objetivo corporativo amplio;
- múltiples unidades;
- dependencias;
- decisiones de inversión;
- alta incertidumbre.

---

# 5. UX principle

La experiencia debe ser híbrida.

```text
La plataforma estructura.
El usuario puede editar directamente.
El Copilot observa, interpreta, cuestiona y propone.
```

No debe ser:

```text
conversation-only
```

ni:

```text
long-form mandatory form
```

El usuario debe poder trabajar de tres maneras:

## Direct

```text
usuario edita workspace
→ Startería reevalúa
→ muestra gaps/sufficiency
```

## Copilot

```text
usuario conversa
→ Copilot propone estructura
→ usuario aplica/corrige
→ workspace se actualiza
```

## Mixed

```text
usuario edita
→ Copilot detecta algo
→ Startería sugiere
→ usuario incorpora/descarta
```

Todos deben terminar en el mismo estado estructurado.

---

# 6. Copilot rule

Regla principal:

> Todo el framing debe poder completarse sin conversar con el Copilot.

Y:

> Todo insight relevante del Copilot debe poder convertirse en estado estructurado y nunca permanecer únicamente en la conversación.

Copilot:

- interpreta;
- propone;
- cuestiona;
- explica;
- detecta gaps;
- recomienda prioridades.

Copilot NO:

- crea Retos automáticamente;
- decide qué debe abordar la organización;
- convierte inferencia en verdad;
- obliga a usar chat.

---

# 7. Gaps / opportunities

Los lenses producen observaciones y posibles gaps.

No:

```text
Lens → Challenge automático
```

Sí:

```text
Lens observation
→ Driver / Gap / Opportunity
→ Priorización
→ Human confirmation
→ Challenge
```

Los gaps pueden quedar en:

```text
ACTIVE / ABORDAR AHORA
OBSERVE / EN OBSERVACIÓN
DISCARD / NO ABORDAR
```

No todo gap debe convertirse en Reto.

---

# 8. Strategic backlog

El backlog pertenece al Frente, no a cada lens.

Conceptual:

```text
Frente
├── Retos activos
└── Gaps / opportunities en observación
```

Ejemplo:

```text
Abordar ahora
- Validación manual

En observación
- Integración de datos
- Skills
- Incentivos
- Dependencia externa
```

Startería debe respetar capacidad, horizonte y urgencia.

Si existen 5 gaps pero capacidad para 1:

> Startería debe recomendar foco, no crear 5 Retos.

---

# 9. Sufficiency

Startería evalúa suficiencia, no completitud.

No:

```text
3/4 lenses completed
```

Sí:

```text
Outcome claro ✓
Métrica clara ✓
Driver principal identificado ✓
Dependencia de datos incierta ○
Impacto financiero no evaluado ○
```

Startería debe distinguir:

- hard blocker;
- soft gap;
- useful-but-not-required information.

La ausencia de un lens no bloquea por sí misma.

---

# 10. Mental model scenarios to freeze

Crear IDs permanentes.

## SF-MM-01 — Expert / direct

Input:
- outcome claro;
- KPI claro;
- driver claro.

Expected:
- mínima intervención;
- no lenses forzados;
- rápida conversión a Reto si hay suficiente claridad.

Forbidden:
- preguntas innecesarias;
- Deep framing obligatorio.

## SF-MM-02 — Outcome clear, causes uncertain

Input:
- KPI claro;
- driver desconocido.

Expected:
- Startería propone 2–4 lenses relevantes;
- exploración guiada;
- gaps visibles;
- no crea Challenge automáticamente.

## SF-MM-03 — Portfolio-first

Input:
- múltiples iniciativas;
- estrategia poco clara.

Expected:
- reverse alignment;
- identificar patrones;
- proponer posibles Frentes;
- humano confirma.

Forbidden:
- fabricar estrategia desde inventario.

## SF-MM-04 — Speed / limited capacity

Input:
- horizonte corto;
- un equipo;
- varios gaps.

Expected:
- priorizar un gap;
- proponer máximo un Reto activo;
- mantener otros gaps en observación.

Forbidden:
- crear un Reto por gap;
- forzar profundidad innecesaria.

## SF-MM-05 — Complex corporate front

Input:
- múltiples áreas;
- dependencias;
- varias iniciativas.

Expected:
- framing profundo;
- varios lenses relevantes;
- múltiples Retos cuando se justifique;
- coverage visible.

## SF-MM-06 — User works without Copilot

Input:
- usuario edita directamente.

Expected:
- framing completo posible sin chat;
- Copilot puede observar/revisar después.

Forbidden:
- conversación obligatoria para avanzar.

## SF-MM-07 — Specialized perspective

Input:
- factor financiero, cultura, tecnología, riesgo o ecosistema material.

Expected:
- activar lens adicional relevante.

Forbidden:
- limitar análisis a cuatro lenses fijos.

---

# 11. Traceability rule

Cada mental model debe existir en:

```text
1. Scenario ID
2. Experience Contract
3. Acceptance Test
4. Traceability Matrix
```

Ejemplo:

```text
SF-MM-04
→ capacity-aware framing rule
→ gap prioritization UI
→ prioritization application service
→ limited-capacity acceptance test
→ SF-5 implementation slice
```

No considerar suficientemente protegido un comportamiento si existe solo en:
- conversación;
- PRD;
- Figma;
- prompt;
- copy.

---

# 12. Proposed documentation package

Crear:

`docs/portfolio-lead/07-strategic-framing/`

con:

1. `STRATEGIC_FRAMING_EXPERIENCE_CONTRACT_v0.1.md`
2. `STRATEGIC_FRAMING_MENTAL_MODEL_SCENARIOS_v0.1.md`
3. `STRATEGIC_FRAMING_ACCEPTANCE_CHECKLIST_v0.1.md`
4. `STRATEGIC_FRAMING_TRACEABILITY_MATRIX_v0.1.md`
5. `STRATEGIC_FRAMING_IMPLEMENTATION_SEQUENCE_v0.1.md`
6. `README.md`

---

# 13. Proposed implementation sequence

```text
SF-0 Contract + scenario freeze
SF-1 Current-state audit
SF-2 Strategic Framing Read Model
SF-3 Editable Front Workspace
SF-4 Adaptive Lens Suggestions
SF-5 Gap Prioritization
SF-6 Promote Gap → Challenge
SF-7 Portfolio Home Integration
SF-8 E2E Harness
```

No big-bang implementation.

---

# 14. Important architectural caution

No crear todavía una tabla canónica `Lens`.

No asumir todavía que se requieren entidades:
- StrategicLens;
- FrontLens;
- LensChallenge.

Primero validar mediante read model / experience.

Si surge necesidad de persistir nuevos objetos canónicos como:
- StrategicObservation;
- StrategicGap;

debe pasar por ADR y evaluación de Core/domain migration.

---

# 15. Relationship with Portfolio Home

Portfolio Home debe poder consumir progresivamente:
- outcome;
- strategic health;
- active challenges;
- gaps in observation;
- coverage;
- learning;
- decisions.

Pero PH-3B no debe implementarse todavía si Strategic Framing modifica materialmente el read model esperado.

Primero congelar SF-0 / SF-1.

---

# 16. Documents to load in the new chat

Minimum required:

## Authority / Core
- `docs/STARTERIA_AUTHORITY.md`
- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- `docs/reconciliation/CORE_0_CANDIDATE_RECONCILIATION.md`

## Portfolio Entry
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- current Portfolio Entry clarification/handoff candidate docs if needed for input semantics.

## Portfolio Home
- `docs/portfolio-lead/06-portfolio-home-governance/PORTFOLIO_HOME_GOVERNANCE_TARGET_v0.1.md`
- `docs/portfolio-lead/06-portfolio-home-governance/PORTFOLIO_HOME_READ_MODEL_CONTRACT_v0.1.md`
- `docs/portfolio-lead/90-implementation-reports/PORTFOLIO_HOME_UX_RECONCILIATION_PH3A_v0.1.md`

## Handoff
- `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md`

## Design System / Copilot
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md`
- `docs/design-system/STARTERIA_PAGE_ANATOMY_SYSTEM_v0.1.md`
- `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md`

## This handoff
- `STARTERIA_STRATEGIC_FRAMING_NEXT_CHAT_CONTEXT_v0.1.md`

---

# 17. Recommended first task in the new chat

Do NOT implement immediately.

First:
1. review this handoff;
2. validate the Strategic Framing mental model;
3. create SF-0 documentation package;
4. audit current implementation against it;
5. only then define implementation slices.

Primary question:

> How should Startería adapt framing depth, lenses, gap prioritization and Copilot intervention to different user mental models while preserving speed, flexibility and human authority?
