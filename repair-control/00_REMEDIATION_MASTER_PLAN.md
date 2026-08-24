# Starteria MVP Remediation Master Plan

**Status:** Active  
**Baseline commit:** `5ff32f9`  
**Baseline verdict:** `MVP PILOT NO-GO`  
**Repair branch:** `repair/mvp-r1-truth-foundation`

---

## 1. Purpose

This document governs the remediation program required to move Starteria from the audited baseline at commit `5ff32f9` to a verifiable MVP PILOT GO.

It does not replace product PRDs. It converts the baseline audit into an ordered repair program based on root causes, Golden Paths and MUST guardrails.

The program must optimize for E2E closure, not for the number of isolated requirements marked PASS.

---

## 2. Baseline Audit Summary

### Golden Paths

| Golden Path | Baseline level | Baseline status |
|---|---:|---|
| GP-A — Ordenar Portafolio | 0–1 | FAIL |
| GP-B — Avanzar Iniciativa | 2 | PARTIAL |
| GP-C — Evidencia → Decisión | 1 | FAIL |

### Baseline condition

- MVP PILOT: **NO-GO**
- General maturity: **Level 1–2**
- CRITICAL gaps: open
- MUST guardrails: multiple PARTIAL / FAIL
- Full E2E verification: blocked by test environment failure in the baseline audit

---

## 3. Program Principles

1. **Root cause before symptom.**
   Do not repair individual findings independently when they share a domain or architectural cause.

2. **Vertical E2E work.**
   Each repair must close domain → persistence → service → API → projection → UI → tests where applicable.

3. **Do not rebuild KEEP capabilities.**
   Existing working architecture should be extended or consolidated.

4. **No silent mocks in pilot mode.**
   Primary pilot flows must fail explicitly rather than silently degrade to mock, local-only or fallback state.

5. **Human authority remains explicit.**
   AI may suggest, analyze and prepare actions, but cannot create unverified evidence or make final human decisions.

6. **Claim ≠ Evidence ≠ Validation.**
   A statement is not evidence; evidence is not validation.

7. **No GO by average.**
   MVP PILOT GO requires all target Golden Paths at Level 3, all MUST guardrails PASS and zero open CRITICAL gaps.

8. **Reaudit each repair block before proceeding.**
   Implementation completion is not equivalent to product acceptance.

---

## 4. KEEP Architecture

Do not replace without a documented blocker:

- `StrategicFront`
- `Challenge`
- `InitiativePortfolioMeta`
- Copilot ledger / action infrastructure
- `CreateStrategicFront` vertical
- Adaptive Core persistence
- existing checkpoint instances and Step outputs
- `syncInitiativeProgress`
- PDF proposals with provenance already present
- global initiative list
- current visual primitives for Attention Queue / Pending Decisions where reusable

---

## 5. Root Causes to Close

| ID | Root cause |
|---|---|
| RC-IMPORT-01 | Importación y publicación multiobjeto inexistentes |
| RC-COP-01 | Copilot real limitado a `CreateStrategicFront` |
| RC-EVID-01 | Evidencia general es metadata, no objeto verificable |
| RC-STEP-01 | Validación de checkpoint es suficiencia parcial |
| RC-STEP-02 | Coexistencia legacy/adaptive divide el journey |
| RC-DEC-01 | No existe aggregate persistido de decisión |
| RC-DEC-02 | Decision Center usa heurística frontend sin evidence bundle |
| RC-BLOCK-01 | Bloqueo confirmado no existe como dominio |
| RC-DATA-01 | Fallbacks, mocks y estado local conviven con persistencia |
| RC-HAND-01 | Handoff/readiness es output adaptivo, no lifecycle P0 |

---

## 6. Repair Program

### R0 — Validation Environment
Goal: make the product auditable through executable tests and reproducible local execution.

Gate: repeatable test commands and evidence can be produced from the repair worktree.

### R1 — Truth Foundation
Goal: create the minimum shared truth layer required by Steps, Decisions and Portfolio.

Scope:
- Source / provenance
- Claim
- Evidence
- Validation
- AttentionItem / Blocker
- minimum ImpactStatus semantics
- pilot-mode mock/fallback policy

Primary root causes:
- RC-EVID-01
- RC-BLOCK-01
- RC-DATA-01

Gate: unverified claims cannot be represented as validated facts or unlock dependent decisions/gates.

### R2 — GP-B Initiative Flow
Goal: make Adaptive Core the single pilot progression engine and close GP-B at Level 3.

Gate: `GP-B = Level 3 / PASS`.

### R3 — GP-C Decision Flow
Goal: close Evidence → Decision as a persisted domain flow.

Gate: `GP-C = Level 3 / PASS`.

### R4 — GP-A Portfolio Intake
Goal: close Portfolio import/classification/publication E2E.

Gate: `GP-A = Level 3 / PASS`.

### R5 — Pilot Closure
Goal: remove remaining blockers to full MVP PILOT GO.

Gate: no open CRITICAL; all MUST guardrails PASS.

---

## 7. Execution Order

```text
R0 Validation Environment
        ↓
R1 Truth Foundation
        ↓
R2 GP-B Steps / Checkpoints
        ↓
Reaudit GP-B
        ↓
R3 GP-C Decisions
        ↓
Reaudit GP-C
        ↓
R4 GP-A Portfolio Intake
        ↓
Reaudit GP-A
        ↓
R5 Pilot Closure
        ↓
Full Audit Harness
```

No later repair block should be implemented automatically merely because the previous code change completed.

---

## 8. Repair Block Workflow

Every block follows:

1. read baseline audit evidence;
2. confirm current-state code;
3. implement only the active Repair Contract;
4. execute required tests;
5. inspect diff;
6. create implementation evidence;
7. commit the repair;
8. reaudit only the impacted block;
9. close only if the audit returns GO/PASS for the defined gate.

---

## 9. Implementation Evidence Required

Every repair run must produce a report under:

`repair-control/runs/<repair-id>/`

Minimum contents:

- baseline commit;
- repair commit or working SHA;
- files changed;
- migrations;
- domain changes;
- API changes;
- UI changes;
- tests added/changed;
- tests executed;
- failures;
- E2E evidence;
- known remaining gaps;
- deviations from Repair Contract;
- requirements believed to be closed;
- requirements still open.

An implementation agent must never declare the block accepted. Acceptance belongs to reaudit.

---

## 10. MVP PILOT GO Gate

The remediation program is complete only when:

- `GP-A = Level 3 / PASS`
- `GP-B = Level 3 / PASS`
- `GP-C = Level 3 / PASS`
- all MUST control / guardrail requirements = PASS
- CRITICAL gaps = 0
- no silent mocks/fallbacks in pilot primary flows
- traceability is demonstrable E2E
- completed initiative/cycle can produce a usable persisted human decision
