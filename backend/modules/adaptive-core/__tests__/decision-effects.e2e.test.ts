import { PrismaClient, type DecisionOutcome } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';

const describeC5E2E = process.env.R2_PERSISTENCE_E2E === '1' ? describe : describe.skip;

const prisma = new PrismaClient();

const ownerId = 'user-r3c5-owner';
const leadId = 'user-r3c5-lead';
const challengeId = 'challenge-r3c5';
const strategicFrontId = 'front-r3c5';
const organizationId = 'org-r3c5';
const projectIds = [
  'project-r3c5-continue',
  'project-r3c5-implement',
  'project-r3c5-scale',
  'project-r3c5-pause',
  'project-r3c5-close',
  'project-r3c5-concurrency',
];

async function clean() {
  const where = { projectId: { in: projectIds } };
  await (prisma as any).continuationRoute.deleteMany({ where });
  await (prisma as any).implementationHandoff.deleteMany({ where });
  await (prisma as any).scalingHandoff.deleteMany({ where });
  await (prisma as any).closureSummary.deleteMany({ where });
  await (prisma as any).decision.deleteMany({ where });
  await (prisma as any).decisionRequest.deleteMany({ where });
  await (prisma as any).initiativeGovernance.deleteMany({ where });
  await prisma.adaptiveAdaptationEvent.deleteMany({ where });
  await prisma.adaptiveProgressSignal.deleteMany({ where });
  await prisma.adaptiveCheckpointResponse.deleteMany({ where });
  await prisma.adaptiveCheckpointInstance.deleteMany({ where });
  await prisma.adaptiveStepOutput.deleteMany({ where });
  await prisma.adaptiveStepConfiguration.deleteMany({ where });
  await prisma.cycleStepState.deleteMany({ where: { cycle: { projectId: { in: projectIds } } } });
  await prisma.initiativeCycle.deleteMany({ where });
  await prisma.truthValidation.deleteMany({ where });
  await prisma.evidence.deleteMany({ where });
  await prisma.truthClaim.deleteMany({ where });
  await prisma.sourceRef.deleteMany({ where });
  await prisma.initiativePortfolioMeta.deleteMany({ where });
  await prisma.teamMember.deleteMany({ where });
  await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
  await prisma.challenge.deleteMany({ where: { id: challengeId } });
  await prisma.strategicFront.deleteMany({ where: { id: strategicFrontId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, leadId] } } });
}

async function seedUsersAndChallenge() {
  await prisma.user.createMany({
    data: [
      { id: ownerId, email: 'r3c5-owner@starteria.test', name: 'R3C5 Owner', role: 'participante', initials: 'RO', skills: [] },
      { id: leadId, email: 'r3c5-lead@starteria.test', name: 'R3C5 Lead', role: 'mentor', initials: 'RL', skills: [] },
    ],
  });
  await prisma.organization.create({ data: { id: organizationId, name: 'R3C5 Org', slug: 'r3c5-org' } });
  await prisma.strategicFront.create({ data: { id: strategicFrontId, name: 'R3C5 Front', ownerId: leadId, organizationId } });
  await prisma.challenge.create({ data: { id: challengeId, strategicFrontId, title: 'R3C5 Challenge', ownerId: leadId } });
}

async function seedDecision(projectId: string, outcome: DecisionOutcome) {
  await prisma.project.create({
    data: {
      id: projectId,
      name: `R3C5 ${projectId}`,
      description: 'Disposable R3-C5 E2E project.',
      ownerId,
      status: 'IN_PROGRESS',
      currentStep: 4,
      step0Status: 'COMPLETED',
      step0Data: { challengeType: 'growth', initialFocus: 'Foco', expectedImpact: 'Impacto', mainRisk: 'Riesgo conocido' },
      teamMembers: {
        create: [
          { userId: ownerId, role: 'OWNER', status: 'ACTIVE', modulePermissions: [] },
          { userId: leadId, role: 'VIEWER', status: 'ACTIVE', modulePermissions: [] },
        ],
      },
    },
  });
  await prisma.initiativePortfolioMeta.create({
    data: { projectId, challengeId, strategicFrontId, currentStep: 'Step 4', status: 'lista_para_decision', readyForDecision: true },
  });
  await (prisma as any).initiativeGovernance.create({
    data: { projectId, mode: 'portfolio_governed', portfolioLeadUserId: leadId },
  });
  const cycle = await prisma.initiativeCycle.create({
    data: {
      projectId,
      cycleNumber: 1,
      triggerType: 'initial',
      startStep: 0,
      currentStep: 4,
      status: 'completed',
      completedAt: new Date('2026-08-20T10:00:00.000Z'),
    },
  });
  for (let stepNumber = 0; stepNumber <= 4; stepNumber += 1) {
    await prisma.cycleStepState.create({ data: { cycleId: cycle.id, stepNumber, state: 'confirmed' } });
    await prisma.adaptiveStepOutput.create({
      data: {
        projectId,
        cycleId: cycle.id,
        stepNumber,
        version: 1,
        status: 'confirmed',
        outputKey: `Step${stepNumber}Output`,
        outputJson: { stepNumber, selectedBet: stepNumber === 2 ? 'A' : undefined, learning: stepNumber === 4 ? 'Learning' : undefined },
        confirmedById: ownerId,
        confirmedAt: new Date('2026-08-20T10:05:00.000Z'),
      },
    });
  }
  const config = await prisma.adaptiveStepConfiguration.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 3,
      version: 1,
      status: 'active',
      routeType: 'explore_validate',
      depthLevel: 'standard',
      configurationJson: { step: 3 },
      sourceContextJson: { step2Output: { selectedBet: 'A' }, risks: ['Riesgo conocido'] },
    },
  });
  const source = await prisma.sourceRef.create({ data: { projectId, sourceType: 'USER_INPUT', reference: `${projectId}-source` } });
  const claim = await prisma.truthClaim.create({
    data: {
      projectId,
      subjectType: 'initiative',
      subjectId: projectId,
      claimType: 'learning',
      statement: 'La iniciativa tiene aprendizaje trazable.',
      createdById: ownerId,
      createdByType: 'human',
      verificationState: 'supported',
    },
  });
  const evidence = await prisma.evidence.create({
    data: { projectId, name: `${projectId} evidence`, type: 'OTHER', stepRef: 4, ownerId, sourceRefId: source.id, targetClaimId: claim.id, truthStatus: 'supports' },
  });
  const request = await (prisma as any).decisionRequest.create({
    data: {
      projectId,
      sourceCycleId: cycle.id,
      requestedById: ownerId,
      status: 'resolved',
      authorityType: 'portfolio_lead',
      authorityUserId: leadId,
      readinessSnapshotJson: { assessments: [] },
      authoritySnapshotJson: { authorityPurpose: 'portfolio_review', authorityType: 'portfolio_lead', authorityUserId: leadId },
      decisionPackageSnapshotJson: { sourceOutputId: `step4-${projectId}`, decisionPackage: { scope: 'Scope', metrics: ['M1'], evidenceReferences: [evidence.id], risks: ['R1'] } },
      recommendationSnapshotJson: { recommendation: 'Starteria analysis' },
      presentationSnapshotJson: { completionRouting: { route: 'portfolio_presented' }, learning: { summary: 'Learning' }, evidenceReferences: [evidence.id] },
      idempotencyKey: `request-${projectId}`,
    },
  });
  const decision = await (prisma as any).decision.create({
    data: {
      projectId,
      sourceCycleId: cycle.id,
      decisionRequestId: request.id,
      outcome,
      decidedById: leadId,
      rationale: `Decision ${outcome}`,
      conditionsJson: outcome === 'implement' || outcome === 'scale' ? [{ code: 'EXECUTION_CONDITION', accepted: true }] : null,
      authoritySnapshotJson: { authorityPurpose: 'portfolio_review', authorityType: 'portfolio_lead', authorityUserId: leadId },
      readinessSnapshotJson: outcome === 'continue_experimenting'
        ? { decisionType: outcome, overallStatus: 'ready', conditions: [{ code: 'EXECUTION_GAP', dimension: 'execution', message: 'Revisar ejecucion' }], unresolvedQuestions: [] }
        : { decisionType: outcome, overallStatus: 'ready', conditions: [], unresolvedQuestions: [] },
      recommendationSnapshotJson: { recommendation: 'Starteria analysis' },
      packageSnapshotJson: { decisionPackage: { scope: 'Scope', metrics: ['M1'], evidenceReferences: [evidence.id], risks: ['R1'] } },
      presentationSnapshotJson: { completionRouting: { route: 'portfolio_presented' }, learning: { summary: 'Learning' }, evidenceReferences: [evidence.id] },
      idempotencyKey: `decision-${projectId}`,
    },
  });
  return { cycle, config, source, claim, evidence, request, decision };
}

async function historicalSnapshot(projectId: string) {
  const [outputs, claims, evidence, sourceRefs, decisions, requests] = await Promise.all([
    prisma.adaptiveStepOutput.findMany({ where: { projectId }, orderBy: [{ stepNumber: 'asc' }, { version: 'asc' }] }),
    prisma.truthClaim.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
    prisma.evidence.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
    prisma.sourceRef.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
    (prisma as any).decision.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
    (prisma as any).decisionRequest.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
  ]);
  return JSON.stringify({ outputs, claims, evidence, sourceRefs, decisions, requests });
}

describeC5E2E('R3-C5 DecisionEffects PostgreSQL E2E', () => {
  beforeAll(async () => {
    await clean();
    await seedUsersAndChallenge();
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('applies all five outcome mappings with persisted route and lifecycle projection', async () => {
    const service = new AdaptiveCoreService(prisma);
    const seeded = {
      continue_experimenting: await seedDecision('project-r3c5-continue', 'continue_experimenting'),
      implement: await seedDecision('project-r3c5-implement', 'implement'),
      scale: await seedDecision('project-r3c5-scale', 'scale'),
      pause: await seedDecision('project-r3c5-pause', 'pause'),
      close_with_learning: await seedDecision('project-r3c5-close', 'close_with_learning'),
    };
    const beforeClose = await historicalSnapshot('project-r3c5-close');

    const continueResult = await service.applyDecisionEffects('project-r3c5-continue', leadId, 'mentor', seeded.continue_experimenting.decision.id, { idempotencyKey: 'r3c5-effects-continue' });
    const implementResult = await service.applyDecisionEffects('project-r3c5-implement', leadId, 'mentor', seeded.implement.decision.id, { idempotencyKey: 'r3c5-effects-implement' });
    const scaleResult = await service.applyDecisionEffects('project-r3c5-scale', leadId, 'mentor', seeded.scale.decision.id, { idempotencyKey: 'r3c5-effects-scale' });
    const pauseResult = await service.applyDecisionEffects('project-r3c5-pause', leadId, 'mentor', seeded.pause.decision.id, { idempotencyKey: 'r3c5-effects-pause' });
    const closeResult = await service.applyDecisionEffects('project-r3c5-close', leadId, 'mentor', seeded.close_with_learning.decision.id, { idempotencyKey: 'r3c5-effects-close' });

    expect(continueResult.route.routeType).toBe('new_cycle');
    expect(implementResult.route.routeType).toBe('implementation_handoff');
    expect(scaleResult.route.routeType).toBe('scaling_handoff');
    expect(pauseResult.route.routeType).toBe('paused');
    expect(closeResult.route.routeType).toBe('closed');

    const cycle2 = await prisma.initiativeCycle.findUniqueOrThrow({ where: { id: continueResult.resultingCycleId! } });
    expect(cycle2).toMatchObject({
      cycleNumber: 2,
      parentCycleId: seeded.continue_experimenting.cycle.id,
      triggerType: 'decision',
      triggerRefId: seeded.continue_experimenting.decision.id,
      startStep: 3,
      currentStep: 3,
      status: 'active',
    });
    expect(await prisma.initiativeCycle.findUniqueOrThrow({ where: { id: seeded.continue_experimenting.cycle.id } })).toMatchObject({ status: 'completed' });
    expect(await prisma.cycleStepState.findMany({ where: { cycleId: cycle2.id }, orderBy: { stepNumber: 'asc' } })).toMatchObject([
      expect.objectContaining({ stepNumber: 0, state: 'inherited', inheritedFromCycleId: seeded.continue_experimenting.cycle.id }),
      expect.objectContaining({ stepNumber: 1, state: 'inherited', inheritedFromCycleId: seeded.continue_experimenting.cycle.id }),
      expect.objectContaining({ stepNumber: 2, state: 'inherited', inheritedFromCycleId: seeded.continue_experimenting.cycle.id }),
      expect.objectContaining({ stepNumber: 3, state: 'active' }),
      expect.objectContaining({ stepNumber: 4, state: 'pending' }),
    ]);
    expect(await prisma.adaptiveStepOutput.count({ where: { cycleId: cycle2.id } })).toBe(0);
    expect(await prisma.project.findUniqueOrThrow({ where: { id: 'project-r3c5-continue' } })).toMatchObject({ status: 'IN_PROGRESS', currentStep: 3 });
    expect(await prisma.initiativePortfolioMeta.findFirstOrThrow({ where: { projectId: 'project-r3c5-continue' } })).toMatchObject({ status: 'en_step_3', currentStep: 'Step 3' });

    expect(await prisma.initiativeCycle.count({ where: { projectId: 'project-r3c5-implement' } })).toBe(1);
    expect(await prisma.initiativeCycle.count({ where: { projectId: 'project-r3c5-scale' } })).toBe(1);
    expect(await prisma.initiativeCycle.count({ where: { projectId: 'project-r3c5-pause' } })).toBe(1);
    expect(await prisma.initiativeCycle.count({ where: { projectId: 'project-r3c5-close' } })).toBe(1);
    expect(await (prisma as any).implementationHandoff.count({ where: { projectId: 'project-r3c5-implement' } })).toBe(1);
    expect(await (prisma as any).scalingHandoff.count({ where: { projectId: 'project-r3c5-scale' } })).toBe(1);
    expect(await (prisma as any).closureSummary.count({ where: { projectId: 'project-r3c5-close' } })).toBe(1);
    expect(await prisma.project.findUniqueOrThrow({ where: { id: 'project-r3c5-implement' } })).toMatchObject({ status: 'IMPLEMENTATION_APPROVED' });
    expect(await prisma.project.findUniqueOrThrow({ where: { id: 'project-r3c5-scale' } })).toMatchObject({ status: 'SCALING_APPROVED' });
    expect(await prisma.project.findUniqueOrThrow({ where: { id: 'project-r3c5-pause' } })).toMatchObject({ status: 'PAUSED' });
    expect(await prisma.project.findUniqueOrThrow({ where: { id: 'project-r3c5-close' } })).toMatchObject({ status: 'CLOSED' });
    expect(await prisma.initiativePortfolioMeta.findFirstOrThrow({ where: { projectId: 'project-r3c5-implement' } })).toMatchObject({ status: 'implementation_approved' });
    expect(await prisma.initiativePortfolioMeta.findFirstOrThrow({ where: { projectId: 'project-r3c5-scale' } })).toMatchObject({ status: 'scaling_approved' });
    expect(await prisma.initiativePortfolioMeta.findFirstOrThrow({ where: { projectId: 'project-r3c5-pause' } })).toMatchObject({ status: 'paused' });
    expect(await prisma.initiativePortfolioMeta.findFirstOrThrow({ where: { projectId: 'project-r3c5-close' } })).toMatchObject({ status: 'closed' });
    expect(await historicalSnapshot('project-r3c5-close')).toBe(beforeClose);

    const fresh = new PrismaClient();
    try {
      const routes = await new AdaptiveCoreService(fresh).listContinuationRoutes('project-r3c5-implement', leadId, 'mentor');
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({ routeType: 'implementation_handoff', decisionId: seeded.implement.decision.id });
    } finally {
      await fresh.$disconnect();
    }
  });

  it('is idempotent and serializes concurrent application to one effective route', async () => {
    const service = new AdaptiveCoreService(prisma);
    const seeded = await seedDecision('project-r3c5-concurrency', 'close_with_learning');

    const results = await Promise.allSettled([
      service.applyDecisionEffects('project-r3c5-concurrency', leadId, 'mentor', seeded.decision.id, { idempotencyKey: 'r3c5-effects-concurrency-a' }),
      service.applyDecisionEffects('project-r3c5-concurrency', leadId, 'mentor', seeded.decision.id, { idempotencyKey: 'r3c5-effects-concurrency-b' }),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    expect(await (prisma as any).continuationRoute.count({ where: { projectId: 'project-r3c5-concurrency' } })).toBe(1);
    expect(await (prisma as any).closureSummary.count({ where: { projectId: 'project-r3c5-concurrency' } })).toBe(1);
    const route = await (prisma as any).continuationRoute.findFirstOrThrow({ where: { projectId: 'project-r3c5-concurrency' } });
    const retry = await service.applyDecisionEffects('project-r3c5-concurrency', leadId, 'mentor', seeded.decision.id, { idempotencyKey: 'r3c5-effects-concurrency-a' });
    expect(retry.route.id).toBe(route.id);
    expect(await (prisma as any).decision.count({ where: { projectId: 'project-r3c5-concurrency' } })).toBe(1);
    expect(await prisma.initiativeCycle.count({ where: { projectId: 'project-r3c5-concurrency' } })).toBe(1);
  });
});
