# Portfolio Home Read Model Implementation Report v0.1

Status: PH-2 implementation. This report documents a read-only application composition; it does not promote Core v0.3 or create a new domain authority.

## Authority boundary

- Current Core remains `doc/CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md`.
- Core v0.3 remains candidate-only and is not implemented.
- `PortfolioHomeReadModel` is derived/composed state, not canonical domain state.

## Sources

The service reads `StrategicFront`, `Challenge`, `ChallengeInvitation`, `InitiativePortfolioMeta` as legacy Portfolio metadata, `Project`, `AttentionItem`, `DecisionRequest`, `Decision`, and the latest user-owned `PortfolioReading` through `PortfolioBootstrapSession`.

It does not persist the composed model and does not call any write method.

## Read model

`GET /api/v1/portfolio/home` returns:

- `portfolioReading` with available persisted reading values and nullable unavailable counts;
- `governance` with factual people/labels only; Portfolio Lead and unresolved Decision Authority remain `null`;
- `strategicUnits[]` preserving `StrategicFront → Challenge → Initiative`;
- `attention[]` from `AttentionItem`, `PortfolioReading.primaryAttentionItems`, and explicitly marked legacy metadata;
- `pendingDecisions[]` from `DecisionRequest` and its `Decision` relation;
- `recommendations[]` from `PortfolioReading.nextBestAction` or legacy metadata, always requiring human confirmation;
- `generatedAt` for the composition request.

## Provenance rules

- Project owner, AttentionItem, DecisionRequest and Decision are canonical reads.
- `InitiativePortfolioMeta` is read as legacy-derived Portfolio metadata and never becomes lifecycle authority.
- Sponsor labels from `StrategicFront.sponsor` are not converted into Decision Authority.
- `expected` contribution is kept separate from `observed` and `attributed`, which remain `null` when unavailable.
- `pre_start`, Activation Readiness v0.3, owner-pending/resourcing-pending, and new coverage/cardinality semantics are deferred.

## Read-only guarantees

The route and service perform no create, update, delete, upsert, transaction, invitation action, acceptance, activation, or lifecycle write. Tests assert no calls to Project, TeamMember, Step, InitiativeCycle, Decision, invitation mutation, or InitiativePortfolioMeta mutation methods.

## Legacy dependencies preserved

`PortfolioLeadContext`, `BootstrapHomeProjection`, `InitiativePortfolioMeta`, legacy Home selectors, and the Challenge → Project path remain in place. PH-3 owns UI integration and PH-9 owns cleanup after migration evidence.

## Deferred/candidate dependencies

- canonical invitation acceptance and activation lifecycle;
- technical representation of `pre_start`;
- ownership confirmation semantics;
- Challenge coverage/cardinality;
- richer Decision Authority model;
- full expected/observed/attributed contribution evidence.
