import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';

const describeCycleDb = process.env.R2_PERSISTENCE_E2E === '1' ? describe : describe.skip;

const prisma = new PrismaClient();
const service = new AdaptiveCoreService(prisma);
const userId = 'user-r3a-db-invariants';
const projectId = 'project-r3a-db-invariants';

async function clean() {
  const where = { projectId };
  await prisma.adaptiveAdaptationEvent.deleteMany({ where });
  await prisma.adaptiveProgressSignal.deleteMany({ where });
  await prisma.adaptiveCheckpointResponse.deleteMany({ where });
  await prisma.adaptiveCheckpointInstance.deleteMany({ where });
  await prisma.adaptiveStepOutput.deleteMany({ where });
  await prisma.adaptiveStepConfiguration.deleteMany({ where });
  await prisma.cycleStepState.deleteMany({ where: { cycle: where } });
  await prisma.initiativeCycle.deleteMany({ where });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

async function seedProject() {
  await prisma.user.create({
    data: {
      id: userId,
      email: 'r3a-db-invariants@starteria.test',
      name: 'R3A DB Invariants',
      role: 'mentor',
      initials: 'R3',
      skills: [],
    },
  });
  await prisma.project.create({
    data: {
      id: projectId,
      name: 'R3-A DB invariants',
      ownerId: userId,
      step0Status: 'IN_PROGRESS',
      status: 'IN_PROGRESS',
      step0Data: {
        contextInitial: 'Contexto inicial',
        initialFocus: 'Validar oportunidad',
        expectedImpact: 'Adopcion semanal',
        nextRecommendedStep: 'Completar Step 0',
      },
    },
  });
}

describeCycleDb('R3-A database cycle invariants', () => {
  beforeAll(async () => {
    await clean();
    await seedProject();
    await service.ensureInitialized(projectId, userId, 'mentor');
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('rejects a second active cycle for the same project', async () => {
    await expect(prisma.initiativeCycle.create({
      data: {
        projectId,
        cycleNumber: 2,
        status: 'active',
        triggerType: 'decision',
        startStep: 1,
        currentStep: 1,
      },
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects duplicate cycleNumber and duplicate CycleStepState', async () => {
    const cycle = await prisma.initiativeCycle.findFirstOrThrow({ where: { projectId, cycleNumber: 1 } });
    await expect(prisma.initiativeCycle.create({
      data: {
        projectId,
        cycleNumber: 1,
        status: 'superseded',
        triggerType: 'critical_change',
        startStep: 0,
        currentStep: 0,
      },
    })).rejects.toMatchObject({ code: 'P2002' });

    await expect(prisma.cycleStepState.create({
      data: {
        cycleId: cycle.id,
        stepNumber: 0,
        state: 'active',
      },
    })).rejects.toMatchObject({ code: 'P2002' });
  });
});
