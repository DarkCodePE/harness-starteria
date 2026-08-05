import api from '../../../app/services/api';
import { normalizeCopilotError } from './copilot-api-errors';
import type { CopilotClient } from './copilot-client';
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

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (err) {
    throw normalizeCopilotError(err);
  }
}

export class HttpCopilotClient implements CopilotClient {
  createConversation(input: CreateConversationInput = {}): Promise<CopilotConversationDto> {
    return unwrap(api.post<ApiResponse<CopilotConversationDto>>('/copilot/conversations', input));
  }

  getConversation(conversationId: string): Promise<CopilotConversationDto> {
    return unwrap(api.get<ApiResponse<CopilotConversationDto>>(`/copilot/conversations/${conversationId}`));
  }

  getMessages(conversationId: string): Promise<CopilotMessageDto[]> {
    return unwrap(api.get<ApiResponse<CopilotMessageDto[]>>(`/copilot/conversations/${conversationId}/messages`));
  }

  sendMessage(conversationId: string, content: string): Promise<CopilotMessageResponseDto> {
    return unwrap(api.post<ApiResponse<CopilotMessageResponseDto>>(
      `/copilot/conversations/${conversationId}/messages`,
      { content },
    ));
  }

  async getCurrentActionPlan(conversationId: string): Promise<ActionPlanDto | null> {
    try {
      return await unwrap(api.get<ApiResponse<ActionPlanDto>>(`/copilot/conversations/${conversationId}/action-plan`));
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) return null;
      throw err;
    }
  }

  getActionPlan(actionPlanId: string): Promise<ActionPlanDto> {
    return unwrap(api.get<ApiResponse<ActionPlanDto>>(`/copilot/action-plans/${actionPlanId}`));
  }

  updateAction(actionId: string, input: UpdateProposedActionInput): Promise<ProposedActionDto> {
    return unwrap(api.patch<ApiResponse<ProposedActionDto>>(`/copilot/actions/${actionId}`, input));
  }

  approveAction(actionId: string, expectedVersion: number): Promise<ProposedActionDto> {
    return unwrap(api.post<ApiResponse<ProposedActionDto>>(
      `/copilot/actions/${actionId}/approve`,
      { expectedVersion },
    ));
  }

  rejectAction(actionId: string, input: RejectProposedActionInput): Promise<ProposedActionDto> {
    return unwrap(api.post<ApiResponse<ProposedActionDto>>(`/copilot/actions/${actionId}/reject`, input));
  }

  executeAction(
    actionId: string,
    input: ExecuteProposedActionInput,
    idempotencyKey: string,
  ): Promise<ActionExecutionDto> {
    return unwrap(api.post<ApiResponse<ActionExecutionDto>>(
      `/copilot/actions/${actionId}/execute`,
      input,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ));
  }

  getExecution(executionId: string): Promise<ActionExecutionDto> {
    return unwrap(api.get<ApiResponse<ActionExecutionDto>>(`/copilot/executions/${executionId}`));
  }

  listActionExecutions(actionId: string): Promise<ActionExecutionDto[]> {
    return unwrap(api.get<ApiResponse<ActionExecutionDto[]>>(`/copilot/actions/${actionId}/executions`));
  }
}

export const httpCopilotClient = new HttpCopilotClient();

