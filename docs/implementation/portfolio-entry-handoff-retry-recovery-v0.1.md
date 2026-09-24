# Portfolio Entry Handoff Retry Recovery v0.1

Estado: IMPLEMENTED / E2E BLOCKED BY LOCAL DOCKER DAEMON  
Slice: `PORTFOLIO_ENTRY_HANDOFF_RETRY_RECOVERY`

## Alcance

Se corrigió la recuperación del flujo cuando `materialize_handoff` falla después de que la sesión llega a `nextAction = generate_handoff`.

El cambio se limita a la superficie frontend de Portfolio Entry. No modifica backend, runtime, Core, permisos, rutas, Prisma, Quick Clarification, Guided Exploration, checkpoints, VH-1/VH-2/VH-3, CTA, Portfolio Home ni Steps.

## Comportamiento implementado

- El intento automático y el retry manual comparten `materializeHandoff`.
- Cada intento genera una nueva idempotency key.
- Se conserva el mismo `sessionId` y el mismo `expectedRevision`.
- Un error retryable (`timeout`, `unavailable`, `provider_output`, `rate_limited`, `network` y fallback retryable) deja visible el error y muestra `Reintentar análisis`.
- La revisión materializada bloquea reintentos automáticos, pero no bloquea el retry manual explícito.
- Mientras el retry está pendiente no se permite doble submit.
- Errores no retryable no muestran el botón.
- `conflict` conserva la recuperación existente mediante refresh de sesión y no activa retry directo.
- No existe retry automático posterior al fallo.

## Archivos

- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`
- `front/src/features/portfolio-entry/public/__tests__/PortfolioEntryExperience.test.tsx`

## Evidencia

La suite focal de `PortfolioEntryExperience` cubre intento fallido, acción de retry, sesión y revisión esperada, idempotency keys distintas, éxito posterior, doble submit, error no retryable y regresión del handoff exitoso.

## V2_CHANGE_CLOSURE_CHECK

V2 contract satisfied: YES  
V2 route active: YES  
V1 consumer remaining: NONE INTRODUCED  
Legacy compatibility documented: NOT APPLICABLE  
E2E passed: NO — blocked before test execution because the local Docker Desktop Linux engine is unavailable  
Manifest updated: NO CHANGE REQUIRED; existing Portfolio Entry slice remains partial/testing  
Retirement action: KEEP_COMPAT  
Migration status: PARTIAL
