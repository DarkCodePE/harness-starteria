# Starteria — Core Logic Contract Authority Gap Audit v0.1

**Fecha de auditoría:** 2026-09-25  
**Repositorio auditado:** `DarkCodePE/harness-starteria`  
**Alcance:** auditoría documental únicamente; no se modificó código productivo, Dashboardstarteria ni ningún contrato existente.

## Resultado ejecutivo

```text
AUTHORITY_GAP_REQUIRES_SOURCE
```

La ruta canónica `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` no existe en este checkout. El repositorio la referencia como autoridad superior y como dependencia de contratos, harnesses, auditorías y documentación de Portfolio, pero no contiene el contrato canónico en esa ruta.

El archivo histórico `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` es un `LEGACY_SOURCE_CANDIDATE`, no una equivalencia probada ni una autorización para copiar, renombrar o promoverlo. Su propio estado es `Base fundacional revisada / Por validar`; la autoridad vigente declara un Core `v0.3 candidata / Requiere re-test`.

## 1. Repository Authority Guard

```text
repository guard: PASS
root: C:/Users/User/proyect-starteria/harness-starteria-clean
origin: https://github.com/DarkCodePE/harness-starteria.git
branch: feat/portfolio-entry-decision-readiness-harness
initial working tree: clean
Dashboardstarteria modified: NO
```

## 2. Referencias encontradas

La búsqueda sobre archivos tracked produjo **60 coincidencias en 49 archivos** para `STARTERIA_CORE_LOGIC_CONTRACT`. Las variantes relacionadas produjeron, con solapamiento entre resultados, **13** coincidencias de `Core Logic Contract`, **24** de `core logic` y **3** de `Starteria Authority`.

### 2.1 Referencias normativas o de cadena de autoridad

Estas referencias colocan el Core en la jerarquía, lo declaran dependencia obligatoria o le atribuyen estado normativo:

| Archivo | Línea(s) | Uso / clasificación |
|---|---:|---|
| `AGENTS.md` | 39, 81 | Orden obligatorio de lectura y Core superior. `HARD_AUTHORITY`. |
| `docs/STARTERIA_AUTHORITY.md` | 57, 73, 111, 122, 144, 216 | Jerarquía, estado factual, dependencia de bounded contexts y precondición de cambios. `HARD_AUTHORITY`. |
| `CURRENT_STATE.md` | 106 | Declara el Core como autoridad vigente factual, pero candidata/requiere re-test. `HARD_AUTHORITY` con gap factual. |
| `STARTERIA_V2_MANIFEST.md` | 216 | Nodo `STARTERIA_CORE_LOGIC_CONTRACT` de la jerarquía V2. `HARD_AUTHORITY` como índice, no como contrato. |
| `docs/governance/STARTERIA_V2_MIGRATION_GUARDRAILS.md` | 68 | Lectura obligatoria antes de cambios. `HARD_AUTHORITY` procedimental. |
| `docs/governance/STARTERIA_V2_IMPLEMENTATION_PLAYBOOK.md` | 37 | Lectura obligatoria y condición de `AUTHORITY_GAP → STOP functional implementation`. `HARD_AUTHORITY` procedimental. |
| `docs/portfolio-lead/DOCUMENT_INVENTORY.md` | 24 | Registra target v0.3 candidate en la ruta canónica. `SUPPORTING_REFERENCE` con evidencia de path gap. |
| `STARTERIA_PLATFORM_REPO_MIGRATION_AUDIT.md` | 95 | Mapea la ruta canónica al candidato legacy y marca `KEEP_TARGET`; no prueba materialización. `SUPPORTING_REFERENCE`. |
| `docs/portfolio-lead/00-authority/README.md` | 9 | Enlace de autoridad a la ruta ausente. `HARD_AUTHORITY` de navegación; actualmente stale. |
| `docs/portfolio-lead/README.md` | 56, 173, 204 | Índice y grafos que dependen del Core. `HARD_AUTHORITY` de navegación; actualmente stale en el enlace. |
| `docs/portfolio-lead/05-activation-handoff/README.md` | 26 | Grafo de autoridad para Activation/Handoff. `HARD_AUTHORITY` declarada; dependencia ausente. |

### 2.2 Referencias de contratos, skills, harness y soporte

| Grupo | Archivos / líneas | Uso / clasificación |
|---|---|---|
| Experience Contract activo | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md:15` | Declara el Core como dependencia superior. `HARD_AUTHORITY` de dependencia; el contrato de experiencia sí existe. |
| Candidate Experience/Orchestration | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md:17`; `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_VALUE_HANDOFF_TARGET_v0.1.md:382,384` | Dependencia o registro explícito del gap. `SUPPORTING_REFERENCE`; el segundo también es `STALE_REFERENCE` descriptiva. |
| Agent / Skills v0.1 | `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md:17`; `doc/entry-01...` a `doc/entry-04...:18` | Dependencia declarada. `SUPPORTING_REFERENCE`; los artefactos están en ubicación legacy. |
| Agent / Skills v0.2 | `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md:17`; cuatro `docs/agents/portfolio-entry/skills/.../SKILL_v0.2.md:18` | Dependencia declarada por stack candidato. `SUPPORTING_REFERENCE`; no promueve el Core. |
| AI harness | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md:39`; `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md:163` | Precondición/dependencia de harness. `SUPPORTING_REFERENCE`. |
| Development Harness legacy | `doc/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md:42,86,281` | Define la función constitucional del Core y su ubicación recomendada. `HISTORICAL_REFERENCE` / `STALE_REFERENCE` porque describe una estructura no materializada. |
| Design System y reportes DS | `docs/design-system/STARTERIA_DESIGN_SYSTEM_CONTRACT_v0.1.md:10`; DS01–DS08, `STARTERIA_DESIGN_SYSTEM_REPO_AUTHORITY_RECONCILIATION.md` y `STARTERIA_VISUAL_DIRECTION_VD01_REPORT.md` | Preservación/lectura de autoridad, no definición de negocio. `SUPPORTING_REFERENCE`; los reportes no son autoridad funcional. |
| Implementación/auditorías | `docs/implementation/PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md:15`; `portfolio-entry-active-question-loop-audit-v0.1.md:29`; `portfolio-entry-completion-failsafe-v0.1.md:14`; `portfolio-entry-pack-traceability-v0.3.md:21` | Evidencia y registro del gap. `SUPPORTING_REFERENCE`; los dos últimos describen explícitamente la ausencia. |
| Confirmation artifact | `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_FINAL_CANDIDATE_CONFIRMATION_REPORT_v0.1.md:64`; `test/portfolio-entry-v02-isolated-validation/run-final-candidate-confirmation.ts:103` | Preserva el gap y prohíbe resolverlo silenciosamente. `SUPPORTING_REFERENCE`. |
| Confidence-gate report | `docs/analisis-jev/11-confidence-gate-decision.md:280` | Observación de que el checkout no contiene la ruta. `HISTORICAL_REFERENCE` / evidencia. |
| Portfolio contracts | `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md:16`; `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md:10` | Dependencias de contexto Portfolio. `SUPPORTING_REFERENCE`; no reemplazan Core. |
| Architecture comparison | `docs/portfolio-lead/01-architecture/STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md:706` | Nombre del contrato dentro de arquitectura comparada. `SUPPORTING_REFERENCE`. |

### 2.3 Referencias históricas o de nombre relacionado

- `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md:2320` menciona el nombre canónico dentro de material histórico, pero no materializa la ruta `docs/core/`.
- `plugins/starteria-harness/skills/starteria/MAPA-DE-DOCUMENTOS.md:15` y `skills/starteria/MAPA-DE-DOCUMENTOS.md:15` registran el contrato legacy v0.2 como existente. Son `HISTORICAL_REFERENCE`, no autoridad canónica actual.
- `docs/PRD.md:16` describe históricamente un Core con trece invariantes, sin establecer la ruta canónica actual. `HISTORICAL_REFERENCE`.
- `docs/design-system/STARTERIA_COPILOT_INTERACTION_SYSTEM_v0.1.md:10` usa la expresión genérica “Core Logic Contract de Starteria”; `SUPPORTING_REFERENCE`, no una referencia de path.
- `doc/STARTERIA_AUTHORITY.md:18,34` usa el contrato legacy como Core superior. Es `HISTORICAL_REFERENCE` y evidencia de una autoridad anterior incompatible con el mapa actual.

## 3. Documentos equivalentes inspeccionados

| Documento / área | Responsabilidad observada | Resultado |
|---|---|---|
| `docs/STARTERIA_AUTHORITY.md` | Jerarquía y estado factual del Core; no contiene invariantes Core. | No equivalente; autoridad de índice. |
| `AGENTS.md`, `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md` | Gobernanza, estado y clasificación V2; declaran la ausencia/candidatura. | No equivalentes; referencias de gobernanza. |
| `doc/STARTERIA_DEVELOPMENT_HARNESS_v0.1.md` | Define qué debería contener un Core Contract y cómo se usa. | No equivalente; harness histórico. |
| `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | Documento de negocio con 13 invariantes, autoridad, Portfolio/Initiative, IA, procedencia, evidencia y Steps 0–4. | **Candidato legacy parcial**; no se prueba equivalencia con v0.3 ni promoción. |
| `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | Reglas de la experiencia Portfolio Entry. | No equivalente; contrato de experiencia subordinado. |
| `docs/experience/portfolio-entry/*` | Clarificación, handoff y target de valor. | No equivalentes; experiencia/orquestación y evidencia. |
| `docs/portfolio-lead/*` | Gobernanza Portfolio, Bootstrap/Home, Activation/Handoff, arquitectura e índices. | No equivalentes; bounded contexts subordinados o índices. |
| `docs/design-system/*` | Foundations, semántica visual y reportes de implementación. | No equivalente; explícitamente no define autoridad de negocio. |

El candidato legacy cubre responsabilidades sustantivas que serían esperables de un Core, pero el repositorio no contiene una relación aprobada que lo identifique como el contrato canónico v0.3 declarado en `docs/STARTERIA_AUTHORITY.md` y `CURRENT_STATE.md`. La equivalencia es, por tanto, **PARTIAL**, no `YES`.

## 4. Authority graph

```text
docs/STARTERIA_AUTHORITY.md
  → docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md
    → approved Product ADRs
      → Experience Contracts
        → Agent / Skill Contracts
          → Tech Specs / tests / implementation
```

Estado observado:

```text
docs/STARTERIA_AUTHORITY.md
  → HARD_AUTHORITY
  → Core dependency: MISSING

CURRENT_STATE.md / STARTERIA_V2_MANIFEST.md
  → declare candidate v0.3 / requires re-test
  → do not supply Core semantics

doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md
  → LEGACY_SOURCE_CANDIDATE
  → existing, v0.2, por validar
  → not proven equivalent; must not be silently promoted

Portfolio Entry / Portfolio Lead contracts
  → SUPPORTING_REFERENCE
  → depend on Core; do not replace it

Design System / reports / tests / audits
  → SUPPORTING_REFERENCE or HISTORICAL_REFERENCE
  → cannot define Core authority
```

No se encontró una referencia que demuestre materialización real de `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`. Las referencias a esa ruta en índices, enlaces y listas de lectura son `STALE_REFERENCE` cuando se interpretan como archivo existente; las declaraciones explícitas de ausencia son evidencia correcta del gap.

## 5. Legacy repositories

No se consultó ni modificó `Dashboardstarteria`, conforme al hard guard. No se copiaron archivos desde allí.

```text
LEGACY_SOURCE_CANDIDATE: YES
source observed in this repository: doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md
Dashboardstarteria inspected: NO
Dashboardstarteria modified: NO
```

El candidato observado no autoriza migración. Cualquier fuente adicional en Dashboardstarteria requeriría una auditoría separada y decisión explícita; no forma parte de este resultado.

## 6. Impacto sobre el Portfolio Entry candidate congelado

```text
integration impact: PARTIALLY_BLOCKS_PRODUCT_INTEGRATION
```

El gap no invalida por sí mismo la confirmación experimental congelada ni impide seguir revisando su evidencia de Decision Readiness y Conversion Readiness. Sí impide cerrar de forma completa la integración como comportamiento de producto gobernado, porque:

- Decision Readiness y Conversion Readiness dependen de invariantes de autoridad, procedencia, suficiencia y separación entre propuesta de IA y decisión humana.
- El handoff público → registro/continuación no debe inferir creación de entidades, permisos o semántica de Portfolio/Initiative sin el Core.
- La creación de Portfolio y la frontera Portfolio/Initiative requieren una fuente Core para distinguir estado canónico, proyección, handoff y creación material.
- La orquestación multi-entry y sus límites de canal dependen de autoridad, ownership, provenance y lifecycle Core.

La clasificación no es `BLOCKS_PRODUCT_INTEGRATION` total porque el candidato congelado se presenta como experimento/harness y sus artefactos registran que no modifican Core, rutas, esquemas ni semántica productiva. Es `PARTIALLY_BLOCKS_PRODUCT_INTEGRATION` para promoción o integración productiva gobernada.

## 7. Respuestas requeridas

1. **Repository guard:** PASS.
2. **Referencias encontradas:** 60 coincidencias en 49 archivos para el token exacto; agrupación completa en §2.
3. **Referencias normativas:** `AGENTS.md`, `docs/STARTERIA_AUTHORITY.md`, `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, guardrails/playbook y grafos de Portfolio; detalle en §2.1.
4. **Referencias stale:** enlaces/listas a `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` cuando presuponen que el archivo existe; detalle en §2 y §4.
5. **Equivalent contract found:** PARTIAL.
6. **Canonical contract currently exists:** NO.
7. **Legacy source candidate found:** YES; el candidato v0.2 observado en `doc/`.
8. **Semantic reconstruction required:** NO para esta auditoría; YES si se pretendiera cerrar el gap sin una fuente aprobada. Esa reconstrucción está prohibida.
9. **Integration impact:** PARTIALLY_BLOCKS_PRODUCT_INTEGRATION.
10. **Exact authority gap:** la jerarquía exige un Core v0.3 candidato/re-test en `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`, pero la ruta no existe; el v0.2 legacy no está demostrado como equivalente ni aprobado como sustituto.
11. **Safe remediation options:** (a) localizar y aportar la fuente autorizada v0.3 sin reinterpretarla; (b) aprobar explícitamente una promoción/versionado del candidato v0.2 mediante el proceso de autoridad y actualizar índices; (c) emitir un nuevo Core por decisión explícita de producto, con trazabilidad y re-test. Ninguna opción debe ejecutarse copiando o inventando semántica en esta auditoría.
12. **Recommended next step:** obtener del responsable la fuente autorizada del Core v0.3 candidata o una decisión explícita de promoción/versionado; después realizar una auditoría de reconciliación separada antes de cualquier integración productiva.
13. **Files changed:** únicamente este archivo.
14. **Working tree status:** verificación final requerida; el único cambio esperado es este artefacto.

## 8. Cierre

```text
AUTHORITY_GAP_REQUIRES_SOURCE
SEMANTIC_RECONSTRUCTION: NOT PERFORMED
PRODUCTIVE_CODE_CHANGED: NO
FROZEN_PORTFOLIO_ENTRY_CANDIDATE_CHANGED: NO
```
