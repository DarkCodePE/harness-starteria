import { describe, expect, it } from 'vitest';
import { AppError } from '../../../shared/errors/AppError';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { StrategicFramingProvisionalStateService } from '../strategic-framing.provisional-state.service';
import type { StrategicFramingReadModel } from '../strategic-framing.types';

function snapshot(sourceMode: StrategicFramingReadModel['context']['sourceMode'] = 'enterprise_direct'): StrategicFramingReadModel {
  return {
    context: { userId: 'user-1', organizationId: 'org-1', sourceMode, sourceContinuationId: sourceMode === 'bootstrap' ? 'continuation-1' : null },
    anchor: { id: 'anchor-1', status: 'anchor_sufficient', intendedMovement: 'Mejorar conversión', whyItMatters: 'Reducir fricción', signal: { status: 'proxy', value: 'Conversión' }, decisionToEnable: 'Decidir inversión', parentContext: { status: 'unresolved', label: null, sourceRefs: ['entry:1'] }, provenance: [{ sourceRef: 'entry:1', kind: 'extracted' }] },
    scopeAssessment: { level: 'challenge_like', confidence: 'low', rationale: ['signal'], provenance: ['derived:text'], canonicalized: false },
    existingWork: [{ id: 'work-1', label: 'Resolver fricción', stateHint: 'active', ownerCandidate: 'candidate@example.com', alignment: { status: 'alignment_unknown' }, sourceRefs: ['work:1'] }],
    framingSignals: {
      observations: [{ id: 'observation-1', kind: 'observation', statement: 'No candidate', sourceRefs: ['obs:1'], provenance: 'derived', confidence: 'low', canonical: false }],
      drivers: [{ id: 'driver-1', kind: 'driver', statement: 'No candidate', sourceRefs: ['driver:1'], provenance: 'derived', confidence: 'low', canonical: false }],
      gaps: [{ id: 'gap-1', kind: 'gap', statement: 'Resolver dependencia', sourceRefs: ['gap:1'], provenance: 'ai_suggested', confidence: 'medium', canonical: false }],
      opportunities: [{ id: 'opportunity-1', kind: 'opportunity', statement: 'Aprovechar señal', sourceRefs: ['opp:1'], provenance: 'extracted', confidence: 'high', canonical: false }],
    },
    sufficiency: { status: 'insufficient', blockers: ['Falta validación'], softGaps: ['Contexto'], optionalContext: ['Sin iniciativa'] },
    nextBestAction: { kind: 'review_parent_context', reason: 'parent' },
    generatedAt: '2026-09-24T10:00:00.000Z',
  };
}

function fakePrisma(options: { forceConcurrentCreateConflict?: boolean; forceUpdateMiss?: boolean } = {}) {
  const states = new Map<string, any>();
  const histories: any[] = [];
  let createCalls = 0;
  let transactionTail = Promise.resolve();
  const canonicalWrites = { strategicFront: 0, challenge: 0, project: 0, initiative: 0, step: 0 };
  const api = {
    strategicFramingProvisionalState: {
      findUnique: async ({ where }: any) => where.id ? [...states.values()].find((state) => state.id === where.id) ?? null : [...states.values()].find((state) => state.userId === where.userId_logicalContextKey.userId && state.logicalContextKey === where.userId_logicalContextKey.logicalContextKey) ?? null,
      create: async ({ data }: any) => { createCalls += 1; if (options.forceConcurrentCreateConflict && createCalls === 2) throw { code: 'P2002' }; const value = { id: `state-${states.size + 1}`, ...data }; states.set(value.id, value); return value; },
      updateMany: async ({ where, data }: any) => { const value = states.get(where.id); if (!value || value.version !== where.version || options.forceUpdateMiss) return { count: 0 }; states.set(where.id, { ...value, ...data, version: data.version?.increment ? value.version + data.version.increment : data.version }); return { count: 1 }; },
    },
    strategicFramingProvisionalStateHistory: { create: async ({ data }: any) => { if (histories.some((history) => history.stateId === data.stateId && history.version === data.version)) throw { code: 'P2002' }; histories.push({ id: `history-${histories.length + 1}`, ...data }); return histories.at(-1); } },
    $transaction: (callback: any) => { const run = transactionTail.then(async () => { const stateSnapshot = new Map([...states].map(([id, value]) => [id, { ...value }])); const historyLength = histories.length; try { return await callback(api); } catch (error) { states.clear(); for (const [id, value] of stateSnapshot) states.set(id, value); histories.splice(historyLength); throw error; } }); transactionTail = run.then(() => undefined, () => undefined); return run; },
    strategicFront: { create: async () => { canonicalWrites.strategicFront += 1; } },
    challenge: { create: async () => { canonicalWrites.challenge += 1; } },
    project: { create: async () => { canonicalWrites.project += 1; } },
    initiativePortfolioMeta: { create: async () => { canonicalWrites.initiative += 1; } },
    step: { create: async () => { canonicalWrites.step += 1; } },
    states,
    histories,
    canonicalWrites,
  };
  return api;
}

const read = permissionsForRoles(['portfolio_lead']);
const write = permissionsForRoles(['portfolio_lead']);

describe('StrategicFramingProvisionalStateService', () => {
  it('seeds only noncanonical gaps and opportunities with stable source identity', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'seed', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    expect(state.prioritizationState.candidates).toEqual([
      expect.objectContaining({ candidateId: 'sf5:gap:gap-1', sourceCandidateRef: 'gap-1', humanDisposition: 'undecided', humanDecision: null, sourceVersion: '2026-09-24T10:00:00.000Z', sourceRefs: ['gap:1'], provenance: 'ai_suggested', confidence: 'medium' }),
      expect.objectContaining({ candidateId: 'sf5:opportunity:opportunity-1', sourceCandidateRef: 'opportunity-1', sourceRefs: ['opp:1'], provenance: 'extracted', confidence: 'high' }),
    ]);
    expect(state.prioritizationState.candidates.some((candidate) => candidate.candidateId.includes('observation') || candidate.candidateId.includes('driver'))).toBe(false);
    expect(state.prioritizationState.nonCanonical).toBe(true);
  });

  it('reads legacy null prioritization without writing or incrementing version', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const created = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'null-state', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    db.states.get(created.id).prioritizationState = null;
    const current = await service.getCurrent({ stateId: created.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    expect(current.version).toBe(1);
    expect(current.prioritizationState).toEqual({ schemaVersion: 1, nonCanonical: true, focusSlots: null, focusRationale: null, candidates: [] });
  });

  it('initializes existing empty state transactionally and preserves non-empty reviewed state', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'explicit-init', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    db.states.get(state.id).prioritizationState = null;
    const initialized = await service.initializePrioritizationFromReadSnapshot({ stateId: state.id, snapshot: snapshot(), actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1 });
    expect(initialized.version).toBe(2);
    expect(db.histories[0].action).toBe('prioritization_initialized');
    expect(db.histories[0].snapshot.prioritizationState).toBeNull();
    const reviewed = await service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 2, decisions: [{ candidateId: 'sf5:gap:gap-1', disposition: 'address_now', rationale: 'Material', recommendationSnapshot: { recommendationVersion: 'test-1', inputStateVersion: 2, recommendedDisposition: 'address_now', rationale: ['evidence'], sourceRefs: ['gap:1'] } }] });
    const resynced = await service.initializePrioritizationFromReadSnapshot({ stateId: state.id, snapshot: { ...snapshot(), generatedAt: 'changed' }, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 3 });
    expect(reviewed.prioritizationState.candidates[0].humanDisposition).toBe('address_now');
    expect(resynced.prioritizationState.candidates[0].humanDisposition).toBe('address_now');
    expect(resynced.prioritizationState.candidates[0].statementSnapshot).toBe('Resolver dependencia');
  });

  it('persists reversible human review, trusted recommendation evidence and over-capacity', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any, () => new Date('2026-09-24T12:00:00.000Z'));
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'review', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const reviewed = await service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, focusSlots: 1, focusRationale: 'Capacidad actual', decisions: [
      { candidateId: 'sf5:gap:gap-1', disposition: 'address_now', recommendationSnapshot: { recommendationVersion: 'test-1', inputStateVersion: 1, recommendedDisposition: 'observe', rationale: ['evidence'], sourceRefs: ['gap:1'] } },
      { candidateId: 'sf5:opportunity:opportunity-1', disposition: 'address_now', recommendationSnapshot: { recommendationVersion: 'test-1', inputStateVersion: 1, recommendedDisposition: 'address_now', rationale: ['evidence'], sourceRefs: ['opp:1'] } },
    ] });
    expect(reviewed.version).toBe(2);
    expect(reviewed.prioritizationState.focusSlots).toBe(1);
    expect(reviewed.prioritizationState.candidates.filter((candidate) => candidate.humanDisposition === 'address_now')).toHaveLength(2);
    expect(reviewed.prioritizationState.candidates[0].humanDecision).toMatchObject({ actorUserId: 'user-1', appliedFromStateVersion: 1, recommendationSnapshot: { recommendedDisposition: 'observe' } });
    expect(reviewed.sufficiency.status).toBe('insufficient');
    const reversed = await service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 2, focusSlots: 0, decisions: [{ candidateId: 'sf5:gap:gap-1', disposition: 'observe', recommendationSnapshot: { recommendationVersion: 'test-2', inputStateVersion: 2, recommendedDisposition: 'uncertain', rationale: [], sourceRefs: ['gap:1'] } }] });
    expect(reversed.prioritizationState.focusSlots).toBe(0);
    expect(reversed.prioritizationState.candidates[0].humanDisposition).toBe('observe');
  });

  it('rejects invalid capacity, unknown candidates, untrusted recommendation refs and stale review', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'invalid-review', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    await expect(service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, focusSlots: -1 })).rejects.toMatchObject({ code: 'SF_PRIORITIZATION_FOCUS_SLOTS_INVALID' });
    await expect(service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, decisions: [{ candidateId: 'missing', disposition: 'discard', recommendationSnapshot: { recommendationVersion: 'x', inputStateVersion: 1, recommendedDisposition: 'discard', rationale: [], sourceRefs: [] } }] })).rejects.toMatchObject({ code: 'SF_PRIORITIZATION_CANDIDATE_NOT_FOUND' });
    await expect(service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, decisions: [{ candidateId: 'sf5:gap:gap-1', disposition: 'discard', recommendationSnapshot: { recommendationVersion: 'x', inputStateVersion: 1, recommendedDisposition: 'discard', rationale: [], sourceRefs: ['fabricated'] } }] })).rejects.toMatchObject({ code: 'SF_PRIORITIZATION_RECOMMENDATION_INVALID' });
    await service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, focusSlots: null });
    await expect(service.reviewPrioritization({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1 })).rejects.toMatchObject({ code: 'SF_PROVISIONAL_STATE_STALE' });
  });

  it('initializes from SF-2 without canonicalizing and reuses on re-entry', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any, () => new Date('2026-09-24T10:00:00.000Z'));
    const first = await service.initializeFromReadSnapshot({ snapshot: snapshot('public_entry'), logicalContextKey: 'public:continuation-1', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const second = await service.initializeFromReadSnapshot({ snapshot: snapshot('public_entry'), logicalContextKey: 'public:continuation-1', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    expect(second.id).toBe(first.id);
    expect(first.logicalContextKey).toContain('"sourceMode":"public_entry"');
    expect(first.subjectLevel).toBe('challenge_like');
    expect(first.parentStatus).toBe('unresolved');
    expect(db.canonicalWrites).toEqual({ strategicFront: 0, challenge: 0, project: 0, initiative: 0, step: 0 });
  });

  it('resolves concurrent initialization to one namespaced state', async () => {
    const db = fakePrisma({ forceConcurrentCreateConflict: true });
    const service = new StrategicFramingProvisionalStateService(db as any);
    const results = await Promise.all([
      service.initializeFromReadSnapshot({ snapshot: snapshot('enterprise_direct'), logicalContextKey: 'same-raw-key', actorUserId: 'user-1', organizationId: 'org-1', permissions: read }),
      service.initializeFromReadSnapshot({ snapshot: snapshot('enterprise_direct'), logicalContextKey: 'same-raw-key', actorUserId: 'user-1', organizationId: 'org-1', permissions: read }),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(db.states.size).toBe(1);
  });

  it('does not reuse the same raw key across organizations or source modes', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const orgOne = await service.initializeFromReadSnapshot({ snapshot: snapshot('enterprise_direct'), logicalContextKey: 'same-raw-key', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const orgTwo = await service.initializeFromReadSnapshot({ snapshot: snapshot('enterprise_direct'), logicalContextKey: 'same-raw-key', actorUserId: 'user-1', organizationId: 'org-2', permissions: read });
    const publicEntry = await service.initializeFromReadSnapshot({ snapshot: snapshot('public_entry'), logicalContextKey: 'same-raw-key', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const sameContext = await service.initializeFromReadSnapshot({ snapshot: snapshot('enterprise_direct'), logicalContextKey: 'same-raw-key', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    expect(new Set([orgOne.id, orgTwo.id, publicEntry.id]).size).toBe(3);
    expect(sameContext.id).toBe(orgOne.id);
  });

  it('supports enterprise direct without continuation and existing portfolio as evidence only', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const direct = await service.initializeFromReadSnapshot({ snapshot: snapshot('enterprise_direct'), logicalContextKey: 'direct:case-1', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const existing = await service.initializeFromReadSnapshot({ snapshot: { ...snapshot('existing_portfolio'), context: { ...snapshot('existing_portfolio').context, sourceContinuationId: null }, anchor: { ...snapshot('existing_portfolio').anchor, parentContext: { status: 'known', label: 'Growth', sourceRefs: ['canonical:front-1'] } }, scopeAssessment: { ...snapshot('existing_portfolio').scopeAssessment, level: 'front_like' } }, logicalContextKey: 'portfolio:front-1', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    expect(direct.sourceMode).toBe('enterprise_direct');
    expect(existing.sourceMode).toBe('existing_portfolio');
    expect(existing.parentStatus).toBe('known');
  });

  it('records a human correction, increments version and preserves prior material state', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any, () => new Date('2026-09-24T11:00:00.000Z'));
    const created = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'direct:case-2', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const corrected = await service.correct({ stateId: created.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, reason: 'Aclaración humana', correction: { intendedMovement: 'Mejorar retención', parentStatus: 'provisional', parentContext: { label: 'Growth candidate', sourceRefs: ['human:1'] }, sufficiency: { status: 'sufficient', blockers: [], softGaps: [], optionalContext: [] } } });
    expect(corrected.version).toBe(2);
    expect(corrected.intendedMovement).toBe('Mejorar retención');
    expect(corrected.parentStatus).toBe('provisional');
    expect(corrected.parentContext.sourceRefs).toEqual(['entry:1']);
    expect(db.histories[0]).toMatchObject({ version: 1, actorUserId: 'user-1', action: 'human_correction' });
    expect(db.histories[0].snapshot.intendedMovement).toBe('Mejorar conversión');
    expect(corrected.provenance).toMatchObject({ correction: { actorUserId: 'user-1', kind: 'human_corrected' } });
  });

  it('rejects a stale concurrent correction and keeps one history version', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'direct:stale', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    const results = await Promise.allSettled([
      service.correct({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, correction: { intendedMovement: 'Primera corrección' } }),
      service.correct({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, correction: { intendedMovement: 'Corrección stale' } }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')[0]).toMatchObject({ reason: { code: 'SF_PROVISIONAL_STATE_STALE' } });
    expect(db.histories).toHaveLength(1);
    expect(db.states.get(state.id).version).toBe(2);
  });

  it('rolls back history when the conditional correction update fails', async () => {
    const db = fakePrisma({ forceUpdateMiss: true });
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'direct:rollback', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    await expect(service.correct({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: write, expectedVersion: 1, correction: { intendedMovement: 'No debe persistir' } })).rejects.toMatchObject({ code: 'SF_PROVISIONAL_STATE_STALE' });
    expect(db.histories).toHaveLength(0);
    expect(db.states.get(state.id).version).toBe(1);
  });

  it('denies cross-user and cross-organization access', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'direct:case-3', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    await expect(service.getCurrent({ stateId: state.id, actorUserId: 'user-2', organizationId: 'org-1', permissions: read })).rejects.toMatchObject({ code: 'SF_PROVISIONAL_STATE_FORBIDDEN' });
    await expect(service.getCurrent({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-2', permissions: read })).rejects.toMatchObject({ code: 'SF_PROVISIONAL_STATE_FORBIDDEN' });
  });

  it('fails closed for unauthorized corrections', async () => {
    const db = fakePrisma();
    const service = new StrategicFramingProvisionalStateService(db as any);
    const state = await service.initializeFromReadSnapshot({ snapshot: snapshot(), logicalContextKey: 'direct:case-4', actorUserId: 'user-1', organizationId: 'org-1', permissions: read });
    await expect(service.correct({ stateId: state.id, actorUserId: 'user-1', organizationId: 'org-1', permissions: new Set(), expectedVersion: 1, correction: { intendedMovement: 'No' } })).rejects.toBeInstanceOf(AppError);
  });
});
