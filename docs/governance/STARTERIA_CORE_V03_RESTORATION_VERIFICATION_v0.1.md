# Starteria — Core v0.3 Restoration Verification

**Documento:** `STARTERIA_CORE_V03_RESTORATION_VERIFICATION_v0.1.md`  
**Fecha:** 2026-09-25  
**Propósito:** verificar la restauración del Core Contract canónico y re-testear su compatibilidad documental con el Portfolio Entry candidate congelado.  
**Scope:** auditoría y verificación documental únicamente. No modifica Core, frontend, backend, DB, runtime productivo ni harness congelado.

## 1. Resultado ejecutivo

```text
REPOSITORY_GUARD: PASS
CANONICAL_CORE_EXISTS: YES
BYTE_MATCH_WITH_AUTHORIZED_SOURCE: YES
SHA256_MATCH: YES
TITLE_VERSION_STATE_MATCH: YES
REFERENCES_CHECKED: YES
NORMATIVE_REFERENCES_RESOLVED: PARTIAL
PORTFOLIO_ENTRY_COMPATIBILITY: NEEDS_ADR
HANDOFF_DESIGN_STATUS: CANDIDATE / FROZEN IN ISOLATED HARNESS
PRODUCTIVE_INTEGRATION_STATUS: BLOCKED / NOT AUTHORIZED
AUTHORITY_GAP_DISPOSITION: RESTORATION VERIFIED; LEGACY GAP AUDIT NOW STALE
CORE_FILE_MODIFIED: NO
```

La restauración física y criptográfica está verificada. La compatibilidad semántica del candidate congelado con Core v0.3 es positiva en la frontera pre-Core. El resultado global es `NEEDS_ADR` porque la continuidad posterior a registro conserva una ruta legacy capaz de derivar hacia `Project`/Steps, mientras que el Core v0.3 y el Portfolio Entry candidate separan handoff, canonicalización y activación.

## 2. Repository guard

Se verificó el checkout indicado por la solicitud:

```text
Repository: C:\Users\User\proyect-starteria\harness-starteria-clean
Core target: docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md
Unauthorized source used for writes: NO
Core/Frontend/Backend/DB/Runtime/Harness writes: NO
```

El estado previo a este informe ya contenía cambios no rastreados en `docs/core/` y `docs/governance/STARTERIA_CORE_LOGIC_CONTRACT_AUTHORITY_GAP_AUDIT_v0.1.md`. Se preservaron sin modificarlos.

## 3. Canonical Core verification

Fuente autorizada de comparación:

`C:\Users\User\Downloads\STARTERIA_CORE_LOGIC_CONTRACT.md`

Resultado de comparación binaria:

| Check | Resultado |
|---|---|
| Archivo canónico existe | YES |
| Longitud fuente / canónico | 76,497 / 76,497 bytes |
| Comparación byte a byte | MATCH |
| SHA-256 fuente | `3D12553B5FD956DC05A7D3E2C80F8AA44E7219F4824D1B181F41ECBFB4132A2B` |
| SHA-256 canónico | `3D12553B5FD956DC05A7D3E2C80F8AA44E7219F4824D1B181F41ECBFB4132A2B` |
| Título | `Starteria — Contrato de Lógica Core para el MVP` |
| Versión | `v0.3 candidata` |
| Estado | `Candidata de gobernanza / Requiere re-test` |

El Core Contract no fue modificado.

## 4. Reference audit

Se re-ejecutó una búsqueda repository-wide de `STARTERIA_CORE_LOGIC_CONTRACT.md` excluyendo `.git`.

```text
Exact-reference files found: 48
Legacy v0.2 Core-reference files found: 11
```

### Normative references resolved

- `docs/STARTERIA_AUTHORITY.md` ahora declara `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` como autoridad superior y conserva el estado candidate/re-test.
- `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, guardrails y playbook apuntan al mismo Core canónico.
- El único Experience Contract activo para Portfolio Entry sigue siendo `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`.
- El handoff candidate, Agent Contract, Skills v0.2, AI Harness y Harness Execution Spec usan la ruta canónica.

### Stale / broken references

- `docs/governance/STARTERIA_CORE_LOGIC_CONTRACT_AUTHORITY_GAP_AUDIT_v0.1.md` describe que el Core está ausente. Esa afirmación quedó stale por la restauración; el archivo no se modificó por la restricción de crear únicamente este informe.
- `docs/portfolio-entry/testing/PORTFOLIO_ENTRY_FINAL_CANDIDATE_CONFIRMATION_REPORT_v0.1.md`, `docs/implementation/portfolio-entry-active-question-loop-audit-v0.1.md`, `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_VALUE_HANDOFF_TARGET_v0.1.md` y otros reportes históricos también conservan la observación de ausencia. Son evidencia histórica, no autoridad vigente.
- `doc/STARTERIA_AUTHORITY.md`, `README.md`, `skills/starteria/MAPA-DE-DOCUMENTOS.md` y equivalentes conservan referencias al Core v0.2 legacy en `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`. Deben tratarse como legacy/historical y no definen comportamiento nuevo.
- El Manifest menciona `STARTERIA_DESIGN_SYSTEM_V2_RESTRUCTURE_BASELINE.md` y `STARTERIA_LANDING_V4_IMPLEMENTATION_SPEC.md`; esos archivos no están materializados en el checkout. Esto es un gap documental separado del Core restaurado.

Disposition: la referencia normativa activa al Core queda resuelta; la reconciliación/rotulación de los artefactos stale y legacy requiere una limpieza documental posterior, no realizada aquí.

## 5. Portfolio Entry compatibility re-test

Fuentes contrastadas:

- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md`
- `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md`
- `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md`
- `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md`
- frozen reports under `docs/portfolio-entry/testing/`

| Compatibility dimension | Result | Evidence / finding |
|---|---|---|
| AI authority | PASS | Core INV-03 is preserved: AI extracts, infers, compares and suggests; it does not approve, canonicalize or execute organizational decisions. Frozen authority-boundary harness reports zero authority invention. |
| Provisional/public pre-canonical behavior | PASS | Portfolio Entry produces `PortfolioEntryDraft` + `PortfolioEntryAnalysis`; the contract prohibits automatic Organization, StrategicFront, Challenge, Initiative, Evidence, Step or Decision creation. |
| Canonical entity creation/mutation | PASS at Entry boundary / CONFLICT downstream | Entry contracts prohibit creation and mutation. Existing implementation evidence still includes legacy authenticated continuation toward Project/Steps; this is outside a clean pre-Core handoff and requires an ADR if retained as direct continuation. |
| Provenance | PASS | `USER_DECLARED`, `EXTRACTED_FROM_USER_TEXT`, `AI_INFERRED`, `AI_SUGGESTED` remain distinct; inferred values do not become confirmed without human action. |
| Grounding | PASS with follow-up | Grounding/sufficiency reports and frozen runs preserve source-grounded known context and open items. CR-ADV-05 remains a focused later-work/current-item review item, not a reason to broaden authority. |
| Conversion Readiness | PASS in harness / not productive certification | Frozen conversion run completed 66/66 calls with PASS statuses. The report is explicitly harness-only and does not authorize product integration. |
| CURRENT/LATER projection | PASS deterministic candidate | Authoritative CURRENT/LATER report records `current_relevance implemented: YES`; projection remains deterministic-only and must not be inferred from later work. |
| Open items | PASS | Frozen outputs preserve `open_items`, why they matter, who can resolve them and suggested next moves; unresolved does not become false completeness. |
| Registration handoff | NEEDS_ADR | The value-handoff target places registration after demonstrated value, but current-state evidence documents legacy lead-capture/auth continuation and possible Project/Step creation. The governing decision on whether/when authenticated conversion is allowed is not approved in the active product-ADR chain. |

### Compatibility conclusion

```text
PORTFOLIO_ENTRY: NEEDS_ADR
```

This is not a failure of the frozen pre-Core cognition. It is an unresolved authority boundary at registration/continuation. No implementation change is authorized by this verification.

## 6. Handoff and productive status

```text
HANDOFF_DESIGN_STATUS:
  CANDIDATE / FROZEN IN ISOLATED HARNESS
  compatible with pre-Core provisional handoff
  not promoted to canonical product behavior

PRODUCTIVE_INTEGRATION_STATUS:
  BLOCKED / NOT AUTHORIZED
  no product integration performed
  no Core approval inferred from file restoration
```

The restoration verifies the authority artifact, not approval of v0.3. Core remains `Candidata de gobernanza / Requiere re-test`.

## 7. Authority gap disposition

```text
Previous gap: canonical Core path absent from checkout.
Current state: canonical path exists and matches the authorized source byte-for-byte.
Disposition: RESTORATION VERIFIED.
Remaining gap: stale absence reports and legacy v0.2 references require separate documentary reconciliation.
Product authority: NOT PROMOTED; explicit v0.3 governance decision still required.
```

## 8. Files changed

Created only:

- `docs/governance/STARTERIA_CORE_V03_RESTORATION_VERIFICATION_v0.1.md`

Not modified:

- `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md`
- frontend, backend, DB, product runtime and frozen harness

## 9. Recommended next step

Create and approve a focused product ADR for the registration/continuation boundary: decide whether authenticated continuation may create canonical Portfolio/Initiative state, which human checkpoint and ownership rules apply, and explicitly prohibit implicit Project/Step creation until that decision is resolved. After that ADR, re-run the compatibility gate and update stale authority-gap reports in a separate documentary change.
