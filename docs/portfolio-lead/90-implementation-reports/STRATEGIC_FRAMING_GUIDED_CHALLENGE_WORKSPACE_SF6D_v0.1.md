# SF-6D — Guided Challenge Structuring & Promotion Workspace v0.1

**Slice:** SF-6D / KAN-31
**Estado:** GO para SF-6D; validación E2E completada.

## Interaction boundary

La página existente `StrategicFramingWorkspacePage` continúa siendo el workspace único. La implementación expone la priorización y estructuración como revisiones humanas versionadas; ninguna recomendación se convierte automáticamente en decisión y ningún ChallengeCandidate se convierte en entidad canónica antes de promoción.

## API adapters

- `POST /api/v1/strategic-framing/states/:stateId/prioritization-review`
- `POST /api/v1/strategic-framing/states/:stateId/challenge-structure-review`
- `GET /api/v1/strategic-framing/states/:stateId/promotions`

Los dos POST validan payload estricto, toman actor y organización del contexto autenticado y delegan en `reviewPrioritization` / `reviewChallengeStructure`. `expectedVersion` se conserva como control optimista. No se duplicó lógica de dominio.

## Promotion read projection

`StrategicFramingPromotionReadService` consulta únicamente la proyección segura de promociones después de que el servicio de estado haya validado usuario, organización y `portfolio:read`. La lectura no llama al POST de promoción ni muta el estado provisional. Incluye solo `challengeTitle` como dato canónico mínimo para reentrada.

La promoción usa el endpoint SF-6C existente y mantiene sus garantías de autoridad Portfolio Lead, Front canónico dentro de scope, idempotencia y efectos transaccionales.

## Frontend architecture

Se extendieron tipos y servicios existentes. El workspace muestra:

- candidatos gap/opportunity;
- recomendación de Startería separada de decisión humana;
- `address_now`, `observe` y `discard`;
- capacidad no definida cuando `focusSlots` es `null`;
- estructura provisional editable solo desde candidatos `address_now`;
- confirmación explícita de Front, título, statement y tipo antes de promover.
- selector de Front canónico mediante `listStrategicFronts()` y nombres humanos;
- bloqueo localizado si no hay Front o falla la lectura;
- opción humana `Mantener provisional`, sin write ni candidato nuevo;
- resultado de promoción con título, Draft, Front, origen, cero iniciativas e IDs.

La UI usa la respuesta del servidor como estado operativo. No se persiste `promoted` dentro del estado provisional.

## Stale / conflict / re-entry

Las revisiones envían `expectedVersion`; un estado stale se recarga explícitamente. La reentrada carga estado, recomendaciones y promociones. Las promociones existentes se presentan como `Promovido` mediante la proyección segura. Los conflictos de promoción, Front fuera de scope, candidato inexistente o no elegible siguen siendo errores de servidor sin retry automático.

## Tests and final validation

Pasaron:

- typecheck backend;
- typecheck frontend;
- tests backend Strategic Framing focalizados: 11 archivos / 104 tests (98 passed, 6 skipped en integración sin `E2E_DATABASE_URL`);
- tests frontend SF-6D focalizados: 1 archivo / 2 tests;
- `git diff --check`.

Los servicios de dominio SF-5B/SF-5C/SF-6C mantienen sus pruebas existentes. La spec browser específica es `front/e2e/strategic-framing-sf6d-guided-challenge.spec.ts` e incluye happy path durable/idempotente, bloqueo sin selección de Front y stale save con recarga explícita.

### SF-6D E2E rerun final

- Command: `npm run test:e2e -- --config=playwright.sf6d-local.config.ts e2e/strategic-framing-sf6d-guided-challenge.spec.ts`.
- Result: **3 passed, 0 failed**.
- Browser: Microsoft Edge via Playwright `channel: 'msedge'`, headless.
- Isolation: frontend `127.0.0.1:5177`, backend `127.0.0.1:4101`, base URL `http://127.0.0.1:5177`.
- Database: disposable PostgreSQL `starteria_e2e` at `localhost:5433`; Docker skipped with `E2E_SKIP_DOCKER=true`.
- Covered: guided promotion with one Challenge/Promotion, no-Front negative path with no POST/no row/no success, and stale-save explicit reload.

Defects found and resolved during the rerun:

1. The E2E locator was ambiguous; it now uses the exact accessible label `Frente estratégico`.
2. The no-Front assertion used non-canonical copy; it now checks `Strategic Front canónico`.
3. The fixture lacked the scoped `portfolio:write` grant and array-shaped provenance/source references; the fixture now provisions the required contract data.
4. The product UI hid the successful promotion result after the POST because the reload/promotion state replaced the local success state; the minimal frontend fix preserves the `Challenge creado` result until re-entry/reload.

The stable detail route remains `/retos/:challengeId`. The temporary Playwright config was removed after the run and is not present in git status.

## No-side-effects

No se crean Strategic Fronts, Invitations, Projects, Initiatives o Steps. No hay activación, publicación, owner/sponsor assignment, Core change, Prisma change, migración ni integración SF-7.

## V2_CHANGE_GUARDRAIL_CHECK

```text
Slice: SF-6D / KAN-31
Authority: SF Experience Contract + SF-6A + SF-6B + SF-6C; subordinado a Core v0.2
Manifest status: Strategic Framing implementation lineage present; slice remains partial until full validation
Current route: StrategicFramingWorkspacePage and /api/v1/strategic-framing
Legacy dependencies: existing SF-3C workspace and SF-6C promotion service
Semantic owner: V2
V1 assumptions detected: none used to define new behavior
Adapter required: yes, HTTP adapters and safe promotion read projection
Tests protecting current behavior: SF-3C frontend/router tests and SF-5B/SF-5C/SF-6C service tests
Tests required for V2: review endpoints, safe projection, re-entry, stale/conflict, explicit promotion confirmation
Authority conflict: none observed
Proceed: YES
```

SF-7 is not implemented.
