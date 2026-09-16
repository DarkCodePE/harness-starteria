import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';

const describeTransitionDb = process.env.R2_PERSISTENCE_E2E === '1' ? describe : describe.skip;

const prisma = new PrismaClient();
const userId = 'user-r3b2b-transition-e2e';
const otherUserId = 'user-r3b2b-transition-other';
const projectPrefix = 'project-r3b2b-transition';
const projectIds = [
  `${projectPrefix}-same-cycle`,
  `${projectPrefix}-new-cycle`,
  `${projectPrefix}-concurrent`,
  `${projectPrefix}-reopened`,
  `${projectPrefix}-cross-project`,
  `${projectPrefix}-other`,
  `${projectPrefix}-return`,
  `${projectPrefix}-return-concurrent`,
  `${projectPrefix}-return-invalid`,
  `${projectPrefix}-return-other`,
];
const organizationId = 'org-r3b2b-transition-e2e';
const strategicFrontId = 'front-r3b2b-transition-e2e';
const challengeIdByProject = Object.fromEntries(projectIds.map((projectId) => [projectId, `${projectId}-challenge`]));

async function clean() {
  const where = { projectId: { in: projectIds } };
  await prisma.adaptiveAdaptationEvent.deleteMany({ where });
  await prisma.adaptiveProgressSignal.deleteMany({ where });
  await prisma.adaptiveCheckpointResponse.deleteMany({ where });
  await prisma.adaptiveCheckpointInstance.deleteMany({ where });
  await prisma.adaptiveStepOutput.deleteMany({ where });
  await prisma.adaptiveStepConfiguration.deleteMany({ where });
  await prisma.criticalChange.deleteMany({ where });
  await prisma.cycleStepState.deleteMany({ where: { cycle: { projectId: { in: projectIds } } } });
  await prisma.initiativeCycle.deleteMany({ where });
  await prisma.challenge.deleteMany({ where: { id: { in: Object.values(challengeIdByProject) } } });
  await prisma.strategicFront.deleteMany({ where: { id: strategicFrontId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
}

async function seedUser(id: string, email: string) {
  return prisma.user.create({
    data: {
      id,
      email,
      name: email,
      role: 'mentor',
      initials: 'RB',
      skills: [],
    },
  });
}

async function seedProject(projectId: string, ownerId = userId) {
  await prisma.organization.upsert({
    where: { id: organizationId },
    create: { id: organizationId, name: 'R3B2B Transition Org', slug: 'r3b2b-transition-org', seatLimit: 10 },
    update: {},
  });
  await prisma.strategicFront.upsert({
    where: { id: strategicFrontId },
    create: { id: strategicFrontId, organizationId, name: 'R3B2B Transition Front', status: 'active' },
    update: {},
  });
  await prisma.challenge.create({
    data: {
      id: challengeIdByProject[projectId],
      strategicFrontId,
      title: `Challenge ${projectId}`,
      status: 'activo_interno',
    },
  });
  return prisma.project.create({
    data: {
      id: projectId,
      name: `R3-B2B ${projectId}`,
      ownerId,
      status: 'IN_PROGRESS',
      currentStep: 0,
      step0Status: 'IN_PROGRESS',
      step0Data: {
        challengeType: 'growth',
        contextInitial: 'Contexto inicial R3-B2B.',
        initialFocus: 'Validar oportunidad.',
        expectedImpact: 'Menos retrabajo.',
        nextRecommendedStep: 'Completar Step 0',
      },
      portfolioMeta: {
        create: {
          challengeId: challengeIdByProject[projectId],
          strategicFrontId,
          currentStep: 'Step 0',
        },
      },
    },
  });
}

async function initialize(projectId: string) {
  const service = new AdaptiveCoreService(prisma);
  await service.ensureInitialized(projectId, userId, 'mentor');
  return service;
}

async function configureSourceCycle(projectId: string, options: { step3Confirmed?: boolean } = {}) {
  const cycle = await prisma.initiativeCycle.findFirstOrThrow({ where: { projectId, status: 'active' } });
  const config0 = await prisma.adaptiveStepConfiguration.findFirstOrThrow({ where: { projectId, cycleId: cycle.id, stepNumber: 0 } });
  const baseContext = {
    routeType: 'explore_validate',
    depthLevel: 'standard',
    maturity: 'solution_proposed',
    assumptions: ['Hipotesis inicial'],
    risks: [],
  };
  const config1 = await prisma.adaptiveStepConfiguration.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 1,
      version: 1,
      status: 'active',
      routeType: 'explore_validate',
      depthLevel: 'standard',
      maturity: 'problem',
      configurationJson: { step: 1 },
      sourceContextJson: baseContext,
    },
  });
  const config2 = await prisma.adaptiveStepConfiguration.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 2,
      version: 1,
      status: 'active',
      routeType: 'explore_validate',
      depthLevel: 'standard',
      maturity: 'solution_proposed',
      configurationJson: { step: 2 },
      sourceContextJson: { ...baseContext, step1Output: { focus: 'F1' } },
    },
  });
  const config3 = options.step3Confirmed
    ? await prisma.adaptiveStepConfiguration.create({
      data: {
        projectId,
        cycleId: cycle.id,
        stepNumber: 3,
        version: 1,
        status: 'active',
        routeType: 'explore_validate',
        depthLevel: 'standard',
        maturity: 'execution',
        configurationJson: { step: 3 },
        sourceContextJson: { ...baseContext, step2Output: { selectedBet: 'A' } },
      },
    })
    : null;

  const output0 = await prisma.adaptiveStepOutput.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 0,
      version: 1,
      sourceConfigurationId: config0.id,
      status: 'confirmed',
      outputKey: 'Step0AlignmentBrief',
      outputJson: { priorityHypothesis: 'H0' },
      confirmedById: userId,
      confirmedAt: new Date(),
      requiresReview: false,
    },
  });
  const output1 = await prisma.adaptiveStepOutput.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 1,
      version: 1,
      sourceConfigurationId: config1.id,
      status: 'confirmed',
      outputKey: 'Step1FocusDecision',
      outputJson: { focus: 'F1' },
      confirmedById: userId,
      confirmedAt: new Date(),
      requiresReview: false,
    },
  });
  const step2Json = { selectedBet: 'A', evidenceRefs: ['source-a'] };
  const output2 = await prisma.adaptiveStepOutput.create({
    data: {
      projectId,
      cycleId: cycle.id,
      stepNumber: 2,
      version: 1,
      sourceConfigurationId: config2.id,
      status: 'confirmed',
      outputKey: 'SelectedBet',
      outputJson: step2Json,
      confirmedById: userId,
      confirmedAt: new Date(),
      requiresReview: false,
    },
  });
  if (config3) {
    await prisma.adaptiveStepOutput.create({
      data: {
        projectId,
        cycleId: cycle.id,
        stepNumber: 3,
        version: 1,
        sourceConfigurationId: config3.id,
        status: 'confirmed',
        outputKey: 'Step3Decision',
        outputJson: { decision: 'iterate' },
        confirmedById: userId,
        confirmedAt: new Date(),
        requiresReview: false,
      },
    });
  }

  for (const stepNumber of [0, 1, 2, 3, 4]) {
    await prisma.cycleStepState.upsert({
      where: { cycleId_stepNumber: { cycleId: cycle.id, stepNumber } },
      create: {
        cycleId: cycle.id,
        stepNumber,
        state: stepNumber < 3 || (options.step3Confirmed && stepNumber === 3) ? 'confirmed' : stepNumber === 3 ? 'active' : 'pending',
      },
      update: {
        state: stepNumber < 3 || (options.step3Confirmed && stepNumber === 3) ? 'confirmed' : stepNumber === 3 ? 'active' : 'pending',
      },
    });
  }
  await prisma.initiativeCycle.update({ where: { id: cycle.id }, data: { currentStep: 3 } });
  await prisma.project.update({ where: { id: projectId }, data: { currentStep: 3 } });
  await prisma.initiativePortfolioMeta.updateMany({ where: { projectId }, data: { currentStep: 'Step 3' } });
  return { cycle, output0, output1, output2, step2Json };
}

async function assessSelectedBet(service: AdaptiveCoreService, projectId: string, suffix: string) {
  await service.registerCriticalChange(projectId, userId, 'mentor', {
    idempotencyKey: `${projectId}-${suffix}-assessment`,
    field: 'selected_bet',
    previousValue: { selectedBet: 'A' },
    nextValue: { selectedBet: 'B' },
    confirmed: true,
  });
  return prisma.criticalChange.findFirstOrThrow({ where: { projectId }, orderBy: { createdAt: 'desc' } });
}

async function createCycle2WithSolutionB(projectId: string, suffix: string) {
  const service = await initialize(projectId);
  const { cycle: cycle1, output0, output1, output2 } = await configureSourceCycle(projectId);
  const changeToB = await assessSelectedBet(service, projectId, `${suffix}-to-b`);
  await service.confirmCriticalChangeTransition(projectId, userId, 'mentor', changeToB.id, {
    idempotencyKey: `${projectId}-${suffix}-to-b-confirm`,
    confirmed: true,
    confirmedReentryStep: 2,
  });
  const cycle2 = await prisma.initiativeCycle.findFirstOrThrow({ where: { projectId, status: 'active' } });
  const cycle2Config = await prisma.adaptiveStepConfiguration.findFirstOrThrow({ where: { projectId, cycleId: cycle2.id, stepNumber: 2 } });
  const outputB = await prisma.adaptiveStepOutput.create({
    data: {
      projectId,
      cycleId: cycle2.id,
      stepNumber: 2,
      version: 1,
      sourceConfigurationId: cycle2Config.id,
      status: 'confirmed',
      outputKey: 'SelectedBet',
      outputJson: { selectedBet: 'B', evidenceRefs: ['source-b'] },
      confirmedById: userId,
      confirmedAt: new Date(),
      requiresReview: false,
    },
  });
  await prisma.cycleStepState.update({
    where: { cycleId_stepNumber: { cycleId: cycle2.id, stepNumber: 2 } },
    data: { state: 'confirmed' },
  });
  await prisma.initiativeCycle.update({ where: { id: cycle2.id }, data: { currentStep: 2 } });
  return { service, cycle1, cycle2, output0, output1, output2, outputB, changeToB };
}

async function freshState(projectId: string) {
  const fresh = new PrismaClient();
  try {
    return await new AdaptiveCoreService(fresh).getState(projectId, userId, 'mentor');
  } finally {
    await fresh.$disconnect();
  }
}

describeTransitionDb('R3-B2B critical change transition PostgreSQL E2E', () => {
  beforeAll(async () => {
    await clean();
    await seedUser(userId, 'r3b2b-transition@starteria.test');
    await seedUser(otherUserId, 'r3b2b-transition-other@starteria.test');
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('applies same_cycle on real DB without artificial reentry and reloads the same operational cycle', async () => {
    const projectId = `${projectPrefix}-same-cycle`;
    await seedProject(projectId);
    const service = await initialize(projectId);
    const { cycle } = await configureSourceCycle(projectId);

    await service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-target-date-assessment`,
      field: 'target_date',
      previousValue: '2026-09-01',
      nextValue: '2026-10-01',
      confirmed: true,
    });
    const criticalChange = await prisma.criticalChange.findFirstOrThrow({ where: { projectId } });
    expect((criticalChange.impactJson as any).transition).toBe('same_cycle');
    expect((criticalChange.impactJson as any).reentryStep).toBeNull();

    await service.confirmCriticalChangeTransition(projectId, userId, 'mentor', criticalChange.id, {
      idempotencyKey: `${projectId}-target-date-confirm`,
      confirmed: true,
    });

    expect(await prisma.initiativeCycle.count({ where: { projectId } })).toBe(1);
    const applied = await prisma.criticalChange.findUniqueOrThrow({ where: { id: criticalChange.id } });
    expect(applied.status).toBe('applied');
    expect(applied.confirmedReentryStep).toBeNull();
    expect(applied.resultingCycleId).toBeNull();
    expect(applied.appliedAt).not.toBeNull();
    const state = await freshState(projectId);
    expect(state.cycle?.id).toBe(cycle.id);
    expect(state.cycle?.status).toBe('active');
  });

  it('applies new_cycle on real DB with inherited states, no copied outputs, projections and reload isolation', async () => {
    const projectId = `${projectPrefix}-new-cycle`;
    await seedProject(projectId);
    const service = await initialize(projectId);
    const { cycle: cycle1, output0, output1, output2, step2Json } = await configureSourceCycle(projectId);
    const criticalChange = await assessSelectedBet(service, projectId, 'new-cycle');
    expect((criticalChange.impactJson as any)).toMatchObject({ transition: 'new_cycle', reentryStep: 2 });

    await service.confirmCriticalChangeTransition(projectId, userId, 'mentor', criticalChange.id, {
      idempotencyKey: `${projectId}-new-cycle-confirm`,
      confirmed: true,
      confirmedReentryStep: 2,
    });

    const cycles = await prisma.initiativeCycle.findMany({ where: { projectId }, orderBy: { cycleNumber: 'asc' } });
    expect(cycles).toHaveLength(2);
    const cycle2 = cycles[1];
    expect(cycles[0].status).toBe('superseded');
    expect(cycle2).toMatchObject({
      cycleNumber: 2,
      parentCycleId: cycle1.id,
      basedOnCycleId: null,
      triggerType: 'critical_change',
      triggerRefId: criticalChange.id,
      startStep: 2,
      currentStep: 2,
      status: 'active',
    });

    const applied = await prisma.criticalChange.findUniqueOrThrow({ where: { id: criticalChange.id } });
    expect(applied).toMatchObject({
      status: 'applied',
      confirmedById: userId,
      confirmedReentryStep: 2,
      resultingCycleId: cycle2.id,
    });
    expect(applied.confirmedAt).not.toBeNull();
    expect(applied.appliedAt).not.toBeNull();

    const states = await prisma.cycleStepState.findMany({ where: { cycleId: cycle2.id }, orderBy: { stepNumber: 'asc' } });
    expect(states.map((state) => state.state)).toEqual(['inherited', 'inherited', 'active', 'pending', 'pending']);
    expect(states[0]).toMatchObject({ inheritedFromCycleId: cycle1.id, inheritedFromOutputId: output0.id });
    expect(states[1]).toMatchObject({ inheritedFromCycleId: cycle1.id, inheritedFromOutputId: output1.id });

    expect(await prisma.adaptiveStepOutput.count({ where: { cycleId: cycle2.id } })).toBe(0);
    const oldStep2 = await prisma.adaptiveStepOutput.findUniqueOrThrow({ where: { id: output2.id } });
    expect(oldStep2.outputJson).toEqual(step2Json);
    expect(oldStep2.status).toBe('confirmed');
    expect(oldStep2.requiresReview).toBe(false);

    const cycle2Configs = await prisma.adaptiveStepConfiguration.findMany({ where: { cycleId: cycle2.id } });
    expect(cycle2Configs).toHaveLength(1);
    expect(cycle2Configs[0]).toMatchObject({ stepNumber: 2, version: 1, status: 'active' });
    const cycle2Checkpoints = await prisma.adaptiveCheckpointInstance.findMany({ where: { cycleId: cycle2.id } });
    expect(cycle2Checkpoints).toHaveLength(1);
    expect(cycle2Checkpoints[0]).toMatchObject({ checkpointKey: 'CP-2.1', stepConfigurationId: cycle2Configs[0].id });

    const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    const meta = await prisma.initiativePortfolioMeta.findFirstOrThrow({ where: { projectId } });
    const signal = await prisma.adaptiveProgressSignal.findUniqueOrThrow({ where: { projectId } });
    expect(project.currentStep).toBe(2);
    expect(meta.currentStep).toBe('Step 2');
    expect(signal).toMatchObject({ cycleId: cycle2.id, stepNumber: 2 });

    const state = await freshState(projectId);
    expect(state.cycle?.id).toBe(cycle2.id);
    expect(state.cycle?.currentStep).toBe(2);
    expect(state.stepConfigurations.every((config: any) => config.id !== cycle2Configs[0].id || config.step === 2)).toBe(true);
    expect(state.stepOutputs).toHaveLength(0);
    expect(state.checkpointInstances).toHaveLength(1);
    expect(state.checkpointInstances[0].checkpointKey).toBe('CP-2.1');
  });

  it('serializes concurrent confirmation to one Cycle 2 and one active cycle', async () => {
    const projectId = `${projectPrefix}-concurrent`;
    await seedProject(projectId);
    const service = await initialize(projectId);
    await configureSourceCycle(projectId);
    const criticalChange = await assessSelectedBet(service, projectId, 'concurrent');
    const input = { idempotencyKey: `${projectId}-confirm`, confirmed: true, confirmedReentryStep: 2 as const };

    const results = await Promise.allSettled([
      service.confirmCriticalChangeTransition(projectId, userId, 'mentor', criticalChange.id, input),
      service.confirmCriticalChangeTransition(projectId, userId, 'mentor', criticalChange.id, input),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    const cycles = await prisma.initiativeCycle.findMany({ where: { projectId } });
    const applied = await prisma.criticalChange.findUniqueOrThrow({ where: { id: criticalChange.id } });
    expect(cycles).toHaveLength(2);
    expect(cycles.filter((cycle) => cycle.status === 'active')).toHaveLength(1);
    expect(cycles.filter((cycle) => cycle.triggerRefId === criticalChange.id)).toHaveLength(1);
    expect(applied.resultingCycleId).toBe(cycles.find((cycle) => cycle.triggerRefId === criticalChange.id)?.id);
    expect(await prisma.adaptiveStepConfiguration.count({ where: { cycleId: applied.resultingCycleId ?? '' } })).toBe(1);
    expect(await prisma.adaptiveCheckpointInstance.count({ where: { cycleId: applied.resultingCycleId ?? '' } })).toBe(1);
  });

  it('marks confirmed invalidated downstream as reopened selectively', async () => {
    const projectId = `${projectPrefix}-reopened`;
    await seedProject(projectId);
    const service = await initialize(projectId);
    const { cycle } = await configureSourceCycle(projectId, { step3Confirmed: true });
    const criticalChange = await assessSelectedBet(service, projectId, 'reopened');

    await service.confirmCriticalChangeTransition(projectId, userId, 'mentor', criticalChange.id, {
      idempotencyKey: `${projectId}-reopened-confirm`,
      confirmed: true,
      confirmedReentryStep: 2,
    });

    const cycle2 = await prisma.initiativeCycle.findFirstOrThrow({ where: { projectId, status: 'active' } });
    const states = await prisma.cycleStepState.findMany({ where: { cycleId: cycle2.id }, orderBy: { stepNumber: 'asc' } });
    expect(states.map((state) => state.state)).toEqual(['inherited', 'inherited', 'active', 'reopened', 'pending']);
    expect(states[0].inheritedFromCycleId).toBe(cycle.id);
    expect(states[1].inheritedFromCycleId).toBe(cycle.id);
  });

  it('rejects cross-project transition and preserves active-cycle DB invariant', async () => {
    const projectId = `${projectPrefix}-cross-project`;
    const otherProjectId = `${projectPrefix}-other`;
    await seedProject(projectId);
    await seedProject(otherProjectId, otherUserId);
    const service = await initialize(projectId);
    await initialize(otherProjectId);
    await configureSourceCycle(projectId);
    const criticalChange = await assessSelectedBet(service, projectId, 'cross-project');

    await expect(new AdaptiveCoreService(prisma).confirmCriticalChangeTransition(otherProjectId, userId, 'mentor', criticalChange.id, {
      idempotencyKey: `${otherProjectId}-cross-project-confirm`,
      confirmed: true,
      confirmedReentryStep: 2,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_NOT_FOUND' });

    const active = await prisma.initiativeCycle.findFirstOrThrow({ where: { projectId, status: 'active' } });
    await expect(prisma.initiativeCycle.create({
      data: {
        projectId,
        cycleNumber: 99,
        status: 'active',
        triggerType: 'critical_change',
        triggerRefId: criticalChange.id,
        startStep: 2,
        currentStep: 2,
        parentCycleId: active.id,
      },
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it("creates A -> B -> A' return cycle without reactivating or copying history", async () => {
    const projectId = `${projectPrefix}-return`;
    await seedProject(projectId);
    const { service, cycle1, cycle2, output0, output1, output2, outputB } = await createCycle2WithSolutionB(projectId, 'return');

    await service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-return-assessment`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: "A'" },
      confirmed: true,
      action: 'return_to_prior_direction',
      basedOnCycleId: cycle1.id,
      reentryStep: 2,
    });
    const returnChange = await prisma.criticalChange.findFirstOrThrow({
      where: { projectId, sourceCycleId: cycle2.id },
      orderBy: { createdAt: 'desc' },
    });
    expect((returnChange.impactJson as any)).toMatchObject({
      transition: 'return_to_prior_direction',
      basedOnCycleId: cycle1.id,
      reentryStep: 2,
    });

    await service.confirmCriticalChangeTransition(projectId, userId, 'mentor', returnChange.id, {
      idempotencyKey: `${projectId}-return-confirm`,
      confirmed: true,
      basedOnCycleId: cycle1.id,
      confirmedReentryStep: 2,
    });

    const cycles = await prisma.initiativeCycle.findMany({ where: { projectId }, orderBy: { cycleNumber: 'asc' } });
    expect(cycles).toHaveLength(3);
    const cycle3 = cycles[2];
    expect(cycles[0]).toMatchObject({ id: cycle1.id, status: 'superseded' });
    expect(cycles[1]).toMatchObject({ id: cycle2.id, status: 'superseded' });
    expect(cycle3).toMatchObject({
      cycleNumber: 3,
      parentCycleId: cycle2.id,
      basedOnCycleId: cycle1.id,
      triggerType: 'return_to_prior_direction',
      triggerRefId: returnChange.id,
      startStep: 2,
      currentStep: 2,
      status: 'active',
    });

    const applied = await prisma.criticalChange.findUniqueOrThrow({ where: { id: returnChange.id } });
    expect(applied).toMatchObject({
      status: 'applied',
      basedOnCycleId: cycle1.id,
      resultingCycleId: cycle3.id,
      confirmedById: userId,
      confirmedReentryStep: 2,
    });
    expect(applied.confirmedAt).not.toBeNull();
    expect(applied.appliedAt).not.toBeNull();

    const states = await prisma.cycleStepState.findMany({ where: { cycleId: cycle3.id }, orderBy: { stepNumber: 'asc' } });
    expect(states.map((state) => state.state)).toEqual(['inherited', 'inherited', 'active', 'pending', 'pending']);
    expect(states[0]).toMatchObject({ inheritedFromCycleId: cycle1.id, inheritedFromOutputId: output0.id });
    expect(states[1]).toMatchObject({ inheritedFromCycleId: cycle1.id, inheritedFromOutputId: output1.id });

    expect(await prisma.adaptiveStepOutput.count({ where: { cycleId: cycle3.id } })).toBe(0);
    expect((await prisma.adaptiveStepOutput.findUniqueOrThrow({ where: { id: output2.id } })).outputJson).toEqual({ selectedBet: 'A', evidenceRefs: ['source-a'] });
    expect((await prisma.adaptiveStepOutput.findUniqueOrThrow({ where: { id: outputB.id } })).outputJson).toEqual({ selectedBet: 'B', evidenceRefs: ['source-b'] });

    const cycle3Configs = await prisma.adaptiveStepConfiguration.findMany({ where: { cycleId: cycle3.id } });
    const cycle3Checkpoints = await prisma.adaptiveCheckpointInstance.findMany({ where: { cycleId: cycle3.id } });
    expect(cycle3Configs).toHaveLength(1);
    expect(cycle3Configs[0]).toMatchObject({ stepNumber: 2, version: 1 });
    const cycle2Config = await prisma.adaptiveStepConfiguration.findFirstOrThrow({ where: { cycleId: cycle2.id, stepNumber: 2 } });
    expect((cycle2Config.sourceContextJson as any).step2Output.selectedBet).toBe('B');
    expect((cycle3Configs[0].sourceContextJson as any).step2Output.selectedBet).toBe("A'");
    expect(JSON.stringify(cycle3Configs[0].configurationJson)).toContain("A'");
    expect((cycle3Configs[0].sourceContextJson as any).returnToPriorDirection).toMatchObject({
      basedOnCycleId: cycle1.id,
      sourceCycleId: cycle2.id,
      criticalChangeId: returnChange.id,
    });
    expect(cycle3Checkpoints).toHaveLength(1);
    expect(cycle3Checkpoints[0]).toMatchObject({ checkpointKey: 'CP-2.1', stepConfigurationId: cycle3Configs[0].id });

    const reloaded = await freshState(projectId);
    expect(reloaded.cycle?.id).toBe(cycle3.id);
    expect(reloaded.cycle?.currentStep).toBe(2);
    expect(reloaded.stepOutputs).toHaveLength(0);
    expect(reloaded.checkpointInstances).toHaveLength(1);
    expect(reloaded.checkpointInstances[0].checkpointKey).toBe('CP-2.1');
  });

  it('serializes concurrent return confirmation to one Cycle 3', async () => {
    const projectId = `${projectPrefix}-return-concurrent`;
    await seedProject(projectId);
    const { service, cycle1, cycle2 } = await createCycle2WithSolutionB(projectId, 'return-concurrent');
    await service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-return-assessment`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: "A'" },
      confirmed: true,
      action: 'return_to_prior_direction',
      basedOnCycleId: cycle1.id,
      reentryStep: 2,
    });
    const returnChange = await prisma.criticalChange.findFirstOrThrow({ where: { projectId, sourceCycleId: cycle2.id } });
    const input = {
      idempotencyKey: `${projectId}-return-confirm`,
      confirmed: true,
      basedOnCycleId: cycle1.id,
      confirmedReentryStep: 2 as const,
    };

    const results = await Promise.allSettled([
      service.confirmCriticalChangeTransition(projectId, userId, 'mentor', returnChange.id, input),
      service.confirmCriticalChangeTransition(projectId, userId, 'mentor', returnChange.id, input),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    const cycles = await prisma.initiativeCycle.findMany({ where: { projectId } });
    const applied = await prisma.criticalChange.findUniqueOrThrow({ where: { id: returnChange.id } });
    expect(cycles).toHaveLength(3);
    expect(cycles.filter((cycle) => cycle.status === 'active')).toHaveLength(1);
    expect(cycles.filter((cycle) => cycle.triggerRefId === returnChange.id)).toHaveLength(1);
    expect(applied.resultingCycleId).toBe(cycles.find((cycle) => cycle.triggerRefId === returnChange.id)?.id);
  });

  it('rejects invalid return basedOnCycleId cases before mutation', async () => {
    const projectId = `${projectPrefix}-return-invalid`;
    const otherProjectId = `${projectPrefix}-return-other`;
    await seedProject(projectId);
    await seedProject(otherProjectId, otherUserId);
    const { service, cycle1, cycle2 } = await createCycle2WithSolutionB(projectId, 'return-invalid');
    await initialize(otherProjectId);
    const otherCycle = await prisma.initiativeCycle.findFirstOrThrow({ where: { projectId: otherProjectId, status: 'active' } });

    await expect(service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-return-missing-based`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: "A'" },
      confirmed: true,
      action: 'return_to_prior_direction',
      reentryStep: 2,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_BASED_ON_REQUIRED' });

    await expect(service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-return-current-based`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: "A'" },
      confirmed: true,
      action: 'return_to_prior_direction',
      basedOnCycleId: cycle2.id,
      reentryStep: 2,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_BASED_ON_CURRENT' });

    await expect(service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-return-other-based`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: "A'" },
      confirmed: true,
      action: 'return_to_prior_direction',
      basedOnCycleId: otherCycle.id,
      reentryStep: 2,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_BASED_ON_INVALID' });

    await expect(service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-return-missing-cycle`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: "A'" },
      confirmed: true,
      action: 'return_to_prior_direction',
      basedOnCycleId: 'missing-cycle',
      reentryStep: 2,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_BASED_ON_INVALID' });

    await expect(service.registerCriticalChange(projectId, userId, 'mentor', {
      idempotencyKey: `${projectId}-unexpected-based`,
      field: 'selected_bet',
      previousValue: { selectedBet: 'B' },
      nextValue: { selectedBet: 'C' },
      confirmed: true,
      basedOnCycleId: cycle1.id,
    })).rejects.toMatchObject({ code: 'CRITICAL_CHANGE_BASED_ON_UNEXPECTED' });

    expect(await prisma.initiativeCycle.count({ where: { projectId } })).toBe(2);
    expect(await prisma.initiativeCycle.count({ where: { projectId, status: 'active' } })).toBe(1);
  });
});
