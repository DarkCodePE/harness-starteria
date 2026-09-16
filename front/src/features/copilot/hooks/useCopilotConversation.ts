import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCopilotErrorMessage } from '../api/copilot-api-errors';
import type { CopilotClient } from '../api/copilot-client';
import { httpCopilotClient } from '../api/http-copilot-client';
import type {
  ActionExecutionDto,
  ActionPlanDto,
  CopilotConversationDto,
  CopilotMessageDto,
  IntentAssessmentDto,
  ProposedActionDto,
  ProposedActionPayload,
} from '../domain/copilot.types';
import { getLatestExecution, getPrimaryAction, isExecutionTerminal } from '../domain/copilot.selectors';
import { useCopilotExecutionPolling } from './useCopilotExecution';

const STORAGE_KEY = 'starteria.portfolioCopilot.conversationId';

function getStoredConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeConversationId(conversationId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, conversationId);
  } catch {
    /* non-critical */
  }
}

function makeIdempotencyKey(actionId: string): string {
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `portfolio-copilot:${actionId}:${generated}`;
}

export interface CopilotState {
  conversation: CopilotConversationDto | null;
  messages: CopilotMessageDto[];
  assessment: IntentAssessmentDto | null;
  actionPlan: ActionPlanDto | null;
  executions: ActionExecutionDto[];
  activeExecution: ActionExecutionDto | null;
  isLoading: boolean;
  isSending: boolean;
  isMutating: boolean;
  error: string | null;
  pendingRefreshWarning: string | null;
}

export function useCopilotConversation({
  client = httpCopilotClient,
  onPortfolioRefresh,
}: {
  client?: CopilotClient;
  onPortfolioRefresh?: () => Promise<void> | void;
} = {}) {
  const [state, setState] = useState<CopilotState>({
    conversation: null,
    messages: [],
    assessment: null,
    actionPlan: null,
    executions: [],
    activeExecution: null,
    isLoading: false,
    isSending: false,
    isMutating: false,
    error: null,
    pendingRefreshWarning: null,
  });
  const [executionKeys, setExecutionKeys] = useState<Record<string, string>>({});

  const primaryAction = useMemo(() => getPrimaryAction(state.actionPlan), [state.actionPlan]);

  const refreshConversation = useCallback(async (conversationId?: string) => {
    const id = conversationId ?? state.conversation?.id ?? getStoredConversationId();
    if (!id) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [conversation, messages, plan] = await Promise.all([
        client.getConversation(id),
        client.getMessages(id),
        client.getCurrentActionPlan(id),
      ]);
      const actions = plan?.proposedActions ?? [];
      const executionGroups = await Promise.all(actions.map((action) => client.listActionExecutions(action.id).catch(() => [])));
      const executions = executionGroups.flat();
      setState((prev) => ({
        ...prev,
        conversation,
        messages,
        actionPlan: plan,
        executions,
        activeExecution: getLatestExecution(executions),
        isLoading: false,
      }));
      storeConversationId(conversation.id);
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false, error: getCopilotErrorMessage(err) }));
    }
  }, [client, state.conversation?.id]);

  useEffect(() => {
    void refreshConversation();
  }, []);

  const ensureConversation = useCallback(async (): Promise<CopilotConversationDto> => {
    if (state.conversation) return state.conversation;
    const created = await client.createConversation();
    storeConversationId(created.id);
    setState((prev) => ({ ...prev, conversation: created }));
    return created;
  }, [client, state.conversation]);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setState((prev) => ({ ...prev, error: 'Escribe una solicitud antes de enviarla.' }));
      return;
    }
    setState((prev) => ({ ...prev, isSending: true, error: null }));
    try {
      const conversation = await ensureConversation();
      const response = await client.sendMessage(conversation.id, trimmed);
      setState((prev) => ({
        ...prev,
        conversation: response.conversation,
        messages: [...prev.messages, response.userMessage, response.assistantMessage],
        assessment: response.assessment,
        actionPlan: response.actionPlan,
        executions: response.actionPlan ? prev.executions : [],
        activeExecution: null,
        isSending: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, isSending: false, error: getCopilotErrorMessage(err) }));
    }
  }, [client, ensureConversation]);

  const updateAction = useCallback(async (action: ProposedActionDto, payload: ProposedActionPayload) => {
    setState((prev) => ({ ...prev, isMutating: true, error: null }));
    try {
      const updated = await client.updateAction(action.id, {
        expectedVersion: action.version,
        proposedPayload: payload,
      });
      setState((prev) => ({
        ...prev,
        actionPlan: prev.actionPlan
          ? { ...prev.actionPlan, proposedActions: prev.actionPlan.proposedActions.map((item) => item.id === updated.id ? updated : item) }
          : prev.actionPlan,
        isMutating: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, isMutating: false, error: getCopilotErrorMessage(err) }));
      if ((err as { status?: number }).status === 409 && state.actionPlan) {
        void refreshConversation(state.actionPlan.conversationId);
      }
    }
  }, [client, refreshConversation, state.actionPlan]);

  const approveAction = useCallback(async (action: ProposedActionDto) => {
    setState((prev) => ({ ...prev, isMutating: true, error: null }));
    try {
      const approved = await client.approveAction(action.id, action.version);
      setState((prev) => ({
        ...prev,
        actionPlan: prev.actionPlan
          ? { ...prev.actionPlan, status: 'approved', proposedActions: prev.actionPlan.proposedActions.map((item) => item.id === approved.id ? approved : item) }
          : prev.actionPlan,
        isMutating: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, isMutating: false, error: getCopilotErrorMessage(err) }));
    }
  }, [client]);

  const rejectAction = useCallback(async (action: ProposedActionDto, reason?: string) => {
    setState((prev) => ({ ...prev, isMutating: true, error: null }));
    try {
      const rejected = await client.rejectAction(action.id, { expectedVersion: action.version, reason });
      setState((prev) => ({
        ...prev,
        actionPlan: prev.actionPlan
          ? { ...prev.actionPlan, proposedActions: prev.actionPlan.proposedActions.map((item) => item.id === rejected.id ? rejected : item) }
          : prev.actionPlan,
        isMutating: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, isMutating: false, error: getCopilotErrorMessage(err) }));
    }
  }, [client]);

  const executeAction = useCallback(async (action: ProposedActionDto) => {
    const key = executionKeys[action.id] ?? makeIdempotencyKey(action.id);
    setExecutionKeys((prev) => ({ ...prev, [action.id]: key }));
    setState((prev) => ({ ...prev, isMutating: true, error: null }));
    try {
      const execution = await client.executeAction(action.id, { expectedVersion: action.version }, key);
      setState((prev) => ({
        ...prev,
        executions: [execution, ...prev.executions.filter((item) => item.id !== execution.id)],
        activeExecution: execution,
        conversation: prev.conversation ? { ...prev.conversation, status: isExecutionTerminal(execution) ? 'completed' : 'executing' } : prev.conversation,
        isMutating: false,
      }));
      if (isExecutionTerminal(execution) && execution.status !== 'failed') {
        try {
          await onPortfolioRefresh?.();
        } catch {
          setState((prev) => ({
            ...prev,
            pendingRefreshWarning: 'El frente fue creado, pero no pudimos actualizar el mapa automáticamente.',
          }));
        }
      }
    } catch (err) {
      setState((prev) => ({ ...prev, isMutating: false, error: getCopilotErrorMessage(err) }));
    }
  }, [client, executionKeys, onPortfolioRefresh]);

  const updateActiveExecution = useCallback((execution: ActionExecutionDto) => {
    setState((prev) => ({
      ...prev,
      executions: [execution, ...prev.executions.filter((item) => item.id !== execution.id)],
      activeExecution: execution,
    }));
    if (isExecutionTerminal(execution) && execution.status !== 'failed') {
      void Promise.resolve(onPortfolioRefresh?.()).catch(() => {
        setState((prev) => ({
          ...prev,
          pendingRefreshWarning: 'El frente fue creado, pero no pudimos actualizar el mapa automáticamente.',
        }));
      });
    }
  }, [onPortfolioRefresh]);

  useCopilotExecutionPolling({
    client,
    execution: state.activeExecution,
    onUpdate: updateActiveExecution,
    enabled: !!state.activeExecution,
  });

  return {
    ...state,
    primaryAction,
    sendMessage,
    updateAction,
    approveAction,
    rejectAction,
    executeAction,
    refreshConversation,
  };
}

