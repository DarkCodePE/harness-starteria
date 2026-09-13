# AGENTS.md

Entrada neutral para Codex y otros agentes que trabajen sobre este repositorio.

## Naturaleza del repositorio

Este repositorio es harness/documentacion publica de Starteria. Contiene contratos, comandos de trabajo, ADRs del harness, referencias de producto y estado documental.

No es el checkout productivo `Dashboardstarteria` ni contiene una runtime productiva autorizada para evolucionar el producto.

## Regla de no incorporacion productiva

No incorporar, restaurar, copiar ni crear codigo productivo en este repositorio sin una decision explicita.

Prohibido por defecto:

- `backend/` productivo;
- `front/` productivo;
- Prisma o migraciones productivas;
- runtime de IA productiva;
- tests productivos o E2E productivos;
- secretos, datos reales, dumps, artefactos privados o credenciales.

Los cambios permitidos por defecto son documentales: contratos, harness, auditorias, indices, estado actual, trazabilidad, ADRs y notas de seguridad.

## Jerarquia de autoridad

Cuando haya conflicto entre documentos, aplicar este orden y conservar el estado declarado de cada documento:

1. `doc/STARTERIA_AUTHORITY.md`
2. Core Contract, en su estado factual real: `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
3. ADRs de producto aprobados en `doc/product-adr/`
4. Experience Logic Contracts aprobados
5. Agent Contracts
6. Skill Contracts
7. Tech Specs
8. PRDs
9. Prototipos, mockups, prompts experimentales y reportes historicos
10. Implementacion productiva observada en el checkout productivo, solo como evidencia

La presencia de un contrato en este repositorio no lo convierte en aprobado. Mantener siempre su estado: candidate, proposed, approved, deprecated, superseded o historical.

## Core Contract

El Core presente en este repo es:

`doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`

Estado factual real:

- Version: `v0.2`
- Estado: `Base fundacional revisada / Por validar`

No tratarlo como aprobado por estar presente en el repositorio.

## Contrato activo de Portfolio Entry

Para Portfolio Entry, usar una sola autoridad documental:

`doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

No crear otro `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` paralelo si duplica ese contrato.

## Separacion de ADRs

- `docs/adr/` conserva ADRs del harness.
- `doc/product-adr/` conserva el indice y la serie de ADRs de producto.
- No mezclar ADRs de producto con `docs/adr/ADR-001...007`.

## Documentos legacy

Todo documento historico o legacy debe abrir con un banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL`, enlazando a:

- `CURRENT_STATE.md`
- el reemplazo vigente, si existe.

Si el reemplazo vigente no existe, indicarlo de forma explicita en el banner.

## Antes de modificar

1. Leer `CURRENT_STATE.md`.
2. Leer `doc/STARTERIA_AUTHORITY.md`.
3. Leer el contrato afectado y verificar su estado.
4. Identificar si el cambio es documental o productivo.
5. Si es productivo, detenerse salvo que exista decision explicita.
6. Revisar secretos/PII antes de preparar commit porque el repositorio es publico.

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
