---
id: ADR-PORTFOLIO-ENTRY-MODEL-SELECTION
title: "Seleccion de modelo para Portfolio Entry v0.2"
status: proposed
type: model-selection
date: 2026-09-11
decision_makers: [Starteria Product Engineering]
related_docs:
  - docs/ai-harness/portfolio-entry/PHASE_5_CLOSURE_REPORT.md
  - docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md
  - docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md
tags: [portfolio-entry, ai-harness, model-selection, openai, deepseek]
---

# ADR: Seleccion de modelo para Portfolio Entry v0.2

## Context and problem statement

Portfolio Entry v0.2 necesita un provider LLM para ejecutar Analysis, Question Planning y Handoff bajo contratos estrictos de Starteria.

La decision debe priorizar:

1. fidelidad semantica;
2. respeto de autoridad humana;
3. provenance;
4. estabilidad multi-turn;
5. control de preguntas;
6. trazabilidad;
7. coste.

El coste importa, pero debe optimizarse despues de estabilizar la semantica y la operacion del MVP.

## Decision

Para el MVP de Portfolio Entry:

```text
Provider primario: OpenAI
Modelo primario: gpt-5.6-luna
```

DeepSeek queda validado como provider secundario:

```text
Provider secundario / benchmark: DeepSeek
Candidate: starteria-deepseek-v0.2-a
Modelo configurado en runs: deepseek-v4-flash
Modelo efectivo reportado/actual: registrar desde provider_raw.model
```

No se adopta por ahora una arquitectura con modelos distintos para Analysis y Handoff.

## Decision drivers

- Consistencia semantica entre Analysis y Handoff.
- Respeto del principio: la IA recomienda y el Portfolio Lead decide.
- Trazabilidad de evidencia, faltantes, riesgos y proximos pasos.
- Capacidad de operar multi-turn sin romper Question Budget.
- Provider abstraction desacoplada de contratos de dominio.
- Coste y latencia medidos, no asumidos.

## Candidates evaluated

| Candidate | Provider | Modelo | Estado |
| --- | --- | --- | --- |
| `starteria-openai-v0.2-a` | OpenAI | `gpt-5.6-luna` | Behaviorally validated |
| `starteria-deepseek-v0.2-a` | DeepSeek | `deepseek-v4-flash` / effective provider model in raw | Behaviorally validated, secondary |

## Evidence

| Caso | Objetivo | OpenAI | DeepSeek |
| --- | --- | ---: | ---: |
| `PE2-ST-LIVE-01` | Portfolio-first / priorizacion | PASS | PASS |
| `PE2-ST-LIVE-02` | Solution-first / Reverse Alignment | PASS | PASS |
| `PE2-MT-LIVE-01` | Multi-turn / reanalysis / budget / handoff | PASS | PASS |

Runs locales relevantes:

- OpenAI: `2026-09-11T05-22-05-741Z`, `2026-09-11T05-37-19-503Z`, `2026-09-11T05-48-45-154Z`.
- DeepSeek: `2026-09-11T07-24-41-342Z`, `2026-09-11T07-47-38-480Z`, `2026-09-11T07-55-20-504Z`.
- Baseline determinista: `2026-09-11T06-34-56-243Z`, con 32 PASS / 0 REVIEW / 0 FAIL.

## Rationale

OpenAI `gpt-5.6-luna` mostro la mejor combinacion observada para el MVP:

- precision semantica adecuada;
- menor agresividad interpretativa;
- buen comportamiento multi-turn;
- menor volumen de tokens en la muestra comparable;
- menor incertidumbre operativa actual sobre identidad/versionado del modelo.

DeepSeek no se descarta. Paso los smoke tests criticos despues del fix de extraccion `message/output_text`, mantuvo Structured Outputs, respeto Question Budget y genero handoffs contractualmente validos. Su rol recomendado es secundario/benchmark hasta contar con medicion formal de coste, latencia y estabilidad con mas muestra.

## Consequences

Positive:

- Portfolio Entry arranca el MVP con un baseline estable.
- Los contratos siguen siendo provider-agnostic.
- DeepSeek permanece disponible como alternativa validada.
- La arquitectura multi-provider queda preservada.

Negative:

- No se captura todavia una optimizacion agresiva de coste por provider.
- DeepSeek requiere seguimiento por `DS-OBS-01`, `DS-OBS-02`, `DS-OBS-03` y `DS-OBS-04`.
- Falta formalizar mediciones comparables de coste/latencia por provider.
- Falta registrar de forma separada requested model vs effective provider model.

## Rejected options

### DeepSeek como default inmediato

Rejected because: aunque DeepSeek paso los smoke tests, mostro mayor expansion y algunas observaciones cualitativas que conviene estudiar antes de convertirlo en default del MVP.

### Modelo mixto: OpenAI para Analysis, DeepSeek para Handoff

Rejected because: introduciria routing adicional y haria mas dificil atribuir diferencias de comportamiento al producto, al prompt, al schema o al provider.

### Seleccion dinamica por coste o complejidad

Rejected because: aun no existe baseline estable ni medicion formal suficiente para introducir reglas dinamicas sin aumentar incertidumbre operativa.

## Implementation guidance

Mantener:

```text
Session Engine
  -> Agent Contract
  -> StructuredModelAdapter
  -> Provider Adapter
  -> OpenAI / DeepSeek / futuro provider
```

No modificar por esta decision:

- prompts;
- Intent Detection;
- Reverse Alignment;
- Question Planner;
- Session Controller;
- scoring;
- evaluator;
- Handoff schema;
- contratos;
- DTOs productivos;
- Steps;
- UI productiva.

## Review triggers

Revisar esta decision cuando ocurra cualquiera de estos eventos:

- coste mensual LLM de Portfolio Entry supera el presupuesto operativo acordado por dos ciclos consecutivos;
- P95 latency de Portfolio Entry degrada la experiencia del MVP;
- eval score o pass rate cae tras actualizacion de modelo;
- DeepSeek completa medicion formal de coste/latencia y reduce observaciones abiertas;
- se introduce Phase 6 o integracion productiva que cambie volumen, riesgo o superficie de usuario;
- se requiere seleccion dinamica por provider.

## Sources

- OpenAI Models: https://developers.openai.com/api/docs/models
- DeepSeek Models & Pricing: https://api-docs.deepseek.com/quick_start/pricing/
- DeepSeek V4.1 Flash announcement: https://deepseek.com/en/news/deepseek-v4-1-flash/
