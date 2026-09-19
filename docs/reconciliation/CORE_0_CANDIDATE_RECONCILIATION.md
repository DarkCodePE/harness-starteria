# CORE-0 — Reconciliación del Core candidate v0.3

**Fecha:** 2026-09-19  
**Estado:** RECONCILIACIÓN COMPLETADA / PROMOCIÓN BLOQUEADA  
**Baseline declarado:** `7b82f14cfa4bbfe886b53de55dba932ff5ef79b0`  
**Repositorio:** `DarkCodePE/harness-starteria`  
**Branch:** `docs/portfolio-home-v2-authority`

## 1. Fuentes y regla de autoridad

| Fuente | Estado usado en CORE-0 | SHA-256 observado |
|---|---|---|
| `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | Core factual vigente del checkout; `v0.2`, `Base fundacional revisada / Por validar` | `29A7E3AB544E83684A65D1324E7917EC6838724CA16DBC16411500EA07AD6EB2` |
| `C:\Users\User\Downloads\STARTERIA_CORE_LOGIC_CONTRACT.md` | Fuente candidate externa; no se incorpora ni se trata como autoridad | `3D12553B5FD956DC05A7D3E2C80F8AA44E7219F4824D1B181F41ECBFB4132A2B` |

`docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` no existe en este checkout. Por tanto, el candidate externo no puede sustituir la autoridad factual del v0.2 durante esta reconciliación.

Los cambios no commiteados existentes fueron inspeccionados antes de la operación y se preservan. Este reporte es documental y no modifica su contenido.

## 2. Resultado ejecutivo

El candidate es una extensión v0.3 sobre el v0.2, no un contrato independiente. Mantiene los 13 invariantes `INV-01` a `INV-13` y no cambia la definición funcional de Adaptive Core / Step 0–4.

Sin embargo, introduce cambios materiales de gobernanza y ciclo de vida Core. No son una mera aclaración editorial: sustituyen el modelo MVP de `Sponsor / Responsable del Reto`, introducen `Business Decision Authority`, separan accountability de Portfolio Lead y ownership de Initiative Owner, y hacen explícitas condiciones de activación, cobertura y cierre.

**Decisión CORE-0:**

```text
KEEP     v0.2 como Core factual vigente del checkout
KEEP     v0.3 candidate como fuente de reconciliación externa
BLOCK    promoción, copia canónica o reemplazo del v0.2
REQUIRE  ADR / decisión explícita de producto + re-test del candidate
PRESERVE cambios PH-0 no commiteados
```

## 3. Comparación estructural

### Coincidencias preservadas

- `INV-01`–`INV-13` permanecen sin cambios semánticos observables.
- El contexto de organización/aplicación, provenance, evidencia `L0–L6`, versionado de cambios y no propagación ciega permanecen alineados.
- Adaptive Core y la pregunta/responsabilidad de Step 0–4 permanecen iguales.
- Las restricciones contra invención de evidencia, autoridad autónoma de IA, pérdida de historial y mutación automática de iniciativas permanecen.
- El candidate conserva su propio estado: `Candidata de gobernanza / Requiere re-test`.

### Cambios materiales introducidos por el candidate

| Área | v0.2 factual | v0.3 candidate | Tratamiento |
|---|---|---|---|
| Roles (§5) | `Sponsor / Responsable del Reto` como experiencia MVP unificada; autoridad configurable | Portfolio Leads con responsabilidad conjunta + `Autoridad de Decisión de Negocio` configurable | Requiere decisión/ADR; no promover silenciosamente |
| Accountability (§5.2) | Separación menos explícita | Portfolio Lead gobierna; Initiative Owner desarrolla y recomienda | Requiere re-test de permisos, handoff y activación |
| Cobertura (§18) | Estados descriptivos de cobertura | Reto activo requiere iniciativa; pérdida de cobertura genera alerta/decisión | Requiere definir qué significa “activo” y probar edge cases |
| Job Portfolio (§17) | Gobernar, revisar cobertura y conducir decisiones | Seguimiento continuo de estado, bloqueos, capacidad, evidencia, contribución y decisiones | Compatible como extensión, sujeto a evidencia y alcance |
| Continuidad (§26) | Buscar sponsor cuando corresponda | Buscar respaldo y autoridad de decisión | Actualización dependiente del cambio de roles |
| Activación (§37A) | No existía como sección independiente | `Activation Readiness`, estados de iniciativa y prohibición de transición silenciosa a Steps | Requiere contrato de estados, migración y tests |
| Cierre (§37A.5) | Decisión/cierre sin Brief formal obligatorio | Brief de Iniciativa dirigido a la autoridad correspondiente | Requiere definir obligatoriedad, campos y autoridad |

## 4. Conflictos CORE-0

### CONFLICT-CORE-0-01 — Modelo de roles y autoridad

```text
CONFLICT
Contract: Core v0.2, §5 y §5.1; candidate v0.3, §5.1–§5.3
Requirement: mantener autoridad organizacional explícita y no cambiar invariantes Core silenciosamente
Current document/code: v0.2 factual usa Sponsor / Responsable del Reto; candidate reemplaza esa experiencia por Portfolio Leads + Business Decision Authority
Observed mismatch: cambia el modelo de gobernanza y los actores responsables de confirmar, activar, decidir y cerrar
Risk: consumidores de Experience/Agent/Skill Contracts pueden asumir roles o permisos incompatibles
Recommended treatment: KEEP v0.2; registrar propuesta candidate en ADR y actualizar contratos subordinados solo tras aprobación
Requires ADR: yes
```

### CONFLICT-CORE-0-02 — Activación y cobertura de Reto

```text
CONFLICT
Contract: Core v0.2, §18–§19; candidate v0.3, §18 y §37A
Requirement: distinguir estados de negocio, no abrir Steps silenciosamente y preservar la semántica Core
Current document/code: v0.2 no congela Activation Readiness ni la obligación de cobertura para un Reto activo
Observed mismatch: candidate añade una máquina de estados y condiciones operativas con efectos sobre routing, permisos y cierre
Risk: implementación parcial puede bloquear iniciativas válidas o activar ciclos sin owner/capacidad
Recommended treatment: KEEP como candidate; definir estados, transiciones, excepciones y migración en ADR/contrato subordinado; re-test antes de promoción
Requires ADR: yes
```

### CONFLICT-CORE-0-03 — Evidencia de test real no adjunta

```text
CONFLICT
Contract: candidate v0.3, introducción y §42
Requirement: las decisiones Core deben conservar evidencia suficiente y ser testeables
Current document/code: candidate afirma decisiones surgidas de un test real, pero el archivo candidate no incluye el caso, resultados, expected behavior, fallos ni trazabilidad completa
Observed mismatch: la justificación existe como afirmación documental, no como evidencia verificable en este checkout
Risk: promover una regla de gobernanza basándose en una observación no auditable
Recommended treatment: KEEP candidate como hipótesis/decisión propuesta; adjuntar test harness, resultados y criterios de re-test
Requires ADR: yes para promoción; no para conservarlo como candidate externo
```

## 5. V2_CHANGE_GUARDRAIL_CHECK

```text
Slice: CORE-0 / Core governance reconciliation
Authority: doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md (factual); candidate externo no autoritativo
Manifest status: Core = CANDIDATE v0.2 factual; modern v0.3 reference missing / requires retest
Current route: reconciliación documental; sin cambio de runtime
Legacy dependencies: consumidores históricos de roles Sponsor / Challenge Owner y contratos subordinados
Semantic owner: V2 Core factual v0.2; v0.3 candidate = UNKNOWN until explicit decision
V1 assumptions detected: no se promueve semántica V1; no se autoriza migración visual ni runtime
Decision: PROCEED solo con documentación de reconciliación; NO proceder a promoción o implementación
ADR_REQUIRED: YES para cualquier cambio de invariantes, roles Core, estados de activación o autoridad de decisión
```

## 6. Trabajo requerido para CORE-1

Antes de elevar el candidate:

1. Registrar y aprobar un ADR de producto que decida el nuevo modelo de roles y autoridad.
2. Adjuntar el test real que originó v0.3 y ejecutar casos claro, ambiguo, incompleto, contradictorio, importado y de corrección.
3. Definir el contrato de `Activation Readiness`, sus transiciones, estados inválidos y compatibilidad con iniciativas existentes.
4. Definir si cobertura de Reto es un hard gate, una alerta o una condición configurable por tipo de Reto.
5. Actualizar Experience/Agent/Skill/Tech Specs afectados solo después de aprobar el Core change.
6. Reconciliar consumidores de `Sponsor / Responsable del Reto`, `Portfolio Lead`, `Initiative Owner` y `Business Decision Authority`.
7. Si se promueve, crear una copia canónica dentro del repositorio y actualizar `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md` y `docs/STARTERIA_AUTHORITY.md` en la misma decisión.

Hasta completar esos pasos, el candidate puede servir como referencia de análisis, pero no puede definir comportamiento nuevo.

