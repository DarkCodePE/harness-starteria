# Portfolio Lead Document Inventory

Status: documentation inventory
Date: 2026-09-15
Scope: Portfolio Lead documentation, contracts, reports, target candidates, prompts, and unresolved references

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
| `STARTERIA_CORE_LOGIC_CONTRACT.md` | `docs/core/STARTERIA_CORE_LOGIC_CONTRACT.md` | v0.3 candidate | TARGET_CANDIDATE | Core Contract | Highest logical reference, but factual state is candidate/re-test. | KEEP_IN_PLACE |
| `ADR-INDEX.md` | `docs/product-adr/ADR-INDEX.md` | current | REFERENCE | Approved/proposed ADR index | Product ADR entry point. | KEEP_IN_PLACE |
| `ADR-028-portfolio-lead-platform-role.md` | `backend/docs/adr/ADR-028-portfolio-lead-platform-role.md` | ADR-028 | REFERENCE | Product/auth reference | Defines `portfolio_lead` role history. | KEEP_IN_PLACE |
| `ADR-029-permission-based-authorization.md` | `backend/docs/adr/ADR-029-permission-based-authorization.md` | ADR-029 | REFERENCE | Product/auth reference | Permission and multi-role background for PG-4. | KEEP_IN_PLACE |
| `ADR-030-challenge-and-initiative-state-machine.md` | `backend/docs/adr/ADR-030-challenge-and-initiative-state-machine.md` | ADR-030 | REFERENCE | Product lifecycle reference | Legacy state machine context; not Activation/Handoff completion. | KEEP_IN_PLACE |
| `ADR-031-portfolio-entry-continuation-to-portfolio.md` | `docs/product-adr/ADR-031-portfolio-entry-continuation-to-portfolio.md` | ADR-031 | TARGET_CANDIDATE | Product ADR proposed | Proposed Portfolio continuation decision; not approved authority. | KEEP_IN_PLACE |
| `STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md` | `docs/portfolio-lead/01-architecture/STARTERIA_PORTFOLIO_ARCHITECTURE_PLUGIN_READINESS_COMPARISON_v0.1.md` | v0.1 | REFERENCE | Architecture reference | Imported from provided docs for discoverability. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md` | `docs/portfolio-lead/04-channel-independence/PORTFOLIO_GOVERNANCE_INTERACTION_CONTRACT_v0.1.md` | v0.1 | TARGET_CANDIDATE | Experience/interaction contract candidate | Governs channel-independence target; not higher than Core/ADRs. | COPY_REFERENCE_ONLY |
| `PORTFOLIO_GOVERNANCE_CHANNEL_INDEPENDENCE_AUDIT_v0.1.md` | `PORTFOLIO_GOVERNANCE_CHANNEL_INDEPENDENCE_AUDIT_v0.1.md` | v0.1 | REFERENCE | Factual audit | Pre-PG implementation audit; useful historical baseline. | KEEP_IN_PLACE |
| `PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md` | `PORTFOLIO_TO_STEPS_SINGLE_PATH_AUDIT_v0.1.md` | v0.1 | REFERENCE | Factual audit | Defines remaining Activation/Handoff gap and single-path risks. | KEEP_IN_PLACE |
| `STARTERIA_STEPS_ARCHITECTURE_COMPARISON_AND_TARGET_v0.1.md` | not found | v0.1 | UNKNOWN | Architecture dependency | Requested as Steps dependency; absent from repo and provided files. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | v0.1 | CURRENT_CONTRACT | Approved Experience Contract | Active authority for Portfolio Entry/Pantalla 1. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md` | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md` | v0.1 | CURRENT_CONTRACT | Acceptance checklist | Entry acceptance reference. | KEEP_IN_PLACE |
| `PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` | `docs/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` | v0.1 | TARGET_CANDIDATE | Proposed Experience Contract | Continuation contract; `CURRENT_STATE.md` says proposed/not implemented historically. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | v0.1 | TARGET_CANDIDATE | Agent Contract | Proposed agent contract. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md` | provided externally, not imported | v0.2 | UNKNOWN | Agent Contract candidate | Duplicate/newer external candidate; not repository authority. | REVIEW_REQUIRED |
| `entry-01-intent-detection/SKILL.md` | `docs/agents/portfolio-entry/skills/entry-01-intent-detection/SKILL.md` | v0.1 | TARGET_CANDIDATE | Skill Contract | Intent detection skill candidate. | KEEP_IN_PLACE |
| `entry-02-context-extraction/SKILL.md` | `docs/agents/portfolio-entry/skills/entry-02-context-extraction/SKILL.md` | v0.1 | TARGET_CANDIDATE | Skill Contract | Context extraction skill candidate. | KEEP_IN_PLACE |
| `entry-03-reverse-alignment/SKILL.md` | `docs/agents/portfolio-entry/skills/entry-03-reverse-alignment/SKILL.md` | v0.1 | TARGET_CANDIDATE | Skill Contract | Reverse alignment skill candidate. | KEEP_IN_PLACE |
| `entry-04-question-planner/SKILL.md` | `docs/agents/portfolio-entry/skills/entry-04-question-planner/SKILL.md` | v0.1 | TARGET_CANDIDATE | Skill Contract | Question planner skill candidate. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | v0.1 | REFERENCE | Harness | Existing harness reference. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md` | provided externally, not imported | v0.2 | UNKNOWN | Harness candidate | Newer external duplicate; needs explicit import/approval decision. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md` | v0.1 | REFERENCE | Harness execution spec | Existing repo execution spec. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md` | provided externally, not imported | v0.2 | UNKNOWN | Harness candidate | Newer external duplicate; needs approval/import decision. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_FINDINGS_REGISTER.md` | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_FINDINGS_REGISTER.md` | current | REFERENCE | Findings register | Existing Entry findings. | KEEP_IN_PLACE |
| `PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md` | provided externally, not imported | v0.2 | UNKNOWN | Findings candidate | Newer external duplicate. | REVIEW_REQUIRED |
| `PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md` | provided externally, not imported | v0.2.1 | UNKNOWN | Contract candidate | Requested handoff area; not in repo. | REVIEW_REQUIRED |
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
| Portfolio Entry logic | `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` | `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` in provided external docs | Repo version remains active authority per `CURRENT_STATE.md`. |
| Portfolio Entry agent | `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` | external `v0.2` | Do not elevate `v0.2` until reviewed/imported. |
| Portfolio Entry harness | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` | external `v0.2` | Repo version remains indexed; external `v0.2` needs review. |
| Harness execution spec | `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md` | external `v0.2` | Repo version remains indexed; external `v0.2` needs review. |
| Bootstrap/Home | `docs/portfolio-lead/03-bootstrap-home/PORTFOLIO_BOOTSTRAP_HOME_LOGIC_CONTRACT_v0.1.md` | none observed in repo | Imported as current Bootstrap/Home contract reference below Core. |
| PG-4 | `PERMISSION_GUARD_CONSOLIDATION_REPORT_v0.1.md` | earlier AUTHORITY_GAP state superseded by same report final closure | Current report states GO and final closure block. |

## Documents Not Resolved

- `STARTERIA_STEPS_ARCHITECTURE_COMPARISON_AND_TARGET_v0.1.md` was requested but not found.
- `STARTERIA_NEXT_CHAT_HANDOFF_CONTEXT.md` was requested but not found.
- External Portfolio Entry `v0.2` and clarification handoff documents exist in provided local files but were not promoted because repository authority names `v0.1` as active and the newer files need explicit status review.
- Prompt series files remain historical aids and are not indexed as source of truth.

## Recommendations

- Keep `docs/portfolio-lead/README.md` as the default entry point for future chats.
- Do not move root implementation reports until links and references are audited.
- Add status banners only when editing legacy documents for another reason; do not rewrite history merely to make it tidy.
- Resolve missing Steps architecture and next-chat handoff references before the Activation/Handoff Tech Spec.
- Treat `Portfolio -> Initiative Activation/Handoff` as the next bounded context, not as implemented.
