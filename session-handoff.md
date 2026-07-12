# Session Handoff — épico company-context-real-ai (CC)

## Estado: CC-01, CC-02, CC-05 passing · CC-03 in_progress · CC-04 todo

Rama `feat/cc-01-ai-initial-review` (commits 1ed0be9..7244357):
- CC-01 endpoint IA real `/api/v1/ai/initial-review` (pytest 49 ✅, smoke live LLM ✅)
- CC-02 AI_PATH fix + fallback resiliente a mock (backend 422/422 ✅)
- CC-05 e2e empresa→review(companyContext)→confirm-route→Project: tier (a) mock 3/3 ✅,
  tier (b) IA real 3/3 ✅ (1 generación degradó a mock con warn — resiliencia probada)
- CC-03 compose+k8s listos; **pendientes**: (1) documentar INITIAL_REVIEW_AI en
  `.env.example` (bloqueado por permisos), (2) tag de release DESPUÉS de confirmar
  rollout de la imagen ai-service (memoria: CD revierte todo si un servicio falla).

## Riesgos conocidos
- Modelo local deepseek/deepseek-chat trunca JSON a veces → retry + fallback lo cubren;
  para prod preferir modelo con salida estructurada confiable (OPENROUTER_MODEL).
- Latencia IA real 14-60s: nginx/ingress con timeout 60s puede cortar al cliente
  (la review igual se genera). Evaluar timeout del ingress o UX de polling.
- Test heurístico pre-existente roto (CULTURE) en ai-service — lo absorbe CC-04.

## Reanudar
1. Abrir/mergear PR de `feat/cc-01-ai-initial-review` → main.
2. CC-04: extractor LLM con fallback heurístico (`company_context_extractor.py`,
   patrón field_refiner; arregla el test CULTURE de paso).
3. CC-05 tier (b) en CI opcional vía E2E_REAL_AI=1.
