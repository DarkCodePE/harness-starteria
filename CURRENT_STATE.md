# Current State

Estado del repositorio al aplicar el file plan de continuidad Portfolio Entry v0.3.

## Naturaleza

Este repositorio debe leerse como harness/documentacion publica de Starteria. Conserva contratos, auditorias, trazabilidad, reportes de estado y referencias de gobernanza.

No debe leerse como runtime productivo. La presencia de carpetas historicas como `front/`, `backend/`, `tests/`, `prisma`, `ai-service` o equivalentes no autoriza a incorporar ni evolucionar producto en este repositorio.

## E2E

El E2E de producto fue validado en un checkout productivo/autorizado. Este repositorio conserva contratos, harness y estado documental asociado, pero no conserva un runtime productivo certificado ni debe presentarse como el entorno que ejecuta producto end-to-end.

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
