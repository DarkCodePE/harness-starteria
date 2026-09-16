import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';

const describeAuthorityDb = process.env.R2_PERSISTENCE_E2E === '1' ? describe : describe.skip;

const prisma = new PrismaClient();
const projectId = 'project-r3c2a-authority-e2e';
const ownerId = 'user-r3c2a-owner';
const assignedLeadId = 'user-r3c2a-assigned-lead';
const otherLeadId = 'user-r3c2a-other-lead';

async function clean() {
  await (prisma as any).initiativeGovernance.deleteMany({ where: { projectId } });
  await prisma.adaptiveAdaptationEvent.deleteMany({ where: { projectId } });
  await prisma.adaptiveProgressSignal.deleteMany({ where: { projectId } });
  await prisma.adaptiveCheckpointResponse.deleteMany({ where: { projectId } });
  await prisma.adaptiveCheckpointInstance.deleteMany({ where: { projectId } });
  await prisma.adaptiveStepOutput.deleteMany({ where: { projectId } });
  await prisma.adaptiveStepConfiguration.deleteMany({ where: { projectId } });
  await prisma.cycleStepState.deleteMany({ where: { cycle: { projectId } } });
  await prisma.initiativeCycle.deleteMany({ where: { projectId } });
  await prisma.teamMember.deleteMany({ where: { projectId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, assignedLeadId, otherLeadId] } } });
}

async function seed() {
  await prisma.user.createMany({
    data: [
      { id: ownerId, email: 'r3c2a-owner@starteria.test', name: 'R3C2A Owner', role: 'participante', initials: 'RO', skills: [] },
      { id: assignedLeadId, email: 'r3c2a-assigned-lead@starteria.test', name: 'R3C2A Assigned Lead', role: 'participante', initials: 'AL', skills: [] },
      { id: otherLeadId, email: 'r3c2a-other-lead@starteria.test', name: 'R3C2A Other Lead', role: 'participante', initials: 'OL', skills: [] },
    ],
  });
  await prisma.project.create({
    data: {
      id: projectId,
      name: 'R3-C2A Authority E2E',
      ownerId,
      status: 'IN_PROGRESS',
      currentStep: 2,
      step0Status: 'IN_PROGRESS',
      step0Data: {
        contextInitial: 'Contexto C2A.',
        initialFocus: 'Validar autoridad.',
        expectedImpact: 'Decisiones trazables.',
        nextRecommendedStep: 'Continuar.',
      },
      teamMembers: {
        create: [
          { userId: ownerId, role: 'OWNER', status: 'ACTIVE', modulePermissions: [] },
          { userId: assignedLeadId, role: 'VIEWER', status: 'ACTIVE', modulePermissions: [] },
          { userId: otherLeadId, role: 'VIEWER', status: 'ACTIVE', modulePermissions: [] },
        ],
      },
    },
  });
  await new AdaptiveCoreService(prisma).ensureInitialized(projectId, ownerId, 'participante');
}

describeAuthorityDb('R3-C2A DecisionAuthority PostgreSQL E2E', () => {
  beforeAll(async () => {
    await clean();
    await seed();
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('uses owner-governed compatibility without creating governance rows', async () => {
    const service = new AdaptiveCoreService(prisma);

    const result = await service.getDecisionAuthority(projectId, ownerId, 'participante', 'implement');

    expect(result.governanceMode).toBe('owner_governed');
    expect(result.authorityType).toBe('initiative_owner');
    expect(result.currentUserCanDecide).toBe(true);
    await expect((prisma as any).initiativeGovernance.count({ where: { projectId } })).resolves.toBe(0);
  });

  it('resolves configured portfolio-governed authority without using global role', async () => {
    await (prisma as any).initiativeGovernance.create({
      data: {
        projectId,
        mode: 'portfolio_governed',
        portfolioLeadUserId: assignedLeadId,
      },
    });
    const service = new AdaptiveCoreService(prisma);

    const ownerResult = await service.getDecisionAuthority(projectId, ownerId, 'participante', 'implement');
    const assignedLeadResult = await service.getDecisionAuthority(projectId, assignedLeadId, 'participante', 'scale');
    const globalRoleOnlyResult = await service.getDecisionAuthority(projectId, otherLeadId, 'portfolio_lead', 'scale');

    expect(ownerResult).toMatchObject({ authorityType: 'portfolio_lead', currentUserCanDecide: false, currentUserCanSubmit: true });
    expect(assignedLeadResult).toMatchObject({ authorityType: 'portfolio_lead', authorityUserId: assignedLeadId, currentUserCanDecide: true });
    expect(globalRoleOnlyResult).toMatchObject({ authorityType: 'portfolio_lead', authorityUserId: assignedLeadId, currentUserCanDecide: false });
  });

  it('keeps one governance configuration per project', async () => {
    await expect((prisma as any).initiativeGovernance.create({
      data: {
        projectId,
        mode: 'owner_governed',
      },
    })).rejects.toMatchObject({ code: 'P2002' });
  });
});
