import { PrismaClient } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';

const describeC4AE2E = process.env.R2_PERSISTENCE_E2E === '1' ? describe : describe.skip;

const prisma = new PrismaClient();

const ownerId = 'user-r3c4a-owner';
const leadId = 'user-r3c4a-lead';
const newLeadId = 'user-r3c4a-new-lead';
const otherId = 'user-r3c4a-other';
const portfolioProjectId = 'project-r3c4a-portfolio';
const staleProjectId = 'project-r3c4a-stale';
const authorityProjectId = 'project-r3c4a-authority';
const concurrencyProjectId = 'project-r3c4a-concurrency';
const challengeId = 'challenge-r3c4a';
const strategicFrontId = 'front-r3c4a';
const organizationId = 'org-r3c4a';

async function clean() {
  const projectIds = [portfolioProjectId, staleProjectId, authorityProjectId, concurrencyProjectId];
  const where = { projectId: { in: projectIds } };
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
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, leadId, newLeadId, otherId] } } });
}

async function seedUsersAndChallenge() {
  await prisma.user.createMany({
    data: [
      { id: ownerId, email: 'r3c4a-owner@starteria.test', name: 'R3C4A Owner', role: 'participante', initials: 'RO', skills: [] },
      { id: leadId, email: 'r3c4a-lead@starteria.test', name: 'R3C4A Lead', role: 'mentor', initials: 'RL', skills: [] },
      { id: newLeadId, email: 'r3c4a-new-lead@starteria.test', name: 'R3C4A New Lead', role: 'mentor', initials: 'RN', skills: [] },
      { id: otherId, email: 'r3c4a-other@starteria.test', name: 'R3C4A Other', role: 'mentor', initials: 'RG', skills: [] },
    ],
  });
  await prisma.organization.create({ data: { id: organizationId, name: 'R3C4A Org', slug: 'r3c4a-org' } });
  await prisma.strategicFront.create({ data: { id: strategicFrontId, name: 'R3C4A Front', ownerId: leadId, organizationId } });
  await prisma.challenge.create({ data: { id: challengeId, strategicFrontId, title: 'R3C4A Challenge', ownerId: leadId } });
}

async function seedPresentedProject(projectId: string, portfolioLeadUserId: string | null = leadId) {
  await prisma.project.create({
    data: {
      id: projectId,
      name: `R3C4A ${projectId}`,
      description: 'Disposable R3-C4A E2E project.',
      ownerId,
      status: 'IN_PROGRESS',
      currentStep: 4,
      step0Status: 'COMPLETED',
      step0Data: { challengeType: 'growth', initialFocus: 'Foco', expectedImpact: 'Impacto' },
      teamMembers: {
        create: [
          { userId: ownerId, role: 'OWNER', status: 'ACTIVE', modulePermissions: [] },
          { userId: leadId, role: 'VIEWER', status: 'ACTIVE', modulePermissions: [] },
          { userId: newLeadId, role: 'VIEWER', status: 'ACTIVE', modulePermissions: [] },
          { userId: otherId, role: 'VIEWER', status: 'ACTIVE', modulePermissions: [] },
        ],
      },
    },
  });
  await prisma.initiativePortfolioMeta.create({
    data: {
      projectId,
      challengeId,
      strategicFrontId,
      currentStep: 'Step 4',
      status: 'lista_para_decision',
    },
  });
  await (prisma as any).initiativeGovernance.create({
    data: {
      projectId,
      mode: 'portfolio_governed',
      portfolioLeadUserId,
    },
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
    await prisma.cycleStepState.create({
      data: { cycleId: cycle.id, stepNumber, state: 'confirmed' },
    });
  }
  const output = await prisma.adaptiveStepOutput.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 4,
      version: 1,
      status: 'confirmed',
      outputKey: 'DecisionMemoLearningReport',
      outputJson: {
        learning: 'Aprendizaje capturado',
        executionPlan: 'Plan operativo',
        risks: ['Riesgo conocido'],
        recommendation: 'Solicitar revision de portafolio.',
        lifecycleProjection: 'presented',
        completionRoute: 'portfolio_presented',
        portfolioReviewRequired: true,
      },
      confirmedById: ownerId,
      confirmedAt: new Date('2026-08-20T10:05:00.000Z'),
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
  return { cycle, output, source, claim, evidence };
}

async function createRequest(service: AdaptiveCoreService, projectId: string, idempotencyKey: string) {
  return service.createDecisionRequest(projectId, ownerId, 'participante', { idempotencyKey });
}

describeC4AE2E('R3-C4A Organizational Decision PostgreSQL E2E', () => {
  beforeAll(async () => {
    await clean();
    await seedUsersAndChallenge();
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('persists one immutable Decision, resolves the request, reloads snapshots, and leaves source records unchanged', async () => {
    const seeded = await seedPresentedProject(portfolioProjectId);
    const service = new AdaptiveCoreService(prisma);
    const request = await createRequest(service, portfolioProjectId, 'r3c4a-request-main');
    const outputBefore = await prisma.adaptiveStepOutput.findUniqueOrThrow({ where: { id: seeded.output.id } });
    const cycleBefore = await prisma.initiativeCycle.findUniqueOrThrow({ where: { id: seeded.cycle.id } });
    const claimBefore = await prisma.truthClaim.findUniqueOrThrow({ where: { id: seeded.claim.id } });
    const evidenceBefore = await prisma.evidence.findUniqueOrThrow({ where: { id: seeded.evidence.id } });

    const decision = await service.decideDecisionRequest(portfolioProjectId, leadId, 'mentor', request.id, {
      idempotencyKey: 'r3c4a-decision-main',
      outcome: 'close_with_learning',
      rationale: 'El aprendizaje esta documentado y la mejor accion es cerrar con aprendizaje.',
    });
    const retry = await service.decideDecisionRequest(portfolioProjectId, leadId, 'mentor', request.id, {
      idempotencyKey: 'r3c4a-decision-main',
      outcome: 'close_with_learning',
      rationale: 'El aprendizaje esta documentado y la mejor accion es cerrar con aprendizaje.',
    });

    expect(retry.id).toBe(decision.id);
    expect(decision).toMatchObject({
      projectId: portfolioProjectId,
      sourceCycleId: seeded.cycle.id,
      decisionRequestId: request.id,
      outcome: 'close_with_learning',
      decidedById: leadId,
    });
    expect(decision.authoritySnapshotJson).toMatchObject({ authorityPurpose: 'portfolio_review', authorityType: 'portfolio_lead', authorityUserId: leadId });
    expect(decision.readinessSnapshotJson).toMatchObject({ decisionType: 'close_with_learning', overallStatus: 'ready' });
    expect(decision.packageSnapshotJson).toMatchObject({ sourceOutputId: seeded.output.id });
    expect(decision.presentationSnapshotJson).toMatchObject({ completionRouting: { route: 'portfolio_presented' } });
    expect(await (prisma as any).decision.count({ where: { projectId: portfolioProjectId } })).toBe(1);
    await expect(service.decideDecisionRequest(portfolioProjectId, leadId, 'mentor', request.id, {
      idempotencyKey: 'r3c4a-decision-second-key',
      outcome: 'close_with_learning',
      rationale: 'Segundo intento.',
    })).rejects.toMatchObject({ code: 'DECISION_REQUEST_ALREADY_RESOLVED' });

    const resolvedRequest = await (prisma as any).decisionRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(resolvedRequest).toMatchObject({ status: 'resolved' });
    expect(resolvedRequest.readinessSnapshotJson).toEqual(request.readinessSnapshotJson);
    expect(resolvedRequest.authoritySnapshotJson).toEqual(request.authoritySnapshotJson);
    expect(resolvedRequest.presentationSnapshotJson).toEqual(request.presentationSnapshotJson);

    const fresh = new PrismaClient();
    try {
      const reloaded = await new AdaptiveCoreService(fresh).getDecision(portfolioProjectId, leadId, 'mentor', decision.id);
      expect(reloaded).toMatchObject({ id: decision.id, outcome: 'close_with_learning', decisionRequestId: request.id });
      expect(await new AdaptiveCoreService(fresh).listDecisions(portfolioProjectId, leadId, 'mentor')).toHaveLength(1);
    } finally {
      await fresh.$disconnect();
    }

    expect(await prisma.adaptiveStepOutput.findUniqueOrThrow({ where: { id: seeded.output.id } })).toEqual(outputBefore);
    expect(await prisma.initiativeCycle.findUniqueOrThrow({ where: { id: seeded.cycle.id } })).toEqual(cycleBefore);
    expect(await prisma.truthClaim.findUniqueOrThrow({ where: { id: seeded.claim.id } })).toEqual(claimBefore);
    expect(await prisma.evidence.findUniqueOrThrow({ where: { id: seeded.evidence.id } })).toEqual(evidenceBefore);
    expect(await prisma.initiativeCycle.count({ where: { projectId: portfolioProjectId } })).toBe(1);
    expect(await prisma.adaptiveAdaptationEvent.count({ where: { projectId: portfolioProjectId, eventType: 'organizational_decision_created' } })).toBe(1);
  });

  it('rejects stale requests and rechecks current Portfolio Lead authority', async () => {
    const staleSeed = await seedPresentedProject(staleProjectId);
    const authoritySeed = await seedPresentedProject(authorityProjectId);
    const service = new AdaptiveCoreService(prisma);
    const staleRequest = await createRequest(service, staleProjectId, 'r3c4a-request-stale');
    const authorityRequest = await createRequest(service, authorityProjectId, 'r3c4a-request-authority');

    await prisma.initiativeCycle.create({
      data: {
        projectId: staleProjectId,
        cycleNumber: 2,
        parentCycleId: staleSeed.cycle.id,
        triggerType: 'critical_change',
        startStep: 2,
        currentStep: 2,
        status: 'active',
      },
    });
    await expect(service.decideDecisionRequest(staleProjectId, leadId, 'mentor', staleRequest.id, {
      idempotencyKey: 'r3c4a-decision-stale',
      outcome: 'close_with_learning',
      rationale: 'Solicitud vieja.',
    })).rejects.toMatchObject({ code: 'DECISION_REQUEST_STALE' });
    expect(await (prisma as any).decision.count({ where: { projectId: staleProjectId } })).toBe(0);

    await (prisma as any).initiativeGovernance.update({ where: { projectId: authorityProjectId }, data: { portfolioLeadUserId: newLeadId } });
    await expect(service.decideDecisionRequest(authorityProjectId, leadId, 'mentor', authorityRequest.id, {
      idempotencyKey: 'r3c4a-decision-old-lead',
      outcome: 'close_with_learning',
      rationale: 'Autoridad anterior.',
    })).rejects.toMatchObject({ code: 'DECISION_AUTHORITY_REQUIRED' });
    const decided = await service.decideDecisionRequest(authorityProjectId, newLeadId, 'mentor', authorityRequest.id, {
      idempotencyKey: 'r3c4a-decision-new-lead',
      outcome: 'close_with_learning',
      rationale: 'Autoridad vigente.',
    });
    expect(decided).toMatchObject({ decidedById: newLeadId, sourceCycleId: authoritySeed.cycle.id });
  });

  it('serializes concurrent confirmation so one request produces one Decision', async () => {
    await seedPresentedProject(concurrencyProjectId);
    const service = new AdaptiveCoreService(prisma);
    const request = await createRequest(service, concurrencyProjectId, 'r3c4a-request-concurrency');

    const results = await Promise.allSettled([
      service.decideDecisionRequest(concurrencyProjectId, leadId, 'mentor', request.id, {
        idempotencyKey: 'r3c4a-decision-concurrency-a',
        outcome: 'close_with_learning',
        rationale: 'Decision concurrente A.',
      }),
      service.decideDecisionRequest(concurrencyProjectId, leadId, 'mentor', request.id, {
        idempotencyKey: 'r3c4a-decision-concurrency-b',
        outcome: 'close_with_learning',
        rationale: 'Decision concurrente B.',
      }),
    ]);

    expect(await (prisma as any).decision.count({ where: { projectId: concurrencyProjectId } })).toBe(1);
    expect(await (prisma as any).decisionRequest.findUniqueOrThrow({ where: { id: request.id } })).toMatchObject({ status: 'resolved' });
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
    expect(rejected?.reason).toMatchObject({ code: 'DECISION_REQUEST_ALREADY_RESOLVED' });
  });
});
