# Dashboard Starteria

Repositorio mixto de Starteria: contratos, harness, auditorias, estado documental y superficies de implementacion controlada.

Este repo no debe tratarse como runtime productivo certificado por defecto. La presencia de frontend, backend, Prisma, runtime o tests no autoriza por si sola cambios productivos.

Desde DS-05 y DS-06 existen pilotos frontend de producto autorizados por slice y documentados en `docs/design-system/`. Nuevas migraciones frontend deben tener alcance explicito, leer la autoridad aplicable y preservar Core, AI, permisos, esquemas, rutas y semantica de producto salvo autorizacion especifica.

## Punto de entrada

- Estado actual: `CURRENT_STATE.md`
- Instrucciones para agentes: `AGENTS.md`
- Mapa de autoridad: `docs/STARTERIA_AUTHORITY.md`
- Core Contract: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- Portfolio Entry activo: `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- ADRs de producto: `docs/product-adr/ADR-INDEX.md`

## Regla principal

La presencia de codigo en el arbol no autoriza cambios productivos. Cualquier incorporacion o evolucion productiva requiere una decision explicita previa y reporte de alcance.
