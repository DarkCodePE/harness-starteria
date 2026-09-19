# STARTERIA_DESIGN_SYSTEM_REPO_AUTHORITY_RECONCILIATION

**Estado:** Reconciliacion documental aplicada
**Fecha:** 2026-09-16
**Alcance:** autoridad de repositorio antes de DS-07
**Tipo:** documentacion / gobernanza solamente

## 1. Lectura realizada

Se leyo:

- `AGENTS.md`
- `CURRENT_STATE.md`
- `docs/STARTERIA_AUTHORITY.md`
- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS01_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS02_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS03_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS04_IMPLEMENTATION_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS05_PORTFOLIO_ENTRY_HANDOFF_REPORT.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_DS06_PORTFOLIO_HOME_REPORT.md`

Tambien se inspecciono:

- estructura del repositorio;
- `front/package.json`;
- historial git reciente relevante a `front/`, `CURRENT_STATE.md`, `AGENTS.md` y `docs/STARTERIA_AUTHORITY.md`;
- `README.md` como punto publico de entrada.

## 2. Rol factual actual del repositorio

El rol factual actual es:

```text
mixed repository
```

Razon:

- conserva contratos, auditorias, harness y estado documental;
- contiene una superficie ejecutable bajo `front/` con Vite, React, TypeScript, Prisma, Playwright, Vitest y scripts de build/test;
- contiene backend y modulos de producto;
- el commit `05a9970 docs: isolate starteria harness authority` establecio una postura de harness/documentacion;
- commits posteriores, en particular `d794345 fix: wire portfolio entry product journey`, incorporaron cambios extensos de producto en frontend, backend, Prisma y E2E;
- DS-01 a DS-04 implementaron foundation/primitives/patterns bajo `front/`;
- DS-05 y DS-06 documentan pilotos intencionales sobre superficies frontend de producto.

Este repositorio no queda certificado como runtime productivo global. La evidencia si muestra que la declaracion absoluta "solo harness/documentacion, no evolucionar frontend producto" estaba stale para la practica actual de DS-05/DS-06.

## 3. Conflicto exacto

```text
CONFLICT
Contract:
CURRENT_STATE.md / AGENTS.md / docs/STARTERIA_AUTHORITY.md / README.md
Requirement:
El repositorio se describe como harness/documentacion publico y no runtime productivo; la presencia de front/backend/tests/prisma no autoriza evolucion productiva.
Current document/code:
El arbol contiene implementacion frontend/backend, tests y E2E. El historial reciente incluye commits de producto despues de la aislacion documental. DS-05 y DS-06 modificaron intencionalmente superficies frontend de producto con reportes de implementacion.
Observed mismatch:
La documentacion seguia presentando una prohibicion absoluta que ya no reflejaba el uso factual de este checkout para pilotos frontend acotados.
Risk:
DS-07 y futuras slices podrian quedar bloqueadas por documentos stale o, en sentido contrario, interpretar erroneamente que todo cambio backend/Core/producto queda autorizado.
Recommended treatment:
UPDATE la autoridad documental minima para declarar el rol mixto: documentacion/harness + implementacion frontend autorizable por slice, manteniendo prohibicion por defecto para cambios no autorizados y para Core/backend/AI/esquemas/permisos.
Requires ADR:
No para esta reconciliacion documental. Si se quiere convertir este checkout en runtime productivo certificado o autorizar cambios backend/Core de forma ordinaria, si requiere ADR o decision equivalente.
```

## 4. Correcciones aplicadas

Se actualizaron solo documentos de gobernanza/entrada:

- `AGENTS.md`
- `CURRENT_STATE.md`
- `docs/STARTERIA_AUTHORITY.md`
- `README.md`
- `docs/design-system/STARTERIA_DESIGN_SYSTEM_REPO_AUTHORITY_RECONCILIATION.md`

Correccion conceptual:

- de "repositorio solo harness/documentacion; front/backend historicos no activos";
- a "repositorio mixto; documentacion/harness + implementacion existente; cambios frontend de producto permitidos solo con decision explicita de slice y reporte".

## 5. Limites preservados

No se modifico:

- frontend;
- backend;
- rutas;
- esquemas;
- Design System code;
- Core logic;
- AI logic;
- permisos;
- semantica de producto.

La reconciliacion no cambia los invariantes del Core Contract.

## 6. Estado de permiso para migracion frontend

La migracion frontend de producto queda explicitamente permitida solo bajo estas condiciones:

1. la slice la autoriza de forma expresa;
2. se lee la autoridad aplicable;
3. se conserva Core/AI/permisos/esquemas/rutas/semantica salvo autorizacion especifica;
4. se documentan decisiones, conflictos, pruebas y alcance;
5. no se interpreta la implementacion existente como autoridad superior a contratos aprobados.

Esto cubre DS-07 si DS-07 mantiene alcance frontend visual/interaccional y reporta conflictos antes de tocar producto no autorizado.

## 7. ADR

No se requiere ADR para esta correccion documental porque no cambia semantica de producto ni un invariante Core.

Se recomienda ADR o decision equivalente si se quiere:

- certificar este checkout como runtime productivo;
- normalizar cambios backend/Core como actividad ordinaria;
- cambiar permisos, IA, esquemas, rutas o contratos de producto;
- modificar la jerarquia de autoridad.

## 8. Recomendacion para DS-07

DS-07 puede proceder con seguridad documental si se mantiene como slice frontend/product-surface explicitamente autorizada y acotada.

DS-07 no debe asumir permiso para backend, Core, AI, Prisma, rutas, permisos ni cambios de semantica de producto sin una autorizacion separada.
