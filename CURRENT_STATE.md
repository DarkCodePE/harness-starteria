# Current State

Estado del repositorio al aplicar el file plan de continuidad Portfolio Entry v0.3.

## Naturaleza

Este repositorio debe leerse actualmente como repositorio mixto de Starteria.

Conserva contratos, auditorias, trazabilidad, reportes de estado y referencias de gobernanza. Tambien contiene implementacion frontend/backend, tests y E2E que han sido modificados por commits y slices recientes.

No debe leerse como runtime productivo certificado por defecto. La presencia de carpetas como `front/`, `backend/`, `tests`, `prisma`, `ai-service` o equivalentes no autoriza por si sola a incorporar ni evolucionar producto.

La autoridad actual permite cambios frontend de producto solo cuando exista decision explicita y documentada de slice, con alcance acotado y sin modificar Core, AI, permisos, esquemas, rutas ni semantica de producto salvo autorizacion especifica. DS-05 y DS-06 son evidencia documental de pilotos frontend autorizados por slice.

## E2E

El E2E de producto fue originalmente validado en un checkout productivo/autorizado. Este repositorio ahora conserva harness, estado documental y una superficie ejecutable de tests/E2E bajo `front/`.

No debe presentarse como runtime productivo certificado. Los resultados E2E en este checkout son evidencia de validacion de slice, no certificacion global de producto.

## Autoridad vigente

- Authority map: `docs/STARTERIA_AUTHORITY.md`.
- Core Contract: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`.
  - Estado factual real: `v0.3 candidata`, `Candidata de gobernanza / Requiere re-test`.
  - Su presencia aqui no lo convierte en aprobado.
- Portfolio Entry Experience Contract aprobado:
  - `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
  - Este es el unico `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` que debe usarse como autoridad activa para Pantalla 1.
  - SHA-256 observado: `D34FDEA9A5E5BE843105DDC2A3CED4970144AE2596AC8BF5AB897A95B2A54E8A`.
- Portfolio Post-Entry Continuation:
  - `docs/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`.
  - Estado: propuesto para revision, no implementado.

## ADRs

- ADRs de harness/documentacion: `docs/adr/`.
- ADRs de producto: `docs/product-adr/`.
- La serie de producto se mantiene separada de `docs/adr/ADR-001...007`.

## Legacy e historico

Los documentos legacy o historicos deben abrir con banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL` y enlazar a este archivo y al reemplazo vigente si existe.

Si un documento no tiene banner todavia, no debe asumirse vigente por defecto. Verificar su estado declarado, fecha, ruta y reemplazo antes de usarlo como autoridad.

## Guardrail publico

Antes de cada commit:

- revisar secretos y datos sensibles;
- excluir runtime productivo nuevo;
- excluir dumps, credenciales, tokens, archivos `.env` reales y artefactos con datos privados;
- confirmar que README y AGENTS no prometen ejecucion productiva desde este repositorio.
