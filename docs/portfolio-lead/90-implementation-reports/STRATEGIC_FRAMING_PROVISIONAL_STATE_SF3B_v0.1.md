# Strategic Framing SF-3B — Provisional State

**Estado:** IMPLEMENTED_UNVERIFIED / GO_WITH_GAPS  
**Fecha:** 2026-09-24

## Alcance

SF-3B implementa el estado provisional durable propiedad de Strategic Framing. El slice inicializa desde el read snapshot de SF-2, reutiliza por contexto lógico, permite corrección humana tipada y conserva historial/versionado. No implementa rutas, UI, Copilot ni orquestación SF-3D.

## Autoridad y frontera

- Core v0.2 no cambia.
- SF-3A decide que `ProposedMutation` de Bootstrap no es reutilizable como estado SF y que el estado provisional debe ser durable y propio.
- No se crean ni actualizan `StrategicFront`, `Challenge`, `Project`, `InitiativePortfolioMeta`, `Step`, `Invitation` ni asignaciones de ownership.
- `challenge_like` permanece provisional; no fuerza un Front canónico.
- `ownerCandidate` del snapshot SF-2 solo permanece en la lectura fuente; nunca se convierte en ownership.

## Implementación

- `StrategicFramingProvisionalState`: agregado activo SF-owned con scope de usuario/organización, source mode, clave lógica, valores editables, parent context, sufficiency, provenance y versión.
- `StrategicFramingProvisionalStateHistory`: snapshot previo por versión, actor, timestamp, acción y razón.
- `StrategicFramingProvisionalStateService`: inicialización/reutilización, lectura autorizada y corrección humana explícita.
- Adapter de SF-2: conserva movimiento, por qué importa, señal/proxy, decisión, alcance, parent context, source refs/provenance y suficiencia. No fabrica outcome, contribución ni atribución.

## Re-entry / idempotencia

La unicidad persistida es `(userId, logicalContextKey)`, pero el servicio
deriva `logicalContextKey` con un namespace determinista que incorpora
`sourceMode`, `organizationId` (incluido `null`) y la clave cruda. Así, el
boundary no depende de que los callers elijan claves globalmente únicas.

- Public Entry: clave estable del continuation/contexto público.
- Enterprise Direct: clave estable del caso directo; no requiere continuation.
- Existing Portfolio: clave estable de la evidencia/contexto existente; las referencias canónicas se conservan como evidencia y no se mutan.

El modo `bootstrap` del read model SF-2 se adapta explícitamente a `public_entry` cuando hay continuation y a `enterprise_direct` cuando no la hay. Una carrera de creación que recibe `P2002` relee y devuelve el estado ganador.

## Autorización

Se reutilizan permisos existentes: `portfolio:read` para inicializar/leer y `portfolio:write` para corrección. Cada acceso verifica actor y organización; los accesos cross-user/cross-org fallan cerrado. El actor de toda corrección material queda en historial y provenance.

## Tests

`backend/modules/strategic-framing/__tests__/strategic-framing.provisional-state.service.test.ts` cubre:

- creación y re-entry;
- Public Entry, Enterprise Direct y Existing Portfolio;
- los cuatro niveles de scope y parent unresolved/provisional/known;
- corrección, incremento de versión e historial;
- provenance y suficiencia;
- owner candidate sin ownership;
- ausencia de escrituras canónicas;
- denegación cross-user/cross-org y permisos insuficientes.

El test existente de SF-2 cubre además la ausencia de business outcome/contribution fabricados y el comportamiento `challenge_like` sin Challenge canónico.

## Hardening y validación ejecutada

- Corrección humana: transacción única, `expectedVersion`, actualización
  condicionada y rechazo explícito `SF_PROVISIONAL_STATE_STALE`; el rollback no
  deja historia huérfana.
- Focused SF tests: PASS (14 tests).
- Backend suite: PASS (1.010 passed, 78 skipped).
- Prisma generate: PASS.
- Prisma validate: PASS (con `DATABASE_URL` de validación local; sin conexión ni migración aplicada).
- Backend typecheck: PASS.
- `git diff --check`: PASS.

## Gaps para SF-3C / SF-3D

- No existe todavía route/product API; el servicio es application/domain backend interno.
- No hay orquestación multi-entry completa ni worker schedulable.
- No hay Candidate Challenge, Copilot, UI ni promoción canónica.
- La migración debe aplicarse en el entorno de base de datos antes de integración.
- La autorización depende de los permisos de plataforma existentes; no se inventa autoridad nueva.

## ADR

No requerido por SF-3A ni por la implementación: no cambia Core, cardinalidades canónicas, autoridad humana ni semántica de Steps.
