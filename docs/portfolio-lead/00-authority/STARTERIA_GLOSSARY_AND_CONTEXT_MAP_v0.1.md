# StarterÃƒÂ­a Ã¢â‚¬â€ Glossary and Context Map v0.1

**Date:** 2026-09-24
**Status:** WORKING GLOSSARY / TRACEABILITY BASELINE
**Purpose:** provide one shared vocabulary for product, design, AI, engineering and governance discussions. This glossary explains what each term means, when it appears, what authority it has and what it must not be confused with.

## 1. How to read StarterÃƒÂ­a

StarterÃƒÂ­a should be read as a sequence of increasingly governed context:

```text
ENTRY CHANNEL
Where did the user/context come from?
        Ã¢â€ â€œ
STRATEGIC INTERPRETATION
What are they really trying to achieve/understand?
        Ã¢â€ â€œ
PORTFOLIO ANCHOR
What is the minimum sufficiently clear reference for organizing work?
        Ã¢â€ â€œ
STRATEGIC FRAMING
How should that intent be structured sufficiently for governance?
        Ã¢â€ â€œ
STRATEGIC FRONT
What governed strategic outcome are we organizing around?
        Ã¢â€ â€œ
OBSERVATIONS / DRIVERS / GAPS / OPPORTUNITIES
What explains, constrains or may improve that outcome?
        Ã¢â€ â€œ
PRIORITIZATION
What deserves attention now given impact/capacity/context?
        Ã¢â€ â€œ
CHALLENGE
What human-confirmed problem/opportunity should become governed work?
        Ã¢â€ â€œ
INVITATION / ACCEPT / START
Who takes responsibility, and when does execution actually begin?
        Ã¢â€ â€œ
INITIATIVE CORE / STEPS 0Ã¢â‚¬â€œ4
How is one initiative developed and evidenced?
        Ã¢â€ â€œ
PORTFOLIO HOME
What is happening across the portfolio, what needs attention, and what decision is next?
```

## 2. Authority labels used in this glossary

| Label | Meaning |
|---|---|
| **Core / canonical** | Factual domain concept governed by Core/approved domain authority. |
| **Governed application state** | Persisted/versioned state used by the product, but not necessarily a Core aggregate/entity. |
| **Derived** | Computed/read-only interpretation from governed sources; not a source of truth by itself. |
| **Provisional** | Extracted/inferred/suggested context awaiting review or confirmation. |
| **Experience concept** | Useful UX/analysis concept that is not currently authorized as a canonical domain entity. |
| **Candidate** | Target semantics proposed for future implementation; requires review/evidence/possibly ADR. |
| **Legacy implementation term** | Existing technical/runtime representation that may not match final V2 vocabulary. |

## 3. Entry and interpretation vocabulary

### Entry Channel

**Meaning:** the route through which context enters StarterÃƒÂ­a.

**Examples:**
- Public Portfolio Entry;
- Enterprise Direct / pilot setup;
- Existing Portfolio / imported work;
- future API/assistant/channel.

**Authority:** interaction/provenance context, not organizational truth.

**Do not confuse with:** Strategic Framing. The entry channel answers **where context came from**, not how strategy is finally structured.

---

### Portfolio Entry

**Meaning:** the public/self-service StarterÃƒÂ­a experience that helps a potential Portfolio Lead express what they need to achieve or understand in natural language.

**Produces:** provisional interpretation, Entry State, intent, extracted context, ambiguity/reverse-alignment findings and handoff context.

**Authority:** experience contract; output is mainly provisional until confirmed.

**Important rule:** Portfolio Entry is **not** the exclusive gateway to Portfolio Lead or Strategic Framing.

---

### Enterprise Direct

**Meaning:** assisted entry for a company already in a demo, pilot, workshop or commercial implementation context.

**Target experience:** authenticated/provisioned workspace Ã¢â€ â€™ strategic intake/interpretation Ã¢â€ â€™ Portfolio Anchor Ã¢â€ â€™ Strategic Framing.

**Authority:** validated experience decision; runtime journey not yet complete.

**Do not confuse with:** skipping strategic questioning. Enterprise Direct removes the awkward public acquisition flow, not the cognitive value of StarterÃƒÂ­a challenging weak Fronts/Challenges.

---

### Existing Portfolio path

**Meaning:** entry when the organization already has initiatives/projects/work and may have incomplete or implicit strategic structure.

**Primary cognitive operation:** reverse alignment.

**Target:** existing work Ã¢â€ â€™ patterns/connections Ã¢â€ â€™ candidate outcomes/Fronts/Gaps Ã¢â€ â€™ human review.

**Forbidden:** fabricate strategy solely from clustering or inventory similarity.

---

### Strategic Interpretation

**Meaning:** reusable cognitive capability that asks what the organization is really trying to achieve, understand or decide before strategic structure is confirmed.

**May include:**
- intent detection;
- context extraction;
- ambiguity detection;
- solution/initiative-first detection;
- reverse alignment;
- minimum material clarification;
- preservation of provenance.

**Authority:** experience/application capability concept; not currently a new Core entity.

**Important rule:** Strategic Interpretation may be reused by Public Entry, Enterprise Direct and Existing Portfolio paths.

**Do not confuse with:** Strategic Framing. Interpretation clarifies the intent; Framing structures it for governance.

---

### Reverse Alignment

**Meaning:** reason backwards from an existing solution, initiative or portfolio to the business outcome, signal and strategic intent that would justify it.

**Typical chain:**

```text
solution / initiative
Ã¢â€ â€™ expected change
Ã¢â€ â€™ metric / signal
Ã¢â€ â€™ business intent
Ã¢â€ â€™ continuation criterion
```

**Authority:** analytical capability; results remain provisional until confirmed where material.

---

## 4. Portfolio setup vocabulary

### Portfolio Anchor

**Meaning:** the minimum sufficiently clear reference around which Portfolio work can start to be organized without inventing strategic intent.

**May contain:**
- outcome / priority to move;
- decision to enable;
- business signal/KPI when known;
- context;
- provenance.

**States currently used conceptually:**
- `anchor_insufficient`;
- `anchor_provisional`;
- `anchor_sufficient`;
- `anchor_confirmed`;
- `anchor_conflicting`.

**Authority:** governed Portfolio Bootstrap/application state; not the same thing as a Core Strategic Front.

**Do not confuse with:**
- `Portfolio Anchor != Strategic Front`;
- `anchor_sufficient != corporate strategy approved`;
- `anchor_confirmed != Challenge created`.

**How to read it:** Ã¢â‚¬Å“What do we know enough about to start organizing work responsibly?Ã¢â‚¬Â

---

### Portfolio Bootstrap

**Meaning:** B0Ã¢â‚¬â€œB5 experience that carries forward prior context, confirms/completes the Anchor, ingests existing work, proposes structure, asks for material human review and publishes a first Portfolio Reading.

**Primary job:** low-effort transition from context to first governed Portfolio reading.

**Does not:** activate Steps or replace Strategic Framing.

---

### Work Item

**Meaning:** staging representation of existing work detected/imported during Portfolio Bootstrap.

**Possible source:** pasted text, manual entry, Entry context, CSV/XLSX import.

**Minimum input:** name/label.

**Authority:** governed staging state, not automatically a canonical Initiative.

**Do not confuse with:** `Work Item != Initiative`.

---

### Owner Candidate

**Meaning:** person/name detected from imported or declared work who may be a plausible owner.

**Authority:** provisional.

**Required progression:** candidate Ã¢â€ â€™ identity resolution Ã¢â€ â€™ human confirmation Ã¢â€ â€™ invitation/acceptance Ã¢â€ â€™ real ownership.

**Forbidden:** assigning canonical Initiative ownership just because an Excel cell contains a name.

---

### Strategic Connection

**Meaning:** governed relationship describing how a Work Item/Initiative relates to the current strategic reference.

**Examples:** confirmed alignment, partial alignment, alignment unknown, confirmed misalignment, out of current priority.

**Authority:** material alignment requires human confirmation.

**Do not confuse with:** semantic similarity. Similar text is evidence for a proposal, not proof of alignment.

---

### Advancement Condition

**Meaning:** a condition that helps explain what enables or obstructs the next Portfolio movement.

**Current dimensions include:**
- business signal;
- decision path;
- critical dependency;
- required context/perspective;
- ownership visibility.

**Severity may be:** info / attention / blocking.

**Important rule:** missing information is not universally a blocker; severity depends on the movement being attempted.

---

### Portfolio Reading

**Meaning:** versioned derived snapshot of the Portfolio after Bootstrap/material review.

**May summarize:** work count, strategic connections, signal gaps, dependencies, ownership gaps, attention items and next-best action.

**Authority:** **derived persisted snapshot**, not canonical domain truth.

**How to read it:** Ã¢â‚¬Å“Given current governed sources, what is the best factual reading of this Portfolio now?Ã¢â‚¬Â

---

## 5. Strategic Framing vocabulary

### Strategic Framing

**Meaning:** bounded context that turns sufficiently interpretable context into a sufficiently clear, prioritized and governable strategic structure.

**Inputs may come from:** Public Entry, Enterprise Direct, Existing Portfolio, Bootstrap/Anchor.

**Primary question:** Ã¢â‚¬Å“How should this intent be structured sufficiently for governance?Ã¢â‚¬Â

**Does not:** continuously monitor the Portfolio or activate Initiative Core.

---

### Strategic Front / Frente EstratÃƒÂ©gico

**Meaning:** a governable strategic unit organized around an outcome the organization wants to move.

**Core status:** Core/canonical concept.

**May include:** outcome, signal/KPI, horizon, constraints/context, governance context and related Challenges/Initiatives.

**Important rule:**

```text
Outcome != Strategic Front
```

The outcome is the central anchor of the Front; the Front adds governance and enough context to organize work around it.

**Candidate Front:** clustering/patterns may suggest a Front, but human confirmation is required.

---

### Strategic Lens

**Meaning:** analytical perspective used to inspect a Front.

**Examples:** Value/Outcome, Customer/Opportunity, Process/Capability, Financial, Culture, Technology, Risk/Compliance, Ecosystem.

**Authority:** experience concept only in SF-0; **not a canonical entity/table**.

**Important rules:**
- not mandatory;
- dynamic;
- can produce no material finding;
- not a completeness checklist.

---

### Adaptive Depth

**Meaning:** how much strategic analysis is useful now.

**Profiles:** LIGHT / STANDARD / DEEP.

**Authority:** experience concept; not a required persisted enum.

**Decision rule:** deepen only when additional analysis can materially change understanding, prioritization or a decision.

**Do not confuse with:** completeness or maturity score.

---

### Observation

**Meaning:** analytical finding about the Front/context that may explain something important but does not automatically become work.

**Authority:** experience/read-model concept in SF-0; canonical persistence not yet authorized.

**Possible progression:** Observation Ã¢â€ â€™ Driver/Gap/Opportunity.

---

### Driver

**Meaning:** factor that materially explains or influences the outcome the Front is trying to move.

**Authority:** Strategic Framing concept; exact canonical representation TBD in SF-1+.

**How to read it:** Ã¢â‚¬Å“What is materially causing or shaping the outcome?Ã¢â‚¬Â

---

### Gap

**Meaning:** material missing condition, capability, evidence, connection or context that may deserve action or observation.

**Authority:** experience concept in SF-0; no canonical `StrategicGap` entity authorized yet.

**Possible dispositions:** ADDRESS NOW / OBSERVE / DISCARD.

**Important rule:** `Gap != Challenge`.

---

### Opportunity

**Meaning:** material possibility to improve/move the outcome that may deserve prioritization.

**Authority:** Strategic Framing concept; exact persistence TBD.

**Important rule:** opportunity does not automatically become a Challenge.

---

### Strategic Backlog

**Meaning:** conceptual set of active Challenges plus Gaps/Opportunities left in observation around a Front.

**Authority:** experience/read-model concept only; not a canonical backlog entity in SF-0.

**Belongs conceptually to:** the Front, not to each Lens.

---

### Sufficiency

**Meaning:** enough trustworthy context exists to responsibly make the current transition/decision.

**Not:** percentage of form completion.

**Classes of unresolved context:**
- hard blocker;
- soft gap;
- useful but optional context.

**How to read it:** Ã¢â‚¬Å“Do we know enough for this decision now?Ã¢â‚¬Â rather than Ã¢â‚¬Å“Did we fill every field?Ã¢â‚¬Â

---

### Prioritization

**Meaning:** deciding which confirmed/provisional gaps/opportunities deserve attention now, considering impact, urgency, horizon, capacity, dependencies and uncertainty.

**Authority:** AI may recommend; human authority confirms material organizational priority.

---

### Challenge / Reto

**Meaning:** governed problem/opportunity/strategic work object confirmed by a human after sufficient prioritization.

**Core status:** Core/canonical concept.

**Normative promotion:**

```text
Observation
Ã¢â€ â€™ Driver / Gap / Opportunity
Ã¢â€ â€™ Prioritization
Ã¢â€ â€™ Human confirmation
Ã¢â€ â€™ Challenge
```

**Forbidden:** Lens Ã¢â€ â€™ Challenge, AI inference Ã¢â€ â€™ Challenge, Gap Ã¢â€ â€™ Challenge automatically.

---

## 6. Activation / ownership vocabulary

### Sponsor

**Meaning:** executive/governance context associated with a Front/Challenge/Initiative touchpoint.

**Important rule:** Sponsor is **not automatically Decision Authority**.

**Current state:** runtime/UI representations exist; role semantics still require reconciliation across legacy and target V2 concepts.

---

### Challenge Owner

**Meaning:** person responsible for the governed Challenge context in current Portfolio implementation/experience.

**Authority:** existing implementation concept; final relationship with Sponsor/Responsible del Reto must remain aligned with Core v0.2 and approved ADRs.

**Do not assume:** Challenge Owner automatically owns every Initiative.

---

### Initiative Owner

**Meaning:** person responsible for executing/developing a specific Initiative.

**Important rules:**
- Owner assignment does not activate Initiative Core;
- imported owner candidate does not equal accepted owner;
- ownership should be explicit and traceable.

---

### Decision Authority

**Meaning:** person/group authorized to make a defined material decision under the applicable governance rule.

**Important rule:** `Sponsor != universal Decision Authority`.

---

### Invitation

**Meaning:** governed request asking a person to take part/responsibility in a Challenge or existing Initiative.

**Target:** email/auth/claimable, traceable, versioned and channel-independent.

**Important rule:** `Invitation != Initiative`.

---

### Accept

**Meaning:** explicit acceptance of responsibility/participation under the invitation.

**Important rule:** `Accept != Start` and `Accept != Step active`.

---

### pre_start

**Meaning:** target experience/read-model label for accepted responsibility before explicit Start.

**Authority:** candidate semantics; exact Core technical representation is not yet approved.

**Do not treat as:** Step 0.

---

### Start

**Meaning:** explicit governed boundary that hands control from activation/handoff into Initiative Core.

**Important rule:** Start is the boundary; navigation or acceptance must not silently activate Steps.

---

## 7. Initiative execution vocabulary

### Initiative

**Meaning:** governed unit of execution/development connected to strategic context where applicable.

**Core status:** Core concept.

**Current implementation identity:** production currently uses `Project` as the practical identity of an Initiative.

**ADR trigger:** introducing a separate canonical Initiative aggregate/table where `Project != Initiative` requires explicit domain decision.

---

### Project

**Meaning:** current technical/runtime identity used for Initiatives in production code.

**Authority:** legacy/current implementation term, not permission to redefine the domain.

---

### Initiative Core

**Meaning:** bounded context that governs how an individual Initiative is developed after Start.

**Owns:** Step 0Ã¢â‚¬â€œ4 lifecycle/evidence/development behavior.

**Portfolio Lead must not:** duplicate or directly write Step state.

---

### Step 0Ã¢â‚¬â€œ4

**Meaning:** stable Core functions for developing an Initiative; not fixed-duration forms.

**Important rule:** imported/existing initiatives use retroactive gating/reconstruction; valid existing work must not be redone merely to fit sequence aesthetics.

---

### Evidence

**Meaning:** governed material supporting claims, learning and decisions.

**Important rule:** evidence provenance and human validation requirements remain distinct from AI summaries.

---

### Decision Request

**Meaning:** request for a material decision that has not yet been resolved by a Decision.

**Do not confuse with:** recommendation.

---

### Decision

**Meaning:** recorded human/governed decision.

**Important rule:** Recommendation != Decision Request != Decision.

---

## 8. Portfolio Home vocabulary

### Portfolio Home

**Meaning:** continuous Portfolio governance/read surface answering:

> What needs attention, why does it matter, and what is the next governed action?

**Owns:** reading, attention, decision visibility, strategic map and contextual next moves.

**Does not own:** Strategic Framing construction or Initiative execution.

---

### PortfolioHomeReadModel

**Meaning:** request-scoped/read-only composition for Home assembled from governed Portfolio, Bootstrap, Handoff and Initiative sources.

**Authority:** derived/read-only; not a second source of truth.

**Target blocks:** Portfolio Reading, attention, strategic units, pending decisions, recommendations.

---

### Strategic Unit

**Meaning in PH-2 read model:** compact Home projection preserving the lineage Strategic Front Ã¢â€ â€™ Challenge Ã¢â€ â€™ Initiative.

**Authority:** derived Home representation, not a new canonical domain entity.

---

### Attention Item

**Meaning:** a signal that something requires review/action, with reason/context/next movement.

**Important distinction:** Home may combine canonical `AttentionItem` sources with derived Portfolio Reading/legacy-derived signals. The UI must preserve source/provenance rather than treating every attention row as equivalent canonical state.

**Target presentation:** what happened Ã¢â€ â€™ why it matters Ã¢â€ â€™ affected context Ã¢â€ â€™ next movement.

---

### Next Best Action / Next Movement

**Meaning:** contextual recommendation for the next useful Portfolio action.

**Authority:** advisory unless tied to a specific governed command/requirement.

**Do not confuse with:** a decision taken automatically by StarterÃƒÂ­a.

---

## 9. Provenance vocabulary

### USER_DECLARED
User explicitly stated the information.

### EXTRACTED_FROM_USER_TEXT / EXTRACTED
Information was structurally extracted from a source without changing its meaning.

### AI_INFERRED
Reasonable interpretation not explicitly declared. Must remain distinguishable from confirmed fact.

### AI_SUGGESTED
Proposal generated by AI: candidate KPI, Front, connection, wording, priority or next movement.

### USER_CONFIRMED
Human explicitly confirmed the material interpretation/proposal.

### CANONICAL
Current governed state of a canonical object under applicable authority.

### PENDING
Useful/required information is not currently available.

### CONFLICTING
Material sources disagree; system must expose conflict rather than silently choose.

## 10. Reading StarterÃƒÂ­a by moment

| Moment | Main object/context | What StarterÃƒÂ­a is allowed to say | Human checkpoint | What comes next |
|---|---|---|---|---|
| Public/enterprise entry | raw need/context | provisional understanding | only when material ambiguity remains | Strategic Interpretation |
| Strategic Interpretation | intent + extracted/reverse-aligned context | candidate interpretation | confirm/correct material meaning | Portfolio Anchor |
| Portfolio Anchor | minimum strategic reference | sufficient/insufficient/conflicting | confirm when becoming governed context | Bootstrap / Strategic Framing |
| Work Intake | Work Items | detected work + owner/status candidates | review material structure | provisional structuring |
| Strategic Framing | Front/lenses/observations/gaps | proposals, sufficiency, priorities | confirm Front/Challenge material changes | governed Challenges |
| Activation | Invitation / owner candidate | request + inherited context | Accept/Decline; later explicit Start | Initiative Overview/Core |
| Initiative Core | Initiative + Steps | current development/evidence state | validators/decisions per Core | evidence/decision |
| Portfolio Home | PortfolioHomeReadModel | factual derived reading + advisory next moves | portfolio/decision authority actions | continuous governance |

## 11. Critical distinctions to preserve

```text
Portfolio Entry != Strategic Framing
Strategic Interpretation != confirmed strategy
Portfolio Anchor != Strategic Front
Outcome != Strategic Front
Work Item != Initiative
Owner Candidate != Initiative Owner
Semantic similarity != confirmed alignment
Lens != Challenge
Observation != Gap necessarily
Gap != Challenge
AI suggestion != human confirmation
Sponsor != universal Decision Authority
Invitation != Initiative
Accept != Start
Start != Step 0 detail
Portfolio Reading != canonical source of truth
PortfolioHomeReadModel != second database/domain
Portfolio Home != Initiative workspace
Project = current implementation identity of Initiative, not necessarily a separate domain concept
```

## 11.1 SF-0.1 Strategic Interpretation concepts

### Strategic Interpretation Result

Non-canonical conceptual output containing intended movement, why it matters,
signal/proxy, parent context, existing work, reverse-alignment findings,
provenance and open uncertainties. It may include a provisional Scope
Assessment and does not create domain entities.

### Scope Assessment

Advisory assessment of the likely strategic level of input: `front_like`,
`challenge_like`, `initiative_like` or `unresolved`. It is an experience/reasoning
concept, not a canonical type discriminator.

`Front-like` is broad enough to organize several Challenges/Initiatives and
portfolio decisions. `Challenge-like` is a material problem/opportunity/result
within broader context. `Initiative-like` is a concrete intervention, project,
solution, experiment or executable work item. `Unresolved` means the evidence
does not support responsible distinction.

### Candidate Challenge

A non-canonical proposal inside Strategic Framing. It remains provisional until
a Strategic Front is resolved/confirmed and a person explicitly promotes it to
canonical Challenge. It must not be persisted as an orphan or linked to an
inferred Front.

### Movement Signal / Contribution Signal / Business Outcome

Movement Signal indicates whether the specific outcome/problem is moving.
Contribution Signal indicates whether an Initiative contributes to that
movement. Business Outcome indicates whether the movement translates into
business value. These are distinct; expected, observed and attributed
contribution must not be fabricated or conflated.

### Parent Strategic Context / Alignment

The broader outcome or strategic relationship around current work. Its state may
be known, provisional or unresolved. Existing work can remain pending alignment
while reverse alignment continues.

### Top-down / Bottom-up alignment

Top-down follows intention → Front → Challenge → Initiative → Evidence.
Bottom-up/reverse alignment starts from initiative, solution or problem and
tests its broader outcome/Front relationship. Both preserve provenance and
require human confirmation for material canonicalization.

## 12. Recommended glossary governance

This glossary should become a discoverable Portfolio Lead reference and be updated whenever a contract/ADR changes term meaning.

Recommended rule:

```text
Term
Ã¢â€ â€™ definition
Ã¢â€ â€™ authority class
Ã¢â€ â€™ owner bounded context
Ã¢â€ â€™ source document
Ã¢â€ â€™ implementation mapping
Ã¢â€ â€™ acceptance/evidence
```

A term should not be treated as Ã¢â‚¬Å“canonicalÃ¢â‚¬Â merely because it appears in code, UI copy, prompts or historical PRDs.
