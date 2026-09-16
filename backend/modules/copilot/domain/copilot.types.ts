import type { Role } from '../../../shared/types/user.types';

export const COPILOT_CONVERSATION_STATUSES = [
  'collecting_context',
  'interpreting',
  'asking_clarification',
  'proposal_ready',
  'awaiting_confirmation',
  'executing',
  'completed',
  'partially_completed',
  'blocked',
  'cancelled',
] as const;

export type CopilotConversationStatus = (typeof COPILOT_CONVERSATION_STATUSES)[number];

export const COPILOT_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type CopilotMessageRole = (typeof COPILOT_MESSAGE_ROLES)[number];

export const COPILOT_MESSAGE_TYPES = [
  'free_text',
  'clarification',
  'plan_summary',
  'approval_request',
  'execution_result',
  'error',
] as const;
export type CopilotMessageType = (typeof COPILOT_MESSAGE_TYPES)[number];

export const COPILOT_INTENTS = ['create_strategic_front', 'unknown'] as const;
export type CopilotIntent = (typeof COPILOT_INTENTS)[number];

export const COPILOT_OPERATIONS = ['create', 'unsupported'] as const;
export type CopilotOperation = (typeof COPILOT_OPERATIONS)[number];

export const COPILOT_CONFIDENCE = ['low', 'medium', 'high', 'not_evaluable'] as const;
export type CopilotConfidence = (typeof COPILOT_CONFIDENCE)[number];

export const COPILOT_ADAPTER_TYPES = ['deterministic'] as const;
export type CopilotAdapterType = (typeof COPILOT_ADAPTER_TYPES)[number];

export const ACTION_PLAN_STATUSES = [
  'draft',
  'awaiting_confirmation',
  'partially_approved',
  'approved',
  'executing',
  'partially_completed',
  'completed',
  'failed',
  'cancelled',
  'superseded',
] as const;
export type ActionPlanStatus = (typeof ACTION_PLAN_STATUSES)[number];

export const PROPOSED_ACTION_STATUSES = [
  'proposed',
  'edited',
  'approved',
  'rejected',
  'executing',
  'completed',
  'failed',
  'blocked',
  'cancelled',
] as const;
export type ProposedActionStatus = (typeof PROPOSED_ACTION_STATUSES)[number];

export const ACTION_EXECUTION_STATUSES = [
  'pending',
  'validating',
  'executing',
  'completed',
  'failed',
  'idempotent_replay',
  'partially_completed',
  'manual_review_required',
] as const;
export type ActionExecutionStatus = (typeof ACTION_EXECUTION_STATUSES)[number];

export type SourceReference = {
  type: 'message' | 'document' | 'portfolio_object' | 'system';
  id: string;
  label?: string;
};

export type ObjectReference = {
  type: string;
  id: string;
  label?: string;
};

export type ProjectionLink = {
  label: string;
  href: string;
  objectType?: string;
  objectId?: string;
};

export type CommandExecutionError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type CommandExecutionResult = {
  success: boolean;
  commandType: string;
  createdObjects: ObjectReference[];
  updatedObjects: ObjectReference[];
  warnings: string[];
  projectionLinks: ProjectionLink[];
  error?: CommandExecutionError;
};

export type CopilotActor = {
  id: string;
  role: Role;
  organizationId?: string | null;
};

export interface CopilotConversation {
  id: string;
  organizationId: string;
  userId: string;
  status: CopilotConversationStatus;
  contextObjectType?: string | null;
  contextObjectId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotMessage {
  id: string;
  conversationId: string;
  role: CopilotMessageRole;
  messageType: CopilotMessageType;
  content: string;
  sourceReferences: SourceReference[];
  createdAt: Date;
}

export interface IntentAssessment {
  id: string;
  conversationId: string;
  originalMessageId: string;
  primaryIntent: CopilotIntent;
  operation: CopilotOperation;
  detectedEntities: Record<string, unknown>;
  ambiguousObjects: ObjectReference[];
  missingInformation: string[];
  recommendedCapabilities: string[];
  confidence: CopilotConfidence;
  sourceReferences: SourceReference[];
  adapterType: CopilotAdapterType;
  rubricVersion: string;
  createdAt: Date;
}

export type ConversationalAssessmentResult = {
  primaryIntent: CopilotIntent;
  secondaryIntents: CopilotIntent[];
  operation: CopilotOperation;
  detectedEntities: Record<string, unknown>;
  ambiguousObjects: ObjectReference[];
  missingInformation: string[];
  recommendedCapabilities: string[];
  assumptions: string[];
  risks: string[];
  sourceReferences: SourceReference[];
  confidence: CopilotConfidence;
  adapterType: CopilotAdapterType;
  rubricVersion: string;
  proposedPayload?: Record<string, unknown>;
  assistantMessage: string;
};

export interface ActionPlan {
  id: string;
  conversationId: string;
  intentAssessmentId: string;
  summary: string;
  status: ActionPlanStatus;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  supersededById?: string | null;
  proposedActions?: ProposedAction[];
}

export interface ProposedAction {
  id: string;
  actionPlanId: string;
  capabilityId: string;
  ownerPrd: string;
  operation: CopilotOperation;
  commandType: string;
  title: string;
  explanation: string;
  proposedPayload: Record<string, unknown>;
  editableFields: string[];
  requiredPermissions: string[];
  requiresConfirmation: boolean;
  dependencyActionIds: string[];
  status: ProposedActionStatus;
  version: number;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionExecution {
  id: string;
  proposedActionId: string;
  idempotencyKey: string;
  status: ActionExecutionStatus;
  attempt: number;
  approvedBy: string;
  executedBy?: string | null;
  correlationId?: string | null;
  reconciliationClaimId?: string | null;
  reconciliationClaimedAt?: Date | null;
  commandPayload: Record<string, unknown>;
  result?: CommandExecutionResult | null;
  error?: CommandExecutionError | null;
  createdObjectReferences: ObjectReference[];
  updatedObjectReferences: ObjectReference[];
  projectionLinks: ProjectionLink[];
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
