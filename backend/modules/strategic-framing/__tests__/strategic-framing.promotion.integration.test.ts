import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { StrategicFramingPromotionService, type StrategicFramingPromotionInput } from '../strategic-framing.promotion.service';

const databaseUrl = process.env.E2E_DATABASE_URL;
const run = databaseUrl ? describe : describe.skip;
const prisma = new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);
const suffix = `sf6c-${Date.now()}`;
const stateIds: string[] = [];
const challengeIds: string[] = [];
const actor = { id: '', roles: ['portfolio_lead'], permissions: permissionsForRoles(['portfolio_lead']) };
let organizationId = '';
let frontId = 'front-e2e-existing';
let grantId = '';

function payload(stateId: string, overrides: Partial<StrategicFramingPromotionInput> = {}): StrategicFramingPromotionInput {
  return { stateId, challengeCandidateId: 'cc-1', expectedVersion: 1, strategicFrontId: frontId, title: `SF6C ${stateId} challenge`, statement: 'Integration statement', type: 'crecimiento', actor, ...overrides };
}

async function createFixture(label: string): Promise<string> {
  const stateId = `${suffix}-${label}`;
  stateIds.push(stateId);
  await prisma.strategicFramingProvisionalState.create({ data: {
    id: stateId, userId: actor.id, organizationId, sourceMode: 'enterprise_direct', logicalContextKey: stateId,
    sourceRefs: ['integration:sf6c'], provenance: { test: true }, subjectLevel: 'challenge_like', scopeAssessment: {}, parentStatus: 'unresolved', parentContext: {}, sufficiencyStatus: 'sufficient', blockers: [], softGaps: [], optionalContext: {}, version: 1,
    prioritizationState: { schemaVersion: 1, nonCanonical: true, candidates: [{ candidateId: 'gap-1', kind: 'gap', statementSnapshot: 'gap', sourceRefs: ['source:gap'], humanDisposition: 'address_now', humanDecision: { disposition: 'address_now' } }] },
    challengeStructuringState: { schemaVersion: 1, nonCanonical: true, candidates: [{ challengeCandidateId: 'cc-1', sourceCandidateIds: ['gap-1'], relatedWorkRefs: [], statement: 'Integration statement', structureKind: 'one_challenge', structuralRecommendationRef: 'sf6b:1', structuralRecommendationVersion: 'v1', confirmedByUserId: actor.id, confirmedAt: new Date().toISOString(), createdFromStateVersion: 1 }] },
  } as any });
  return stateId;
}

async function countFor(stateId: string) {
  const [promotions, challenges] = await Promise.all([
    prisma.strategicFramingPromotion.count({ where: { stateId } }),
    prisma.challenge.count({ where: { strategicFrontId: frontId, title: { startsWith: `SF6C ${stateId} challenge` } } }),
  ]);
  return { promotions, challenges };
}

run('SF-6C PostgreSQL integration', () => {
  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: process.env.E2E_USER_EMAIL ?? 'portfolio.e2e@starteria.test' } });
    actor.id = user.id;
    organizationId = user.organizationId!;
    const membership = await prisma.organizationMember.findFirstOrThrow({ where: { userId: actor.id, organizationId } });
    expect(membership).toBeTruthy();
    grantId = `${suffix}-grant`;
    await prisma.organizationPortfolioAccessGrant.create({ data: { id: grantId, userId: actor.id, organizationId, capability: 'portfolio:write', grantedByUserId: actor.id } });
  });

  afterAll(async () => {
    await prisma.organizationPortfolioAccessGrant.deleteMany({ where: { id: grantId } });
    await prisma.strategicFramingPromotion.deleteMany({ where: { stateId: { in: stateIds } } });
    if (challengeIds.length) await prisma.challenge.deleteMany({ where: { id: { in: challengeIds } } });
    await prisma.strategicFramingProvisionalState.deleteMany({ where: { id: { in: stateIds } } });
    await prisma.$disconnect();
  });

  it('rolls back Challenge when trace creation fails', async () => {
    const stateId = await createFixture('trace-failure');
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION sf6c_fail_trace() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SF6C forced trace failure'; END; $$`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER sf6c_fail_trace_trigger BEFORE INSERT ON "StrategicFramingPromotion" FOR EACH ROW EXECUTE FUNCTION sf6c_fail_trace()`);
    await expect(new StrategicFramingPromotionService(prisma).promote(payload(stateId))).rejects.toThrow('SF6C forced trace failure');
    await prisma.$executeRawUnsafe(`DROP TRIGGER sf6c_fail_trace_trigger ON "StrategicFramingPromotion"`);
    await prisma.$executeRawUnsafe('DROP FUNCTION sf6c_fail_trace()');
    expect(await countFor(stateId)).toEqual({ promotions: 0, challenges: 0 });
  });

  it('does not create a trace when Challenge creation fails', async () => {
    const stateId = await createFixture('challenge-failure');
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION sf6c_fail_challenge() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SF6C forced Challenge failure'; END; $$`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER sf6c_fail_challenge_trigger BEFORE INSERT ON "Challenge" FOR EACH ROW EXECUTE FUNCTION sf6c_fail_challenge()`);
    await expect(new StrategicFramingPromotionService(prisma).promote(payload(stateId))).rejects.toThrow('SF6C forced Challenge failure');
    await prisma.$executeRawUnsafe(`DROP TRIGGER sf6c_fail_challenge_trigger ON "Challenge"`);
    await prisma.$executeRawUnsafe('DROP FUNCTION sf6c_fail_challenge()');
    expect(await countFor(stateId)).toEqual({ promotions: 0, challenges: 0 });
  });

  it('concurrent exact requests durably produce one Challenge and one trace', async () => {
    const stateId = await createFixture('concurrent-exact');
    const results = await Promise.all([new StrategicFramingPromotionService(prisma).promote(payload(stateId)), new StrategicFramingPromotionService(prisma).promote(payload(stateId))]);
    expect(results[0].challenge.id).toBe(results[1].challenge.id);
    expect(results[0].promotion.id).toBe(results[1].promotion.id);
    const counts = await countFor(stateId);
    expect(counts.promotions).toBe(1);
    expect(counts.challenges).toBe(1);
    challengeIds.push(results[0].challenge.id);
  });

  it('concurrent changed requests yield one success and one conflict', async () => {
    const stateId = await createFixture('concurrent-changed');
    const results = await Promise.allSettled([new StrategicFramingPromotionService(prisma).promote(payload(stateId, { title: `SF6C ${stateId} challenge A` })), new StrategicFramingPromotionService(prisma).promote(payload(stateId, { title: `SF6C ${stateId} challenge B` }))]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason.code).toBe('PROMOTION_CONFLICT');
    expect((await countFor(stateId)).promotions).toBe(1);
    expect((await countFor(stateId)).challenges).toBe(1);
    const winner = results.find((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')!;
    challengeIds.push(winner.value.challenge.id);
  });

  it('forbids exact retry after scoped portfolio:write revocation without writes', async () => {
    const stateId = await createFixture('revocation');
    const service = new StrategicFramingPromotionService(prisma);
    const first = await service.promote(payload(stateId));
    challengeIds.push(first.challenge.id);
    const before = await countFor(stateId);
    await prisma.organizationPortfolioAccessGrant.delete({ where: { id: grantId } });
    await expect(service.promote(payload(stateId))).rejects.toMatchObject({ code: 'PROMOTION_FORBIDDEN' });
    expect(await countFor(stateId)).toEqual(before);
    await prisma.organizationPortfolioAccessGrant.create({ data: { id: grantId, userId: actor.id, organizationId, capability: 'portfolio:write', grantedByUserId: actor.id } });
  });

  it('has the required promotion table uniques and only the restrictive state FK', async () => {
    const table = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StrategicFramingPromotion'`);
    expect(table).toHaveLength(1);
    const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string; indexdef: string }>>(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'StrategicFramingPromotion'`);
    expect(indexes.some((row) => row.indexname === 'StrategicFramingPromotion_challengeId_key' && row.indexdef.includes('UNIQUE'))).toBe(true);
    expect(indexes.some((row) => row.indexname === 'StrategicFramingPromotion_stateId_challengeCandidateId_key' && row.indexdef.includes('UNIQUE'))).toBe(true);
    const constraints = await prisma.$queryRawUnsafe<Array<{ constraint_name: string; constraint_type: string; delete_rule: string | null }>>(`SELECT tc.constraint_name, tc.constraint_type, rc.delete_rule FROM information_schema.table_constraints tc LEFT JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.constraint_schema WHERE tc.table_schema = 'public' AND tc.table_name = 'StrategicFramingPromotion'`);
    const fks = constraints.filter((row) => row.constraint_type === 'FOREIGN KEY');
    expect(fks).toHaveLength(1);
    expect(fks[0]).toMatchObject({ constraint_name: 'StrategicFramingPromotion_stateId_fkey', delete_rule: 'RESTRICT' });
  });
});
