# AGENTS.md

Entrada neutral para Codex y otros agentes que trabajen sobre este repositorio.

## Naturaleza del repositorio

Este repositorio es un snapshot publico de harness, contratos, auditorias y estado documental de Starteria.

No es el checkout productivo ni contiene una runtime productiva autorizada para evolucionar el producto. Aunque el arbol pueda conservar carpetas historicas como `front/`, `backend/`, `tests/`, `prisma` o equivalentes, esas carpetas no deben tratarse como superficie activa de implementacion salvo decision explicita y documentada.

## Regla de no incorporacion productiva

No incorporar, restaurar, copiar ni crear codigo productivo en este repositorio sin una decision explicita.

Prohibido por defecto:

- backend productivo;
- frontend productivo;
- Prisma o migraciones productivas;
- runtime de IA productiva;
- tests productivos o E2E productivos;
- secretos, datos reales, dumps, artefactos privados o credenciales.

Los cambios permitidos por defecto son documentales: contratos, harness, auditorias, indices, estado actual, trazabilidad, ADRs documentales y notas de seguridad.

## Jerarquia de autoridad

Cuando haya conflicto entre documentos, aplicar este orden y conservar el estado declarado de cada documento:

1. `docs/STARTERIA_AUTHORITY.md`
2. Core Contract, en su estado factual real: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
3. ADRs de producto aprobados en `docs/product-adr/`
4. Experience Logic Contracts aprobados
5. Agent Contracts
6. Skill Contracts
7. Tech Specs
8. PRDs
9. Prototipos, mockups, prompts experimentales y reportes historicos
10. Implementacion historica presente en el arbol

La presencia de un contrato en este repositorio no lo convierte en aprobado. Mantener siempre su estado: candidate, proposed, approved, deprecated, superseded o historical.

## Contrato activo de Portfolio Entry

Para Portfolio Entry, usar una sola autoridad:

`docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

No crear otro `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` paralelo si duplica ese contrato. Si el checkout productivo contiene una version aprobada distinta, registrar la diferencia en `CURRENT_STATE.md` o en una auditoria antes de copiar o reemplazar contenido.

## Separacion de ADRs

- `docs/adr/` conserva ADRs del harness/documentacion.
- `docs/product-adr/` conserva el indice y la serie de ADRs de producto.
- No mezclar ADRs de producto con `docs/adr/ADR-001...007` del harness.

## Documentos legacy

Todo documento historico o legacy debe abrir con un banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL`, enlazando a:

- `CURRENT_STATE.md`
- el reemplazo vigente, si existe.

Si el reemplazo vigente no existe, indicarlo de forma explicita en el banner.

## Antes de modificar

1. Leer `CURRENT_STATE.md`.
2. Leer `docs/STARTERIA_AUTHORITY.md`.
3. Leer el contrato afectado y verificar su estado.
4. Identificar si el cambio es documental o productivo.
5. Si es productivo, detenerse salvo que exista decision explicita.
6. Revisar secretos/datos sensibles antes de preparar commit porque el repositorio es publico.

## Protocolo de conflicto

Si una fuente contradice una autoridad superior, reportar:

```text
CONFLICT
Contract:
Requirement:
Current document/code:
Observed mismatch:
Risk:
Recommended treatment:
KEEP / UPDATE / ADD / DEPRECATE
Requires ADR: yes/no
```

No resolver conflictos de producto de forma silenciosa.
