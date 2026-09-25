# Strategic Framing Lens Workspace — SF-4C v0.1

**Estado:** IMPLEMENTED / FOCUSED VERIFIED — runtime certification pending
**Rama:** `feat/strategic-framing-sf4c-lens-workspace`
**Base:** `982e4f1937a62240e13ed833150a0bc94f409bd0` (SF-4B)

## Alcance implementado

SF-4C integra las sugerencias derivadas de SF-4B en el workspace editable de SF-3C.

- Añade soporte frontend read-only para `GET /api/v1/strategic-framing/states/:stateId/lens-suggestions`.
- Presenta una sección advisory `Perspectivas que podrían ayudarte` con etiqueta, razón, pregunta material, relevancia sugerida y referencias de contexto.
- Mantiene las interacciones `Explorar`, `Ocultar por ahora` y `Restaurar perspectivas ocultas` en estado local de sesión.
- Conserva las sugerencias mientras el draft está dirty y muestra que se actualizarán después de guardar.
- Refetch y reset de interacción local al cambiar la versión guardada.
- Cero sugerencias y fallo de lectura son estados no bloqueantes; el retry queda aislado en la sección advisory.

## Límites preservados

```text
suggestions persisted: NO
explore persisted: NO
hide persisted: NO
schema change: NO
Prisma/migration: NO
backend writes added: NO
canonical Lens/Observation/Gap: NO
Challenge creation/promotion: NO
Copilot dependency: NO
sufficiency changed by lens interaction: NO
```

El draft estructurado continúa siendo el system of record. La interacción con lentes no habilita `Guardar cambios`, no modifica suficiencia y no crea observaciones, gaps, Challenges ni entidades canónicas.

## Evidencia

- Frontend focalizado: PASS — 15 tests.
- Regresión SF-3C workspace: PASS — 13 tests.
- Frontend typecheck: PASS.
- Frontend build: PASS; advertencias existentes de tamaño de bundle/import dinámico.
- SF-4B backend regression: PASS — 7 tests.
- `git diff --check`: PASS.

La certificación de runtime externo y E2E amplio permanecen fuera de este slice.
