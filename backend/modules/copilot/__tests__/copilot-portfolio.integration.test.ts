import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PortfolioService } from '../../portfolio/portfolio.service';
import { ConversationService } from '../application/conversation.service';
import { ActionPlanService } from '../application/action-plan.service';
import { ApprovalService } from '../application/approval.service';
import { ActionExecutor } from '../application/action-executor';
import { createDefaultCapabilityRegistry } from '../application/capability-registry';
import { CreateStrategicFrontCommandHandler } from '../commands/create-strategic-front.command';
import { PrismaCopilotRepository } from '../infrastructure/prisma-copilot.repository';

const describeIntegration = process.env.COPILOT_DB_INTEGRATION === '1' ? describe : describe.skip;

const prisma = new PrismaClient();
const organizationId = 'org-copilot-integration';
const userId = 'user-copilot-integration';

async function cleanCopilotIntegrationData() {
  await prisma.actionExecution.deleteMany({ where: { proposedAction: { actionPlan: { conversation: { userId } } } } });
  await prisma.proposedAction.deleteMany({ where: { actionPlan: { conversation: { userId } } } });
  await prisma.actionPlan.deleteMany({ where: { conversation: { userId } } });
  await prisma.intentAssessment.deleteMany({ where: { conversation: { userId } } });
  await prisma.copilotMessage.deleteMany({ where: { conversation: { userId } } });
  await prisma.copilotConversation.deleteMany({ where: { userId } });
  await prisma.strategicFront.deleteMany({ where: { organizationId, ownerId: userId } });
  await prisma.auditLog.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describeIntegration('Copilot -> Portfolio integration', () => {
  beforeAll(async () => {
    await cleanCopilotIntegrationData();
    await prisma.user.create({
      data: {
        id: userId,
        email: 'copilot.integration@starteria.test',
        name: 'Copilot Integration',
        role: 'mentor',
        initials: 'CI',
        skills: [],
        organizationId,
      },
    });
  });

  afterAll(async () => {
    await cleanCopilotIntegrationData();
    await prisma.$disconnect();
  });

  it('aprueba y ejecuta CreateStrategicFront una sola vez con la misma idempotencyKey', async () => {
    const repository = new PrismaCopilotRepository(prisma);
    const registry = createDefaultCapabilityRegistry();
    const conversationService = new ConversationService(repository);
    const actionPlanService = new ActionPlanService(repository, registry);
    const approvalService = new ApprovalService(repository, registry);
    const executor = new ActionExecutor(
      repository,
      registry,
      new CreateStrategicFrontCommandHandler(new PortfolioService(prisma)),
    );

    const conversation = await conversationService.createConversation(
      { id: userId, role: 'mentor', organizationId },
      { organizationId },
    );
    const message = await conversationService.addMessage({
      conversationId: conversation.id,
      role: 'user',
      messageType: 'free_text',
      content: 'Quiero crear un frente de eficiencia operativa.',
      sourceReferences: [],
    });
    const assessment = await actionPlanService.saveIntentAssessment({
      conversationId: conversation.id,
      originalMessageId: message.id,
      primaryIntent: 'create_strategic_front',
      operation: 'create',
      detectedEntities: {},
      ambiguousObjects: [],
      missingInformation: [],
      recommendedCapabilities: ['CreateStrategicFront'],
      confidence: 'high',
      sourceReferences: [],
      adapterType: 'deterministic',
      rubricVersion: 'integration.v1',
    });
    const plan = await actionPlanService.createDraftPlan({
      conversationId: conversation.id,
      intentAssessmentId: assessment.id,
      summary: 'Crear frente estrategico.',
      createdBy: userId,
    });
    const action = await actionPlanService.addProposedAction({
      actionPlanId: plan.id,
      capabilityId: 'CreateStrategicFront',
      title: 'Crear frente',
      explanation: 'Crear frente desde Copilot.',
      proposedPayload: {
        organizationId,
        name: 'Eficiencia operativa Copilot',
        objective: 'Reducir tiempos de ciclo.',
        mainKpi: 'Tiempo de ciclo',
        baseline: '10 dias',
        target: '5 dias',
        horizon: 'Q4',
        sponsor: 'Operaciones',
        priority: 'Media',
        createdBy: userId,
      },
    });
    const approved = await approvalService.approveProposedAction({
      actionId: action.id,
      expectedVersion: action.version,
      approvedBy: { id: userId, role: 'mentor', organizationId },
      organizationId,
    });

    const firstExecution = await executor.executeApprovedAction({
      actionId: approved.id,
      expectedVersion: approved.version,
      idempotencyKey: 'copilot-integration-key-1',
      executedBy: { id: userId, role: 'mentor', organizationId },
      organizationId,
    });
    const replay = await executor.executeApprovedAction({
      actionId: approved.id,
      expectedVersion: approved.version,
      idempotencyKey: 'copilot-integration-key-1',
      executedBy: { id: userId, role: 'mentor', organizationId },
      organizationId,
    });

    const fronts = await prisma.strategicFront.findMany({
      where: { organizationId, ownerId: userId, name: 'Eficiencia operativa Copilot' },
    });
    const storedExecution = await prisma.actionExecution.findUnique({
      where: { idempotencyKey: 'copilot-integration-key-1' },
    });
    const storedAction = await prisma.proposedAction.findUnique({ where: { id: action.id } });
    const storedPlan = await prisma.actionPlan.findUnique({ where: { id: plan.id } });

    expect(firstExecution.status).toBe('completed');
    expect(replay.status).toBe('idempotent_replay');
    expect(fronts).toHaveLength(1);
    expect(storedExecution?.status).toBe('completed');
    expect(storedAction?.status).toBe('completed');
    expect(storedPlan?.status).toBe('completed');
  });
});

