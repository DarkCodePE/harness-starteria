import { CopilotErrors } from '../domain/copilot.errors';
import type {
  ActionPlan,
  ConversationalAssessmentResult,
  CopilotActor,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
} from '../domain/copilot.types';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type { ActionPlanService } from './action-plan.service';
import type { CapabilityRegistry } from './capability-registry';
import { CREATE_STRATEGIC_FRONT_CAPABILITY_ID } from './capability-registry';
import type { CopilotAssessmentAdapter } from './copilot-assessment.adapter';
import { canCreateStrategicFront } from './strategic-front.authorization';

export type SendCopilotMessageInput = {
  conversationId: string;
  actor: CopilotActor;
  content: string;
};

export type SendCopilotMessageResult = {
  conversation: CopilotConversation;
  userMessage: CopilotMessage;
  assistantMessage: CopilotMessage;
  assessment: IntentAssessment;
  actionPlan: ActionPlan | null;
  missingInformation: string[];
};

export class CopilotOrchestrationService {
  constructor(
    private readonly repository: CopilotRepository,
    private readonly actionPlanService: ActionPlanService,
    private readonly capabilityRegistry: CapabilityRegistry,
    private readonly adapter: CopilotAssessmentAdapter,
  ) {}

  async sendMessage(input: SendCopilotMessageInput): Promise<SendCopilotMessageResult> {
    const content = input.content.trim();
    if (!content) {
      throw CopilotErrors.emptyMessage();
    }

    const conversation = await this.loadConversationForActor(input.conversationId, input.actor);
    const userMessage = await this.repository.addMessage({
      conversationId: conversation.id,
      role: 'user',
      messageType: 'free_text',
      content,
      sourceReferences: [],
    });
    await this.audit('copilot.message.saved', input.actor.id, 'CopilotMessage', userMessage.id, {
      analyticsEvent: 'copilot_message_sent',
      conversationId: conversation.id,
      role: 'user',
      messageType: 'free_text',
      sourceReferencesCount: 0,
    });

    await this.repository.updateConversationStatus(conversation.id, 'interpreting');

    const assessmentInput = await this.buildAssessmentInput(conversation, userMessage, content);
    const assessmentResult = await this.adapter.assess({
      conversationId: conversation.id,
      messageId: userMessage.id,
      content: assessmentInput.content,
      organizationId: conversation.organizationId,
      userId: input.actor.id,
      previousAssessment: assessmentInput.previousAssessment,
      sourceReferences: assessmentInput.sourceReferences,
    });
    const sourceReferences = assessmentInput.sourceReferences.length > 0
      ? assessmentInput.sourceReferences
      : assessmentResult.sourceReferences;

    const assessment = await this.actionPlanService.saveIntentAssessment({
      conversationId: conversation.id,
      originalMessageId: userMessage.id,
      primaryIntent: assessmentResult.primaryIntent,
      operation: assessmentResult.operation,
      detectedEntities: assessmentResult.detectedEntities,
      ambiguousObjects: assessmentResult.ambiguousObjects,
      missingInformation: assessmentResult.missingInformation,
      recommendedCapabilities: assessmentResult.recommendedCapabilities,
      confidence: assessmentResult.confidence,
      sourceReferences,
      adapterType: 'deterministic',
      rubricVersion: assessmentResult.rubricVersion,
    });
    await this.audit('copilot.intent.assessed', input.actor.id, 'IntentAssessment', assessment.id, {
      analyticsEvent: 'copilot_intent_assessed',
      conversationId: conversation.id,
      primaryIntent: assessment.primaryIntent,
      operation: assessment.operation,
      confidence: assessment.confidence,
      adapterType: assessment.adapterType,
      rubricVersion: assessment.rubricVersion,
      missingInformation: assessment.missingInformation,
    });

    if (!this.hasExecutableProposal(assessmentResult)) {
      const nextStatus = assessment.primaryIntent === 'create_strategic_front'
        ? 'asking_clarification'
        : 'collecting_context';
      const updatedConversation = await this.repository.updateConversationStatus(conversation.id, nextStatus);
      const assistantMessage = await this.repository.addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        messageType: assessment.primaryIntent === 'unknown' ? 'error' : 'clarification',
        content: assessmentResult.assistantMessage,
        sourceReferences,
      });
      await this.audit('copilot.missing_information.requested', input.actor.id, 'CopilotConversation', conversation.id, {
        analyticsEvent: 'copilot_missing_information_requested',
        primaryIntent: assessment.primaryIntent,
        missingInformation: assessment.missingInformation,
      });

      return {
        conversation: updatedConversation,
        userMessage,
        assistantMessage,
        assessment,
        actionPlan: null,
        missingInformation: assessment.missingInformation,
      };
    }

    this.capabilityRegistry.assertExists(CREATE_STRATEGIC_FRONT_CAPABILITY_ID);
    const plan = await this.actionPlanService.createDraftPlan({
      conversationId: conversation.id,
      intentAssessmentId: assessment.id,
      summary: 'Crear un frente estrategico desde Portfolio Copilot.',
      createdBy: input.actor.id,
    });
    const action = await this.actionPlanService.addProposedAction({
      actionPlanId: plan.id,
      capabilityId: CREATE_STRATEGIC_FRONT_CAPABILITY_ID,
      title: `Crear frente: ${String(assessmentResult.proposedPayload?.name ?? 'Sin nombre')}`,
      explanation: 'Propuesta estructurada por el adapter deterministico. Requiere aprobacion humana antes de ejecutar.',
      proposedPayload: assessmentResult.proposedPayload ?? {},
    });
    await this.repository.updateActionPlanStatus(plan.id, 'awaiting_confirmation');
    const actionPlan = await this.actionPlanService.getPlan(plan.id);
    const updatedConversation = await this.repository.updateConversationStatus(conversation.id, 'awaiting_confirmation');
    const assistantMessage = await this.repository.addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      messageType: 'approval_request',
      content: assessmentResult.assistantMessage,
      sourceReferences,
    });

    await this.audit('copilot.capability.routed', input.actor.id, 'ProposedAction', action.id, {
      analyticsEvent: 'copilot_capability_routed',
      conversationId: conversation.id,
      capabilityId: action.capabilityId,
      commandType: action.commandType,
    });
    await this.audit('copilot.action_plan.generated', input.actor.id, 'ActionPlan', actionPlan.id, {
      analyticsEvent: 'copilot_action_plan_generated',
      conversationId: conversation.id,
      proposedActionIds: actionPlan.proposedActions?.map((item) => item.id) ?? [],
    });

    return {
      conversation: updatedConversation,
      userMessage,
      assistantMessage,
      assessment,
      actionPlan,
      missingInformation: [],
    };
  }

  private async loadConversationForActor(
    conversationId: string,
    actor: CopilotActor,
  ): Promise<CopilotConversation> {
    const conversation = await this.repository.findConversationById(conversationId);
    if (!conversation) {
      throw CopilotErrors.conversationNotFound(conversationId);
    }
    if (conversation.organizationId !== actor.organizationId) {
      await this.audit('copilot.organization_access.denied', actor.id, 'CopilotConversation', conversation.id, {
        organizationId: actor.organizationId ?? null,
        conversationOrganizationId: conversation.organizationId,
        reason: 'conversation_organization_mismatch',
      });
      throw CopilotErrors.organizationAccessDenied(actor.organizationId ?? conversation.organizationId, 'conversation_organization_mismatch');
    }
    if (conversation.userId !== actor.id && actor.role !== 'admin' && actor.role !== 'mentor') {
      throw CopilotErrors.conversationNotFound(conversationId);
    }

    const auth = await canCreateStrategicFront(actor, conversation.organizationId, this.repository);
    if (!auth.allowed) {
      await this.audit('copilot.organization_access.denied', actor.id, 'CopilotConversation', conversation.id, {
        organizationId: conversation.organizationId,
        permission: auth.permission,
        reason: auth.reason,
      });
      throw CopilotErrors.organizationAccessDenied(conversation.organizationId, auth.reason);
    }
    return conversation;
  }

  private async buildAssessmentInput(
    conversation: CopilotConversation,
    latestMessage: CopilotMessage,
    latestContent: string,
  ): Promise<{
    content: string;
    sourceReferences: ConversationalAssessmentResult['sourceReferences'];
    previousAssessment: IntentAssessment | null;
  }> {
    const previousAssessment = await this.repository.findLatestIntentAssessmentByConversation(conversation.id);
    if (!previousAssessment || previousAssessment.missingInformation.length === 0) {
      return {
        content: latestContent,
        sourceReferences: [{ type: 'message', id: latestMessage.id, label: 'Mensaje del usuario' }],
        previousAssessment,
      };
    }

    const userMessages = (await this.repository.listMessages(conversation.id)).filter((message) => message.role === 'user');
    return {
      content: userMessages.map((message) => message.content).join('\n'),
      sourceReferences: userMessages.map((message) => ({
        type: 'message',
        id: message.id,
        label: 'Mensaje del usuario',
      })),
      previousAssessment,
    };
  }

  private hasExecutableProposal(assessment: ConversationalAssessmentResult): boolean {
    return (
      assessment.primaryIntent === 'create_strategic_front' &&
      assessment.operation === 'create' &&
      assessment.missingInformation.length === 0 &&
      assessment.recommendedCapabilities.includes(CREATE_STRATEGIC_FRONT_CAPABILITY_ID) &&
      Boolean(assessment.proposedPayload)
    );
  }

  private async audit(
    action: string,
    userId: string | null,
    resource: string,
    resourceId: string | null,
    details: Record<string, unknown>,
  ): Promise<void> {
    await this.repository.writeAudit({ userId, action, resource, resourceId, details });
  }
}
