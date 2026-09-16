import { vi } from 'vitest';
import type {
  ActionExecution,
  ActionPlan,
  CommandExecutionResult,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
  ProposedAction,
} from '../domain/copilot.types';
import type { CopilotRepository } from '../infrastructure/copilot.repository';

export const testNow = new Date('2026-07-26T12:00:00Z');

export function validCreateFrontPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    organizationId: 'org1',
    name: 'Eficiencia operativa',
    objective: 'Reducir tiempos de ciclo.',
    mainKpi: 'Tiempo de ciclo',
    baseline: '10 dias',
    target: '5 dias',
    horizon: 'Q4',
    sponsor: 'Operaciones',
    priority: 'Media',
    createdBy: 'user1',
    ...overrides,
  };
}

export function makeConversation(overrides: Partial<CopilotConversation> = {}): CopilotConversation {
  return {
    id: 'conv1',
    organizationId: 'org1',
    userId: 'user1',
    status: 'collecting_context',
    contextObjectType: null,
    contextObjectId: null,
    createdAt: testNow,
    updatedAt: testNow,
    ...overrides,
  };
}

export function makePlan(overrides: Partial<ActionPlan> = {}): ActionPlan {
  return {
    id: 'plan1',
    conversationId: 'conv1',
    intentAssessmentId: 'ia1',
    summary: 'Crear frente',
    status: 'awaiting_confirmation',
    version: 1,
    createdBy: 'user1',
    createdAt: testNow,
    updatedAt: testNow,
    supersededById: null,
    proposedActions: [],
    ...overrides,
  };
}

export function makeAction(overrides: Partial<ProposedAction> = {}): ProposedAction {
  return {
    id: 'action1',
    actionPlanId: 'plan1',
    capabilityId: 'CreateStrategicFront',
    ownerPrd: 'PRD-06',
    operation: 'create',
    commandType: 'CreateStrategicFrontCommand',
    title: 'Crear frente',
    explanation: 'Propuesta',
    proposedPayload: validCreateFrontPayload(),
    editableFields: ['name', 'objective'],
    requiredPermissions: ['portfolio.strategicFront.create'],
    requiresConfirmation: true,
    dependencyActionIds: [],
    status: 'proposed',
    version: 1,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    createdAt: testNow,
    updatedAt: testNow,
    ...overrides,
  };
}

export function makeResult(overrides: Partial<CommandExecutionResult> = {}): CommandExecutionResult {
  return {
    success: true,
    commandType: 'CreateStrategicFrontCommand',
    createdObjects: [{ type: 'StrategicFront', id: 'front1', label: 'Eficiencia operativa' }],
    updatedObjects: [],
    warnings: [],
    projectionLinks: [
      {
        label: 'Ver frente estrategico',
        href: '/portfolio/strategic-fronts/front1',
        objectType: 'StrategicFront',
        objectId: 'front1',
      },
    ],
    ...overrides,
  };
}

export function makeExecution(overrides: Partial<ActionExecution> = {}): ActionExecution {
  return {
    id: 'exec1',
    proposedActionId: 'action1',
    idempotencyKey: 'idem1',
    status: 'pending',
    attempt: 1,
    approvedBy: 'approver1',
    executedBy: 'user1',
    correlationId: null,
    reconciliationClaimId: null,
    reconciliationClaimedAt: null,
    commandPayload: validCreateFrontPayload(),
    result: null,
    error: null,
    createdObjectReferences: [],
    updatedObjectReferences: [],
    projectionLinks: [],
    startedAt: null,
    completedAt: null,
    createdAt: testNow,
    updatedAt: testNow,
    ...overrides,
  };
}

export function makeRepository(overrides: Partial<CopilotRepository> = {}): CopilotRepository {
  const action = makeAction();
  const plan = makePlan({ proposedActions: [action] });
  const repo: CopilotRepository = {
    getActorOrganizationId: vi.fn(async () => 'org1'),
    getOrganizationAccess: vi.fn(async () => ({ organizationExists: true, isMember: true })),
    createConversation: vi.fn(async () => makeConversation()),
    findConversationById: vi.fn(async () => makeConversation()),
    updateConversationStatus: vi.fn(async (_id, status) => makeConversation({ status })),
    addMessage: vi.fn(async () => ({ id: 'msg1' } as CopilotMessage)),
    listMessages: vi.fn(async () => []),
    saveIntentAssessment: vi.fn(async () => ({ id: 'ia1' } as IntentAssessment)),
    findLatestIntentAssessmentByConversation: vi.fn(async () => null),
    createActionPlan: vi.fn(async () => makePlan()),
    createProposedAction: vi.fn(async () => action),
    findActionPlanById: vi.fn(async () => plan),
    findCurrentActionPlanByConversation: vi.fn(async () => plan),
    findProposedActionById: vi.fn(async () => action),
    updateProposedActionPayload: vi.fn(async (_id, input) => makeAction({
      proposedPayload: input.proposedPayload,
      version: input.expectedVersion + 1,
      status: 'edited',
    })),
    approveProposedAction: vi.fn(async (_id, input) => makeAction({
      status: 'approved',
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt ?? testNow,
    })),
    rejectProposedAction: vi.fn(async (_id, input) => makeAction({
      status: 'rejected',
      rejectedBy: input.rejectedBy,
      rejectedAt: input.rejectedAt ?? testNow,
    })),
    updateProposedActionStatus: vi.fn(async (id, status) => makeAction({ id, status })),
    updateActionPlanStatus: vi.fn(async (_id, status) => makePlan({ status })),
    supersedeActionPlan: vi.fn(async () => makePlan({ status: 'superseded' })),
    createPendingActionExecution: vi.fn(async () => makeExecution()),
    findExecutionById: vi.fn(async () => makeExecution()),
    findExecutionByIdempotencyKey: vi.fn(async () => null),
    listExecutionsByAction: vi.fn(async () => [makeExecution()]),
    listStaleNonTerminalExecutions: vi.fn(async () => []),
    claimStaleActionExecution: vi.fn(async (id) => makeExecution({ id })),
    updateActionExecutionStatus: vi.fn(async (_id, input) => makeExecution({
      status: input.status,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      executedBy: input.executedBy,
    })),
    completeActionExecution: vi.fn(async (_id, input) => makeExecution({
      status: 'completed',
      result: input.result,
      createdObjectReferences: input.createdObjectReferences,
      updatedObjectReferences: input.updatedObjectReferences,
      projectionLinks: input.projectionLinks,
      completedAt: input.completedAt ?? testNow,
    })),
    failActionExecution: vi.fn(async (_id, input) => makeExecution({
      status: input.result?.success === true ? 'partially_completed' : 'failed',
      result: input.result ?? null,
      error: input.error,
      completedAt: input.completedAt ?? testNow,
    })),
    markActionExecutionManualReview: vi.fn(async (_id, input) => makeExecution({
      status: 'manual_review_required',
      error: input.error,
      completedAt: input.completedAt ?? testNow,
    })),
    writeAudit: vi.fn(async () => undefined),
    ...overrides,
  };
  return repo;
}
