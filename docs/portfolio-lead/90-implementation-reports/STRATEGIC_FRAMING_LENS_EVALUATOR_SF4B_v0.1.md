# Strategic Framing Lens Evaluator — SF-4B v0.1

**Estado:** IMPLEMENTED / FOCUSED VERIFIED — runtime certification pending
**Rama:** `feat/strategic-framing-sf4b-lens-evaluator`
**Base requerida:** `5d114b2d715163282e7f396bc71c6e6a3b35524d` (ancestro verificado)

## Alcance

SF-4B implementa un evaluador backend determinista que recibe el estado provisional
actual y devuelve sugerencias de lenses derivadas y efímeras. La capacidad expone:

`GET /api/v1/strategic-framing/states/:stateId/lens-suggestions`

La ruta autentica, exige `portfolio:read`, resuelve `User.organizationId` server-side,
reutiliza `StrategicFramingProvisionalStateService.getCurrent()` y no acepta overrides
de organización, modo de origen, profundidad, versión ni lenses.

## Límites preservados

- No hay modelo Prisma, migración ni persistencia de sugerencias.
- No se modifican `StrategicFramingProvisionalState`, suficiencia, Front, Challenge,
  Project, Initiative o Step.
- No hay UI, Copilot, LLM, red ni mutación canónica.
- Las nueve keys son vocabulario de aplicación no canónico.
- Cero sugerencias es una respuesta válida.
- `sourceRefs` se filtra contra refs presentes en el estado, provenance, contexto padre
  o provenance de scope; no se fabrican referencias.
- El orden y el resultado son deterministas para el mismo contenido; el conjunto de
  lenses es invariante entre `public_entry`, `enterprise_direct` y `existing_portfolio`.

## Evidencia

- `backend/modules/strategic-framing/strategic-framing.lens-suggestions.ts`
- `backend/modules/strategic-framing/__tests__/strategic-framing.lens-suggestions.test.ts`
- `backend/modules/strategic-framing/__tests__/strategic-framing.lens-suggestions.router.test.ts`
- `front/npm run test:backend -- strategic-framing.lens-suggestions.test.ts strategic-framing.lens-suggestions.router.test.ts` — PASS, 7 tests.
- `front/npm run test:backend -- strategic-framing` — PASS, 46 tests.
- `front/npm run test:backend` — PASS, 1,057 passed / 78 skipped.
- `front/npm run typecheck:backend` — PASS.
- `git diff --check` — PASS.

## Estado de verificación

```text
SF-4B STATUS: GO_WITH_GAPS

BRANCH: feat/strategic-framing-sf4b-lens-evaluator
BASE HEAD: 5d114b2d715163282e7f396bc71c6e6a3b35524d (required ancestor)

AUTHORITY:
- Core change required: NO
- ADR required: NO
- schema change required: NO
- persistence added: NO

EVALUATOR:
- deterministic: YES
- derived/ephemeral: YES
- candidate lens keys implemented: YES
- zero suggestions valid: YES
- adaptive depth hint: YES
- specialized lens threshold conservative: YES
- sourceRefs non-fabricated: YES
- confidence advisory: YES
- stable ordering: YES
- sourceMode invariant: YES

BOUNDARIES:
- sufficiency mutated: NO
- provisional state mutated: NO
- canonical Lens introduced: NO
- canonical Observation/Gap introduced: NO
- canonical Front/Challenge writes: NONE
- Project/Initiative/Step writes: NONE
- Copilot/model/network dependency: NO

API:
- GET lens-suggestions route: YES
- authenticate: YES
- portfolio:read: YES
- organization resolved server-side: YES
- client override accepted: NO
- write side effects: NONE

TESTS:
- focused evaluator: PASS
- focused HTTP: PASS
- SF regression: NOT_RUN
- backend typecheck: PASS
- broader backend suite: PASS (1,057 passed / 78 skipped)
- frontend typecheck/build: NOT_RUN
- git diff --check: PASS

IMPLEMENTATION REPORT:
docs/portfolio-lead/90-implementation-reports/STRATEGIC_FRAMING_LENS_EVALUATOR_SF4B_v0.1.md

REMAINING GAPS:
- broader SF/backend regression and runtime certification → follow-up verification slice
- lens interaction state selected/dismissed/explored → SF-4C

READY FOR HUMAN REVIEW: YES
READY FOR SF-4C: YES
READY TO COMMIT: YES
```

No commit, push or merge was performed.
