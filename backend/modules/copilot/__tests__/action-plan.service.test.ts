import { describe, expect, it, vi } from 'vitest';
import { ActionPlanService } from '../application/action-plan.service';
import { createDefaultCapabilityRegistry } from '../application/capability-registry';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type {
  ActionExecution,
  ActionPlan,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
  ProposedAction,
} from '../domain/copilot.types';

const now = new Date('2026-07-26T12:00:00Z');

function validPayload() {
  return {
    organizationId: 'org1',
    name: 'Eficiencia operativa',
    objective: 'Reducir tiempos de ciclo.',
    createdBy: 'user1',
  };
}

function makePlan(overrides: Partial<ActionPlan> = {}): ActionPlan {
  return {
    id: 'plan1',
    conversationId: 'conv1',
    intentAssessmentId: 'ia1',
    summary: 'Crear frente',
    status: 'draft',
    version: 1,
    createdBy: 'user1',
    createdAt: now,
    updatedAt: now,
    supersededById: null,
    ...overrides,
  };
}

function makeAction(overrides: Partial<ProposedAction> = {}): ProposedAction {
  return {
    id: 'action1',
    actionPlanId: 'plan1',
    capabilityId: 'CreateStrategicFront',
    ownerPrd: 'PRD-06',
    operation: 'create',
    commandType: 'CreateStrategicFrontCommand',
    title: 'Crear frente',
    explanation: 'Propuesta',
    proposedPayload: validPayload(),
    editableFields: ['name'],
    requiredPermissions: ['portfolio.strategicFront.create'],
    requiresConfirmation: true,
    dependencyActionIds: [],
    status: 'proposed',
    version: 1,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeRepository(overrides: Partial<CopilotRepository> = {}): CopilotRepository {
  const repo: CopilotRepository = {
    getActorOrganizationId: vi.fn(async () => 'org1'),
    getOrganizationAccess: vi.fn(async () => ({ organizationExists: true, isMember: true })),
    createConversation: vi.fn(async () => ({ id: 'conv1' } as CopilotConversation)),
    findConversationById: vi.fn(async () => ({
      id: 'conv1',
      organizationId: 'org1',
      userId: 'user1',
      status: 'collecting_context' as const,
      contextObjectType: null as string | null,
      contextObjectId: null as string | null,
      createdAt: now,
      updatedAt: now,
    })),
    updateConversationStatus: vi.fn(async (_id, status) => ({
      id: 'conv1',
      organizationId: 'org1',
      userId: 'user1',
      status,
      contextObjectType: null,
      contextObjectId: null,
      createdAt: now,
      updatedAt: now,
    })),
    addMessage: vi.fn(async () => ({ id: 'msg1' } as CopilotMessage)),
    listMessages: vi.fn(async () => []),
    saveIntentAssessment: vi.fn(async (input) => ({
      id: 'ia1',
      conversationId: input.conversationId,
      originalMessageId: input.originalMessageId,
      primaryIntent: input.primaryIntent,
      operation: input.operation,
      detectedEntities: input.detectedEntities,
      ambiguousObjects: input.ambiguousObjects,
      missingInformation: input.missingInformation,
      recommendedCapabilities: input.recommendedCapabilities,
      confidence: input.confidence,
      sourceReferences: input.sourceReferences,
      adapterType: input.adapterType,
      rubricVersion: input.rubricVersion,
      createdAt: now,
    })),
    findLatestIntentAssessmentByConversation: vi.fn(async () => null),
    createActionPlan: vi.fn(async (input) => makePlan(input)),
    createProposedAction: vi.fn(async (input) => makeAction(input)),
    findActionPlanById: vi.fn(async () => makePlan()),
    findCurrentActionPlanByConversation: vi.fn(async () => makePlan()),
    findProposedActionById: vi.fn(async () => makeAction()),
    updateProposedActionPayload: vi.fn(async (_id, input) => makeAction({
      proposedPayload: input.proposedPayload,
      version: input.expectedVersion + 1,
      status: 'edited',
      approvedAt: null,
      approvedBy: null,
    })),
    approveProposedAction: vi.fn(async (_id, input) => makeAction({
      status: 'approved',
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt ?? now,
    })),
    rejectProposedAction: vi.fn(async (_id, input) => makeAction({
      status: 'rejected',
      rejectedBy: input.rejectedBy,
      rejectedAt: input.rejectedAt ?? now,
      approvedAt: null,
      approvedBy: null,
    })),
    updateProposedActionStatus: vi.fn(async (_id, status) => makeAction({ status })),
    updateActionPlanStatus: vi.fn(async (_id, status) => makePlan({ status })),
    supersedeActionPlan: vi.fn(async (_id, supersededById) => makePlan({
      status: 'superseded',
      supersededById,
    })),
    createPendingActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    findExecutionById: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    findExecutionByIdempotencyKey: vi.fn(async () => null),
    listExecutionsByAction: vi.fn(async () => []),
    listStaleNonTerminalExecutions: vi.fn(async () => []),
    claimStaleActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    updateActionExecutionStatus: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    completeActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    failActionExecution: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    markActionExecutionManualReview: vi.fn(async () => ({ id: 'exec1' } as ActionExecution)),
    writeAudit: vi.fn(async () => undefined),
    ...overrides,
  };
  return repo;
}

describe('ActionPlanService', () => {
  it('guarda IntentAssessment validando capabilities existentes', async () => {
    const repo = makeRepository();
    const service = new ActionPlanService(repo, createDefaultCapabilityRegistry());

    const assessment = await service.saveIntentAssessment({
      conversationId: 'conv1',
      originalMessageId: 'msg1',
      primaryIntent: 'create_strategic_front',
      operation: 'create',
      detectedEntities: {},
      ambiguousObjects: [],
      missingInformation: [],
      recommendedCapabilities: ['CreateStrategicFront'],
      confidence: 'high',
      sourceReferences: [],
      adapterType: 'deterministic',
      rubricVersion: 'deterministic-create-front.v1',
    });

    expect(assessment.id).toBe('ia1');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.intent_assessment.saved',
    }));
  });

  it('rechaza capability inexistente en IntentAssessment', async () => {
    const service = new ActionPlanService(makeRepository(), createDefaultCapabilityRegistry());

    await expect(service.saveIntentAssessment({
      conversationId: 'conv1',
      originalMessageId: 'msg1',
      primaryIntent: 'create_strategic_front',
      operation: 'create',
      detectedEntities: {},
      ambiguousObjects: [],
      missingInformation: [],
      recommendedCapabilities: ['MissingCapability'],
      confidence: 'high',
      sourceReferences: [],
      adapterType: 'deterministic',
      rubricVersion: 'v1',
    })).rejects.toMatchObject({ code: 'CAPABILITY_NOT_FOUND' });
  });

  it('crea plan draft', async () => {
    const repo = makeRepository();
    const service = new ActionPlanService(repo, createDefaultCapabilityRegistry());

    const plan = await service.createDraftPlan({
      conversationId: 'conv1',
      intentAssessmentId: 'ia1',
      summary: 'Crear un frente',
      createdBy: 'user1',
    });

    expect(plan.status).toBe('draft');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.action_plan.created',
    }));
  });

  it('agrega ProposedAction usando capability existente', async () => {
    const repo = makeRepository();
    const service = new ActionPlanService(repo, createDefaultCapabilityRegistry());

    const action = await service.addProposedAction({
      actionPlanId: 'plan1',
      capabilityId: 'CreateStrategicFront',
      title: 'Crear frente',
      explanation: 'Crear frente en borrador',
      proposedPayload: validPayload(),
    });

    expect(action.capabilityId).toBe('CreateStrategicFront');
    expect(action.ownerPrd).toBe('PRD-06');
    expect(action.requiredPermissions).toContain('portfolio.strategicFront.create');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.proposed_action.created',
    }));
  });

  it('rechaza ProposedAction con capability inexistente', async () => {
    const service = new ActionPlanService(makeRepository(), createDefaultCapabilityRegistry());

    await expect(service.addProposedAction({
      actionPlanId: 'plan1',
      capabilityId: 'MissingCapability',
      title: 'x',
      explanation: 'x',
      proposedPayload: validPayload(),
    })).rejects.toMatchObject({ code: 'CAPABILITY_NOT_FOUND' });
  });

  it('rechaza payload invalido', async () => {
    const service = new ActionPlanService(makeRepository(), createDefaultCapabilityRegistry());

    await expect(service.addProposedAction({
      actionPlanId: 'plan1',
      capabilityId: 'CreateStrategicFront',
      title: 'Crear',
      explanation: 'Payload invalido',
      proposedPayload: { organizationId: 'org1', name: 'A', createdBy: 'user1' },
    })).rejects.toMatchObject({ code: 'INVALID_CAPABILITY_PAYLOAD' });
  });

  it('edita payload, incrementa version e invalida aprobacion', async () => {
    const repo = makeRepository({
      findProposedActionById: vi.fn(async () => makeAction({
        approvedAt: now,
        approvedBy: 'approver1',
      })),
    });
    const service = new ActionPlanService(repo, createDefaultCapabilityRegistry());

    const updated = await service.editProposedPayload('action1', 1, {
      ...validPayload(),
      name: 'Eficiencia comercial',
    });

    expect(updated.version).toBe(2);
    expect(updated.status).toBe('edited');
    expect(updated.approvedAt).toBeNull();
    expect(updated.approvedBy).toBeNull();
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.proposed_action.edited',
    }));
  });

  it('detecta stale version al editar', async () => {
    const service = new ActionPlanService(makeRepository(), createDefaultCapabilityRegistry());

    await expect(service.editProposedPayload('action1', 2, validPayload())).rejects.toMatchObject({
      code: 'STALE_ACTION_VERSION',
    });
  });

  it('supersede plan y evita usarlo como vigente', async () => {
    const repo = makeRepository({
      findActionPlanById: vi.fn(async () => makePlan({ status: 'superseded', supersededById: 'plan2' })),
    });
    const service = new ActionPlanService(repo, createDefaultCapabilityRegistry());

    await expect(service.addProposedAction({
      actionPlanId: 'plan1',
      capabilityId: 'CreateStrategicFront',
      title: 'Crear',
      explanation: 'x',
      proposedPayload: validPayload(),
    })).rejects.toMatchObject({ code: 'STALE_ACTION_VERSION' });
  });

  it('recupera plan con sus acciones', async () => {
    const service = new ActionPlanService(makeRepository({
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [makeAction()] })),
    }), createDefaultCapabilityRegistry());

    const plan = await service.getPlan('plan1');
    expect(plan.proposedActions).toHaveLength(1);
  });
});
