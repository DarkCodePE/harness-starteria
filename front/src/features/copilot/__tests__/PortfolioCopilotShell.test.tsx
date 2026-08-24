import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioCopilotShell } from '../components/PortfolioCopilotShell';
import type { CopilotClient } from '../api/copilot-client';
import type {
  ActionExecutionDto,
  ActionPlanDto,
  CopilotConversationDto,
  CopilotMessageDto,
  CopilotMessageResponseDto,
  ProposedActionDto,
} from '../domain/copilot.types';

const conversation: CopilotConversationDto = {
  id: 'conv-1',
  organizationId: 'org-1',
  userId: 'user-1',
  status: 'collecting_context',
  createdAt: '2026-07-27T10:00:00.000Z',
  updatedAt: '2026-07-27T10:00:00.000Z',
};

function makeAction(overrides: Partial<ProposedActionDto> = {}): ProposedActionDto {
  return {
    id: 'action-1',
    actionPlanId: 'plan-1',
    capabilityId: 'CreateStrategicFront',
    ownerPrd: 'PRD-06',
    operation: 'create',
    commandType: 'CreateStrategicFrontCommand',
    title: 'Crear frente estratégico',
    explanation: 'Crear un frente estratégico desde Portfolio.',
    proposedPayload: {
      organizationId: 'org-1',
      createdBy: 'user-1',
      name: 'Eficiencia operativa',
      objective: 'Reducir retrabajo',
      mainKpi: 'Horas de retrabajo',
      baseline: '500',
      target: '300',
      horizon: '6 meses',
      sponsor: 'Gerencia de Operaciones',
      priority: 'Alta',
    },
    editableFields: ['name', 'objective', 'mainKpi', 'baseline', 'target', 'horizon', 'sponsor', 'priority'],
    requiredPermissions: ['portfolio.strategicFront.create'],
    requiresConfirmation: true,
    dependencyActionIds: [],
    status: 'proposed',
    version: 1,
    createdAt: '2026-07-27T10:01:00.000Z',
    updatedAt: '2026-07-27T10:01:00.000Z',
    ...overrides,
  };
}

function makePlan(action = makeAction()): ActionPlanDto {
  return {
    id: 'plan-1',
    conversationId: 'conv-1',
    intentAssessmentId: 'ia-1',
    summary: 'Crear un frente estratégico de eficiencia operativa.',
    status: action.status === 'approved' ? 'approved' : 'awaiting_confirmation',
    version: 1,
    createdBy: 'user-1',
    createdAt: '2026-07-27T10:01:00.000Z',
    updatedAt: '2026-07-27T10:01:00.000Z',
    proposedActions: [action],
  };
}

const userMessage: CopilotMessageDto = {
  id: 'msg-user',
  conversationId: 'conv-1',
  role: 'user',
  messageType: 'text',
  content: 'Crea un frente llamado Eficiencia operativa.',
  sourceReferences: [],
  createdAt: '2026-07-27T10:01:00.000Z',
};

const assistantMessage: CopilotMessageDto = {
  id: 'msg-assistant',
  conversationId: 'conv-1',
  role: 'assistant',
  messageType: 'structured',
  content: 'Preparé una propuesta para revisar antes de crear el frente.',
  sourceReferences: [{ type: 'message', id: 'msg-user', label: 'Tu mensaje' }],
  createdAt: '2026-07-27T10:01:01.000Z',
};

function makeCompleteResponse(): CopilotMessageResponseDto {
  return {
    conversation: { ...conversation, status: 'awaiting_confirmation' },
    userMessage: { ...userMessage },
    assistantMessage: { ...assistantMessage, sourceReferences: [...assistantMessage.sourceReferences] },
    assessment: {
      id: 'ia-1',
      conversationId: 'conv-1',
      originalMessageId: 'msg-user',
      primaryIntent: 'create_strategic_front',
      operation: 'create',
      detectedEntities: {},
      ambiguousObjects: [],
      missingInformation: [],
      recommendedCapabilities: ['CreateStrategicFront'],
      confidence: 'high',
      sourceReferences: [{ type: 'message', id: 'msg-user', label: 'Tu mensaje' }],
      adapterType: 'deterministic',
      rubricVersion: 'v1',
      createdAt: '2026-07-27T10:01:01.000Z',
    },
    actionPlan: makePlan(),
    missingInformation: [],
  };
}

function makeExecution(status: ActionExecutionDto['status'] = 'completed'): ActionExecutionDto {
  return {
    id: 'exec-1',
    proposedActionId: 'action-1',
    status,
    attempt: 1,
    approvedBy: 'user-1',
    executedBy: 'user-1',
    result: {
      success: true,
      commandType: 'CreateStrategicFrontCommand',
      createdObjects: [{ type: 'StrategicFront', id: 'front-1', label: 'Eficiencia operativa' }],
      updatedObjects: [],
      warnings: [],
      projectionLinks: [{ label: 'Ver mapa estratégico', href: '/portfolio/frentes', objectType: 'StrategicFront', objectId: 'front-1' }],
    },
    error: null,
    createdObjectReferences: [{ type: 'StrategicFront', id: 'front-1', label: 'Eficiencia operativa' }],
    updatedObjectReferences: [],
    projectionLinks: [{ label: 'Ver mapa estratégico', href: '/portfolio/frentes', objectType: 'StrategicFront', objectId: 'front-1' }],
    startedAt: '2026-07-27T10:02:00.000Z',
    completedAt: '2026-07-27T10:02:01.000Z',
    createdAt: '2026-07-27T10:02:00.000Z',
    updatedAt: '2026-07-27T10:02:01.000Z',
  };
}

function makeClient(overrides: Partial<CopilotClient> = {}): CopilotClient {
  return {
    createConversation: vi.fn().mockResolvedValue(conversation),
    getConversation: vi.fn().mockRejectedValue(new Error('no stored conversation')),
    getMessages: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue(makeCompleteResponse()),
    getCurrentActionPlan: vi.fn().mockResolvedValue(null),
    getActionPlan: vi.fn().mockResolvedValue(makePlan()),
    updateAction: vi.fn().mockImplementation((_actionId, input) => Promise.resolve(makeAction({
      proposedPayload: input.proposedPayload,
      status: 'edited',
      version: 2,
      approvedAt: null,
      approvedBy: null,
    }))),
    approveAction: vi.fn().mockResolvedValue(makeAction({ status: 'approved', version: 2, approvedAt: '2026-07-27T10:01:30.000Z', approvedBy: 'user-1' })),
    rejectAction: vi.fn().mockResolvedValue(makeAction({ status: 'rejected', rejectedAt: '2026-07-27T10:01:30.000Z', rejectedBy: 'user-1' })),
    executeAction: vi.fn().mockResolvedValue(makeExecution()),
    getExecution: vi.fn().mockResolvedValue(makeExecution()),
    listActionExecutions: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal('crypto', { randomUUID: () => 'test-key' });
});

describe('PortfolioCopilotShell', () => {
  it('muestra aviso de piloto y revision humana obligatoria', () => {
    render(<PortfolioCopilotShell client={makeClient()} />);

    expect(screen.getByText(/Version piloto/i)).toBeInTheDocument();
    expect(screen.getByText(/no ingreses datos sensibles/i)).toBeInTheDocument();
    expect(screen.getByText(/el Copiloto no ejecuta cambios por su cuenta/i)).toBeInTheDocument();
  });

  it('recorre mensaje completo, edición, aprobación y ejecución confirmada', async () => {
    const client = makeClient();
    const refreshPortfolio = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PortfolioCopilotShell client={client} onPortfolioRefresh={refreshPortfolio} />);

    await user.type(screen.getByLabelText('Mensaje para Portfolio Copilot'), 'Crea un frente llamado Eficiencia operativa.');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/Crear un frente estratégico de eficiencia operativa/i)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Nombre/i));
    await user.type(screen.getByLabelText(/Nombre/i), 'Eficiencia operativa ajustada');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(client.updateAction).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /aprobar/i }));
    await waitFor(() => expect(client.approveAction).toHaveBeenCalledWith('action-1', 2));

    await user.click(screen.getByRole('button', { name: /ejecutar/i }));
    await waitFor(() => expect(client.executeAction).toHaveBeenCalledWith(
      'action-1',
      { expectedVersion: 2 },
      'portfolio-copilot:action-1:test-key',
    ));
    expect(await screen.findByText(/Frente estratégico creado/i)).toBeInTheDocument();
    expect(refreshPortfolio).toHaveBeenCalled();
  });

  it('muestra clarificación sin crear Action Plan cuando faltan datos', async () => {
    const incompleteResponse = makeCompleteResponse();
    incompleteResponse.conversation.status = 'asking_clarification';
    incompleteResponse.actionPlan = null;
    incompleteResponse.assessment.missingInformation = ['name', 'mainKpi', 'priority'];
    incompleteResponse.missingInformation = ['name', 'mainKpi', 'priority'];
    incompleteResponse.assistantMessage.content = 'Necesito nombre, KPI principal y prioridad.';
    const client = makeClient({ sendMessage: vi.fn().mockResolvedValue(incompleteResponse) });
    const user = userEvent.setup();

    render(<PortfolioCopilotShell client={client} />);
    await user.type(screen.getByLabelText('Mensaje para Portfolio Copilot'), 'Quiero crear un frente de eficiencia operativa.');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/Necesito algunos datos/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Action Plan')).not.toBeInTheDocument();
  });

  it('recupera conversación, plan y ejecución después de refresh', async () => {
    window.sessionStorage.setItem('starteria.portfolioCopilot.conversationId', 'conv-1');
    const approvedAction = makeAction({ status: 'approved', version: 2 });
    const client = makeClient({
      getConversation: vi.fn().mockResolvedValue({ ...conversation, status: 'awaiting_confirmation' }),
      getMessages: vi.fn().mockResolvedValue([userMessage, assistantMessage]),
      getCurrentActionPlan: vi.fn().mockResolvedValue(makePlan(approvedAction)),
      listActionExecutions: vi.fn().mockResolvedValue([makeExecution('completed')]),
    });

    render(<PortfolioCopilotShell client={client} />);

    expect(await screen.findByText(/Preparé una propuesta/i)).toBeInTheDocument();
    expect(await screen.findByText(/Frente estratégico creado/i)).toBeInTheDocument();
  });

  it('muestra revision manual requerida como estado terminal recuperable', async () => {
    window.sessionStorage.setItem('starteria.portfolioCopilot.conversationId', 'conv-1');
    const approvedAction = makeAction({ status: 'approved', version: 2 });
    const client = makeClient({
      getConversation: vi.fn().mockResolvedValue({ ...conversation, status: 'blocked' }),
      getMessages: vi.fn().mockResolvedValue([userMessage, assistantMessage]),
      getCurrentActionPlan: vi.fn().mockResolvedValue(makePlan(approvedAction)),
      listActionExecutions: vi.fn().mockResolvedValue([makeExecution('manual_review_required')]),
    });

    render(<PortfolioCopilotShell client={client} />);

    expect(await screen.findByText(/Revisi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ejecutar/i })).toBeDisabled();
  });

  it('no crea una nueva key en doble click mientras ejecuta', async () => {
    const approvedResponse = makeCompleteResponse();
    const approvedAction = makeAction({ status: 'approved', version: 1 });
    approvedResponse.actionPlan = makePlan(approvedAction);
    const executeAction = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(makeExecution()), 50)));
    const client = makeClient({
      sendMessage: vi.fn().mockResolvedValue(approvedResponse),
      executeAction,
    });
    const user = userEvent.setup();
    render(<PortfolioCopilotShell client={client} />);

    await user.type(screen.getByLabelText('Mensaje para Portfolio Copilot'), 'Crea un frente llamado Eficiencia operativa.');
    await user.click(screen.getByRole('button', { name: /enviar/i }));
    const executeButton = await screen.findByRole('button', { name: /ejecutar/i });
    await user.dblClick(executeButton);

    await waitFor(() => expect(executeAction).toHaveBeenCalledTimes(1));
  });
});
