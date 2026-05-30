---
id: ADR-006
title: "Capa de framework y modelo para el refinamiento de campo del editor público"
status: proposed
type: standard
date: 2026-05-29
decision_makers: [Architecture Agent (Swarm)]
related_prds: [PRD-003]
related_specs: [SPEC-003]
sprint: S-03
review_trigger: "Tras eval de utilidad de sugerencias N≥80 (PRD-003 US-002) o cambio de modelo primario (ADR-004)"
tags: [ai, langchain, framework-selection, structured-output, public-landing]
---

# ADR-006: Capa de framework y modelo para el refinamiento de campo del editor público

## Context and problem statement

PRD-003 (US-002) requiere un refinamiento real de campos del borrador público.
El `ai-service` actual usa **LangGraph + Deep Agents** (`deepagents.create_deep_agent`)
con 7 agentes registrados como grafos en `langgraph.json` (`orchestrator`,
`mentor_virtual`, `research_assistant`, `feedback_ia`, `solution_design`,
`experiment_coach`, `narrative_builder`). La pregunta es **en qué capa** construir
el refinamiento de campo, que es un caso muy distinto a esos agentes: una
operación **stateless, single-step**, sin tools, sin memoria, sin planificación,
sin branching — entra `{field, currentValue, draftContext}`, sale un valor
sugerido estructurado.

Se consultó el skill `framework-selection`. Recorrido de la tabla de decisión:

| Pregunta | Respuesta | → |
|---|---|---|
| ¿Sub-tareas / archivos / memoria / skills on-demand? | No | no Deep Agents |
| ¿Control flow complejo (loops, branching, HITL, estado)? | No | no LangGraph |
| ¿Single-purpose con tools? | No (sin tools) | — |
| ¿Pura llamada a modelo / chain con structured output? | **Sí** | **LangChain (chain)** |

**Decision question:** ¿Qué capa de framework, modelo y contrato de salida usamos
para el refinamiento de campo del editor público?

## Decision

1. **Capa = LangChain chain stateless** (no LangGraph, no Deep Agents). Se
   implementa como una función pura modelo→structured-output y se expone vía
   `routers/ai.py`. **No** se registra en `langgraph.json` (no es un grafo).
2. **Structured output con Pydantic:** `with_structured_output(FieldRefinement)`
   donde `FieldRefinement = { suggestedValue: str, rationale: str, confidence: float }`.
   (Para el contrato y middleware de structured output, ver skill `langchain-middleware`.)
3. **Modelo:** usar el proveedor ya configurado (`langchain-openrouter` /
   `langchain-openai`). Alinear con ADR-004: si/cuando el modelo primario migre a
   Haiku 4.5 (`langchain-anthropic`, hoy un TODO en `pyproject.toml`), este
   refinamiento lo adopta. Por ser un paso barato y de alta frecuencia pública, se
   prioriza un modelo de **baja latencia/coste**.
4. **Prompt:** plantilla de refinamiento por campo (instrucción + tipo de campo +
   valor actual + contexto del borrador), registrada junto a los prompts de
   `ai-service/prompts/`. Sin few-shot pesado para acotar tokens.
5. **Fallback:** si el modelo falla/timeout, el frontend usa la heurística local
   (`buildSuggestion`) marcada como sugerencia local — la chain no implementa
   reintentos complejos (eso rompería la simplicidad de la capa).

## Decision drivers

- **Simplicidad/coste:** un grafo o Deep Agent para un single-shot sería
  sobre-ingeniería y añadiría latencia/coste innecesarios en una ruta pública de
  alta frecuencia.
- **Coherencia con framework-selection:** la tabla apunta inequívocamente a chain.
- **Acotación de tokens:** ruta pública → prompt corto, structured output estricto.
- **Evolución de modelo:** desacoplado del proveedor concreto vía LangChain.

## Consequences

**Positivas**
- Implementación mínima, rápida y barata; fácil de testear (entrada→salida).
- No contamina `langgraph.json` ni el grafo del orchestrator.
- Migración de modelo (ADR-004) sin tocar la lógica.

**Negativas**
- Sin estado/memoria: cada refinamiento es independiente (aceptable para el caso).
- Si en el futuro el refinamiento necesitara multi-paso (p. ej. refinar todo el
  borrador con dependencias entre campos), habría que **promover a LangGraph** —
  este ADR se revisaría.

## Alternatives considered

- **Registrar un nuevo agente Deep Agent / grafo LangGraph** como los 7 existentes
  — rechazado: sobre-ingeniería para un single-step sin tools/estado; más coste y
  latencia; ensucia `langgraph.json`.
- **Reusar `narrative_builder`** — rechazado: distinto propósito (construye
  narrativa completa, no refina un campo puntual con structured output acotado).
- **Mantener la heurística cliente** — rechazado por PRD-003/ADR-016 (no es IA real,
  reintroduce mocks).

## Related
- PRD-003, SPEC-003
- ADR-016 (contrato/seguridad del endpoint público en backend)
- ADR-004 (selección de modelo — Haiku 4.5)
- skill `framework-selection`, `langchain-middleware` (structured output)
