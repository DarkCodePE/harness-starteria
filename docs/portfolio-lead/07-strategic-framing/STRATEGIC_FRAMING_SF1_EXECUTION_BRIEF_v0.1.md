# CODEX — SF-1 Strategic Framing Current-State Audit v0.1

## Objective

Execute **SF-1 Current-State Audit** for the now human-approved Strategic Framing baseline.

Repository:
`DarkCodePE/harness-starteria`

Required branch:
`docs/portfolio-home-v2-authority`

Expected pushed head:
`591d23dbbb2ee169bea471c9259d1a0f5eab61b8`

SF-0 is APPROVED.
SF-1 is the next authorized slice.

This task is **AUDIT ONLY**.

Do not implement Strategic Framing.
Do not modify runtime.
Do not modify Prisma/schema/migrations.
Do not add routes/endpoints.
Do not add Copilot capabilities.
Do not modify Portfolio Home.
Do not modify Portfolio Entry.
Do not modify Steps.
Do not commit.
Do not push.

---

# 1. Authority to read first

Read in this order:

1. `AGENTS.md`
2. `CURRENT_STATE.md`
3. `STARTERIA_V2_MANIFEST.md`
4. `docs/STARTERIA_AUTHORITY.md`
5. `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`
6. approved product ADRs relevant to Portfolio / Bootstrap / Copilot / Challenge
7. `docs/portfolio-lead/00-authority/STARTERIA_GLOSSARY_AND_CONTEXT_MAP_v0.1.md`
8. all files under `docs/portfolio-lead/07-strategic-framing/`
9. Portfolio Bootstrap contracts/specs under `docs/portfolio-lead/03-bootstrap-home/`
10. Portfolio Home contracts under `docs/portfolio-lead/06-portfolio-home-governance/`
11. Activation/Handoff target contract
12. Portfolio Entry active logic/agent/runtime contracts

Preserve the approved SF-0 model.

---

# 2. Approved SF-0 baseline that SF-1 must audit against

## Multi-entry

```text
Public Entry
Enterprise Direct
Existing Portfolio / imported work
        ↓
Strategic Interpretation
        ↓
front_like / challenge_like / initiative_like / unresolved
        ↓
sufficient strategic reference / Portfolio Anchor
        ↓
Strategic Framing
```

## Canonical corporate hierarchy

```text
Strategic Front
→ Challenge
→ Initiative
```

## Candidate Challenge boundary

```text
candidate Challenge
→ Strategic Front resolved/confirmed
→ explicit human promotion
→ canonical Challenge
```

A canonical `Challenge` currently requires a Strategic Front.

## Signal separation

```text
Movement Signal
!= Contribution Signal
!= Business Outcome
```

and:

```text
expected contribution
!= observed contribution
!= attributed contribution
```

## Copilot boundary

```text
Structured workspace = system of record
Copilot = cognitive/advisory layer
```

## Promotion boundary

```text
Observation
→ Driver / Gap / Opportunity
→ Prioritization
→ Human confirmation
→ Challenge
```

No automatic Challenge from Lens, AI inference or Gap.

---

# 3. Audit question

Answer:

> What already exists in Startería that can safely support the approved Strategic Framing experience, what must be adapted, what is missing, and what must NOT be reused because it would violate the approved boundaries?

Do not answer with architectural preference alone.

Every material finding must cite:
- file/path;
- relevant symbol/service/type/route/component;
- factual current behavior;
- classification;
- SF-0 rule it supports/conflicts with.

---

# 4. Required classification

Classify every relevant current component as one of:

```text
REUSE_AS_IS
REUSE_WITH_ADAPTER
EXTEND_LATER
LEGACY_COMPAT_ONLY
DO_NOT_REUSE_FOR_SF
MISSING
ADR_REQUIRED_IF_CHANGED
UNKNOWN
```

Also classify state as:

```text
CANONICAL
GOVERNED_STAGING
DERIVED
PROVISIONAL
LEGACY_DERIVED
UI_ONLY
UNKNOWN
```

Do not call persisted data canonical merely because it exists in Prisma.

---

# 5. Audit Area A — Portfolio Entry / Strategic Interpretation reuse

Inspect current Portfolio Entry runtime, including at minimum:

- semantic state / semantic projection;
- `initialEntryState`;
- `primaryIntent`;
- `reverseAlignment`;
- extracted context;
- ambiguities;
- contradictions;
- question planning;
- handoff;
- provenance;
- session lifecycle;
- active question / convergence behavior;
- current AI/runtime adapter boundary.

Determine:

1. Which pieces already perform reusable **Strategic Interpretation** cognition?
2. Which are tightly coupled to the public Entry experience?
3. Can the cognition be reused from Enterprise Direct / Existing Portfolio without replaying the public Entry UX?
4. Is there an application/service boundary today that supports reuse, or is cognition embedded in Entry session orchestration?
5. What would need extraction/adaptation in a future slice?
6. Which output fields map cleanly to:
   - intended movement;
   - why it matters;
   - signal/proxy;
   - scope assessment;
   - parent context;
   - reverse-alignment findings;
   - provenance;
   - open uncertainties?
7. Is `front_like / challenge_like / initiative_like / unresolved` represented anywhere today?
8. Is any current inference silently treated as confirmed state?

Do not implement extraction.

---

# 6. Audit Area B — Portfolio Bootstrap / Anchor / staging

Inspect actual runtime and schema under:

- `backend/modules/portfolio-bootstrap/`
- `front/src/features/portfolio-lead/bootstrap/`
- relevant Prisma models;
- Bootstrap router/controller/service/repository/projection;
- tests.

Audit at minimum:

### Portfolio Anchor
- actual persisted fields;
- statuses;
- history/versioning;
- provenance;
- confirmation;
- source continuation dependency;
- sufficiency rules.

Determine whether current Anchor can support approved SF-0 semantics:

```text
Anchor != Strategic Front
Anchor != corporate strategy
Anchor sufficient != all parent hierarchy resolved
```

Check whether it can express:
- parent context known/provisional/unresolved;
- why it matters;
- signal/proxy;
- decision to enable;
- open uncertainty.

### Work Items
Audit:
- manual intake;
- paste;
- CSV/XLSX import if now implemented;
- ownerCandidate;
- source/provenance;
- current-state hints.

Preserve:
`Work Item != Initiative`.

### StrategicConnection
Audit:
- probable/partial/unknown/misalignment states;
- human confirmation;
- whether connection is to Anchor only or canonical Front/Challenge;
- whether it can support pending alignment.

### ProposedMutation
Audit:
- target types;
- mutation types;
- confirmationRequired;
- provenance;
- materiality;
- lifecycle;
- whether this infrastructure can safely host future Strategic Framing proposals.

Important:
Do NOT assume existing `ProposedMutation` is automatically the SF staging model.
Classify whether it is:
- reusable as-is;
- reusable with adapter;
- too Bootstrap-specific;
- insufficient for candidate Front / candidate Challenge.

### Analysis engine
Audit current Bootstrap analyzer:
- deterministic vs AI;
- what it detects;
- whether it performs clustering;
- whether it identifies business signal / decision path / dependency / context / ownership gaps;
- whether it creates only proposals.

Explicitly verify the known hypothesis:
**semantic clustering into candidate Fronts/Challenges is not productively implemented.**

---

# 7. Audit Area C — Multi-entry reality

Audit actual user entry paths:

## Public Entry
Map:
```text
/public/start
→ Portfolio Entry
→ handoff/confirmation
→ auth/continuation
→ Portfolio Bootstrap
```

## Direct authenticated Portfolio access
Inspect:
- login redirect/resolver;
- `/portfolio/inicio`;
- conditions under which `PortfolioBootstrapHome` renders;
- behavior when there is NO `portfolioEntryContinuationId`.

Determine factual status of known gap:

`PL-GAP-01 — Direct Portfolio entry bypasses governed setup`

## Existing Portfolio
Audit whether an existing organization/user can:
- start from existing Strategic Fronts;
- start from existing Challenges;
- import work;
- invoke reverse alignment;
- enter a governed Strategic Interpretation / Framing experience.

Return exact current behavior.

Do not add navigation.

---

# 8. Audit Area D — Strategic Front runtime

Inspect:

- Prisma `StrategicFront`;
- portfolio backend service/controller/router/schemas;
- frontend types;
- adapters;
- Strategic Front pages/forms;
- `PortfolioLeadContext`;
- tests.

Map:

### Canonical fields
Which fields are actually persisted and returned?

### UI-only / dropped fields
Explicitly test known gap:

`PL-GAP-02 — Strategic Front persistence mismatch`

Prior evidence indicates the UI captures fields such as:
- `sponsorEmail`
- `threshold`
- `area`
- `endDate`
- `notes`

while `toBackendStrategicFront()` forwards a smaller set.

Confirm current truth. Do not fix it.

### Mutation behavior
Confirm whether:
- direct UI create/update writes canonical StrategicFront immediately;
- optimistic frontend state precedes backend result;
- there is any candidate/proposal state before creation;
- human confirmation boundary exists beyond clicking create/save.

Classify current mutation path for future SF use.

Important:
Strategic Framing must not use direct canonical Front creation as its staging mechanism.

---

# 9. Audit Area E — Challenge runtime / candidate Challenge feasibility

Inspect:

- Prisma `Challenge`;
- create/update service;
- schemas;
- frontend `CreateChallengeInput`;
- Challenge pages;
- `PortfolioLeadContext`.

Confirm:

```text
Challenge.strategicFrontId = required
```

Audit:
- whether any non-canonical candidate Challenge representation exists today;
- whether Bootstrap `ProposedMutation` could represent one without schema change;
- whether another staging object already exists;
- whether current UI creates canonical Challenge directly;
- whether Challenge creation can occur without Front;
- whether any current behavior auto-creates/selects Front.

Do not make `strategicFrontId` nullable.

Return:

```text
CAN CANDIDATE CHALLENGE REMAIN NON-CANONICAL TODAY?
YES / PARTIAL / NO
```

with evidence.

If the only way to support candidate Challenge would be canonical orphan Challenge, mark:

`ADR_REQUIRED_IF_CHANGED`

Do not open the ADR in SF-1.

---

# 10. Audit Area F — Initiative / pending alignment / imported work

Inspect:

- Project / Initiative current identity;
- `InitiativePortfolioMeta`;
- bootstrap work-item → portfolio relationships;
- current alignment fields/states;
- import flows;
- existing Project creation from Challenge;
- retroactive alignment behavior if any.

Determine:

1. Can an imported/existing Initiative remain `pending alignment` without a canonical Front/Challenge?
2. Where is that state represented today?
3. Is it canonical, staging, legacy-derived or absent?
4. Does creating a Project from Challenge currently collapse:
   - Challenge;
   - Invitation;
   - Accept;
   - Initiative shell;
   - Start;
   - Step activation?

Do not fix Activation/Handoff here.
Only register any collision relevant to Strategic Framing.

---

# 11. Audit Area G — Copilot infrastructure

Inspect:

- `backend/modules/copilot/application/capability-registry.ts`
- orchestration service;
- assessment adapter(s);
- action plans;
- proposed actions;
- approval service;
- action executor;
- authorization;
- feature guard;
- frontend Copilot shell;
- tests.

Confirm current productive capabilities.

Known hypothesis to verify:

```text
CreateStrategicFront = productive capability
CreateChallenge = not productive
AssignInitiativeOwner = not productive
Clustering / Strategic Framing proposal capability = not productive
```

Separate:

### Reusable orchestration infrastructure
Potential:
- conversation;
- assessment;
- ActionPlan;
- ProposedAction;
- approval;
- executor;
- audit.

### Business capability coverage
Current commands actually available.

Determine whether SF can reuse the orchestration shell while keeping:

```text
Copilot suggestion
→ proposed structured state
→ explicit human apply/confirm
```

Do not add capabilities.

---

# 12. Audit Area H — UI surfaces and routing

Map the current Portfolio Lead surfaces relevant to SF:

- `/portfolio/inicio`
- Strategic Front list/detail/create/edit;
- Challenge list/detail/create/edit;
- Bootstrap experience;
- Copilot shell/drawer;
- navigation;
- any Portfolio Anchor / reading surfaces.

For each surface answer:
- current job;
- source of truth;
- mutations available;
- whether it belongs to Bootstrap, Strategic Framing, Home or legacy mixed UI;
- whether SF should reuse the component, pattern only, or not reuse.

Do NOT design the final SF UI yet.

However, produce a factual **host analysis**:

```text
OPTION A — extend existing Bootstrap surface
OPTION B — new Strategic Framing workspace/route
OPTION C — extend Front detail/create surface
OPTION D — other existing host
```

For each option give:
- what current code supports;
- collisions/risks;
- what SF-0 boundary it may violate;
- whether SF-2 should decide it.

Do not select based on aesthetics.
A recommendation is allowed only from architectural fit/evidence.

---

# 13. Audit Area I — Permissions and authorization

Map permissions used by:

- Portfolio Bootstrap reads/writes;
- Portfolio Front reads/writes;
- Challenge reads/writes;
- Copilot CreateStrategicFront;
- Portfolio Home;
- relevant imported-work operations.

Determine minimum current permissions required for future:
- view Framing;
- edit provisional Framing;
- confirm material interpretation;
- create canonical Front;
- promote canonical Challenge.

Do NOT create a new permission model.

Flag where current authorization is:
- explicit;
- inherited/implicit;
- authenticated-only;
- missing/unclear.

---

# 14. Audit Area J — Tests / harness / evidence reuse

Inventory tests relevant to:

- Portfolio Entry interpretation;
- Bootstrap Anchor;
- Bootstrap analysis;
- ProposedMutation confirmation;
- StrategicConnection;
- Strategic Front create/update;
- Challenge requires Front;
- Copilot approval/execution;
- Portfolio Home read model boundary;
- no Steps writes.

Classify tests as:
- reusable contract protection;
- needs extension in SF-2+;
- legacy behavior conflicting with SF-0;
- unrelated.

Do NOT change tests.

---

# 15. Required current-state journey map

Produce the factual current journey, based on code:

```text
CURRENT PUBLIC PATH:
...

CURRENT DIRECT AUTH PATH:
...

CURRENT EXISTING-PORTFOLIO PATH:
...
```

Then compare with approved target:

```text
TARGET:
Entry / Enterprise Direct / Existing Portfolio
→ Strategic Interpretation
→ sufficient Anchor
→ Strategic Framing
→ governed Front / candidate Challenge / priority
→ later Home / Activation
```

Mark each transition:

```text
IMPLEMENTED
PARTIAL
MISSING
LEGACY_COLLISION
```

---

# 16. Required reuse map

Produce a table:

| Capability needed by SF | Current component | Current state classification | Reuse classification | Gap | Earliest slice |
|---|---|---|---|---|---|

At minimum cover:

- Strategic Interpretation
- scope assessment
- Portfolio Anchor
- provenance
- uncertainty
- reverse alignment
- existing-work intake
- pending alignment
- ProposedMutation/human review
- candidate Front
- candidate Challenge
- adaptive depth
- lenses
- observations
- drivers/gaps/opportunities
- prioritization
- capacity/horizon reasoning
- canonical Front promotion
- canonical Challenge promotion
- Copilot suggestions
- no-Copilot structured workflow
- Home integration

---

# 17. Required risk / conflict register

Create findings IDs:

```text
SF1-F01...
```

Each finding must contain:
- severity: BLOCKER / MATERIAL / MINOR / INFO
- current behavior
- evidence path/symbol
- SF-0 rule affected
- treatment:
  - KEEP
  - ADAPT
  - ISOLATE
  - RETIRE
  - ADR_CANDIDATE
  - DEFER
- target slice

At minimum explicitly assess:

- direct login bypass;
- Front persistence mismatch;
- candidate Challenge staging absence/presence;
- Copilot single-capability limitation;
- no clustering;
- ownerCandidate != ownership;
- current Project-from-Challenge lifecycle collapse;
- PH frontend still not consuming PH-2;
- Portfolio Home authorization debt only if relevant to SF boundary.

Do not solve them.

---

# 18. Required SF-2 recommendation

At the end, recommend the **smallest safe SF-2 slice**.

SF-2 is defined as:

`Strategic Framing Read Model`

The recommendation must answer:

1. What should SF-2 read?
2. What should it NOT write?
3. Which existing canonical/staging sources should feed it?
4. What provisional concepts can remain derived/in-memory/read-only?
5. Does SF-2 need new persistence?
6. Does SF-2 need a new route yet?
7. Does SF-2 need Copilot changes? Prefer NO unless evidence proves required.
8. What tests should define the read-model boundary?
9. What is explicitly deferred to SF-3+?

Prefer a read-only composition before new persistence.

Do not implement SF-2.

---

# 19. Required audit artifact

Create exactly one primary audit artifact:

`docs/portfolio-lead/07-strategic-framing/STRATEGIC_FRAMING_CURRENT_STATE_AUDIT_SF1_v0.1.md`

Status:

```text
EVIDENCE / CURRENT-STATE AUDIT
NOT AUTHORITY
```

It must include:
- executive summary;
- current journey map;
- component inventory;
- reuse map;
- state classification;
- permissions map;
- test/evidence map;
- findings register;
- SF-2 recommendation;
- ADR assessment.

Do not update authority/status/manifest in SF-1 unless there is a factual error that makes the audit impossible to interpret. If such an error exists, report it instead of silently editing authority.

---

# 20. ADR stop conditions

SF-1 is audit-only, so no ADR should be created.

Report `ADR CANDIDATE` if future implementation appears to require:

- canonical Challenge without Strategic Front;
- canonical StrategicLens / StrategicObservation / StrategicGap;
- changed Front → Challenge cardinality;
- new AI organizational authority;
- Project != Initiative identity change;
- new lifecycle;
- material role authority change.

---

# 21. Validation

Because runtime must remain untouched:

Run:

- `git diff --check`
- conflict marker scan
- markdown/reference sanity check
- `git status --short`
- `git diff --stat`
- verify the only intended new/changed file is the SF-1 audit artifact

Do not run broad tests unless needed to verify a disputed factual behavior.
If targeted tests are run, record them.

Do not commit.
Do not push.

---

# 22. Required final report

Return:

```text
SF-1 STATUS: GO | GO_WITH_GAPS | BLOCKED

BRANCH:
BASE HEAD:
COMMIT CREATED: NO
PUSH PERFORMED: NO

AUDIT ARTIFACT:
<path>

CURRENT STATE:
- Public Entry → governed continuation: IMPLEMENTED/PARTIAL/MISSING
- Enterprise Direct → Strategic Interpretation: IMPLEMENTED/PARTIAL/MISSING
- Existing Portfolio → Strategic Interpretation: IMPLEMENTED/PARTIAL/MISSING
- Portfolio Anchor: IMPLEMENTED/PARTIAL/MISSING
- Reverse alignment: IMPLEMENTED/PARTIAL/MISSING
- Existing-work intake: IMPLEMENTED/PARTIAL/MISSING
- Candidate Front staging: IMPLEMENTED/PARTIAL/MISSING
- Candidate Challenge staging: IMPLEMENTED/PARTIAL/MISSING
- Canonical Front create: IMPLEMENTED/PARTIAL/MISSING
- Canonical Challenge requires Front: YES/NO
- Adaptive depth: IMPLEMENTED/PARTIAL/MISSING
- Strategic lenses: IMPLEMENTED/PARTIAL/MISSING
- Gap/opportunity prioritization: IMPLEMENTED/PARTIAL/MISSING
- Copilot orchestration shell: IMPLEMENTED/PARTIAL/MISSING
- Copilot SF capability coverage: IMPLEMENTED/PARTIAL/MISSING

REUSE:
- Entry cognition: REUSE_AS_IS / REUSE_WITH_ADAPTER / DO_NOT_REUSE / UNKNOWN
- Bootstrap Anchor: ...
- StrategicConnection: ...
- ProposedMutation: ...
- Bootstrap analyzer: ...
- Portfolio canonical services: ...
- Copilot infrastructure: ...
- Existing Front UI: ...

KNOWN GAPS VERIFIED:
- PL-GAP-01 direct entry bypass: YES/NO
- PL-GAP-02 Front persistence mismatch: YES/NO
- PL-GAP-03 ownerCandidate != ownership: YES/NO
- PL-GAP-04 clustering absent: YES/NO
- PL-GAP-05 Copilot coverage incomplete: YES/NO
- PL-GAP-06 lifecycle collision relevant to SF: YES/NO
- PL-GAP-07 PH-3B pending: YES/NO

AUTHORITY:
- Core INV-01 preserved: YES/NO
- Core INV-02 preserved: YES/NO
- Candidate Challenge can remain non-canonical: YES/PARTIAL/NO
- ADR required for SF-2: YES/NO
- ADR candidates for later slices: <list or NONE>

SF-2 RECOMMENDATION:
- read-only first: YES/NO
- new persistence required: YES/NO/UNRESOLVED
- new route required now: YES/NO/UNRESOLVED
- Copilot runtime change required now: YES/NO
- proposed inputs: <list>
- proposed derived outputs: <list>
- explicit writes prohibited: <list>

FINDINGS:
- blockers: <count>
- material: <count>
- minor/info: <count>

VALIDATION:
- git diff --check: PASS/FAIL
- conflict marker scan: PASS/FAIL
- markdown/reference check: PASS/FAIL
- runtime files changed: NO
- schema changed: NO
- tests changed: NO

READY FOR HUMAN REVIEW:
YES/NO

READY FOR SF-2 AFTER HUMAN REVIEW:
YES/NO
```

Stop after this report.

Do not implement SF-2.
Do not commit.
Do not push.
