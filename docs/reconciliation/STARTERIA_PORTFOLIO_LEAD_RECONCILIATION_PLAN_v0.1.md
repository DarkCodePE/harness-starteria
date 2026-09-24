# StarterÃ­a â€” Portfolio Lead Reconciliation Plan v0.1

**Date:** 2026-09-24
**Status:** RECONCILIATION BASELINE / HUMAN REVIEW REQUIRED
**Repository:** `DarkCodePE/harness-starteria`
**Working branch:** `docs/portfolio-home-v2-authority`
**Main observed SHA:** `44c2307d72ef9beb10fd730d0fae254f4ecdf8ef`
**Branch observed SHA:** `b36f6743de10f51ff77491866843efb261aa3198`
**Common merge base:** `7b82f14cfa4bbfe886b53de55dba932ff5ef79b0`

## 1. Executive conclusion

The branch is currently **5 commits ahead and 29 commits behind `main`**.

The 29 newer `main` commits are concentrated primarily in Portfolio Entry, AI/Harness, deployment and related runtime hardening. No competing Portfolio Home / Strategic Framing implementation was identified.

The 5 branch-only commits contain valid Portfolio Home / Strategic Framing work, but they must **not** be merged or cherry-picked wholesale because:

1. one branch-only Portfolio Entry E2E stabilization commit is already superseded by newer `main` work;
2. the PH-2 commit mixes valid Home read-model code with authority/current-state edits that are now stale relative to `main`;
3. `AGENTS.md`, `CURRENT_STATE.md`, `STARTERIA_V2_MANIFEST.md`, `docs/STARTERIA_AUTHORITY.md` and Portfolio indexes changed on both lines;
4. Portfolio Entry UI/E2E files changed heavily on `main` after the branch diverged.

The safe approach is **semantic reconciliation by slice**, preserving the current branch and taking current `main` as the factual runtime baseline.

## 2. Branch-only commit classification

| Commit | Purpose | Treatment | Reason |
|---|---|---|---|
| `89a81a4` | PH-0/PH-1/PH-2 docs + Portfolio Home read model/backend | **KEEP + ADAPT** | Core Home work is valuable, but authority/index changes need manual reconciliation and runtime must be retested against current main. |
| `f5b15c5` | Portfolio Entry active-question E2E stabilization | **DROP / MAIN WINS** | Portfolio Entry moved materially after this commit and equivalent/newer fixes already exist in main. |
| `02f0c49` | PH-3A UX reconciliation | **KEEP** | Documentation-only target design; still useful as PH-3B implementation input. |
| `e47ea24` | Strategic Framing context | **KEEP + UPDATE** | Valid context, but must incorporate Enterprise Direct, shared Strategic Interpretation and the latest SF-0 human-review refinements. |
| `b36f674` | `AGENTS.md` Strategic Framing guidance | **KEEP INTENT / REAPPLY MANUALLY** | Main changed since divergence. Take main version first, then re-add updated Strategic Framing guardrails. |

## 3. File-level merge policy

### 3.1 Main must win by default

Use current `main` as the base for these paths, then reapply only explicit Portfolio Lead additions:

- `AGENTS.md`
- `CURRENT_STATE.md`
- `STARTERIA_V2_MANIFEST.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/portfolio-lead/DOCUMENT_INVENTORY.md`
- `docs/portfolio-lead/README.md`
- `front/e2e/portfolio-entry-conversion.spec.ts`
- `front/src/features/portfolio-entry/public/PortfolioEntryExperience.tsx`

Portfolio Entry runtime/UI/E2E should not be restored from the older branch versions.

### 3.2 Preserve from the Portfolio Home branch, then retest

- `backend/modules/portfolio/portfolio-home.read-service.ts`
- `backend/modules/portfolio/__tests__/portfolio-home.read-service.test.ts`
- `backend/modules/portfolio/portfolio.controller.ts` â€” only the PH-2 Home read integration delta
- `backend/modules/portfolio/portfolio.router.ts` â€” only `GET /home` read integration delta
- `docs/portfolio-lead/06-portfolio-home-governance/**`
- `docs/portfolio-lead/90-implementation-reports/PORTFOLIO_HOME_READ_MODEL_IMPLEMENTATION_REPORT_v0.1.md`
- `docs/portfolio-lead/90-implementation-reports/PORTFOLIO_HOME_UX_RECONCILIATION_PH3A_v0.1.md`
- `docs/reconciliation/CORE_0_CANDIDATE_RECONCILIATION.md`
- `docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_CONTEXT_v0.1.md` â€” update before promotion

### 3.3 Do not promote automatically

The following remain candidate/experience concepts until their own review/ADR boundary is satisfied:

- canonical `pre_start` lifecycle representation;
- Activation Readiness;
- new Challenge coverage/cardinality semantics;
- canonical `StrategicLens`;
- canonical `StrategicGap` / `StrategicObservation`;
- persistent LIGHT/STANDARD/DEEP enum;
- new Project vs Initiative identity split;
- any automatic clustering â†’ Strategic Front or Gap â†’ Challenge mutation.

## 4. New validated product decisions to reconcile into SF-0

The latest discussion adds the following experience decisions:

### R-DEC-01 â€” Portfolio Entry is not an exclusive gateway

Public Portfolio Entry is a self-service acquisition/discovery experience. Strategic Framing must also be reachable from Enterprise Direct and Existing Portfolio paths.

### R-DEC-02 â€” Strategic Interpretation is reusable

Intent clarification, reverse alignment, ambiguity detection and strategic questioning are reusable cognitive capabilities. They should not be duplicated as separate business logic per channel.

### R-DEC-03 â€” Entry paths converge on Portfolio Anchor

```text
Public Portfolio Entry â”€â”
Enterprise Direct â”€â”€â”€â”€â”€â”€â”¼â†’ Strategic Interpretation â†’ Portfolio Anchor
Existing Portfolio â”€â”€â”€â”€â”€â”˜
                                             â†“
                                      Strategic Framing
```

### R-DEC-04 â€” Interpretation is not confirmed structure

Entry/interpretation output may contain provisional understanding, candidate outcomes or recommended directions. It does not automatically create/confirm Strategic Front, Driver, Gap, Opportunity or Challenge.

### R-DEC-05 â€” Do not repeat resolved intake

Strategic Framing should consume already-resolved upstream context and only reopen it when stale, conflicting, materially insufficient or explicitly challenged.

### R-DEC-06 â€” Strategic Framing and Home remain separate

Strategic Framing structures/revises strategic framing. Portfolio Home continuously observes/governs attention, progress and decisions.

## 5. Reconciliation execution sequence

### REC-0 â€” Freeze functional additions on the branch

Do not add new Portfolio Home/Strategic Framing runtime behavior until branch reconciliation is complete.

### REC-1 â€” Bring current main into the existing branch

Preserve branch name `docs/portfolio-home-v2-authority`.

Recommended integration strategy: merge current `origin/main` into the branch rather than rewriting history, then resolve conflicts semantically.

Conflict policy:

- Portfolio Entry files: **take main**.
- Authority/index files: **take main, then reapply Portfolio Lead additions manually**.
- PH-2 backend/read model: **retain branch delta, then retest against current main**.
- PH-3A docs: **retain**.
- SF context/AGENTS: **retain intent, update with R-DEC-01..06**.

### REC-2 â€” Validate PH-2 against current main

Required minimum checks:

- TypeScript typecheck;
- Portfolio backend tests;
- `portfolio-home.read-service.test.ts`;
- portfolio router authz tests;
- Prisma/schema compatibility check;
- no write side effects from `GET /api/v1/portfolio/home`;
- Sponsor is not inferred as Decision Authority;
- invitation/initiative/active initiative remain distinct;
- expected/observed/attributed contribution remain separate.

If any current-main domain change makes PH-2 semantics ambiguous, stop and document the gap before adapting the read model.

### REC-3 â€” Refresh authority/status files

Update only after REC-2 evidence exists:

- `CURRENT_STATE.md`
- `STARTERIA_V2_MANIFEST.md`
- `docs/STARTERIA_AUTHORITY.md`
- `docs/portfolio-lead/README.md`
- `docs/portfolio-lead/DOCUMENT_INVENTORY.md`

Do not label Portfolio Home `V2_MIGRATED` merely because PH-2 backend or PH-3A design exists.

### REC-4 â€” Finalize SF-0 human review

Update the SF-0 package with:

- multi-entry boundary;
- Strategic Interpretation reuse;
- Portfolio Anchor convergence;
- Front refinement;
- dynamic lenses;
- adaptive depth;
- Gap â†’ Challenge rules;
- sufficiency;
- Direct/Mixed/Copilot;
- Home boundary.

Then close only with explicit human approval:

```text
SF-0 HUMAN REVIEW: APPROVED
```

### REC-5 â€” Execute SF-1 current-state audit

SF-1 must map target capability to current implementation and classify every item:

```text
KEEP
ADAPT
NEW
REMOVE / DEPRECATE
ADR CANDIDATE
TBD / NEEDS EVIDENCE
```

It must explicitly inspect reuse of Portfolio Entry strategic interpretation/reverse alignment for Enterprise Direct and Existing Portfolio paths.

### REC-6 â€” Only then resume runtime implementation

Target sequence:

```text
SF-2 Read Model
SF-3 Editable Front Workspace
SF-4 Adaptive Lenses
SF-5 Gap Prioritization
SF-6 Gap â†’ Challenge
SF-7 Portfolio Home integration
SF-8 E2E
â†“
PH-3B frontend Home read-model integration
â†“
PH-4 Activation/Handoff integration
â†“
PH-5 Portfolio Home E2E closure
```

## 6. Specific known gaps that must enter the implementation backlog

### GAP-R01 â€” Direct login bypasses governed Bootstrap/Framing

Current direct Portfolio login works, but without a Portfolio Entry continuation it enters normal Home and does not create an equivalent governed setup path.

Target: Enterprise Direct setup reaching Strategic Interpretation / Portfolio Anchor without requiring public Entry.

### GAP-R02 â€” Strategic Front UI/write mismatch

Current Front UI captures fields not all persisted through the backend adapter/path, including fields such as `area`, `threshold`, `endDate`, `sponsorEmail` and `notes`. `Critica` priority currently degrades to backend `Alta`.

Target: reconcile UI contract, API schema, persistence and read adapter before calling Front management complete.

### GAP-R03 â€” Imported owner is candidate, not assignment

Excel/CSV owner mapping produces candidate context; it must not silently become canonical Initiative Owner.

Target: candidate resolution â†’ human confirmation â†’ invitation â†’ accept â†’ ownership.

### GAP-R04 â€” No clustering â†’ strategic structure capability

Current Bootstrap can analyze alignment/gaps but does not productively cluster portfolio work into candidate Fronts/Challenges.

Target: reverse-alignment candidate structure with provenance and human confirmation.

### GAP-R05 â€” Copilot capability surface is narrow

`CreateStrategicFront` exists as a guarded capability. `create_challenge`, `create_initiative`, owner assignment and clustering are not equivalent productive capabilities today.

### GAP-R06 â€” Activation/Handoff target not implemented E2E

Current challenge-linked project creation collapses ownership/start/Steps too early. Target remains:

```text
Invitation != Accept != Initiative/pre-start != Start != Step activation
```

### GAP-R07 â€” Portfolio Home frontend not consuming PH-2 read model

PH-2 backend exists on the branch. Current Home UI still primarily reads the legacy/intermediate Portfolio Lead state/selectors.

Target: PH-3B after SF-7 reconciliation.

## 7. Reconciliation exit criteria

Reconciliation is complete only when:

- current main is incorporated into the working branch;
- no old Portfolio Entry implementation is restored;
- PH-2 read model passes against current main;
- PH-3A remains documentation evidence, not runtime certification;
- authority/current-state/manifest files match observed reality;
- SF-0 includes the multi-entry/Strategic Interpretation decisions;
- glossary/context map is indexed;
- no candidate Core semantics are promoted silently;
- `git diff --check` and targeted validation pass;
- no merge/push occurs until human review of the reconciled diff.

## 8. Recommended immediate next action

Prepare one Codex reconciliation slice limited to REC-1 through REC-3. Do not implement SF-1 or new product behavior in the same change.


