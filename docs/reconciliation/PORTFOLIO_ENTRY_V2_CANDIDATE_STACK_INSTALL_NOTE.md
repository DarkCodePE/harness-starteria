# Portfolio Entry V2 Candidate Stack — Install Note

**Status:** CANDIDATE / RECONCILIATION
**Purpose:** install the v0.2/v0.2.1 documentation stack alongside the existing v0.1 baseline without deleting or superseding v0.1 yet.

## Included

- Clarification + Handoff Contract v0.2.1
- Portfolio Entry Agent Contract v0.2
- Skill 01 v0.2 candidate
- Skill 02 v0.2 candidate
- Skill 03 v0.2 candidate
- Skill 04 v0.2 candidate
- Portfolio Entry AI Harness v0.2
- Harness Execution Spec v0.2
- Test Findings Register v0.2

## Canonical candidate skill sources used

- Skill 01: v0.2_adjusted
- Skill 02: v0.2_adjusted
- Skill 03: v0.2
- Skill 04: v0.2_adjusted

## Normalizations applied

Only governance/document-reference normalization was applied:

- Findings references `v0.1` -> `v0.2`
- Clarification/Handoff references `v0.2` -> `v0.2.1`
- candidate skill paths use `SKILL_v0.2.md` so current `SKILL.md` v0.1 is not overwritten
- the `Documento` field in candidate skill files was changed to `SKILL_v0.2.md`

No product semantics were intentionally changed.

## Important

This installation does NOT:

- supersede `PORTFOLIO_ENTRY_LOGIC_CONTRACT_v0.1.md`;
- replace current `SKILL.md` v0.1 files;
- mark v0.1 Agent/Harness documents as deprecated;
- modify runtime/product code;
- modify Core, Steps, Prisma, backend, frontend, Docker or CD.

Promotion/supersession must happen only after repository reconciliation and validation.
