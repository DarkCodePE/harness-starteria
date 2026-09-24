# Portfolio Lead Document Inventory

Status: documentation inventory
Date: 2026-09-15
Scope: Portfolio Lead documentation, contracts, reports, target candidates, prompts, and unresolved references

Portfolio Entry reconciliation (2026-09-18): v0.1 remains the declared current executable/reference baseline, with its Experience Contract approved. The v0.2/v0.2.1 stack installed by `eef32d6` is `CANDIDATE_RECONCILIATION`; promotion awaits reference validation, harness validation, and an explicit authority update. The v0.2 Test Findings Register is evidence only. Several target `docs/...` v0.1 paths are not materialized in this branch, while equivalent/legacy v0.1 artifacts remain under `doc/...` with active consumers. Reconcile paths and consumers before promotion; v0.2 does not supersede v0.1.

Actions:

- `KEEP_IN_PLACE`: current location remains canonical or referenced.
- `MOVE`: move only after reference audit; not used in this consolidation.
- `COPY_REFERENCE_ONLY`: copied or indexed as a reference, not elevated to authority.
- `DEPRECATE`: should be marked historical/deprecated if edited later.
- `ARCHIVE`: historical execution aid or older duplicate.
- `REVIEW_REQUIRED`: unresolved status, missing file, or candidate that needs approval.

## Inventory

| File | Current path | Version | Status | Authority level | Current relevance | Action |
| --- | --- | --- | --- | --- | --- | --- |
| `STARTERIA_AUTHORITY.md` | `docs/STARTERIA_AUTHORITY.md` | v0.1 | CURRENT_AUTHORITY | Authority map | Defines hierarchy and repo rules. | KEEP_IN_PLACE |
| `CURRENT_STATE.md` | `CURRENT_STATE.md` | current | CURRENT_AUTHORITY | Repository state | Declares repo as public docs/harness snapshot. | KEEP_IN_PLACE |
| `CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md` | v0.2 | FACTUAL_CURRENT | Core Contract | Current factual Core; `Base fundacional revisada / Por validar`. | KEEP_IN_PLACE |
| `STARTERIA_CORE_LOGIC_CONTRACT.md` | external candidate; not materialized under `docs/core/` | v0.3 | EXTERNAL_RECONCILIATION_CANDIDATE | Core candidate | Not current authority; requires ADR, original evidence and re-test before promotion. See CORE-0 report. | KEEP_EXTERNAL / DO_NOT_PROMOTE |
| `STARTERIA_GLOSSARY_AND_CONTEXT_MAP_v0.1.md` | `docs/portfolio-lead/00-authority/STARTERIA_GLOSSARY_AND_CONTEXT_MAP_v0.1.md` | v0.1 | REFERENCE | Vocabulary/context map | Clarifies canonical, provisional, derived and candidate language; does not override authority. | KEEP_IN_PLACE |
| `STARTERIA_PORTFOLIO_LEAD_RECONCILIATION_PLAN_v0.1.md` | `docs/reconciliation/STARTERIA_PORTFOLIO_LEAD_RECONCILIATION_PLAN_v0.1.md` | v0.1 | EVIDENCE / PLANNING BASELINE | Reconciliation plan | Records REC-1 through REC-6 scope and known Portfolio Lead gaps. | KEEP_IN_PLACE |
| `PORTFOLIO_HOME_PH2_POST_MERGE_REVALIDATION_v0.1.md` | `docs/reconciliation/PORTFOLIO_HOME_PH2_POST_MERGE_REVALIDATION_v0.1.md` | v0.1 | EVIDENCE / REVALIDATION REPORT | PH-2 evidence | Post-merge validation; `GO_WITH_GAPS`; not authority. | KEEP_IN_PLACE |
| `STRATEGIC_FRAMING_CONTEXT_v0.1.md` | `docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_CONTEXT_v0.1.md` | v0.1 | CANDIDATE / CONTEXT | Strategic Framing | SF-0 context; no runtime authority. | KEEP_IN_PLACE |
| `STRATEGIC_FRAMING_*_v0.1.md` | `docs/portfolio-lead/07-strategic-framing/` | SF-0 | CANDIDATE / HUMAN_REVIEW | Strategic Framing package | Documentation package ready for final human approval; SF-1–SF-8 not executed. | KEEP_IN_PLACE |
| `ADR-INDEX.md` | `doc/product-adr/ADR-INDEX.md` | current | REFERENCE | Approved/proposed ADR index | Product ADR entry point in the factual tree. | KEEP_AND_RECONCILE |
| `ADR-028-portfolio-lead-platform-role.md` | `backend/docs/adr/ADR-028-portfolio-lead-platform-role.md` | ADR-028 | REFERENCE | Product/auth reference | Defines `portfolio_lead` role history. | KEEP_IN_PLACE |
| `ADR-029-permission-based-authorization.md` | `backend/docs/adr/ADR-029-permission-based-authorization.md` | ADR-029 | REFERENCE | Product/auth reference | Permission and multi-role background for PG-4. | KEEP_IN_PLACE |
| `ADR-030-challenge-and-initiative-state-machine.md` | `backend/docs/adr/ADR-030-challenge-and-initiative-state-machine.md` | ADR-030 | REFERENCE | Product lifecycle reference | Legacy state machine context; not Activation/Handoff completion. | KEEP_IN_PLACE |
| `ADR-031-portfolio-entry-continuation-to-portfolio.md` | `docs/product-adr/ADR-031-portfolio-entry-continuation-to-portfolio.md` | ADR-031 | TARGET_CANDIDATE | Product ADR proposed | Proposed Portfolio continuation decision; not approved authority. | KEEP_IN_PLACE |
| `STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md` | `docs/portfolio-lead/01-architecture/STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md` | v0.1 | REFERENCE | Architecture reference | Imported from provided docs for discoverability. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md` | `docs/portfolio-lead/04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md` | v0.1 | TARGET_CANDIDATE | Experience/interaction contract candidate | Governs channel-independence target; not higher than Core/ADRs. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md` | `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md` | v0.1 | TARGET_CONTRACT | Experience Contract for bounded context | Governs Portfolio / Challenge -> Invitation -> Accept -> Initiative Overview -> Start under Core and Portfolio Governance Interaction Contract. | KEEP_IN_PLACE |
| `PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md` | `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md` | v0.1 | REFERENCE | Factual current-state audit | Evidence only for KEEP / ADAPT / NEW / DEPRECATE; not functional authority. | KEEP_IN_PLACE |
| `PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md` | `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_ACCEPTANCE_CHECKLIST_v0.1.md` | v0.1 | TARGET_CHECKLIST | Acceptance checklist | Protects lifecycle, pre_start, Start boundary, channel independence, team and UI invariants for the bounded context. | KEEP_IN_PLACE |
| `PORTFOLIO_GOVERNANCE_CHANNEL_INDEPENDENCE_AUDIT_v0.1.md` | `PORTFOLIO_GOVERNANCE_CHANNEL_INDEPENDENCE_AUDIT_v0.1.md` | v0.1 | REFERENCE | Factual audit | Pre-PG implementation audit; useful historical baseline. | KEEP_IN_PLACE |
| `PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md` | `PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md` | v0.1 | REFERENCE | Factual audit | Defines remaining Activation/Handoff gap and single-path risks. | KEEP_IN_PLACE |
| `STARTERIA_STEPS_ARCHITECTURE_COMPARISON_AND_TARGET_v0.1.md` | not found | v0.1 | UNKNOWN | Architecture dependency | Requested as Steps dependency; absent from repo and provided files. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | v0.1 | CURRENT_CONTRACT | Approved Experience Contract | Single canonical tracked Experience Contract and active authority. | CANONICAL_PATH / KEEP_BASELINE |
| `README_PORTFOLIO_HOME_GOVERNANCE_PACK_v0.1.md` | `docs/portfolio-lead/06-portfolio-home-governance/README_PORTFOLIO_HOME_GOVERNANCE_PACK_v0.1.md` | PH-0 | TARGET_AUTHORITY_FROZEN | Portfolio Home governance | Frozen target/read-model boundary; runtime not certified. | KEEP_IN_PLACE |
| `PORTFOLIO_HOME_READ_MODEL_IMPLEMENTATION_REPORT_v0.1.md` | `docs/portfolio-lead/90-implementation-reports/PORTFOLIO_HOME_READ_MODEL_IMPLEMENTATION_REPORT_v0.1.md` | PH-2 | IMPLEMENTATION_EVIDENCE | Portfolio Home read model | Read-only backend evidence including `/api/v1/portfolio/home`; current-main re-test pending. | KEEP_IN_PLACE / RETEST |
| `PORTFOLIO_HOME_UX_RECONCILIATION_PH3A_v0.1.md` | `docs/portfolio-lead/90-implementation-reports/PORTFOLIO_HOME_UX_RECONCILIATION_PH3A_v0.1.md` | PH-3A | DESIGN_EVIDENCE | Portfolio Home UX | Target/design evidence only; PH-3B is not implemented. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md` | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md` | v0.1 | CURRENT_CONTRACT | Acceptance checklist | Entry acceptance reference. | KEEP_IN_PLACE |
| `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` | `docs/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` | v0.1 | TARGET_CANDIDATE | Proposed Experience Contract | Continuation contract; `CURRENT_STATE.md` says proposed/not implemented historically. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | Target: `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md`; observed: `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | v0.1 | CURRENT_REFERENCE | Agent Contract | Current legacy source with active consumers; reconcile target path before promotion. | LEGACY_SOURCE_PRESENT / TARGET_PATH_NOT_MATERIALIZED; KEEP_BASELINE / RECONCILE_PATH |
| `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md` | `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md` | v0.2 | CANDIDATE | Agent Contract candidate | Present in repository as candidate reconciliation stack; not active authority yet. | REVIEW_REQUIRED |
| `entry-01-intent-detection/SKILL.md` | Target: `docs/agents/portfolio-entry/skills/entry-01-intent-detection/SKILL.md`; observed: `doc/entry-01-intent-detection_SKILL_v0.1.md` | v0.1 | CURRENT_REFERENCE | Skill Contract | Current legacy source with active consumers; reconcile target path before promotion. | LEGACY_SOURCE_PRESENT / TARGET_PATH_NOT_MATERIALIZED; KEEP_BASELINE / RECONCILE_PATH |
| `entry-02-context-extraction/SKILL.md` | Target: `docs/agents/portfolio-entry/skills/entry-02-context-extraction/SKILL.md`; observed: `doc/entry-02-context-extraction_SKILL_v0.1.md` | v0.1 | CURRENT_REFERENCE | Skill Contract | Current legacy source with active consumers; reconcile target path before promotion. | LEGACY_SOURCE_PRESENT / TARGET_PATH_NOT_MATERIALIZED; KEEP_BASELINE / RECONCILE_PATH |
| `entry-03-reverse-alignment/SKILL.md` | Target: `docs/agents/portfolio-entry/skills/entry-03-reverse-alignment/SKILL.md`; observed: `doc/entry-03-reverse-alignment_SKILL_v0.1.md` | v0.1 | CURRENT_REFERENCE | Skill Contract | Current legacy source with active consumers; reconcile target path before promotion. | LEGACY_SOURCE_PRESENT / TARGET_PATH_NOT_MATERIALIZED; KEEP_BASELINE / RECONCILE_PATH |
| `entry-04-question-planner/SKILL.md` | Target: `docs/agents/portfolio-entry/skills/entry-04-question-planner/SKILL.md`; observed: `doc/entry-04-question-planner_SKILL_v0.1.md` | v0.1 | CURRENT_REFERENCE | Skill Contract | Current legacy source with active consumers; reconcile target path before promotion. | LEGACY_SOURCE_PRESENT / TARGET_PATH_NOT_MATERIALIZED; KEEP_BASELINE / RECONCILE_PATH |
| `entry-01-intent-detection/SKILL_v0.2.md` | `docs/agents/portfolio-entry/skills/entry-01-intent-detection/SKILL_v0.2.md` | v0.2 | CANDIDATE | Skill Contract | Candidate canonical skill for reconciliation. | REVIEW_REQUIRED |
| `entry-02-context-extraction/SKILL_v0.2.md` | `docs/agents/portfolio-entry/skills/entry-02-context-extraction/SKILL_v0.2.md` | v0.2 | CANDIDATE | Skill Contract | Candidate canonical skill for reconciliation. | REVIEW_REQUIRED |
| `entry-03-reverse-alignment/SKILL_v0.2.md` | `docs/agents/portfolio-entry/skills/entry-03-reverse-alignment/SKILL_v0.2.md` | v0.2 | CANDIDATE | Skill Contract | Candidate canonical skill for reconciliation. | REVIEW_REQUIRED |
| `entry-04-question-planner/SKILL_v0.2.md` | `docs/agents/portfolio-entry/skills/entry-04-question-planner/SKILL_v0.2.md` | v0.2 | CANDIDATE | Skill Contract | Candidate canonical skill for reconciliation. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | Target: `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`; observed: `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | v0.1 | CURRENT_REFERENCE | Harness | Current legacy source with active consumers; reconcile target path before promotion. | LEGACY_SOURCE_PRESENT / TARGET_PATH_NOT_MATERIALIZED; KEEP_BASELINE / RECONCILE_PATH |
| `PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md` | v0.2 | CANDIDATE_TEST_BASELINE | Harness candidate | Present in repository for reconciliation and validation; not active authority. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md` | Target: `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md`; no confirmed `doc/...` equivalent | v0.1 | CURRENT_REFERENCE | Harness execution spec | Target path is not materialized; source location requires verification. | VERIFY_PATH |
| `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md` | v0.2 | CANDIDATE_TEST_BASELINE | Harness execution spec | Present in repository for reconciliation and validation. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_FINDINGS_REGISTER.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_FINDINGS_REGISTER.md` | current | REFERENCE | Findings register | Existing Entry findings. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md` | v0.2 | EVIDENCE | Findings Register | Evidence for Portfolio Entry reconciliation; does not define product authority. | KEEP / INDEX |
| `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md` | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md` | v0.2.1 | CANDIDATE | Clarification/Handoff Contract | Present in repository for reconciliation; not active authority yet. | REVIEW_REQUIRED |
| `PHASE_5_CLOSURE_REPORT.md` | `docs/ai-harness/portfolio-entry/PHASE_5_CLOSURE_REPORT.md` | v0.2 phase 5 | IMPLEMENTED_VERIFIED | Harness report | Entry harness closure result. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md` | `docs/implementation/PORTFOLIO_ENTRY_CURRENT_STATE_AUDIT.md` | current | REFERENCE | Implementation audit | Entry factual state audit. | KEEP_IN_PLACE |
| `portfolio-entry-pack-traceability-v0.3.md` | `docs/implementation/portfolio-entry-pack-traceability-v0.3.md` | v0.3 | REFERENCE | Traceability | Entry pack traceability. | KEEP_IN_PLACE |
| `portfolio-entry-continuity-file-plan-v0.3.md` | `docs/implementation/portfolio-entry-continuity-file-plan-v0.3.md` | v0.3 | REFERENCE | File plan | Entry continuity implementation plan. | KEEP_IN_PLACE |
| `PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md` | `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md` | v0.1 | TARGET_CANDIDATE | Experience Contract candidate | Imported from provided docs; proposed for review and below Core. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_BOOTSTRAP_HOME_IMPLEMENTATION_AUDIT_v0.1.md` | `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_IMPLEMENTATION_AUDIT_v0.1.md` | v0.1 | REFERENCE | Implementation audit | Imported from provided docs; planning/factual reference. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_BOOTSTRAP_HOME_TECH_SPEC_v0.1.md` | `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_TECH_SPEC_v0.1.md` | v0.1 | TARGET_CANDIDATE | Tech Spec | Imported target spec; not authority above contracts. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_BOOTSTRAP_HOME_E2E_VALIDATION_REPORT_v0.1.md` | `PORTFOLIO_BOOTSTRAP_HOME_E2E_VALIDATION_REPORT_v0.1.md` | v0.1 | IMPLEMENTED_VERIFIED | Implementation report | Reports Bootstrap/Home GO through B5/HOME_D/E. | KEEP_IN_PLACE |
| `PORTFOLIO_BOOTSTRAP_IMPORT_VALIDATION_REPORT_v0.1.md` | `PORTFOLIO_BOOTSTRAP_IMPORT_VALIDATION_REPORT_v0.1.md` | v0.1 | IMPLEMENTED_VERIFIED | Implementation report | Reports manual/paste/CSV/XLSX import GO and security closure. | KEEP_IN_PLACE |
| `PORTFOLIO_INITIATIVE_PROJECTION_IMPLEMENTATION_REPORT_v0.1.md` | `PORTFOLIO_INITIATIVE_PROJECTION_IMPLEMENTATION_REPORT_v0.1.md` | v0.1 | IMPLEMENTED_VERIFIED | PG-1 report | Projection GO; read-only, derived on read. | KEEP_IN_PLACE |
| `DOMAIN_EVENT_ENVELOPE_IMPLEMENTATION_REPORT_v0.1.md` | `DOMAIN_EVENT_ENVELOPE_IMPLEMENTATION_REPORT_v0.1.md` | v0.1 | IMPLEMENTED_VERIFIED | PG-2 report | Common event envelope and `interaction_channel` GO. | KEEP_IN_PLACE |
| `PERMISSION_GUARD_CONSOLIDATION_REPORT_v0.1.md` | `PERMISSION_GUARD_CONSOLIDATION_REPORT_v0.1.md` | v0.1 | IMPLEMENTED_VERIFIED | PG-4 report | Permission guard consolidation GO. | KEEP_IN_PLACE |
| `CODEX_PG1_PORTFOLIO_INITIATIVE_PROJECTION_PROMPT_v0.1.md` | provided externally, not imported | v0.1 | ARCHIVE | Prompt | Historical execution aid only. | ARCHIVE |
| `CODEX_PG2_COMMON_EVENT_ENVELOPE_PROMPT_v0.1.md` | provided externally, not imported | v0.1 | ARCHIVE | Prompt | Historical execution aid only. | ARCHIVE |
| `CODEX_PG4_PERMISSION_GUARD_CONSOLIDATION_PROMPT_v0.1.md` | provided externally, not imported | v0.1 | ARCHIVE | Prompt | Historical execution aid only. | ARCHIVE |
| `CODEX_PG4_CLOSURE_AUTHORITY_GAP_PROMPT_v0.1.md` | provided externally, not imported | v0.1 | ARCHIVE | Prompt | Historical execution aid only. | ARCHIVE |
| `CODEX_PORTFOLIO_BOOTSTRAP_PR1_PROMPT_v0.1.md` through `PR9_1` | provided externally, not imported | v0.1 | ARCHIVE | Prompt series | Historical implementation prompts; not source of truth. | ARCHIVE |
| `CODEX_PORTFOLIO_LEAD_DOCUMENTATION_CONSOLIDATION_PROMPT_v0.1.md` | provided externally, not imported | v0.1 | ARCHIVE | Prompt | Historical execution aid for this documentation task; not source of truth. | ARCHIVE |
| `STARTERIA_NEXT_CHAT_HANDOFF_CONTEXT.md` | not found | unknown | UNKNOWN | Handoff reference | Requested by prompt but absent from repo and provided files. | REVIEW_REQUIRED |
| `02_PRD_SMART_ENTRY_ROUTING_Y_REVISION_INICIAL.md` | `docs/prds/copilot-first-v1/02_PRD_SMART_ENTRY_ROUTING_Y_REVISION_INICIAL.md` | v1 | REFERENCE | PRD | Historical PRD below contracts/specs. | KEEP_IN_PLACE |
| `03_PRD_DASHBOARD_ADAPTATIVO_STEPS_0_4.md` | `docs/prds/copilot-first-v1/03_PRD_DASHBOARD_ADAPTATIVO_STEPS_0_4.md` | v1 | REFERENCE | PRD | Steps context; not Portfolio-only authority. | KEEP_IN_PLACE |
| `06_PRD_PORTFOLIO_LEAD_IMPORTACION_Y_GOBERNANZA.md` | `docs/prds/copilot-first-v1/06_PRD_PORTFOLIO_LEAD_IMPORTACION_Y_GOBERNANZA.md` | v1 | REFERENCE | PRD | Portfolio import/governance historical PRD. | KEEP_IN_PLACE |
| `07_PRD_VALUE_INVESTMENT_READINESS_HANDOFF_Y_DECISION.md` | `docs/prds/copilot-first-v1/07_PRD_VALUE_INVESTMENT_READINESS_HANDOFF_Y_DECISION.md` | v1 | REFERENCE | PRD | Handoff/decision PRD background; below contracts. | KEEP_IN_PLACE |
| `docs/adr-2026-05-17-portfolio-lead-command-center.md` | `docs/adr-2026-05-17-portfolio-lead-command-center.md` | 2026-05-17 | ARCHIVE | Historical ADR-like note | Historical command center note; not product ADR authority. | REVIEW_REQUIRED |
| `STARTERIA_CRAZY8_01_04_CATALINA_AUDIT.md` | `STARTERIA_CRAZY8_01_04_CATALINA_AUDIT.md` | current | REFERENCE | Audit | Adjacent historical audit, not Portfolio Lead authority. | KEEP_IN_PLACE |
| `STARTERIA_E2E_CURRENT_STATE_TRUTH_MAP.md` | `STARTERIA_E2E_CURRENT_STATE_TRUTH_MAP.md` | current | REFERENCE | E2E state map | Useful current-state evidence; not authority. | KEEP_IN_PLACE |

## Duplicate Resolution

| Responsibility | Visible/current default | Older or unresolved versions | Resolution |
| --- | --- | --- | --- |
| Portfolio Entry logic | `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | No v0.2 logic contract installed | Canonical v0.1 source remains active; candidate v0.2 stack does not replace it. |
| Portfolio Entry agent | Target `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md`; observed `doc/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md` (installed candidate) | Keep v0.1 baseline; reconcile path and consumers before explicit promotion. |
| Portfolio Entry skills 01–04 | Targets under `docs/agents/portfolio-entry/skills/`; observed equivalents under `doc/entry-*_SKILL_v0.1.md` | Four installed `SKILL_v0.2.md` candidates | Keep v0.1 baseline; reconcile paths and consumers before explicit promotion. |
| Clarification/Handoff | No active v0.1 replacement declared | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md` (installed candidate) | Candidate subcontract below approved Experience Contract; validate before promotion. |
| Portfolio Entry harness | Target `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md`; observed `doc/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md` (installed candidate) | Keep v0.1 baseline; reconcile path and consumers before promotion. |
| Harness execution spec | Target `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md`; no confirmed `doc/...` equivalent | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md` (installed candidate) | Keep v0.1 baseline; verify source path before promotion. |
| Test findings | No authority baseline | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md` (installed evidence) | Evidence only; cannot promote contracts by itself. |
| Bootstrap/Home | `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md` | none observed in repo | Imported as current Bootstrap/Home contract reference below Core. |
| PG-4 | `PERMISSION_GUARD_CONSOLIDATION_REPORT_v0.1.md` | earlier AUTHORITY_GAP state superseded by same report final closure | Current report states GO and final closure block. |
| Portfolio -> Initiative Activation/Handoff | `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md` | external copy in user-provided Downloads | Repo copy is the indexed bounded-context Experience Contract; Current State Audit remains evidence only. |

## Documents Not Resolved

- `STARTERIA_STEPS_ARCHITECTURE_COMPARISON_AND_TARGET_v0.1.md` was requested but not found.
- `STARTERIA_NEXT_CHAT_HANDOFF_CONTEXT.md` was requested but not found.
- Portfolio Entry v0.2/v0.2.1 documents are installed in this repository by `eef32d6` as candidates. Promotion remains pending reference validation, harness validation, and explicit authority update.
- Target governance paths under `docs/...` are not materialized for several v0.1 artifacts. Equivalent/legacy sources remain under `doc/...`, including Portfolio Entry contracts, Agent, Skills, Harness, and the historical Core contract `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`; active consumers require reconciliation before any promotion. Do not infer supersession from path differences.
- Prompt series files remain historical aids and are not indexed as source of truth.

## Recommendations

- Keep `docs/portfolio-lead/README.md` as the default entry point for future chats.
- Do not move root implementation reports until links and references are audited.
- Add status banners only when editing legacy documents for another reason; do not rewrite history merely to make it tidy.
- Resolve missing Steps architecture and next-chat handoff references before the Activation/Handoff Tech Spec.
- Treat `Portfolio -> Initiative Activation/Handoff` as the next bounded context, not as implemented.
- Use `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_ACTIVATION_EXPERIENCE_CONTRACT_v0.1.md` as the bounded-context target before H-1 implementation.
- Keep `docs/portfolio-lead/05-activation-handoff/PORTFOLIO_TO_INITIATIVE_HANDOFF_CURRENT_STATE_AUDIT_v0.1.md` outside the authority chain as factual evidence only.
