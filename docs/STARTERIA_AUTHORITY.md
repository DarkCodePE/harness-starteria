# Starteria - Authority Map

**Documento:** `docs/STARTERIA_AUTHORITY.md`
**Version:** v0.1
**Estado:** Base de gobernanza para desarrollo documental/harness
**Fecha:** 2026-09-09
**Estado del repositorio:** ver `../CURRENT_STATE.md`

## 1. Proposito

Este archivo indica a cualquier persona, agente o herramienta que documentos tienen autoridad y en que orden deben consultarse.

Este repositorio es harness/documentacion publico. No es runtime productivo. El codigo historico presente en el arbol no redefine Starteria ni autoriza incorporacion productiva.

## 2. Jerarquia de autoridad

Cuando dos fuentes entren en conflicto, aplicar este orden:

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs de producto aprobados en `docs/product-adr/`
3. Experience Logic Contracts aprobados
4. Agent Contracts
5. Skill Contracts
6. Tech Specs
7. PRDs
8. Prototipos, mockups, prompts experimentales y reportes historicos
9. Implementacion historica presente en el arbol

Regla: si dos fuentes entran en conflicto, gobierna la de mayor autoridad y debe conservarse el estado factual declarado por cada documento.

## 3. Estado factual del Core Contract

Core Contract:

`docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`

Estado declarado actual:

- Version: `v0.3 candidata`
- Estado: `Candidata de gobernanza / Requiere re-test`

La presencia de este contrato en el repositorio no lo convierte en aprobado. Cualquier cambio que dependa de tratarlo como aprobado requiere ratificacion explicita.

## 4. Contrato activo para Portfolio Entry

Para el vertical slice `Pantalla 1 - Portfolio Entry / Landing publica`, el Experience Contract activo es:

`docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

Estado declarado:

- Version: `v0.1`
- Estado: `APROBADO COMO BASE DE EXPERIENCIA PARA AUDITORIA E IMPLEMENTACION`

No crear otro `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` si duplica este contrato. Usar una sola autoridad.

El desarrollo de este slice no debe modificar el comportamiento del Adaptive Core / Step 0-4.

## 5. Documentos de referencia

### Core

- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `docs/core/STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md`

### Gobernanza de desarrollo

- `docs/governance/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`

### Portfolio Entry

- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` - propuesto para revision, no implementado
- `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` - propuesto
- `docs/agents/portfolio-entry/skills/entry-01-intent-detection/SKILL.md` a `entry-04-question-planner/SKILL.md` - propuestos
- `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` - harness propuesto/ejecutable segun su propio estado

Nota de estado: implementado no equivale a aprobado ni a probado end-to-end. El Experience Contract v0.1 sigue siendo el contrato activo aprobado para Pantalla 1. Los documentos Agent/Skill conservan su estado propio hasta ratificacion explicita.

## 6. ADRs

- ADRs de harness/documentacion: `docs/adr/`.
- ADRs de producto: `docs/product-adr/ADR-INDEX.md`.
- No mezclar la serie de producto con `docs/adr/ADR-001...007`.

## 7. Reglas obligatorias

Antes de modificar producto:

1. leer `../CURRENT_STATE.md`;
2. leer este archivo;
3. leer Core y conservar su estado factual;
4. identificar el Experience Contract afectado;
5. revisar ADRs relevantes;
6. revisar Agent/Skill Contracts si existen;
7. revisar Tech Spec si existe;
8. inspeccionar la implementacion actual solo como evidencia, no como autoridad;
9. ejecutar baseline tests en el checkout autorizado cuando aplique;
10. reportar conflictos antes de editar.

## 8. Conflicto contrato / codigo

Si el codigo actual contradice una autoridad superior, no preservar el comportamiento solo porque ya existe.

Reportar:

```text
CONFLICT
Contract:
Requirement:
Current implementation:
Observed mismatch:
Risk:
Recommended treatment:
KEEP / UPDATE / ADD / DEPRECATE
Requires ADR: yes/no
```

## 9. Regla de ADR

Detener la implementacion y proponer ADR si el cambio:

- modifica un Invariante Core;
- altera relaciones o cardinalidades canonicas;
- expande autoridad de IA;
- cambia autoridad humana;
- modifica la funcion estable de Step 0-4;
- cambia logica de ciclo/gating adaptativo;
- convierte inferencias en verdad canonica automaticamente;
- requiere migracion de dominio material.

## 10. Portfolio Entry - guardrails especificos

Durante implementacion de `/public/start`:

- no crear Organization;
- no crear StrategicFront;
- no crear Challenge;
- no crear Initiative;
- no crear Step;
- no crear Decision;
- no activar Step 0;
- no modificar Step 0-4;
- no modificar Adaptive Cycle;
- no aceptar archivos publicos P0;
- no convertir inferencias IA en confirmadas;
- no presentar preview ilustrativa como analisis real.

## 11. Regla final

El codigo implementa contratos; no redefine Starteria.
