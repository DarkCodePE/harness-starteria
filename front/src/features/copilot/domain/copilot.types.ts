export type CopilotConversationStatus =
  | 'collecting_context'
  | 'interpreting'
  | 'asking_clarification'
  | 'proposal_ready'
  | 'awaiting_confirmation'
  | 'executing'
  | 'completed'
  | 'partially_completed'
  | 'blocked'
  | 'cancelled';

export type CopilotMessageRole = 'user' | 'assistant' | 'system';
export type CopilotMessageType = 'text' | 'structured';
export type CopilotIntent = 'create_strategic_front' | 'create_challenge' | 'create_initiative' | 'unknown';
export type CopilotOperation = 'create' | 'unsupported';
export type CopilotConfidence = 'low' | 'medium' | 'high';
export type ActionPlanStatus =
  | 'draft'
  | 'awaiting_confirmation'
  | 'partially_approved'
  | 'approved'
  | 'executing'
  | 'partially_completed'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'superseded';
export type ProposedActionStatus =
  | 'proposed'
  | 'edited'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';
export type ActionExecutionStatus =
  | 'pending'
  | 'validating'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'idempotent_replay'
  | 'partially_completed'
  | 'manual_review_required';

export type StrategicFrontPriority = 'Alta' | 'Media' | 'Baja';

export interface SourceReferenceDto {
  type: 'message' | 'document' | 'portfolio_object' | 'system';
  id: string;
  label?: string;
}

export interface ObjectReferenceDto {
  type: string;
  id: string;
  label?: string;
}

export interface ProjectionLinkDto {
  label: string;
  href: string;
  objectType?: string;
  objectId?: string;
}

export interface CopilotConversationDto {
  id: string;
  organizationId: string;
  userId: string;
  status: CopilotConversationStatus;
  contextObjectType?: string | null;
  contextObjectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessageDto {
  id: string;
  conversationId: string;
  role: CopilotMessageRole;
  messageType: CopilotMessageType;
  content: string;
  sourceReferences: SourceReferenceDto[];
  createdAt: string;
}

export interface IntentAssessmentDto {
  id: string;
  conversationId: string;
  originalMessageId: string;
  primaryIntent: CopilotIntent;
  operation: CopilotOperation;
  detectedEntities: Record<string, unknown>;
  ambiguousObjects: ObjectReferenceDto[];
  missingInformation: string[];
  recommendedCapabilities: string[];
  confidence: CopilotConfidence;
  sourceReferences: SourceReferenceDto[];
  adapterType: string;
  rubricVersion: string;
  createdAt: string;
}

export interface PortfolioCopilotSessionDto {
  id: string;
  organizationId?: string;
  userId: string;
  intent: 'create_strategic_front' | 'create_challenge' | 'create_initiative';
  targetEntity: 'strategic_front' | 'challenge' | 'initiative';
  phase: string;
  contextRefs: Record<string, string | undefined>;
  collectedFields: Record<string, unknown>;
  fieldSources: Record<string, {
    sourceMessageId: string;
    confidence?: number;
    extractionType: 'explicit' | 'inferred' | 'inherited' | 'user_edited';
  }>;
  missingRequiredFields: string[];
  unresolvedAmbiguities: string[];
  askedFieldKeys: string[];
  questionAttempts: Record<string, number>;
  proposal?: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrategicFrontPayload {
  organizationId: string;
  name: string;
  objective?: string;
  mainKpi?: string;
  baseline?: string;
  target?: string;
  horizon?: string;
  sponsor?: string;
  priority?: StrategicFrontPriority;
  createdBy: string;
}

export type ProposedActionPayload = CreateStrategicFrontPayload | Record<string, unknown>;

export interface ProposedActionDto {
  id: string;
  actionPlanId: string;
  capabilityId: string;
  ownerPrd: string;
  operation: CopilotOperation;
  commandType: string;
  title: string;
  explanation: string;
  proposedPayload: ProposedActionPayload;
  editableFields: string[];
  requiredPermissions: string[];
  requiresConfirmation: boolean;
  dependencyActionIds: string[];
  status: ProposedActionStatus;
  version: number;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionPlanDto {
  id: string;
  conversationId: string;
  intentAssessmentId: string;
  summary: string;
  status: ActionPlanStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  supersededById?: string | null;
  proposedActions: ProposedActionDto[];
}

export interface CommandExecutionErrorDto {
  code: string;
  message: string;
  retryable: boolean;
}

export interface CommandExecutionResultDto {
  success: boolean;
  commandType: string;
  createdObjects: ObjectReferenceDto[];
  updatedObjects: ObjectReferenceDto[];
  warnings: string[];
  projectionLinks: ProjectionLinkDto[];
  error?: CommandExecutionErrorDto;
}

export interface ActionExecutionDto {
  id: string;
  proposedActionId: string;
  status: ActionExecutionStatus;
  attempt: number;
  approvedBy: string;
  executedBy?: string | null;
  correlationId?: string | null;
  result?: CommandExecutionResultDto | null;
  error?: CommandExecutionErrorDto | null;
  createdObjectReferences: ObjectReferenceDto[];
  updatedObjectReferences: ObjectReferenceDto[];
  projectionLinks: ProjectionLinkDto[];
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessageResponseDto {
  conversation: CopilotConversationDto;
  userMessage: CopilotMessageDto;
  assistantMessage: CopilotMessageDto;
  assessment: IntentAssessmentDto;
  actionPlan: ActionPlanDto | null;
  missingInformation: string[];
}

export interface CreateConversationInput {
  contextObjectType?: string;
  contextObjectId?: string;
}

export interface UpdateProposedActionInput {
  expectedVersion: number;
  proposedPayload: ProposedActionPayload;
}

export interface RejectProposedActionInput {
  expectedVersion: number;
  reason?: string;
}

export interface ExecuteProposedActionInput {
  expectedVersion: number;
}

export interface CopilotErrorDto {
  code: string;
  message: string;
  status?: number;
  retryable?: boolean;
  details?: Array<{ field?: string; code?: string; message: string }>;
}
