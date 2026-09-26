import { describe, expect, it, vi } from 'vitest';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { StrategicFramingPromotionService, type StrategicFramingPromotionInput } from '../strategic-framing.promotion.service';

function fixture(version = 1) {
  return {
    id: 'state-1', organizationId: 'org-1', version,
    sourceRefs: ['source:state'],
    prioritizationState: { schemaVersion: 1, nonCanonical: true, candidates: [
      { candidateId: 'gap-1', kind: 'gap', statementSnapshot: 'gap', sourceRefs: ['source:gap'], humanDisposition: 'address_now', humanDecision: { disposition: 'address_now' } },
      { candidateId: 'opp-1', kind: 'opportunity', statementSnapshot: 'opp', sourceRefs: ['source:opp'], humanDisposition: 'address_now', humanDecision: { disposition: 'address_now' } },
    ] },
    challengeStructuringState: { schemaVersion: 1, nonCanonical: true, candidates: [{ challengeCandidateId: 'cc-1', sourceCandidateIds: ['gap-1', 'opp-1'], relatedWorkRefs: [], statement: 'Mover conversion', structureKind: 'multiple_challenges', structuralRecommendationRef: 'sf6b:1', structuralRecommendationVersion: 'v1', confirmedByUserId: 'u-1', confirmedAt: '2026-09-26T10:00:00.000Z', createdFromStateVersion: 1 }] },
  };
}

function makeDb(version = 1) {
  const state = fixture(version);
  const promotions = new Map<string, any>();
  const challenges = new Map<string, any>();
  let challengeNumber = 0;
  const db: any = {
    state,
    strategicFramingProvisionalState: { findUnique: vi.fn(async () => db.state) },
    strategicFramingPromotion: {
      findUnique: vi.fn(async ({ where }: any) => promotions.get(`${where.stateId_challengeCandidateId.stateId}:${where.stateId_challengeCandidateId.challengeCandidateId}`) ?? null),
      create: vi.fn(async ({ data }: any) => { const value = { id: 'promotion-1', ...data }; promotions.set(`${data.stateId}:${data.challengeCandidateId}`, value); return value; }),
    },
    strategicFront: { findUnique: vi.fn(async () => ({ id: 'front-1', organizationId: 'org-1' })) },
    challenge: {
      create: vi.fn(async ({ data }: any) => { const value = { id: `challenge-${++challengeNumber}`, ...data }; challenges.set(value.id, value); return value; }),
      findUnique: vi.fn(async ({ where }: any) => challenges.get(where.id) ?? null),
    },
    $transaction: vi.fn(async (work: (tx: any) => Promise<unknown>) => work(db)),
  };
  return db;
}

const actor = { id: 'u-1', roles: ['portfolio_lead'], permissions: permissionsForRoles(['portfolio_lead']) };
const input = (overrides: Partial<StrategicFramingPromotionInput> = {}): StrategicFramingPromotionInput => ({ stateId: 'state-1', challengeCandidateId: 'cc-1', expectedVersion: 1, strategicFrontId: 'front-1', title: 'Conversion challenge', statement: 'Move conversion', type: 'crecimiento', actor, ...overrides });

describe('StrategicFramingPromotionService', () => {
  const authorized = () => ({ canUserAccessPortfolio: vi.fn().mockResolvedValue(true) });

  it('creates one draft Challenge and one trace atomically', async () => {
    const db = makeDb();
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    const result = await service.promote(input());
    expect(result.retry).toBe(false);
    expect(db.challenge.create).toHaveBeenCalledTimes(1);
    expect(db.strategicFramingPromotion.create).toHaveBeenCalledTimes(1);
    expect(result.challenge.status).toBe('draft');
    expect(result.challenge.description).toBe('Move conversion');
    expect(result.promotion.sourceCandidateIds).toEqual(['gap-1', 'opp-1']);
    expect(result.promotion.candidateSnapshot.sourceCandidates).toHaveLength(2);
  });

  it.each([
    ['admin-only', { roles: ['admin'], permissions: permissionsForRoles(['admin']) }],
    ['sponsor-only', { roles: ['sponsor'], permissions: permissionsForRoles(['sponsor']) }],
    ['permission missing', { roles: ['portfolio_lead'], permissions: new Set() }],
  ])('rejects %s authority before canonical writes', async (_label, deniedActor) => {
    const db = makeDb();
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    await expect(service.promote(input({ actor: { id: 'u-1', ...deniedActor } as any }))).rejects.toMatchObject({ code: 'PROMOTION_FORBIDDEN' });
    expect(db.challenge.create).not.toHaveBeenCalled();
    expect(db.strategicFramingPromotion.create).not.toHaveBeenCalled();
  });

  it('requires membership plus the scoped write grant', async () => {
    const db = makeDb();
    const access = { canUserAccessPortfolio: vi.fn().mockResolvedValue(false) };
    const service = new StrategicFramingPromotionService(db, access as any);
    await expect(service.promote(input())).rejects.toMatchObject({ code: 'PROMOTION_FORBIDDEN' });
    expect(access.canUserAccessPortfolio).toHaveBeenCalledWith({ userId: 'u-1', organizationId: 'org-1', capability: 'portfolio:write' });
    expect(db.challenge.create).not.toHaveBeenCalled();
  });

  it('blocks null or mismatched server-owned scope and missing Front', async () => {
    for (const stateOrganizationId of [null, 'org-2']) {
      const db = makeDb();
      db.state.organizationId = stateOrganizationId;
      const service = new StrategicFramingPromotionService(db, { canUserAccessPortfolio: vi.fn().mockResolvedValue(Boolean(stateOrganizationId)) } as any);
      await expect(service.promote(input())).rejects.toMatchObject({ code: stateOrganizationId ? 'FRONT_SCOPE_MISMATCH' : 'PROMOTION_FORBIDDEN' });
    }
    const db = makeDb();
    db.strategicFront.findUnique.mockResolvedValue(null);
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    await expect(service.promote(input())).rejects.toMatchObject({ code: 'FRONT_NOT_FOUND' });
    const nullFrontDb = makeDb();
    nullFrontDb.strategicFront.findUnique.mockResolvedValue({ id: 'front-1', organizationId: null });
    const nullFrontService = new StrategicFramingPromotionService(nullFrontDb, authorized() as any);
    await expect(nullFrontService.promote(input())).rejects.toMatchObject({ code: 'FRONT_SCOPE_MISMATCH' });
  });

  it.each([
    ['missing candidate', { challengeCandidateId: 'unknown' }],
    ['empty source set', { mutate: (db: any) => { db.state.challengeStructuringState.candidates[0].sourceCandidateIds = []; } }],
    ['source not address_now', { mutate: (db: any) => { db.state.prioritizationState.candidates[0].humanDisposition = 'defer'; } }],
    ['missing human decision', { mutate: (db: any) => { delete db.state.prioritizationState.candidates[0].humanDecision; } }],
    ['missing candidate source id', { mutate: (db: any) => { db.state.challengeStructuringState.candidates[0].sourceCandidateIds = ['stale']; } }],
  ])('rejects candidate eligibility: %s', async (_label, scenario: any) => {
    const db = makeDb();
    scenario.mutate?.(db);
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    await expect(service.promote(input({ challengeCandidateId: scenario.challengeCandidateId ?? 'cc-1' }))).rejects.toMatchObject({ code: scenario.challengeCandidateId ? 'CANDIDATE_NOT_FOUND' : 'PROMOTION_NOT_ELIGIBLE' });
    expect(db.challenge.create).not.toHaveBeenCalled();
  });

  it('rejects a stale first request with zero canonical writes', async () => {
    const db = makeDb(2);
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    await expect(service.promote(input())).rejects.toMatchObject({ code: 'STALE_STATE' });
    expect(db.challenge.create).not.toHaveBeenCalled();
    expect(db.strategicFramingPromotion.create).not.toHaveBeenCalled();
  });

  it('returns an exact retry after the state version changes without writes', async () => {
    const db = makeDb();
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    const first = await service.promote(input());
    db.state.version = 2;
    const retry = await service.promote(input());
    expect(retry.retry).toBe(true);
    expect(retry.challenge.id).toBe(first.challenge.id);
    expect(retry.promotion.id).toBe(first.promotion.id);
    expect(db.challenge.create).toHaveBeenCalledTimes(1);
    expect(db.strategicFramingPromotion.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['front', { strategicFrontId: 'front-2' }],
    ['title', { title: 'Other challenge' }],
    ['statement', { statement: 'Other statement' }],
    ['type', { type: 'correccion' as const }],
    ['objective', { objective: 'Other objective' }],
    ['whyNow', { whyNow: 'Now' }],
    ['successCriteria', { successCriteria: 'Criterion' }],
    ['rationale', { rationale: 'Reason' }],
  ])('returns PROMOTION_CONFLICT for changed retry: %s', async (_label, changed) => {
    const db = makeDb();
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    await service.promote(input());
    await expect(service.promote(input(changed))).rejects.toMatchObject({ code: 'PROMOTION_CONFLICT' });
    expect(db.challenge.create).toHaveBeenCalledTimes(1);
    expect(db.strategicFramingPromotion.create).toHaveBeenCalledTimes(1);
  });

  it('re-authorizes exact retry and forbids it after scoped authority revocation', async () => {
    const db = makeDb();
    const access = { canUserAccessPortfolio: vi.fn().mockResolvedValue(true) };
    const service = new StrategicFramingPromotionService(db, access as any);
    await service.promote(input());
    access.canUserAccessPortfolio.mockResolvedValue(false);
    await expect(service.promote(input())).rejects.toMatchObject({ code: 'PROMOTION_FORBIDDEN' });
    expect(db.challenge.create).toHaveBeenCalledTimes(1);
    expect(db.strategicFramingPromotion.create).toHaveBeenCalledTimes(1);
  });

  it('keeps provisional state and prohibited downstream boundaries untouched', async () => {
    const db = makeDb();
    const before = JSON.parse(JSON.stringify(db.state));
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    const result = await service.promote(input());
    expect(db.state).toEqual(before);
    expect(result.challenge).toMatchObject({ status: 'draft', strategicFrontId: 'front-1' });
    expect(result.challenge).not.toHaveProperty('challengeOwner');
    expect(result.challenge).not.toHaveProperty('ownerId');
    expect(result.challenge).not.toHaveProperty('sponsorId');
    expect(result.challenge.openCallStatus).toBeUndefined();
    expect(result.challenge.visibleToParticipants).toBeUndefined();
    expect(db).not.toHaveProperty('invitation');
    expect(db).not.toHaveProperty('project');
    expect(db).not.toHaveProperty('step');
  });

  it.each([
    ['title', { title: ' ' }],
    ['statement', { statement: ' ' }],
    ['type', { type: undefined as any }],
  ])('rejects invalid payload: %s', async (_label, changed) => {
    const db = makeDb();
    const service = new StrategicFramingPromotionService(db, authorized() as any);
    await expect(service.promote(input(changed))).rejects.toMatchObject({ code: 'INVALID_PROMOTION_PAYLOAD' });
  });
});
