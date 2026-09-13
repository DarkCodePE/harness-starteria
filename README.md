# Dashboard Starteria Harness

Repositorio publico de contratos, harness, auditorias y estado documental de Starteria.

Este repo no debe tratarse como runtime productivo. El E2E fue validado en un checkout productivo/autorizado; aqui se conserva la evidencia documental, los contratos, el harness y el estado de continuidad, sin incorporar backend, frontend, Prisma, runtime ni tests productivos nuevos.

## Punto de entrada

- Estado actual: `CURRENT_STATE.md`
- Instrucciones para agentes: `AGENTS.md`
- Mapa de autoridad: `docs/STARTERIA_AUTHORITY.md`
- Core Contract: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- Portfolio Entry activo: `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- ADRs de producto: `docs/product-adr/ADR-INDEX.md`

## Regla principal

La presencia de codigo historico en el arbol no autoriza cambios productivos. Cualquier incorporacion de runtime productivo requiere una decision explicita previa.
