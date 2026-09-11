# Portfolio Entry Harness v0.2 - Phase 5 Closure Report

**Producto:** Starteria  
**Componente:** Portfolio Entry Harness v0.2  
**Fase:** Phase 5 - Live Candidate  
**Estado:** COMPLETE - PASS WITH QUALITATIVE OBSERVATIONS  
**Fecha:** 2026-09-11  
**Alcance:** Harness experimental aislado, sin cambios productivos  

---

## 1. Resultado

Phase 5 queda cerrada como:

```text
COMPLETE - PASS WITH QUALITATIVE OBSERVATIONS
```

OpenAI `gpt-5.6-luna` queda como provider primario recomendado para el MVP de Portfolio Entry.

DeepSeek queda validado como provider secundario, benchmark de calidad/coste, alternativa de contingencia y candidato para futuras optimizaciones controladas.

No se recomienda para el MVP dividir el flujo entre un modelo para Analysis y otro para Handoff. La prioridad inmediata es preservar consistencia semantica y operativa antes de optimizar agresivamente coste.

---

## 2. Casos Ejecutados

| Caso | Objetivo | OpenAI | DeepSeek |
| --- | --- | ---: | ---: |
| `PE2-ST-LIVE-01` | Portfolio-first / priorizacion | PASS | PASS |
| `PE2-ST-LIVE-02` | Solution-first / Reverse Alignment | PASS | PASS |
| `PE2-MT-LIVE-01` | Multi-turn / reanalysis / budget / handoff | PASS | PASS |

Evidencia local relevante:

| Provider | Run ID | Candidate | Caso | Resultado |
| --- | --- | --- | --- | --- |
| OpenAI | `2026-09-11T05-22-05-741Z` | `starteria-openai-v0.2-a` | `PE2-ST-LIVE-01` | PASS |
| OpenAI | `2026-09-11T05-37-19-503Z` | `starteria-openai-v0.2-a` | `PE2-ST-LIVE-02` | PASS |
| OpenAI | `2026-09-11T05-48-45-154Z` | `starteria-openai-v0.2-a` | `PE2-MT-LIVE-01` | PASS |
| DeepSeek | `2026-09-11T07-24-41-342Z` | `starteria-deepseek-v0.2-a` | `PE2-ST-LIVE-01` | PASS |
| DeepSeek | `2026-09-11T07-47-38-480Z` | `starteria-deepseek-v0.2-a` | `PE2-ST-LIVE-02` | PASS |
| DeepSeek | `2026-09-11T07-55-20-504Z` | `starteria-deepseek-v0.2-a` | `PE2-MT-LIVE-01` | PASS |

Baseline determinista:

| Run ID | Casos | Resultado |
| --- | ---: | --- |
| `2026-09-11T06-34-56-243Z` | 32 | 32 PASS / 0 REVIEW / 0 FAIL |

---

## 3. Fixes de Phase 5

### Provider extraction fix

El run DeepSeek `2026-09-11T06-27-29-006Z` fallo con `F-SCHEMA`, pero el problema no era un JSON invalido generado por el modelo. El `provider_raw` contenia:

- `output[type=reasoning].content[type=reasoning_text].text`
- `output[type=message].content[type=output_text].text`

El adapter intentaba parsear el primer `content[].text`, que correspondia a reasoning. Se corrigio la capa `StructuredModelAdapter` / provider adapter para Responses-compatible providers:

```text
response.output
  -> ignorar output[type=reasoning]
  -> seleccionar output[type=message]
  -> seleccionar content[type=output_text]
  -> pasar solo .text a JSON.parse
```

El `provider_raw` completo, incluyendo reasoning, se preserva para observabilidad.

Archivos modificados por el fix:

- `tests/ai-harness/portfolio-entry/adapters/live-llm-adapter.ts`
- `tests/ai-harness/portfolio-entry/__tests__/portfolio-entry-live-candidate-v0.2.test.ts`

---

## 4. Validacion Tecnica

Validaciones ejecutadas despues del fix:

| Validacion | Resultado |
| --- | --- |
| Targeted provider tests | 28 PASS |
| Portfolio Entry harness tests | 108 PASS |
| TypeScript | PASS |
| Baseline v0.1 | 32 PASS / 0 REVIEW / 0 FAIL |
| `npm test` | 56 files PASS / 398 tests PASS |

No se modificaron:

- prompts;
- contracts;
- Skill semantics;
- Session Controller;
- Question Planner;
- Handoff semantics;
- evaluator;
- scoring;
- fixtures;
- domain Zod schemas;
- codigo productivo;
- comportamiento OpenAI.

---

## 5. Observaciones Cualitativas

### OpenAI `gpt-5.6-luna`

Fortalezas observadas:

- buena clasificacion de intent;
- buena distincion entre estado inicial y evolucion del contexto;
- Reverse Alignment relativamente conservador;
- buen comportamiento multi-turn;
- menor tendencia a expandir gaps innecesarios;
- menor consumo total de tokens en casos comparables observados;
- consistencia adecuada entre Analysis y Handoff;
- buen respeto de la IA como copiloto, no como autoridad de decision.

Observaciones:

- algunas clasificaciones derivadas quedaron con provenance mas cercano a `EXTRACTED_FROM_USER_TEXT` cuando conceptualmente correspondian a `AI_INFERRED`;
- persiste deuda de encoding UTF-8 en artefactos existentes;
- el reporting del harness todavia mezcla findings con failures en algunas vistas.

### DeepSeek `starteria-deepseek-v0.2-a`

Fortalezas observadas:

- Structured Outputs correcto despues del fix del adapter;
- Intent Detection correcto en los tres casos;
- provenance disciplinado en varios outputs;
- buen manejo de `USER_DECLARED`, `AI_INFERRED` y `AI_SUGGESTED`;
- respeta Question Budget;
- respeta `responded_resolves != answered_gaps`;
- buen reanalysis entre turnos;
- Handoff completo y contractualmente correcto;
- no toma decisiones de portfolio por el usuario.

Observaciones:

- `DS-OBS-01`: Reverse Alignment agresivo en el caso multi-turn al interpretar una aceleradora interna como solution.
- `DS-OBS-02`: `current_frame` conservador aun cuando el intent evoluciono correctamente hacia `portfolio_prioritization`.
- `DS-OBS-03`: algunos gaps portfolio-level fueron enviados prematuramente a `INITIATIVE_SETUP`.
- `DS-OBS-04`: mayor expansion de ambiguities, missing links, alternativas y razonamiento.

---

## 6. Eficiencia y Modelo

Runs DeepSeek observados:

| Caso | Tokens totales aproximados |
| --- | ---: |
| `PE2-ST-LIVE-01` | 21,388 |
| `PE2-ST-LIVE-02` | 17,660 |
| `PE2-MT-LIVE-01` | 26,118 |

Los runs DeepSeek consumieron mas tokens que los OpenAI comparables. Esto no prueba por si solo que DeepSeek sea economicamente peor, porque los precios/token difieren; si reduce margen para asumir una ventaja nominal por precio.

Segun documentacion oficial consultada el 2026-09-11:

- OpenAI documenta `gpt-5.6-luna` con precio de USD 0.20 por 1M input tokens y USD 1.20 por 1M output tokens.
- DeepSeek documenta `deepseek-flash` como `DeepSeek-V4.1-Flash`, con pricing peak/off-peak y compatibilidad Responses API.
- DeepSeek indica que `deepseek-v4-flash` y `deepseek-v4-flash-vision-exp` fueron retirados y se enrutan temporalmente a V4.1-Flash.

Fuentes:

- OpenAI Models: https://developers.openai.com/api/docs/models
- DeepSeek Models & Pricing: https://api-docs.deepseek.com/quick_start/pricing/
- DeepSeek V4.1 Flash announcement: https://deepseek.com/en/news/deepseek-v4-1-flash/

---

## 7. Deudas Abiertas

| ID | Tipo | Estado | Bloquea Phase 5 |
| --- | --- | --- | --- |
| `REPORTING-DEBT` | Observabilidad | Open | No |
| `UTF8-DEBT` | Encoding | Open | No |
| `DS-OBS-01` | Modelo / conducta | Open | No |
| `DS-OBS-02` | Modelo / conducta | Open | No |
| `DS-OBS-03` | Modelo / routing metodologico | Open | No |
| `DS-OBS-04` | Modelo / expansion | Open | No |
| `MODEL-ID-DEBT` | Observabilidad | Open | No |
| `COST-LATENCY-DEBT` | Medicion | Open | No |

Ninguna deuda requiere modificar contratos antes de continuar.

---

## 8. Cierre

Phase 5 demuestra que la arquitectura multi-provider tiene valor:

```text
Session Engine
  -> Agent Contract
  -> StructuredModelAdapter
  -> Provider Adapter
  -> OpenAI / DeepSeek / futuro provider
```

La logica de dominio permanece provider-agnostic. Cambiar de provider debe seguir siendo una decision de infraestructura, no una reescritura de Starteria.

Decision de cierre:

```text
Usar OpenAI gpt-5.6-luna como baseline del MVP.
Mantener DeepSeek como provider secundario validado.
```
