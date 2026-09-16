import { describe, expect, it, vi } from 'vitest';
import { ActionPlanService } from '../application/action-plan.service';
import { createDefaultCapabilityRegistry } from '../application/capability-registry';
import { CopilotOrchestrationService } from '../application/copilot-orchestration.service';
import { DeterministicCopilotAdapter } from '../application/deterministic-copilot.adapter';
import type { CopilotMessage, IntentAssessment } from '../domain/copilot.types';
import { makeAction, makeConversation, makePlan, makeRepository, testNow } from './test-utils';

function makeService(overrides: Parameters<typeof makeRepository>[0] = {}) {
  const messages: CopilotMessage[] = [];
  const assessments: IntentAssessment[] = [];
  const action = makeAction();
  const plan = makePlan({ status: 'awaiting_confirmation', proposedActions: [action] });
  let messageSeq = 0;
  const repo = makeRepository({
    addMessage: vi.fn(async (input) => {
      const message: CopilotMessage = {
        id: `msg${++messageSeq}`,
        conversationId: input.conversationId,
        role: input.role,
        messageType: input.messageType,
        content: input.content,
        sourceReferences: input.sourceReferences,
        createdAt: testNow,
      };
      messages.push(message);
      return message;
    }),
    listMessages: vi.fn(async () => messages),
    saveIntentAssessment: vi.fn(async (input) => {
      const assessment: IntentAssessment = {
        id: `ia${assessments.length + 1}`,
        conversationId: input.conversationId,
        originalMessageId: input.originalMessageId,
        primaryIntent: input.primaryIntent,
        operation: input.operation,
        detectedEntities: input.detectedEntities,
        ambiguousObjects: input.ambiguousObjects,
        missingInformation: input.missingInformation,
        recommendedCapabilities: input.recommendedCapabilities,
        confidence: input.confidence,
        sourceReferences: input.sourceReferences,
        adapterType: input.adapterType,
        rubricVersion: input.rubricVersion,
        createdAt: testNow,
      };
      assessments.push(assessment);
      return assessment;
    }),
    findLatestIntentAssessmentByConversation: vi.fn(async () => assessments.at(-1) ?? null),
    createActionPlan: vi.fn(async () => makePlan({ status: 'draft' })),
    createProposedAction: vi.fn(async () => action),
    findActionPlanById: vi.fn(async () => plan),
    updateActionPlanStatus: vi.fn(async (_id, status) => makePlan({ status, proposedActions: [action] })),
    updateConversationStatus: vi.fn(async (_id, status) => makeConversation({ status })),
    ...overrides,
  });
  const registry = createDefaultCapabilityRegistry();
  const service = new CopilotOrchestrationService(
    repo,
    new ActionPlanService(repo, registry),
    registry,
    new DeterministicCopilotAdapter(),
  );
  return { service, repo, messages, assessments };
}

describe('CopilotOrchestrationService', () => {
  it('guarda mensaje, assessment y crea ActionPlan cuando el mensaje esta completo', async () => {
    const { service, repo } = makeService();

    const result = await service.sendMessage({
      conversationId: 'conv1',
      actor: { id: 'user1', role: 'mentor', organizationId: 'org1' },
      content: 'Crea un frente llamado Eficiencia operativa. Su objetivo es reducir retrabajo. El KPI principal sera horas de retrabajo, con baseline 500, meta 300, horizonte de 6 meses, area de Operaciones, prioridad alta y sponsor Operaciones.',
    });

    expect(result.conversation.status).toBe('awaiting_confirmation');
    expect(result.actionPlan?.status).toBe('awaiting_confirmation');
    expect(result.assessment.primaryIntent).toBe('create_strategic_front');
    expect(repo.createProposedAction).toHaveBeenCalledWith(expect.objectContaining({
      capabilityId: 'CreateStrategicFront',
      proposedPayload: expect.objectContaining({ organizationId: 'org1', createdBy: 'user1' }),
    }));
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.action_plan.generated',
    }));
  });

  it('pide clarificacion y no crea ProposedAction cuando faltan datos', async () => {
    const { service, repo } = makeService();

    const result = await service.sendMessage({
      conversationId: 'conv1',
      actor: { id: 'user1', role: 'mentor', organizationId: 'org1' },
      content: 'Quiero crear un frente de eficiencia operativa.',
    });

    expect(result.conversation.status).toBe('asking_clarification');
    expect(result.actionPlan).toBeNull();
    expect(result.missingInformation).toEqual([
      'objective',
      'mainKpi',
      'baseline',
      'target',
      'horizon',
      'areaOrBusinessUnit',
      'priority',
    ]);
    expect(repo.createProposedAction).not.toHaveBeenCalled();
  });

  it('mensaje desconocido conserva mensaje y no crea plan', async () => {
    const { service, repo } = makeService();

    const result = await service.sendMessage({
      conversationId: 'conv1',
      actor: { id: 'user1', role: 'mentor', organizationId: 'org1' },
      content: 'Ordena los bloqueos de TI.',
    });

    expect(result.assessment.primaryIntent).toBe('unknown');
    expect(result.conversation.status).toBe('collecting_context');
    expect(result.actionPlan).toBeNull();
    expect(repo.createActionPlan).not.toHaveBeenCalled();
  });

  it('continua una conversacion incompleta combinando mensajes confirmados', async () => {
    const { service, repo } = makeService();

    await service.sendMessage({
      conversationId: 'conv1',
      actor: { id: 'user1', role: 'mentor', organizationId: 'org1' },
      content: 'Quiero crear un frente de eficiencia operativa.',
    });
    const completed = await service.sendMessage({
      conversationId: 'conv1',
      actor: { id: 'user1', role: 'mentor', organizationId: 'org1' },
      content: 'Su objetivo es reducir retrabajo. El KPI principal sera horas de retrabajo.',
    });

    expect(completed.actionPlan).toBeNull();
    expect(completed.missingInformation).toContain('baseline');
    expect(repo.createProposedAction).not.toHaveBeenCalled();
  });
});
