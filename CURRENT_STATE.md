# Current State

Estado del repositorio al aplicar el file plan de continuidad Portfolio Entry v0.3.

## Naturaleza

Este repositorio debe leerse actualmente como repositorio mixto de Starteria.

Conserva contratos, auditorias, trazabilidad, reportes de estado y referencias de gobernanza. Tambien contiene implementacion frontend/backend, tests y E2E que han sido modificados por commits y slices recientes.

No debe leerse como runtime productivo certificado por defecto. La presencia de carpetas como `front/`, `backend/`, `tests`, `prisma`, `ai-service` o equivalentes no autoriza por si sola a incorporar ni evolucionar producto.

La autoridad actual permite cambios frontend de producto solo cuando exista decision explicita y documentada de slice, con alcance acotado y sin modificar Core, AI, permisos, esquemas, rutas ni semantica de producto salvo autorizacion especifica. DS-05 y DS-06 son evidencia documental de pilotos frontend autorizados por slice.

## Starteria V2 — baseline de reconciliación

Starteria se encuentra actualmente en proceso explicito de consolidacion hacia V2.

El indice operativo de esta migracion es:

`STARTERIA_V2_MANIFEST.md`

El Manifest separa para cada slice:

- `logic_status`;
- `implementation_status`;
- `visual_status`;
- `evidence_status`.

La presencia de codigo legacy no implica que dicho comportamiento siga siendo autoridad de producto.

### Politica V2-only

A partir de esta consolidacion:

```text
V1 ACTIVE PRODUCT
→ en retirada progresiva

V1 AUTHORITY
→ no permitida para comportamiento nuevo

V1 INFRASTRUCTURE
→ reutilizable unicamente cuando sea compatible con V2

V1 LEGACY
→ debe clasificarse, aislarse y retirarse por slice
```

Los documentos obligatorios para cualquier migracion son:

- `STARTERIA_V2_MANIFEST.md`;
- `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md`;
- `docs/governance/STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md`.

No debe declararse un slice como `V2_MIGRATED` solo porque haya cambiado visualmente.

La migracion requiere:

```text
V2 authority
+
V2 active behavior
+
V2 tests
+
no undocumented V1 consumers
```

### Boundary visual actual

La migracion visual V2 alcanzo conceptualmente:

```text
Portfolio Entry
→ Handoff
→ Portfolio Home
→ Strategic Front / Challenge
→ Activation / Invitation
```

La superficie:

```text
Initiative Overview
→ Step 0
→ Step 1
→ Step 2
→ Step 3
→ Step 4
```

NO debe considerarse automaticamente V2.

Su logica existente debe auditarse antes de cualquier rediseno o limpieza.

## E2E

El E2E de producto fue originalmente validado en un checkout productivo/autorizado. Este repositorio ahora conserva harness, estado documental y una superficie ejecutable de tests/E2E bajo `front/`.

No debe presentarse como runtime productivo certificado. Los resultados E2E en este checkout son evidencia de validacion de slice, no certificacion global de producto.

## Autoridad vigente

- Authority map: `docs/STARTERIA_AUTHORITY.md`.
- Core Contract: `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`.
  - Estado factual real: `v0.3 candidata`, `Candidata de gobernanza / Requiere re-test`.
  - Su presencia aqui no lo convierte en aprobado.
- Portfolio Entry Experience Contract aprobado:
  - `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
  - Este es el unico `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` que debe usarse como autoridad activa para Pantalla 1.
  - SHA-256 observado: `D34FDEA9A5E5BE843105DDC2A3CED4970144AE2596AC8BF5AB897A95B2A54E8A`.
- Portfolio Post-Entry Continuation:
  - El contrato presente es `doc/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md`.
  - Estado del contrato: `PROPOSED FOR REVIEW`; no es autoridad aprobada ni autoriza runtime productivo.
  - La continuación Portfolio es un `APPROVED_TARGET` de ADR-003 todavía `PROPOSED`, no una afirmación de que el flujo productivo canónico ya exista.
  - La implementación observada en este checkout es mixta: existe una superficie candidata de continuación Portfolio y permanecen rutas legacy de pilot/public-draft que pueden crear Project/Steps.
  - La slice `AUTHENTICATED_PORTFOLIO_CONTEXT_ESTABLISHMENT` está implementada sobre autoridad scoped: resuelve y selecciona contextos existentes sin crear autoridad ni entidades de negocio. Ver `docs/portfolio-entry/implementation/PORTFOLIO_ENTRY_AUTHENTICATED_PORTFOLIO_CONTEXT_ESTABLISHMENT_v0.1.md`.

## ADR-003 — estado reconciliado

`doc/product-adr/ADR-003-public-entry-registration-continuation-boundary.md` mantiene estado `PROPOSED`.

La lectura activa para esta frontera es:

```text
IMPLEMENTED_TODAY:
  - Public Entry, auth y rutas legacy Project/Steps coexisten en el checkout.
  - Existe una rama candidata de continuación Portfolio y tests de sus límites.

PROPOSED_TARGET (ADR-003; pendiente de aceptación e integración):
  Public Entry → handoff provisional → registration/login →
  restaurar contexto → Portfolio context por defecto.

LEGACY_COMPATIBILITY:
  - /auth/continue/:draftId → pilot lead.
  - /public/continuar → claim de piloto.
  - /continuar-piloto → Project + Steps.
  - createProjectFromPublicDraft → Project / Step 0.

DEPRECATION_TARGET:
  - Cualquier ruta pública por defecto que convierta directamente a Project/Steps.
  - createProjectFromPublicDraft dentro de la frontera Public Entry.

NOT_YET_IMPLEMENTED:
  - La integración canónica ADR-003 de registro → handoff Portfolio.
  - El contrato productivo Public Entry → Product Handoff.
```

Invariantes de esta frontera: `AUTHENTICATION != BUSINESS CANONICALIZATION`,
`PUBLIC_ENTRY_CONTINUATION != PROJECT_CREATION` y
`PUBLIC_ENTRY_CONTINUATION != STEPS_ENTRY`.

## ADRs

- ADRs de harness/documentacion: `docs/adr/`.
- ADRs de producto: `docs/product-adr/`.
- La serie de producto se mantiene separada de `docs/adr/ADR-001...007`.

### AI Harness / INTERPRET — ADR-031

El responsable aprobó ADR-031 el 2026-09-20 y autorizó la slice
`AI_HARNESS_INTERPRET_ADR031`, registrada en `STARTERIA_V2_MANIFEST.md`.
El código de `ai-service` usa Jev por defecto en INTERPRET de `mode=harness` y
`POST /ai/diagnose`; GROUND sigue en OpenRouter. `HARNESS_INTERPRET_BACKEND=llm`
restaura la ruta anterior. El corte provisional sigue en 0.50 por pregunta.
La implementación está verificada con pruebas herméticas; este checkout no acredita
despliegue externo ni riesgo productivo. En este entorno no hay `JEV_API_KEY` configurada,
por lo que una llamada real al path Jev falla cerrada hasta instalarla en el entorno
de ejecución. CD exige ahora el secreto `JEV_API_KEY`; la lista de secretos de
`DarkCodePE/harness-starteria` no lo contiene todavía y el despliegue queda
bloqueado hasta configurarlo. Ver `docs/analisis-jev/13-adr-031-activation.md`.

## Legacy e historico

Los documentos legacy o historicos deben abrir con banner `DEPRECATED`, `SUPERSEDED` o `HISTORICAL` y enlazar a este archivo y al reemplazo vigente si existe.

Si un documento no tiene banner todavia, no debe asumirse vigente por defecto. Verificar su estado declarado, fecha, ruta y reemplazo antes de usarlo como autoridad.

## Guardrail publico

Antes de cada commit:

- revisar secretos y datos sensibles;
- excluir runtime productivo nuevo;
- excluir dumps, credenciales, tokens, archivos `.env` reales y artefactos con datos privados;
- confirmar que README y AGENTS no prometen ejecucion productiva desde este repositorio.
