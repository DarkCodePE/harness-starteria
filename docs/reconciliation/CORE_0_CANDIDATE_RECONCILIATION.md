# CORE-0 — Reconciliación del Core candidate v0.3

**Fecha:** 2026-09-19
**Estado:** RECONCILIACIÓN COMPLETADA / PROMOCIÓN BLOQUEADA
**Repositorio:** `DarkCodePE/harness-starteria`
**Branch:** `docs/portfolio-home-v2-authority`

## 1. Fuentes y regla de autoridad

| Fuente | Estado usado en CORE-0 |
|---|---|
| `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | Core factual vigente del checkout; `v0.2`, `Base fundacional revisada / Por validar` |
| Core v0.3 externo | `External / reconciliation candidate`; no se incorpora ni se trata como autoridad |

`docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` no existe en este checkout. Por
tanto, el candidate externo no puede sustituir la autoridad factual del v0.2.

## 2. Resultado ejecutivo

El candidate es una extensión v0.3 sobre el v0.2, no un contrato independiente.
Mantiene los invariantes Core conocidos y conserva la definición funcional de
Adaptive Core / Step 0–4, pero introduce cambios materiales de gobernanza y
ciclo de vida.

**Decisión CORE-0:**

```text
KEEP     v0.2 como Core factual vigente del checkout
KEEP     v0.3 candidate como fuente de reconciliación externa
BLOCK    promoción, copia canónica o reemplazo del v0.2
REQUIRE  ADR / decisión explícita de producto + evidencia original + re-test
PRESERVE cambios documentales PH-0 / CORE-0 / PH-0B
```

## 3. Áreas que requieren decisión antes de promoción

- modelo de roles y autoridad, incluyendo la relación Sponsor / Portfolio Lead /
  Initiative Owner / expanded Decision Authority;
- Activation Readiness y sus transiciones;
- `pre_start` y su representación técnica;
- ownership transition semantics;
- Challenge coverage/cardinality;
- exact Step materialization boundary;
- criterios y evidencia del test real que originó el candidate.

Estas áreas se registran como candidate dependencies. No definen comportamiento
nuevo y no autorizan implementar lifecycle semantics v0.3.

## 4. CONFLICT

```text
CONFLICT
Contract: Core v0.2 factual vs external Core v0.3 candidate
Requirement: mantener una única autoridad factual y no cambiar semántica Core sin ADR
Current document/code: v0.2 vive bajo doc/; v0.3 solo está disponible como candidate externo
Observed mismatch: el candidate amplía roles, activación, cobertura, ownership y cierre
Risk: consumidores de Experience/Agent/Skill/Tech Specs podrían asumir permisos o transiciones no validadas
Recommended treatment: KEEP v0.2; UPDATE índices y registrar v0.3 como candidate externo
Requires ADR: yes para cualquier promoción o implementación de sus semánticas
```

## 5. V2_CHANGE_GUARDRAIL_CHECK

```text
Slice: CORE-0 / Core governance reconciliation
Authority: doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md (factual); v0.3 externo no autoritativo
Manifest status: Core v0.2 factual; v0.3 external reconciliation candidate
Current route: reconciliación documental; sin cambio de runtime
Legacy dependencies: consumidores históricos de roles Sponsor / Challenge Owner y contratos subordinados
Semantic owner: Core factual v0.2; v0.3 candidate = UNKNOWN until explicit decision
V1 assumptions detected: no se promueve semántica V1; no se autoriza migración visual ni runtime
Decision: PROCEED solo con documentación de reconciliación; NO promoción ni implementación
ADR_REQUIRED: YES para cambios de invariantes, roles Core, activación o autoridad de decisión
```

## 6. Trabajo requerido para CORE-1

Antes de elevar el candidate:

1. Registrar y aprobar un ADR de producto que decida el nuevo modelo de roles y autoridad.
2. Adjuntar la evidencia original del test que originó v0.3 y ejecutar re-test con casos claros, ambiguos, incompletos, contradictorios, importados y de corrección.
3. Definir Activation Readiness, `pre_start`, ownership transitions, Challenge coverage/cardinality y Step materialization.
4. Reconciliar consumidores de Sponsor / Responsable del Reto, Portfolio Lead, Initiative Owner y expanded Decision Authority.
5. Si se promueve, crear una copia canónica dentro del repositorio y actualizar los índices en la misma decisión.

Hasta completar esos pasos, el candidate puede servir como referencia de
análisis, pero no puede definir comportamiento nuevo.
