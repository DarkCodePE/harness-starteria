import type { CopilotActor, CopilotConversation, CopilotMessage } from '../domain/copilot.types';
import { CopilotErrors } from '../domain/copilot.errors';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type { CreateCopilotMessageInput } from '../infrastructure/copilot.repository';
import { canCreateStrategicFront } from './strategic-front.authorization';

export type CreateConversationInput = {
  organizationId: string;
  contextObjectType?: string;
  contextObjectId?: string;
};

export class ConversationService {
  constructor(private readonly repository: CopilotRepository) {}

  async createConversation(
    actor: CopilotActor,
    input: CreateConversationInput,
  ): Promise<CopilotConversation> {
    const authorization = await canCreateStrategicFront(actor, input.organizationId, this.repository);
    if (!authorization.allowed) {
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.organization_access.denied',
        resource: 'Organization',
        resourceId: input.organizationId,
        details: {
          permission: authorization.permission,
          reason: authorization.reason,
        },
      });
      throw CopilotErrors.organizationAccessDenied(input.organizationId, authorization.reason);
    }

    const conversation = await this.repository.createConversation({
      organizationId: input.organizationId,
      userId: actor.id,
      status: 'collecting_context',
      contextObjectType: input.contextObjectType,
      contextObjectId: input.contextObjectId,
    });

    await this.repository.writeAudit({
      userId: actor.id,
      action: 'copilot.conversation.created',
      resource: 'CopilotConversation',
      resourceId: conversation.id,
      details: {
        organizationId: conversation.organizationId,
        contextObjectType: conversation.contextObjectType,
        contextObjectId: conversation.contextObjectId,
      },
    });

    return conversation;
  }

  async getConversation(id: string): Promise<CopilotConversation> {
    const conversation = await this.repository.findConversationById(id);
    if (!conversation) {
      throw CopilotErrors.conversationNotFound(id);
    }
    return conversation;
  }

  async addMessage(input: CreateCopilotMessageInput): Promise<CopilotMessage> {
    const conversation = await this.repository.findConversationById(input.conversationId);
    if (!conversation) {
      throw CopilotErrors.conversationNotFound(input.conversationId);
    }

    const message = await this.repository.addMessage(input);
    await this.repository.writeAudit({
      userId: conversation.userId,
      action: 'copilot.message.saved',
      resource: 'CopilotMessage',
      resourceId: message.id,
      details: {
        conversationId: message.conversationId,
        role: message.role,
        messageType: message.messageType,
        sourceReferencesCount: message.sourceReferences.length,
      },
    });
    return message;
  }

  async listMessages(conversationId: string): Promise<CopilotMessage[]> {
    const conversation = await this.repository.findConversationById(conversationId);
    if (!conversation) {
      throw CopilotErrors.conversationNotFound(conversationId);
    }
    return this.repository.listMessages(conversationId);
  }
}
