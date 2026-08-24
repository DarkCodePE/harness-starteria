import type {
  ActionExecutionDto,
  ActionPlanDto,
  CopilotConversationDto,
  CopilotMessageDto,
  CopilotMessageResponseDto,
  CreateConversationInput,
  ExecuteProposedActionInput,
  ProposedActionDto,
  RejectProposedActionInput,
  UpdateProposedActionInput,
} from '../domain/copilot.types';

export interface CopilotClient {
  createConversation(input?: CreateConversationInput): Promise<CopilotConversationDto>;
  getConversation(conversationId: string): Promise<CopilotConversationDto>;
  getMessages(conversationId: string): Promise<CopilotMessageDto[]>;
  sendMessage(conversationId: string, content: string): Promise<CopilotMessageResponseDto>;
  getCurrentActionPlan(conversationId: string): Promise<ActionPlanDto | null>;
  getActionPlan(actionPlanId: string): Promise<ActionPlanDto>;
  updateAction(actionId: string, input: UpdateProposedActionInput): Promise<ProposedActionDto>;
  approveAction(actionId: string, expectedVersion: number): Promise<ProposedActionDto>;
  rejectAction(actionId: string, input: RejectProposedActionInput): Promise<ProposedActionDto>;
  executeAction(
    actionId: string,
    input: ExecuteProposedActionInput,
    idempotencyKey: string,
  ): Promise<ActionExecutionDto>;
  getExecution(executionId: string): Promise<ActionExecutionDto>;
  listActionExecutions(actionId: string): Promise<ActionExecutionDto[]>;
}

