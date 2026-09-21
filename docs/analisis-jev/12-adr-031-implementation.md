# 12 — Implementación experimental de ADR-031

> **HISTORICAL — 2026-09-20.** Etapa experimental previa a la
> [activación funcional](13-adr-031-activation.md). Estado general del repositorio:
> [CURRENT_STATE](../../CURRENT_STATE.md). Se conserva la evidencia y el guardrail originales.

**Fecha:** 2026-09-20. **Estado:** implementación experimental; no promoción productiva.

```text
V2_CHANGE_GUARDRAIL_CHECK

Slice: ADR-031 / INTERPRET experimental
Authority: ADR-027 Accepted (hard gates y confirmación); ADR-031 Proposed (separación de señales)
Manifest status: no hay slice AI/INTERPRET registrada
Current route: LLM en harness; Jev sólo en harness/eval/runner.py
Legacy dependencies: RouteProfile y gates del harness ADR-027
Semantic owner: UNKNOWN para promoción V2; brazo Jev experimental para esta implementación
V1 assumptions detected: ninguna inferida; no se reutiliza semántica V1 como autoridad
Adapter required: sí, conservar compatibilidad de RouteProfile existente
Tests protecting current behavior: test_harness_jev.py, test_harness_gates.py, test_harness_stages.py
Tests required for V2: política completa con etiquetas de ruta y ambigüedad de unidad;
  evaluación independiente y E2E del slice antes de cualquier promoción
Authority conflict: faltan Core y product-adr referenciados; ADR-031 sigue Proposed;
  no hay riesgo objetivo ni corte final
Proceed: YES para experimento aislado y verificable; NO para activar Jev en runtime ni
  declarar el slice V2 o el umbral certificado
```

## Alcance

El brazo experimental separa la etiqueta de confianza de `route` y la de `unit`.
El gate duro confirma cuando cualquiera es baja; si ambas son bajas, se cuenta un solo
gate `ambiguous_classification`, con su peso original. Los perfiles LLM anteriores carecen
de `unit_confidence` y conservan su comportamiento. La etapa LLM descarta explícitamente
esos campos opcionales si el proveedor llegara a devolverlos; solo el brazo Jev evaluado
con un mock estructurado puede aportar la señal de unidad. La confirmación muestra una
pregunta específica sobre unidad cuando corresponde.
El scorecard de corridas **nuevas** guarda `confidence_scores` de ambas preguntas por caso;
el artefacto histórico n=36 no contiene esos datos y no se reconstruye retrospectivamente.

El corte 0.50 y la frontera high 0.75 permanecen como parámetros experimentales.
Esto no determina el punto de operación ni acredita que los scores de Jev sean
probabilidades de acierto. Se mantiene el brazo de evaluación opt-in. La decisión de
adoptar Jev en INTERPRET requiere reconciliar autoridad V2 y las decisiones abiertas del
[ADR-031](../../backend/docs/adr/ADR-031-confidence-threshold-for-human-escalation.md).

## Verificación

`uv run pytest -q` sobre los seis módulos de pruebas de Jev, gates, etapas, integración,
scorecard y uso de tokens: **71 passed**. `uv run ruff check` sobre los archivos Python
modificados: **sin errores**. Los enlaces documentales y `git diff --check` pasaron.
Las pruebas son herméticas: no se hizo una nueva llamada pagada ni se usó el conjunto de 23
casos para elegir otro umbral.

## Cierre pendiente

```text
V2_CHANGE_CLOSURE_CHECK

V2 contract satisfied: no, autoridad del slice ausente
V2 route active: no
V1 consumer remaining: ruta LLM existente
Legacy compatibility documented: sí, RouteProfile sin unit_confidence mantiene gate anterior
E2E passed: pendiente para promoción
Manifest updated: no, no se declara migración experimental como V2
Retirement action: KEEP_COMPAT
Migration status: PARTIAL
```
