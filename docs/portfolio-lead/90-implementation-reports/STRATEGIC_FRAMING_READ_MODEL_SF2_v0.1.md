# Strategic Framing Read Model SF-2

## Status

`IMPLEMENTATION EVIDENCE`

## Implemented scope

SF-2 adds an in-memory, request-scoped composition service for Strategic Framing. It reads governed snapshots supplied by Entry/Bootstrap/Portfolio adapters and derives context, Anchor interpretation, conservative scope assessment, parent context, existing work, alignment, provenance, uncertainty, framing signals and next-best action.

## Files

- `backend/modules/strategic-framing/strategic-framing.types.ts`
- `backend/modules/strategic-framing/strategic-framing.read-service.ts`
- `backend/modules/strategic-framing/__tests__/strategic-framing.read-service.test.ts`

## Source classification

Entry/Bootstrap/Portfolio values remain source data. Derived framing items are explicitly non-canonical and preserve source references and provenance. `ownerCandidate` remains a hint, not ownership. Movement signal is kept separate from contribution and business outcome, which are not fabricated.

## Explicit non-actions

No route, persistence, Prisma/schema/migration, Copilot runtime, Portfolio Entry runtime, Portfolio Home state, Front, Challenge, Project, Initiative or Step mutation was added. The service does not confirm ProposedMutation or execute an action.

## Tests

Focused unit coverage includes composition, no canonicalization, conservative unresolved scope, insufficient Anchor, unresolved parent context, pending alignment, provenance and absence of fabricated business outcomes.

## Known gaps

- Enterprise Direct and Existing Portfolio interpretation boundaries remain deferred to SF-3+.
- Candidate Front/Challenge staging, lenses, clustering, prioritization and Copilot capability coverage remain unimplemented.
- A repository adapter/caller and route are intentionally not part of SF-2.

## SF-3 prerequisites

Define the governed interpretation boundary for non-Entry sources, then add explicit candidate staging and human-promotion semantics only under a reviewed product decision/ADR where required.
