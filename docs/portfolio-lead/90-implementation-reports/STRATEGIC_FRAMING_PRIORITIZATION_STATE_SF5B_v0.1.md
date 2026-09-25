# Strategic Framing SF-5B — Prioritization Application State v0.1

**Estado:** IMPLEMENTED / FOCUSED VERIFIED — runtime certification pending
**Rama:** `feat/strategic-framing-sf5b-prioritization-state`
**Base requerida:** `2dc4be2254237ad361407616a666905e4b744831` (ancestro verificado)

## Alcance

SF-5B añade estado de aplicación durable y no canónico para la decisión de
priorización aprobada en SF-5A. El estado vive como `prioritizationState` nullable
en `StrategicFramingProvisionalState`, conserva snapshots históricos con el patrón
de versión optimista existente y no implementa motor de recomendación, UI ni ruta
de mutación HTTP.

Al crear desde un `StrategicFramingReadModel` se siembran únicamente gaps y
opportunities derivados de SF-2. La identidad es `sf5:<kind>:<DerivedFramingItem.id>`;
no depende del texto. Las disposiciones humanas son reversibles y pueden superar
`focusSlots`; la capacidad no bloquea ni reescribe decisiones.

## Fronteras preservadas

- candidates, gaps y opportunities son no canónicos;
- observations, drivers y lens suggestions no se convierten en candidatos;
- snapshots de recomendación solo se aceptan como input de aplicación confiable,
  con `inputStateVersion` y `sourceRefs` validados;
- suficiencia, blockers, softGaps y optionalContext no cambian por priorización;
- no hay writes a StrategicFront, Challenge, Project, InitiativePortfolioMeta,
  Step, Invitation ni llamadas Copilot/LLM/red.

## Implementación y evidencia

- Prisma: una columna JSONB nullable y una migración aditiva, sin backfill ni
  modelo nuevo.
- Servicio: `initializePrioritizationFromReadSnapshot` y
  `reviewPrioritization`, ambos con `portfolio:write`, scope actor/organización,
  `expectedVersion`, history previa y update condicionado.
- Tests: `backend/modules/strategic-framing/__tests__/strategic-framing.provisional-state.service.test.ts`.
- Tests estratégicos: PASS — 51 tests.
- Tests SF-5B enfocados: PASS — 14 tests.
- SF-4B regression: PASS — 7 tests.
- Backend typecheck: PASS.
- Prisma generate: PASS; Prisma validate: PASS con URL local de validación.
- `git diff --check`: PASS.

## Gaps

- recomendación live/read capability → SF-5C;
- boundary HTTP/UI de revisión humana → SF-5D;
- certificación de runtime externo → follow-up de verificación.

No se realizó commit, push ni merge.
