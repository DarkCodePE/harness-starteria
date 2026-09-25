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
    framingSignals: { observations: [], drivers: [], gaps: [], opportunities: [] },
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
