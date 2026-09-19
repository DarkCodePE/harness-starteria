# Portfolio Home Acceptance Checklist v0.1

**Estado:** PH-0 documentation acceptance checklist; not an E2E result

**Authority split:** Core v0.2 is factual current. Home read-model and
handoff-separation rules below are Experience targets compatible with v0.2.
Activation Readiness, ownership, `pre_start` representation, Challenge
coverage/cardinality, Step materialization timing and Decision Authority are
`CANDIDATE DEPENDENCY / ADR-RETEST REQUIRED`.

## Authority and scope

- [ ] `docs/STARTERIA_AUTHORITY.md` links this pack.
- [ ] Core authority and status are explicit.
- [ ] Portfolio Governance precedes Home Governance in the authority chain.
- [ ] Activation/Handoff is linked as the upstream lifecycle boundary.
- [ ] No item in this checklist authorizes runtime implementation.

## Read model semantics

- [ ] Home is a read model, not a second source of truth.
- [ ] Home states are distinct from Core lifecycle states.
- [ ] Provenance and source references are retained for material values.
- [ ] Invitations are not counted as active Initiatives.
- [ ] `accepted`, `pre_start` and `started` remain distinct.
- [ ] AI suggestions are not silently canonicalized.

## Handoff safety

- [ ] Portfolio context remains visible through the handoff.
- [ ] Existing Initiative invitations do not imply duplicate creation.
- [ ] Challenge-only invitations do not create an Initiative before Accept.
- [ ] Accept does not activate Core or Steps.
- [ ] Start remains explicit, permission-checked, idempotent and auditable.
- [ ] Step 0–4 behavior remains outside this slice.

## Documentation validation

- [ ] Pack files are discoverable from Portfolio Lead indexes.
- [ ] Acceptance Checklist is linked from the Authority Map.
- [ ] Current-state audits are labeled as evidence, not authority.
- [ ] Open ADR candidates remain visible.
- [ ] `git diff --check` passes after documentation changes.

An unchecked item is a documentation gap or future implementation acceptance
failure; it is not permission to infer behavior from existing runtime code.
