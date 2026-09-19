# Portfolio Entry References

**Reconciliation status:** v0.1 is the current executable/reference baseline; v0.2/v0.2.1 is a candidate stack present in the repository. Promotion is pending reference and harness validation plus an explicit authority update. The candidate stack does not supersede v0.1.

## Current baseline (v0.1)

- `doc/experience/portfolio-entry/PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md` — active approved Experience Contract.
- `docs/experience/portfolio-entry/PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md` — acceptance reference.
- `docs/agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md` and `docs/agents/portfolio-entry/skills/entry-01-intent-detection/SKILL.md` through `entry-04-question-planner/SKILL.md` — current Agent/Skill reference baseline.
- `docs/ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md` and `PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.1.md` — current harness reference baseline.
- `docs/experience/portfolio-entry/PORTFOLIO_POST_ENTRY_CONTINUATION_CONTRACT_v0.1.md` — proposed, not implemented.

The target `docs/...` v0.1 paths are not materialized in this branch. Equivalent/legacy v0.1 artifacts remain present under `doc/...` and still have active consumers. Path and consumer reconciliation is required before any promotion or supersession.

## Installed candidate stack (v0.2/v0.2.1)

- [Clarification/Handoff Contract v0.2.1](../../experience/portfolio-entry/PORTFOLIO_ENTRY_CLARIFICATION_HANDOFF_CONTRACT_v0.2.1.md) — candidate experience/orchestration subcontract.
- [Agent Contract v0.2](../../agents/portfolio-entry/PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.2.md) — candidate.
- Candidate skills: [01 intent detection](../../agents/portfolio-entry/skills/entry-01-intent-detection/SKILL_v0.2.md), [02 context extraction](../../agents/portfolio-entry/skills/entry-02-context-extraction/SKILL_v0.2.md), [03 reverse alignment](../../agents/portfolio-entry/skills/entry-03-reverse-alignment/SKILL_v0.2.md), [04 question planner](../../agents/portfolio-entry/skills/entry-04-question-planner/SKILL_v0.2.md).
- [AI Harness v0.2](../../ai-harness/portfolio-entry/PORTFOLIO_ENTRY_AI_HARNESS_v0.2.md) and [Harness Execution Spec v0.2](../../ai-harness/portfolio-entry/PORTFOLIO_ENTRY_HARNESS_EXECUTION_SPEC_v0.2.md) — candidate test baseline.
- [Test Findings Register v0.2](../../ai-harness/portfolio-entry/PORTFOLIO_ENTRY_TEST_FINDINGS_REGISTER_v0.2.md) — evidence only; no product authority.

See the [Document Inventory](../DOCUMENT_INVENTORY.md) and [candidate stack install note](../../reconciliation/PORTFOLIO_ENTRY_V2_CANDIDATE_STACK_INSTALL_NOTE.md). No runtime or executable consumer has been switched to v0.2.
