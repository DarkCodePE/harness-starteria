# 13 — Activación funcional de ADR-031 en INTERPRET

**Fecha:** 2026-09-20. **Slice:** `AI_HARNESS_INTERPRET_ADR031`.
**Autorización:** instrucción explícita del responsable en esta sesión: «activa el
INTERPRET DE JEV aprueba el ADR, y activa la reglas para el cambio funcional».

```text
V2_CHANGE_GUARDRAIL_CHECK

Slice: AI_HARNESS_INTERPRET_ADR031
Goal: Jev como backend de INTERPRET del harness; GROUND sigue en OpenRouter
Authority: ADR-027 Accepted + ADR-031 Accepted por instrucción explícita de 2026-09-20
Manifest status: slice registrado en STARTERIA_V2_MANIFEST.md en esta implementación
Current route: mode=harness / POST /ai/diagnose -> GROUND LLM -> INTERPRET LLM
Legacy dependencies: RouteProfile, StageDriver, GateLadder, cost tracker y scorecard
Semantic owner: V2 para el gate aprobado; ruta LLM LEGACY_COMPAT
MAY_DEFINE_NEW_BEHAVIOR: YES para V2; NO para LEGACY_COMPAT
V1 assumptions detected: el cost tracker atribuía todas las etapas a un modelo OpenRouter
Adapter required: conservar mock hermético y selector explícito de rollback a LLM
Tests protecting current behavior: suite harness, Jev, integración y costos
Tests required for V2: Jev por defecto, LLM de rollback, confirmación, fail-closed,
  uso y proveedor por etapa, baseline sin cambios
Authority conflict: Core referenciado ausente en este checkout; índice
  product-adr incorporado sin duplicar los ADR canónicos del backend.
  El usuario autorizó de forma expresa la activación de este slice; la ausencia
  permanece registrada y no se interpreta como aprobación global del Core.
Proceed: YES, exclusivamente dentro de la slice autorizada
```

## Punto de operación aprobado para la activación

Se conserva **0.50** como corte operativo provisional de cada pregunta (`route` y
`unit`) y **0.75** como frontera high. El hard gate confirma si cualquiera cae en low;
el peso 0.6 y los umbrales del score de riesgo siguen siendo objetos distintos.
Los 23 casos exploratorios no certifican este punto de operación. El valor puede
revisarse con una decisión posterior y una evaluación independiente.

## Contrato de activación

- Jev se usa en INTERPRET por defecto dentro del path `mode=harness` y `POST /ai/diagnose`.
- Los mocks de etapa siguen anulando toda llamada de red para tests/eval determinista.
- `HARNESS_INTERPRET_BACKEND=llm` revierte sólo INTERPRET al backend anterior;
  un valor distinto de `jev` o `llm` falla al iniciar la petición.
- Error o ausencia de credencial Jev aborta el diagnóstico; no hay fallback silencioso.
- La ausencia de credencial se detecta antes de GROUND, evitando una llamada OpenRouter
  que después no podría completar el diagnóstico.
- La auditoría registra modelo y proveedor por etapa; costos se imputan por modelo.
- El baseline del orquestador (`mode=baseline`) no cambia.

## Alcance de la aprobación

Se aprueba la arquitectura y el corte **operativo provisional** para comenzar a usar
el gate. No se declara una garantía de riesgo, sensibilidad, calibración local ni
estabilidad temporal a partir de los dos fallos etiquetados. Las decisiones sobre
objetivo de riesgo y capacidad humana permanecen abiertas y se revisan con datos
posteriores etiquetados.

## Verificación y cierre de la slice

```text
V2_CHANGE_CLOSURE_CHECK

Slice: AI_HARNESS_INTERPRET_ADR031
Functional rule: Jev por defecto en INTERPRET; route y unit son señales
  independientes y cualquiera en low activa confirmación.
Authority: ADR-027 Accepted; ADR-031 Accepted; slice inscrita en Manifest V2.
Implemented paths: harness/backend_selection.py, harness/stages/llm_stages.py,
  harness/jev.py, harness/gates.py, agents/orchestrator.py,
  services/cost_tracker.py, configuración del harness y CD/Kubernetes.
Regression: 190 tests pertinentes aprobados; ruff y git diff --check limpios.
Rollback: HARNESS_INTERPRET_BACKEND=llm, probado en tests herméticos.
External deployment: no realizado. `gh secret list` confirmó que JEV_API_KEY
  aún no figura entre los secretos de DarkCodePE/harness-starteria.
Runtime configuration: JEV_API_KEY es obligatorio en CD y se inyecta en el
  Secret de Kubernetes. También está ausente en este entorno local; las
  peticiones Jev reales fallan cerradas hasta configurar la credencial.
Production risk: no certificado por 23 rutas y dos errores etiquetados.
Status: implementación local verificada; activación externa bloqueada por
  secreto GitHub ausente y pendiente de despliegue y observación etiquetada.
```

La estimación de costes usa una tarifa pública de Jev consultada al implementar
esta slice; verificarla antes de operar presupuestos, porque las tarifas pueden
cambiar. Fuente: [TypeSafe, presentación de Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev).
