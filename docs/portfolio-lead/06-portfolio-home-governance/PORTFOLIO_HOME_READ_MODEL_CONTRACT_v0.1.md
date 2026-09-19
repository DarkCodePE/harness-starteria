# Portfolio Home Read Model Contract v0.1

**Estado:** PH-0 frozen target contract; implementation pending

**Authority split:** Core v0.2 is factual current. Read-only projection,
provenance, non-canonical AI output and distinct invitation/accept/start
semantics are compatible with v0.2. Activation Readiness, the `pre_start`
lifecycle and its representation, ownership transitions, Challenge
coverage/cardinality and expanded Decision Authority semantics are `CANDIDATE
DEPENDENCY / ADR-RETEST REQUIRED`.

Portfolio Home consumes a versioned projection assembled from governed
Portfolio, Bootstrap, Invitation and Initiative sources. It is read-only from
the perspective of domain lifecycle.

```ts
type PortfolioHomeReadModel = {
  version: number;
  generatedAt: string;
  homeState: 'HOME_A' | 'HOME_B' | 'HOME_C' | 'HOME_D' | 'HOME_E' | 'HOME_F';
  anchor?: PortfolioAnchorView;
  workItems: PortfolioWorkItemView[];
  attentionItems: PortfolioAttentionItem[];
  invitations: PortfolioInvitationView[];
  initiatives: PortfolioInitiativeView[];
  nextAction: PortfolioNextAction;
  sourceRefs: string[];
};
```

Every displayed material claim must retain `sourceRefs` and a provenance
classification. The read model may include provisional and confirmed values,
but must not present them as equivalent.

## Required semantic fields

```text
invitation_status: created | sent | viewed | accepted | declined | revoked | expired
activation_state: invited | accepted | pre_start | started
target_kind: challenge_only | existing_initiative
provenance: user_declared | extracted | ai_inferred | ai_suggested | canonical
```

`pre_start` is a target experience/read-model label: responsibility has been
accepted and the Initiative is not in an active Core cycle. Its technical
representation is not approved Core v0.2 and must not be frozen before
ADR/re-test. It is not a synonym for Step 0.

## Projection rules

- Reading the model has no domain side effects.
- Counts and attention items are derived from current governed state.
- Pending invitations do not count as active Initiatives.
- Existing Initiative history is preserved when activation context is attached.
- Home can expose a link/action to `Accept` or `Start`, but the command is
  executed by the Activation/Handoff bounded context with its own permissions,
  idempotency and audit rules.
- If a source is unavailable or semantically ambiguous, expose `unknown` or a
  review-needed state rather than inventing a value.

## Source precedence

```text
Core / approved domain state
→ Portfolio Governance contracts and events
→ Activation/Handoff state
→ Bootstrap/Portfolio read projections
→ AI suggestions and UI state
```

AI output and UI state are never canonical sources for this model.
