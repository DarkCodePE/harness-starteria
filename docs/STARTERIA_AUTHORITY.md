# Starteria — Authority Map

**Documento:** `docs/STARTERIA_AUTHORITY.md`
**Versión:** v0.1
**Estado:** Base de gobernanza para desarrollo
**Fecha:** 2026-09-09

# 1. Propósito

Este archivo indica a cualquier desarrollador, agente o herramienta de ejecución qué documentos tienen autoridad y en qué orden deben consultarse.

El código actual NO es autoridad de producto.

---

# 2. Jerarquía de autoridad

1. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
2. ADRs aprobados
3. Experience Logic Contracts
4. Agent Contracts
5. Skill Contracts
6. Tech Specs
7. PRDs
8. Prototipos / mockups / prompts de experimentación
9. Implementación actual

Regla:

> Si dos fuentes entran en conflicto, gobierna la de mayor autoridad.

---

# 3. Contrato activo para Portfolio Entry

Para el vertical slice `Pantalla 1 — Portfolio Entry / Landing pública`, el Experience Contract activo es:

`docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

El desarrollo de este slice NO debe modificar el comportamiento del Adaptive Core / Step 0–4.

---

# 4. Documentos de referencia

## Core

- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`

## Experiencia E2E

- `docs/core/STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md`

## Gobernanza de desarrollo

- `docs/governance/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md`

## Portfolio Entry

- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- futuro: `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md`
- futuros: `entry-01` a `entry-04` Skill Contracts
- futuro: `PORTFOLIO_ENTRY_TECH_SPEC_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md`

---

# 5. Reglas obligatorias

Antes de modificar producto:

1. leer este archivo;
2. leer Core;
3. identificar el Experience Contract afectado;
4. revisar ADRs relevantes;
5. revisar Agent/Skill Contracts si existen;
6. revisar Tech Spec si existe;
7. inspeccionar la implementación actual;
8. ejecutar baseline tests;
9. reportar conflictos antes de editar.

---

# 6. Conflicto contrato / código

Si el código actual contradice una autoridad superior:

NO preservar el comportamiento solo porque ya existe.

Reportar:

```text
CONFLICT
Contract:
Requirement:
Current implementation:
Observed mismatch:
Risk:
Recommended treatment:
KEEP / ADAPT / REMOVE / NEW
Requires ADR: yes/no
```

---

# 7. Regla de ADR

Detener la implementación y proponer ADR si el cambio:

- modifica un Invariante Core;
- altera relaciones/cardinalidades canónicas;
- expande autoridad de IA;
- cambia autoridad humana;
- modifica la función estable de Step 0–4;
- cambia lógica de ciclo/gating adaptativo;
- convierte inferencias en verdad canónica automáticamente;
- requiere migración de dominio material.

---

# 8. Portfolio Entry — guardrails específicos

Durante implementación de `/public/start`:

- NO crear Organization;
- NO crear StrategicFront;
- NO crear Challenge;
- NO crear Initiative;
- NO crear Step;
- NO crear Decision;
- NO activar Step 0;
- NO modificar Step 0–4;
- NO modificar Adaptive Cycle;
- NO aceptar archivos públicos P0;
- NO convertir inferencias IA en confirmadas;
- NO presentar preview ilustrativa como análisis real.

---

# 9. Regla final

> El código implementa contratos; no redefine Starteria.
