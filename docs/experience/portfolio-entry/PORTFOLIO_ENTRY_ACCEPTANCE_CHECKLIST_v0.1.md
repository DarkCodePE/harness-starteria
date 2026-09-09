# Portfolio Entry — Acceptance & No-Regression Checklist

**Documento:** `PORTFOLIO_ENTRY_ACCEPTANCE_CHECKLIST_v0.1.md`  
**Versión:** v0.1  
**Fecha:** 2026-09-09

Use this checklist in audit, implementation review and PR review.

# A. Value / UX

- [ ] Headline: `Convierte tus iniciativas en decisiones conectadas al negocio.`
- [ ] Main question: `¿Qué necesitas conseguir o entender de tus iniciativas?`
- [ ] Natural-language textarea is present.
- [ ] User can start without knowing Starteria taxonomy.
- [ ] Example chips are present.
- [ ] Example chips remain editable.
- [ ] CTA is `Analizar mi situación`.
- [ ] `ALINEAR → DETECTAR → SEGUIR → DECIDIR` is communicated appropriately.
- [ ] Illustrative preview exists.
- [ ] Preview is explicitly labeled as an example.
- [ ] Preview does not react like real analysis.

# B. Public P0 scope

- [ ] No XLSX upload.
- [ ] No CSV upload.
- [ ] No PDF upload.
- [ ] No PPTX upload.
- [ ] No DOCX upload.
- [ ] No URL input.
- [ ] No Drive.
- [ ] No SharePoint.
- [ ] UI may explain that real initiatives can be imported after workspace creation.
- [ ] No disabled upload UI that implies unavailable functionality.

# C. Entry interpretation

- [ ] `strategy_first`
- [ ] `portfolio_first`
- [ ] `initiative_first`
- [ ] `solution_first`
- [ ] `problem_first`
- [ ] `opportunity_first`
- [ ] `decision_first`
- [ ] `reporting_first`
- [ ] `unknown`

# D. Intent interpretation

- [ ] `strategic_goal`
- [ ] `portfolio_alignment`
- [ ] `portfolio_tracking`
- [ ] `portfolio_prioritization`
- [ ] `portfolio_reporting`
- [ ] `initiative_governance`
- [ ] `unknown`
- [ ] primary and secondary intents can coexist where justified.

# E. Extraction

- [ ] Extract goal only when supported.
- [ ] Extract metric only when supported.
- [ ] Extract target only when supported.
- [ ] Extract baseline only when supported.
- [ ] Extract horizon only when supported.
- [ ] Extract problem/opportunity/solution only when supported.
- [ ] Extract portfolio size only when supported.
- [ ] Do not invent KPI.
- [ ] Do not invent baseline.
- [ ] Do not invent target.
- [ ] Do not invent evidence.
- [ ] Contradictions remain visible.

# F. Reverse alignment

- [ ] `solution_first` can trigger reverse alignment.
- [ ] `initiative_first` can trigger reverse alignment when strategic connection is insufficient.
- [ ] Missing links are identified across:
  - [ ] expected change
  - [ ] metric/signal
  - [ ] business intent
  - [ ] continuity criterion
- [ ] Reverse alignment does not create Initiative.
- [ ] Reverse alignment does not activate Steps.

# G. Question planning

- [ ] Planner may return zero questions.
- [ ] Planner returns at most ~3 critical questions.
- [ ] Questions prioritize material ambiguity.
- [ ] Screen 1 plans; Screen 2 asks.
- [ ] Landing does not become a long wizard.

# H. Provenance

- [ ] `USER_DECLARED`
- [ ] `EXTRACTED_FROM_USER_TEXT`
- [ ] `AI_INFERRED`
- [ ] `AI_SUGGESTED`
- [ ] review state is separate from origin.
- [ ] `AI_INFERRED` never silently becomes `USER_CONFIRMED`.
- [ ] Raw input is preserved.
- [ ] Analysis version is traceable.

# I. Temporary persistence

- [ ] `PortfolioEntryDraft` or semantically equivalent provisional object exists.
- [ ] `PortfolioEntryAnalysis` or semantically equivalent provisional object exists.
- [ ] Semantic equivalence to any reused legacy model is documented.
- [ ] Draft failure/retry does not create canonical objects.

# J. Canonical-object guard

Submitting Screen 1 MUST NOT create:

- [ ] Organization
- [ ] StrategicFront
- [ ] Challenge
- [ ] Initiative
- [ ] Evidence
- [ ] Step
- [ ] Decision

# K. Handoff to Screen 2

- [ ] raw input
- [ ] primary intent
- [ ] secondary intents
- [ ] Entry State
- [ ] extracted context
- [ ] ambiguities
- [ ] critical gaps
- [ ] reverse alignment flag
- [ ] reverse alignment gap
- [ ] question plan
- [ ] provenance

# L. Error / edge cases

- [ ] Too-short input handled without hallucination.
- [ ] Ambiguous input preserved.
- [ ] Contradictory input preserved.
- [ ] Multiple intents supported.
- [ ] Selected example is distinguishable from typed input.
- [ ] Prompt-injection-like user text cannot expand AI authority.
- [ ] AI failure preserves provisional input safely.

# M. Core / Step no-regression

- [ ] No Step 0 contract modified.
- [ ] No Step 1 contract modified.
- [ ] No Step 2 contract modified.
- [ ] No Step 3 contract modified.
- [ ] No Step 4 contract modified.
- [ ] No Adaptive Cycle behavior modified.
- [ ] No adaptive checkpoint behavior modified.
- [ ] No Step sufficiency rule modified.
- [ ] No transition gating modified.
- [ ] No Initiative Cycle semantics modified.
- [ ] No corporate domain cardinality modified.
- [ ] No AI organizational authority expanded.
- [ ] No automatic alignment confirmation added.

# N. Audit before implementation

- [ ] Current `/` route inspected.
- [ ] Current `/public/start` route inspected.
- [ ] Frontend components mapped.
- [ ] Backend handlers/services mapped.
- [ ] Current persistence mapped.
- [ ] Current PublicDraft semantics mapped.
- [ ] Current conversion-to-Initiative flow mapped.
- [ ] Current Step0 dependency mapped.
- [ ] Current AI prompts/services mapped.
- [ ] Current analytics mapped.
- [ ] Current tests mapped.
- [ ] KEEP / ADAPT / REMOVE / NEW matrix produced.
- [ ] ADR candidates identified.
- [ ] Implementation slices proposed.
