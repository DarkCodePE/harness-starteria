# AGENTS.md

Entrada neutral para Codex y otros agentes que trabajen sobre este repositorio.

## Naturaleza del repositorio

Este repositorio debe leerse actualmente como un repositorio mixto de Starteria:

- conserva harness publico, contratos, auditorias, estado documental y trazabilidad;
- contiene tambien una superficie de implementacion frontend/backend con tests y E2E;
- la evolucion productiva no queda autorizada por mera presencia de codigo, sino por decision explicita, alcance documentado y lectura de autoridad.

Las slices DS-05 y DS-06 documentan una decision explicita de modificar superficies frontend de producto bajo `front/` sin cambiar Core, backend, esquemas, rutas ni semantica de producto.

No tratar este repositorio como runtime productivo certificado por defecto. Tratarlo como checkout mixto con autoridad documental y con implementacion frontend autorizable por slice cuando exista decision explicita.

## Regla de incorporacion productiva controlada

No incorporar, restaurar, copiar ni crear codigo productivo en este repositorio sin una decision explicita y documentada.

Prohibido por defecto, salvo autorizacion explicita de la slice:

- backend productivo;
- frontend productivo;
- Prisma o migraciones productivas;
- runtime de IA productiva;
- tests productivos o E2E productivos;
- secretos, datos reales, dumps, artefactos privados o credenciales.

Los cambios permitidos por defecto son documentales: contratos, harness, auditorias, indices, estado actual, trazabilidad, ADRs documentales y notas de seguridad.

Los cambios frontend de producto estan permitidos solo cuando el pedido declare una slice productiva concreta, lea la autoridad aplicable, preserve Core/AI/permisos/semantica de producto, y deje reporte de implementacion. Los cambios backend, Prisma, IA productiva o Core siguen requiriendo autoridad explicita propia.

## Jerarquia de autoridad

Cuando haya conflicto entre documentos, aplicar este orden y conservar el estado declarado de cada documento:

1. `docs/STARTERIA_AUTHORITY.md`
2. Core Contract, en su estado factual real: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
3. ADRs de producto aprobados en `docs/product-adr/`
4. Experience Logic Contracts aprobados
5. Agent Contracts
6. Skill Contracts
7. Tech Specs
8. PRDs
9. Prototipos, mockups, prompts experimentales y reportes historicos
10. Implementacion historica presente en el arbol

La presencia de un contrato en este repositorio no lo convierte en aprobado. Mantener siempre su estado: candidate, proposed, approved, deprecated, superseded o historical.

## Contrato activo de Portfolio Entry

Para Portfolio Entry, usar una sola autoridad:

`docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`

No crear otro `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` paralelo si duplica ese contrato. Si el checkout productivo contiene una version aprobada distinta, registrar la diferencia en `CURRENT_STATE.md` o en una auditoria antes de copiar o reemplazar contenido.

## Separacion de ADRs

- `docs/adr/` conserva ADRs del harness/documentacion.
- `docs/product-adr/` conserva el indice y la serie de ADRs de producto.
- No mezclar ADRs de producto con `docs/adr/ADR-001...007` del harness.

## Documentos legacy

Todo documento historico o legacy debe abrir con un banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL`, enlazando a:

- `CURRENT_STATE.md`
- el reemplazo vigente, si existe.

Si el reemplazo vigente no existe, indicarlo de forma explicita en el banner.

## Antes de modificar

Todo cambio de Starteria debe comenzar leyendo, en este orden:

1. `CURRENT_STATE.md`.
2. `STARTERIA_V2_MANIFEST.md`.
3. `docs/STARTERIA_AUTHORITY.md`.
4. `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`.
5. ADRs de producto aprobados relevantes.
6. Experience Contract del slice afectado.
7. Agent / Skill Contracts aplicables.
8. Tech Spec aplicable, si existe.
9. `docs/design-system/STARTERIA_DESIGN_SYSTEM_V2_RESTRUCTURE_BASELINE.md` si el cambio afecta frontend o experiencia visual.
10. `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md`.
11. `docs/governance/STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`.
12. Implementación actual y tests existentes.

### Regla V2-only

Todo desarrollo nuevo debe corresponder a un slice registrado en `STARTERIA_V2_MANIFEST.md`.

Un artefacto marcado como:

- `HISTORICAL`
- `SUPERSEDED`
- `DEPRECATED`
- `V1_LEGACY`

no puede utilizarse para definir comportamiento nuevo.

Puede consultarse únicamente para:

- dependencias de migración;
- compatibilidad;
- infraestructura reusable;
- comprensión de regresiones;
- trazabilidad histórica.

La infraestructura V1 puede reutilizarse cuando corresponda.

La semántica V1 no puede recuperar autoridad por el hecho de estar implementada.

Antes de reutilizar código legacy debe clasificarse:

```text
SEMANTIC_OWNER:
V2
LEGACY_COMPAT
UNKNOWN

MAY_DEFINE_NEW_BEHAVIOR:
YES
NO

Es decir, debe quedar:

```md
```text
SEMANTIC_OWNER:
V2
LEGACY_COMPAT
UNKNOWN

MAY_DEFINE_NEW_BEHAVIOR:
YES
NO
## Protocolo de conflicto

Si una fuente contradice una autoridad superior, reportar:

```text
CONFLICT
Contract:
Requirement:
Current document/code:
Observed mismatch:
Risk:
Recommended treatment:
KEEP / UPDATE / ADD / DEPRECATE
Requires ADR: yes/no
```

No resolver conflictos de producto de forma silenciosa.
## Starteria V2 — baseline de reconciliación

Starteria se encuentra actualmente en proceso explícito de consolidación hacia V2.

El índice operativo de esta migración es:

`STARTERIA_V2_MANIFEST.md`

El Manifest separa para cada slice:

- `logic_status`;
- `implementation_status`;
- `visual_status`;
- `evidence_status`.

La presencia de código legacy no implica que dicho comportamiento siga siendo autoridad de producto.

### Política V2-only

A partir de esta consolidación:

```text
V1 ACTIVE PRODUCT
→ en retirada progresiva

V1 AUTHORITY
→ no permitida para comportamiento nuevo

V1 INFRASTRUCTURE
→ reutilizable únicamente cuando sea compatible con V2

V1 LEGACY
→ debe clasificarse, aislarse y retirarse por slice