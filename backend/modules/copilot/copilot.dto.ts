import type {
  ActionExecution,
  ActionPlan,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
  ProposedAction,
} from './domain/copilot.types';

export type CopilotConversationDto = {
  id: string;
  organizationId: string;
  userId: string;
  status: CopilotConversation['status'];
  contextObjectType?: string | null;
  contextObjectId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CopilotMessageDto = {
  id: string;
  conversationId: string;
  role: CopilotMessage['role'];
  messageType: CopilotMessage['messageType'];
  content: string;
  sourceReferences: CopilotMessage['sourceReferences'];
  createdAt: string;
};

export type IntentAssessmentDto = {
  id: string;
  conversationId: string;
  originalMessageId: string;
  primaryIntent: IntentAssessment['primaryIntent'];
  operation: IntentAssessment['operation'];
  detectedEntities: Record<string, unknown>;
  ambiguousObjects: IntentAssessment['ambiguousObjects'];
  missingInformation: string[];
  recommendedCapabilities: string[];
  confidence: IntentAssessment['confidence'];
  sourceReferences: IntentAssessment['sourceReferences'];
  adapterType: IntentAssessment['adapterType'];
  rubricVersion: string;
  createdAt: string;
};

export type ProposedActionDto = {
  id: string;
  actionPlanId: string;
  capabilityId: string;
  ownerPrd: string;
  operation: ProposedAction['operation'];
  commandType: string;
  title: string;
  explanation: string;
  proposedPayload: Record<string, unknown>;
  editableFields: string[];
  requiredPermissions: string[];
  requiresConfirmation: boolean;
  dependencyActionIds: string[];
  status: ProposedAction['status'];
  version: number;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActionPlanDto = {
  id: string;
  conversationId: string;
  intentAssessmentId: string;
  summary: string;
  status: ActionPlan['status'];
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  supersededById?: string | null;
  proposedActions: ProposedActionDto[];
};

export type ActionExecutionDto = {
  id: string;
  proposedActionId: string;
  status: ActionExecution['status'];
  attempt: number;
  approvedBy: string;
  executedBy?: string | null;
  correlationId?: string | null;
  result?: ActionExecution['result'];
  error?: ActionExecution['error'];
  createdObjectReferences: ActionExecution['createdObjectReferences'];
  updatedObjectReferences: ActionExecution['updatedObjectReferences'];
  projectionLinks: ActionExecution['projectionLinks'];
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CopilotMessageResponseDto = {
  conversation: CopilotConversationDto;
  userMessage: CopilotMessageDto;
  assistantMessage: CopilotMessageDto;
  assessment: IntentAssessmentDto;
  actionPlan: ActionPlanDto | null;
  missingInformation: string[];
};

export type CopilotErrorDto = {
  code: string;
  message: string;
  retryable?: boolean;
};

export function toConversationDto(conversation: CopilotConversation): CopilotConversationDto {
  return {
    id: conversation.id,
    organizationId: conversation.organizationId,
    userId: conversation.userId,
    status: conversation.status,
    contextObjectType: conversation.contextObjectType,
    contextObjectId: conversation.contextObjectId,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export function toMessageDto(message: CopilotMessage): CopilotMessageDto {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    messageType: message.messageType,
    content: message.content,
    sourceReferences: message.sourceReferences,
    createdAt: message.createdAt.toISOString(),
  };
}

export function toIntentAssessmentDto(assessment: IntentAssessment): IntentAssessmentDto {
  return {
    id: assessment.id,
    conversationId: assessment.conversationId,
    originalMessageId: assessment.originalMessageId,
    primaryIntent: assessment.primaryIntent,
    operation: assessment.operation,
    detectedEntities: assessment.detectedEntities,
    ambiguousObjects: assessment.ambiguousObjects,
    missingInformation: assessment.missingInformation,
    recommendedCapabilities: assessment.recommendedCapabilities,
    confidence: assessment.confidence,
    sourceReferences: assessment.sourceReferences,
    adapterType: assessment.adapterType,
    rubricVersion: assessment.rubricVersion,
    createdAt: assessment.createdAt.toISOString(),
  };
}

export function toProposedActionDto(action: ProposedAction): ProposedActionDto {
  return {
    id: action.id,
    actionPlanId: action.actionPlanId,
    capabilityId: action.capabilityId,
    ownerPrd: action.ownerPrd,
    operation: action.operation,
    commandType: action.commandType,
    title: action.title,
    explanation: action.explanation,
    proposedPayload: action.proposedPayload,
    editableFields: action.editableFields,
    requiredPermissions: action.requiredPermissions,
    requiresConfirmation: action.requiresConfirmation,
    dependencyActionIds: action.dependencyActionIds,
    status: action.status,
    version: action.version,
    approvedAt: action.approvedAt?.toISOString() ?? null,
    approvedBy: action.approvedBy ?? null,
    rejectedAt: action.rejectedAt?.toISOString() ?? null,
    rejectedBy: action.rejectedBy ?? null,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
  };
}

export function toActionPlanDto(plan: ActionPlan): ActionPlanDto {
  return {
    id: plan.id,
    conversationId: plan.conversationId,
    intentAssessmentId: plan.intentAssessmentId,
    summary: plan.summary,
    status: plan.status,
    version: plan.version,
    createdBy: plan.createdBy,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    supersededById: plan.supersededById ?? null,
    proposedActions: (plan.proposedActions ?? []).map(toProposedActionDto),
  };
}

export function toActionExecutionDto(execution: ActionExecution): ActionExecutionDto {
  return {
    id: execution.id,
    proposedActionId: execution.proposedActionId,
    status: execution.status,
    attempt: execution.attempt,
    approvedBy: execution.approvedBy,
    executedBy: execution.executedBy,
    correlationId: execution.correlationId ?? null,
    result: execution.result,
    error: execution.error,
    createdObjectReferences: execution.createdObjectReferences,
    updatedObjectReferences: execution.updatedObjectReferences,
    projectionLinks: execution.projectionLinks,
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
  };
}
