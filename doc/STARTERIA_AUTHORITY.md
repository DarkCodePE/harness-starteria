# Starteria - Authority Map

**Documento:** `doc/STARTERIA_AUTHORITY.md`
**Version:** v0.1
**Estado:** Base de gobernanza para harness/documentacion
**Estado del repositorio:** ver `../CURRENT_STATE.md`

## 1. Proposito

Este archivo indica a cualquier persona, agente o herramienta que documentos tienen autoridad y en que orden deben consultarse.

Este repositorio es harness/documentacion publico. No es runtime productivo. El codigo productivo vive fuera de este repositorio y solo puede usarse como evidencia observada.

## 2. Jerarquia de autoridad

Cuando dos fuentes entren en conflicto, aplicar este orden:

1. `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
2. ADRs de producto aprobados en `doc/product-adr/`
3. Experience Logic Contracts aprobados
4. Agent Contracts
5. Skill Contracts
6. Tech Specs
7. PRDs
8. Prototipos, mockups, prompts experimentales y reportes historicos
9. Implementacion productiva observada en checkout productivo, solo como evidencia

Regla: si dos fuentes entran en conflicto, gobierna la de mayor autoridad y debe conservarse el estado factual declarado por cada documento.

## 3. Estado factual del Core Contract

Core Contract:

`doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`

Estado declarado actual:

- Version: `v0.2`
- Estado: `Base fundacional revisada / Por validar`

La presencia de este contrato en el repositorio no lo convierte en aprobado. Cualquier cambio que dependa de tratarlo como aprobado requiere ratificacion explicita.

## 4. Contrato activo para Portfolio Entry

Para el vertical slice `Pantalla 1 - Portfolio Entry / Landing publica`, el Experience Contract activo es:

`doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

Estado declarado:

- Version: `v0.1`
- Estado: `APROBADO COMO BASE DE EXPERIENCIA PARA AUDITORIA E IMPLEMENTACION`

No crear otro `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` si duplica este contrato. Usar una sola autoridad.

## 5. Documentos de referencia

### Core

- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- `doc/STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md`

### Gobernanza de desarrollo

- `doc/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`

### Portfolio Entry

- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` - propuesto
- `doc/entry-01-intent-detection_SKILL_v0.1.md` a `doc/entry-04-question-planner_SKILL_v0.1.md` - propuestos
- `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` - propuesto para testing
- `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` - propuesto para revision, no implementado

Nota de estado: implementado no equivale a aprobado ni a probado end-to-end. Los documentos Agent/Skill conservan su estado propio hasta ratificacion explicita.

## 6. ADRs

- ADRs de harness: `docs/adr/`.
- ADRs de producto: `doc/product-adr/ADR-INDEX.md`.
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
8. inspeccionar la implementacion productiva solo como evidencia, no como autoridad;
9. ejecutar baseline tests en el checkout productivo/autorizado cuando aplique;
10. reportar conflictos antes de editar.

## 8. Regla final

El harness protege contratos; no redefine Starteria ni incorpora runtime productivo.
