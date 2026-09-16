import { describe, expect, it, vi } from 'vitest';
import { ConversationService } from '../application/conversation.service';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type {
  ActionExecution,
  ActionPlan,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
  ProposedAction,
} from '../domain/copilot.types';

const now = new Date('2026-07-26T12:00:00Z');

function makeRepository(overrides: Partial<CopilotRepository> = {}): CopilotRepository {
  const conversation: CopilotConversation = {
    id: 'conv1',
    organizationId: 'org1',
    userId: 'user1',
    status: 'collecting_context',
    contextObjectType: null,
    contextObjectId: null,
    createdAt: now,
    updatedAt: now,
  };

  const message: CopilotMessage = {
    id: 'msg1',
    conversationId: 'conv1',
    role: 'user',
    messageType: 'free_text',
    content: 'Crear frente',
    sourceReferences: [],
    createdAt: now,
  };

  const repo: CopilotRepository = {
    getActorOrganizationId: vi.fn(async () => 'org1'),
    getOrganizationAccess: vi.fn(async () => ({ organizationExists: true, isMember: true })),
    createConversation: vi.fn(async () => conversation),
    findConversationById: vi.fn(async () => conversation),
    updateConversationStatus: vi.fn(async (_id, status) => ({ ...conversation, status })),
    addMessage: vi.fn(async () => message),
    listMessages: vi.fn(async () => [message]),
    saveIntentAssessment: vi.fn(async () => ({ id: 'ia1' } as IntentAssessment)),
    findLatestIntentAssessmentByConversation: vi.fn(async () => null),
    createActionPlan: vi.fn(async () => ({ id: 'plan1' } as ActionPlan)),
    createProposedAction: vi.fn(async () => ({ id: 'action1' } as ProposedAction)),
    findActionPlanById: vi.fn(async () => null),
    findCurrentActionPlanByConversation: vi.fn(async () => null),
    findProposedActionById: vi.fn(async () => null),
    updateProposedActionPayload: vi.fn(async () => ({ id: 'action1' } as ProposedAction)),
    approveProposedAction: vi.fn(async () => ({ id: 'action1' } as ProposedAction)),
    rejectProposedAction: vi.fn(async () => ({ id: 'action1' } as ProposedAction)),
    updateProposedActionStatus: vi.fn(async () => ({ id: 'action1' } as ProposedAction)),
    updateActionPlanStatus: vi.fn(async () => ({ id: 'plan1' } as ActionPlan)),
    supersedeActionPlan: vi.fn(async () => ({ id: 'plan1' } as ActionPlan)),
    createPendingActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    findExecutionById: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    findExecutionByIdempotencyKey: vi.fn(async () => null),
    listExecutionsByAction: vi.fn(async () => []),
    listStaleNonTerminalExecutions: vi.fn(async () => []),
    claimStaleActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    updateActionExecutionStatus: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    completeActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    failActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    markActionExecutionManualReview: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    writeAudit: vi.fn(async () => undefined),
    ...overrides,
  };
  return repo;
}

describe('ConversationService', () => {
  it('crea conversacion y registra auditoria', async () => {
    const repo = makeRepository();
    const service = new ConversationService(repo);

    const conversation = await service.createConversation(
      { id: 'user1', role: 'mentor' },
      { organizationId: 'org1' },
    );

    expect(conversation.id).toBe('conv1');
    expect(repo.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org1', userId: 'user1' }),
    );
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.conversation.created',
      resource: 'CopilotConversation',
      resourceId: 'conv1',
    }));
  });

  it('valida organizacion y audita rechazo', async () => {
    const repo = makeRepository({
      getOrganizationAccess: vi.fn(async () => ({ organizationExists: true, isMember: false })),
    });
    const service = new ConversationService(repo);

    await expect(
      service.createConversation({ id: 'user1', role: 'mentor' }, { organizationId: 'org1' }),
    ).rejects.toMatchObject({ code: 'ORGANIZATION_ACCESS_DENIED' });
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.organization_access.denied',
    }));
  });

  it('agrega mensajes y registra auditoria', async () => {
    const repo = makeRepository();
    const service = new ConversationService(repo);

    const message = await service.addMessage({
      conversationId: 'conv1',
      role: 'user',
      messageType: 'free_text',
      content: 'Quiero crear un frente.',
      sourceReferences: [],
    });

    expect(message.id).toBe('msg1');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.message.saved',
      resource: 'CopilotMessage',
    }));
  });

  it('recupera conversacion y mensajes', async () => {
    const repo = makeRepository();
    const service = new ConversationService(repo);

    await expect(service.getConversation('conv1')).resolves.toMatchObject({ id: 'conv1' });
    await expect(service.listMessages('conv1')).resolves.toHaveLength(1);
  });

  it('falla si la conversacion no existe', async () => {
    const repo = makeRepository({ findConversationById: vi.fn(async () => null) });
    const service = new ConversationService(repo);

    await expect(service.getConversation('missing')).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
    await expect(service.addMessage({
      conversationId: 'missing',
      role: 'user',
      messageType: 'free_text',
      content: 'x',
      sourceReferences: [],
    })).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND' });
  });
});
