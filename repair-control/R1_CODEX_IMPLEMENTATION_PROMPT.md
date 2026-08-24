# R1 — Codex Implementation Prompt

Trabaja exclusivamente sobre el bloque **R1 — Truth Foundation** de Starteria.

## Contexto obligatorio

Estás en el worktree:

`C:\Users\User\proyect-starteria\Dashboardstarteria-repair-r1`

Rama:

`repair/mvp-r1-truth-foundation`

Antes de modificar código, lee en este orden:

1. `AGENTS.md`
2. `repair-control/00_REMEDIATION_MASTER_PLAN.md`
3. `repair-control/R0_VALIDATION_ENVIRONMENT.md`
4. `repair-control/runs/R0/R0_VALIDATION_RESULT.md`
5. `repair-control/R1_TRUTH_FOUNDATION.md`

El baseline auditado original fue `5ff32f9`.

R0 quedó como:

`R0 READY WITH PRODUCT FAILURES`

No reinterpretes ni amplíes el alcance del programa de remediación.

---

# Misión

Implementa **solo R1 — Truth Foundation**.

R1 debe construir la base transversal mínima para distinguir:

`Claim ≠ Evidence ≠ Validation`

y establecer semántica durable para:

- Source / provenance
- Claim
- Evidence
- Validation
- AttentionItem / Blocker
- ImpactStatus mínimo
- política de mocks/fallbacks silenciosos en pilot mode

R1 prepara R2/R3/R4, pero **no debe implementar esos bloques**.

---

# Regla 1 — inspección antes de implementación

No empieces creando modelos nuevos.

Primero inspecciona el código actual y documenta:

- modelos Prisma relacionados con evidencia, archivos, provenance, metadata, blockers, alerts, impact;
- servicios existentes que ya puedan cumplir parte del contrato;
- DTOs y endpoints relacionados;
- estado local frontend que actualmente represente blockers/evidence/impact;
- mocks/fallbacks relevantes;
- integración con Adaptive Core;
- integración con `InitiativePortfolioMeta`;
- integración con Copilot;
- cualquier concepto equivalente que deba reutilizarse en lugar de duplicarse.

Debes decidir explícitamente para cada concepto de R1:

- REUSE
- EXTEND
- BUILD
- DEPRECATE

No construyas un sistema paralelo si el repositorio ya contiene una abstracción reutilizable.

---

# Regla 2 — KEEP obligatorio

No reconstruyas ni reemplaces innecesariamente:

- Adaptive Core
- checkpoint instances existentes
- Copilot ledger
- ProposedAction / ActionPlan / approval flow
- ActionExecutor
- `CreateStrategicFront`
- `StrategicFront`
- `Challenge`
- `InitiativePortfolioMeta`
- `syncInitiativeProgress`
- provenance ya existente en PDFs/proposals que pueda reutilizarse
- proyecciones existentes que puedan adaptarse

Si detectas un conflicto real con alguno de estos componentes, documéntalo antes de modificar su contrato.

---

# Regla 3 — vertical real

No consideres R1 implementado con solo tipos TypeScript o UI.

Cuando aplique, la solución debe recorrer:

`domain → persistence → service → API/DTO → projection → tests`

La UI solo debe modificarse cuando sea necesaria para demostrar una verdad persistida o eliminar una falsa verdad.

No hagas rediseño visual.

---

# Regla 4 — reglas de verdad

Implementa y prueba el contrato de `R1_TRUTH_FOUNDATION.md`, incluyendo como mínimo:

- TRUTH-001
- TRUTH-002
- TRUTH-003
- TRUTH-004
- TRUTH-005
- TRUTH-006
- TRUTH-007
- TRUTH-008
- TRUTH-009
- TRUTH-010

No rebajes estas reglas para hacer pasar tests.

---

# Regla 5 — autoridad humana e IA

La IA puede:

- proponer;
- analizar;
- resumir;
- recomendar;
- señalar faltantes.

La IA no puede:

- inventar evidencia;
- promover un Claim a validated solo por redacción;
- tratar una estimación como impacto realizado;
- cerrar un blocker sin transición explícita;
- tomar una decisión humana final.

Mantén estas restricciones en servicios y no solo en copy/UI.

---

# Regla 6 — pilot truth

En superficies primarias del piloto:

PROHIBIDO:

- fallback silencioso a mock;
- estado local presentado como persistido;
- evidencia fabricada;
- validated sin Validation;
- datos stale presentados como backend truth.

PERMITIDO:

- empty state explícito;
- unavailable/error state explícito;
- fixture solo en dev/test mediante ruta explícita;
- deterministic fixtures dentro de tests.

---

# Regla 7 — no adelantar otros bloques

No implementar en R1:

- DecisionRecord completo;
- Decision Center E2E;
- GP-C;
- ImportSession;
- ImportedItem;
- parser CSV/XLSX;
- publicación de portfolio;
- Copilot multiobject import;
- GP-A;
- motor contractual completo de checkpoints;
- GP-B;
- handoff completo;
- external connectors;
- benefit tracking 30/60/90;
- advanced attribution;
- navigation redesign.

Si alguno requiere una interfaz mínima para R1, crea solo la interfaz mínima y documenta la deuda.

---

# Baseline técnico que no debes ocultar

R0 encontró:

1. Frontend tests:
   - 45/45 files PASS
   - 287/287 tests PASS

2. Backend tests:
   - 68 files PASS
   - 2 skipped
   - 1 failed
   - 575 tests PASS
   - 1 failing test

3. Typecheck:
   - frontend PASS
   - backend FAIL por `LOG_REDACT_PATHS`

4. Build:
   - PASS

5. Dev boot:
   - frontend PASS
   - backend PASS

Baseline defect conocido:

`backend/shared/utils/__tests__/logger-redaction.test.ts`

El test importa `LOG_REDACT_PATHS`, pero `backend/shared/utils/logger` no lo exporta.

No ocultes este baseline. Si necesitas tocar el mismo módulo por razones directamente relacionadas con R1, explica claramente si el defecto se resuelve incidentalmente. No hagas cambios cosméticos solo para volver verde el baseline.

---

# Migraciones

Si R1 necesita cambios Prisma:

- crea una migración nueva;
- no reescribas migraciones históricas;
- mantén compatibilidad razonable con datos existentes;
- documenta defaults/backfill cuando aplique;
- genera Prisma Client;
- prueba la migración en entorno desechable cuando las herramientas del repositorio lo permitan.

No ejecutes `db reset` contra una base no desechable.

---

# Tests obligatorios

Como mínimo demuestra:

1. Claim sin Evidence no queda validated.
2. Evidence conserva source/provenance.
3. Validation queda persistida y atribuible.
4. Evidencia contradictoria conserva estado contradicted.
5. Blocker/AttentionItem persiste después de una nueva lectura.
6. Resolver blocker requiere transición explícita.
7. Evidence insufficient/contradicted no satisface una regla que exige validación.
8. Pilot mode no sustituye silenciosamente backend failure por mock truth.
9. ImpactStatus no salta de declared/estimated a realized sin transición válida.

Añade integration tests cuando aporten evidencia real.

---

# Validación obligatoria al terminar

Ejecuta, como mínimo, desde `front`:

```powershell
npm run db:generate
npm run test:backend
npm run test:front
npm run typecheck
npm run build
```

Además ejecuta los tests específicos nuevos de R1 y cualquier validación de migración razonablemente disponible.

No declares PASS si un comando no fue ejecutado.

Clasifica cada fallo como:

- PRODUCT_FAILURE
- TEST_ENVIRONMENT_FAILURE
- HARNESS_FAILURE

Distingue baseline previo de regresión introducida por R1.

---

# Evidencia obligatoria

Crea:

`repair-control/runs/R1/R1_IMPLEMENTATION_RESULT.md`

Debe contener:

## A. Baseline
- SHA inicial
- rama
- estado previo

## B. Current-state mapping
- modelos/servicios existentes encontrados
- REUSE / EXTEND / BUILD / DEPRECATE
- duplicidades o conflictos detectados

## C. Cambios
- archivos modificados
- migraciones
- modelos
- servicios
- endpoints/DTOs
- proyecciones/UI mínimas
- políticas de fallback

## D. Tests
Para cada comando:
- comando exacto
- exit code
- PASS/FAIL
- clasificación

## E. E2E evidence
Evidencia concreta para escenarios A–E del Repair Contract.

## F. TRUTH mapping
Para TRUTH-001..TRUTH-010:
- IMPLEMENTED
- PARTIAL
- NOT IMPLEMENTED
- evidencia

## G. Regressions
- nuevas regresiones
- baseline failures que permanecen
- baseline failures resueltos incidentalmente

## H. Remaining gaps

## I. Deviations
Toda desviación respecto al Repair Contract y su motivo.

## J. Reaudit targets
Lista de audit IDs afectados.

No declares esos IDs PASS.

---

# Restricciones Git

NO hagas:

- commit
- push
- merge
- rebase
- reset destructivo
- cambio de branch

Deja todos los cambios en el worktree para revisión humana.

---

# Condición de salida

Termina tu trabajo cuando:

1. R1 esté implementado hasta donde el repositorio permita;
2. las pruebas hayan sido ejecutadas;
3. el reporte `R1_IMPLEMENTATION_RESULT.md` exista;
4. hayas listado con precisión cualquier bloqueo o deuda restante.

Tu mensaje final debe resumir:

- qué reutilizaste;
- qué construiste;
- qué archivos/migraciones cambiaste;
- resultados de tests;
- baseline failures vs regressions;
- qué queda pendiente;
- confirmación explícita de que NO hiciste commit/push/merge.

No declares:
- R1 accepted;
- MVP GO;
- GP-A/B/C PASS;
- guardrails PASS.

La aceptación corresponde a una reaudit independiente.
