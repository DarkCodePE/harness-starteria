import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { PrismaCopilotRepository } from '../infrastructure/prisma-copilot.repository';

const now = new Date('2026-07-26T12:00:00Z');

function makePrisma() {
  return {
    organization: {
      findUnique: vi.fn(async () => ({ id: 'org1' })),
    },
    user: {
      findUnique: vi.fn(async () => ({ organizationId: 'org1' })),
    },
    organizationMember: {
      findFirst: vi.fn(async () => ({ role: 'member' })),
    },
    copilotConversation: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'conv1',
        contextObjectType: null,
        contextObjectId: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      })),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        organizationId: 'org1',
        userId: 'user1',
        status: 'collecting_context',
        contextObjectType: null,
        contextObjectId: null,
        createdAt: now,
        updatedAt: now,
      })),
    },
    copilotMessage: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'msg1',
        createdAt: now,
        ...data,
      })),
      findMany: vi.fn(async () => [
        {
          id: 'msg1',
          conversationId: 'conv1',
          role: 'user',
          messageType: 'free_text',
          content: 'Crear frente',
          sourceReferences: [],
          createdAt: now,
        },
      ]),
    },
    intentAssessment: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'ia1',
        createdAt: now,
        ...data,
      })),
    },
    actionPlan: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'plan1',
        createdAt: now,
        updatedAt: now,
        supersededById: null,
        ...data,
      })),
      findUnique: vi.fn(async () => ({
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
        proposedActions: [],
      })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'plan1',
        conversationId: 'conv1',
        intentAssessmentId: 'ia1',
        summary: 'Crear frente',
        status: data.status,
        version: 1,
        createdBy: 'user1',
        createdAt: now,
        updatedAt: now,
        supersededById: data.supersededById,
      })),
    },
    proposedAction: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'action1',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      })),
      findUnique: vi.fn(async () => ({
        id: 'action1',
        actionPlanId: 'plan1',
        capabilityId: 'CreateStrategicFront',
        ownerPrd: 'PRD-06',
        operation: 'create',
        commandType: 'CreateStrategicFrontCommand',
        title: 'Crear frente',
        explanation: 'x',
        proposedPayload: { organizationId: 'org1', name: 'Eficiencia operativa', createdBy: 'user1' },
        editableFields: ['name'],
        requiredPermissions: ['portfolio.strategicFront.create'],
        requiresConfirmation: true,
        dependencyActionIds: [],
        status: 'proposed',
        version: 1,
        approvedAt: now,
        approvedBy: 'approver1',
        rejectedAt: null,
        rejectedBy: null,
        createdAt: now,
        updatedAt: now,
      })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'action1',
        actionPlanId: 'plan1',
        capabilityId: 'CreateStrategicFront',
        ownerPrd: 'PRD-06',
        operation: 'create',
        commandType: 'CreateStrategicFrontCommand',
        title: 'Crear frente',
        explanation: 'x',
        proposedPayload: data.proposedPayload,
        editableFields: ['name'],
        requiredPermissions: ['portfolio.strategicFront.create'],
        requiresConfirmation: true,
        dependencyActionIds: [],
        status: 'edited',
        version: 2,
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        createdAt: now,
        updatedAt: now,
      })),
    },
    actionExecution: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'exec1',
        status: 'pending',
        attempt: 1,
        result: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      })),
      findUnique: vi.fn(async () => ({
        id: 'exec1',
        proposedActionId: 'action1',
        idempotencyKey: 'idem1',
        status: 'pending',
        attempt: 1,
        approvedBy: 'approver1',
        executedBy: null,
        commandPayload: { organizationId: 'org1', name: 'Eficiencia operativa' },
        result: null,
        error: null,
        createdObjectReferences: [],
        updatedObjectReferences: [],
        projectionLinks: [],
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      })),
    },
    auditLog: {
      create: vi.fn(async () => ({ id: 'audit1' })),
    },
  };
}

describe('PrismaCopilotRepository', () => {
  it('crea conversacion, relaciones por organizacion/usuario y audita', async () => {
    const prisma = makePrisma();
    const repo = new PrismaCopilotRepository(prisma as unknown as PrismaClient);

    const conversation = await repo.createConversation({
      organizationId: 'org1',
      userId: 'user1',
      status: 'collecting_context',
    });
    await repo.writeAudit({
      userId: 'user1',
      action: 'copilot.conversation.created',
      resource: 'CopilotConversation',
      resourceId: conversation.id,
      details: { organizationId: 'org1' },
    });

    expect(conversation).toMatchObject({ id: 'conv1', organizationId: 'org1', userId: 'user1' });
    expect(prisma.copilotConversation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org1', userId: 'user1' }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ resource: 'CopilotConversation' }),
    });
  });

  it('agrega mensajes y busca por conversacion', async () => {
    const repo = new PrismaCopilotRepository(makePrisma() as unknown as PrismaClient);

    const message = await repo.addMessage({
      conversationId: 'conv1',
      role: 'user',
      messageType: 'free_text',
      content: 'Crear frente',
      sourceReferences: [],
    });
    const messages = await repo.listMessages('conv1');

    expect(message.conversationId).toBe('conv1');
    expect(messages).toHaveLength(1);
  });

  it('guarda IntentAssessment y ActionPlan con relaciones', async () => {
    const repo = new PrismaCopilotRepository(makePrisma() as unknown as PrismaClient);

    const assessment = await repo.saveIntentAssessment({
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
      rubricVersion: 'v1',
    });
    const plan = await repo.createActionPlan({
      conversationId: 'conv1',
      intentAssessmentId: assessment.id,
      summary: 'Crear frente',
      status: 'draft',
      version: 1,
      createdBy: 'user1',
    });

    expect(assessment.conversationId).toBe('conv1');
    expect(plan.intentAssessmentId).toBe('ia1');
  });

  it('crea ProposedAction y recupera plan con acciones', async () => {
    const repo = new PrismaCopilotRepository(makePrisma() as unknown as PrismaClient);

    const action = await repo.createProposedAction({
      actionPlanId: 'plan1',
      capabilityId: 'CreateStrategicFront',
      ownerPrd: 'PRD-06',
      operation: 'create',
      commandType: 'CreateStrategicFrontCommand',
      title: 'Crear frente',
      explanation: 'x',
      proposedPayload: { organizationId: 'org1', name: 'Eficiencia operativa', createdBy: 'user1' },
      editableFields: ['name'],
      requiredPermissions: ['portfolio.strategicFront.create'],
      requiresConfirmation: true,
      dependencyActionIds: [],
      status: 'proposed',
      version: 1,
    });
    const plan = await repo.findActionPlanById('plan1');

    expect(action.actionPlanId).toBe('plan1');
    expect(plan?.id).toBe('plan1');
  });

  it('edita payload incrementando version e invalidando aprobacion', async () => {
    const repo = new PrismaCopilotRepository(makePrisma() as unknown as PrismaClient);

    const updated = await repo.updateProposedActionPayload('action1', {
      expectedVersion: 1,
      proposedPayload: { organizationId: 'org1', name: 'Nuevo frente', createdBy: 'user1' },
    });

    expect(updated.version).toBe(2);
    expect(updated.approvedAt).toBeNull();
    expect(updated.approvedBy).toBeNull();
  });

  it('crea ActionExecution pendiente y busca por idempotencyKey', async () => {
    const repo = new PrismaCopilotRepository(makePrisma() as unknown as PrismaClient);

    const execution = await repo.createPendingActionExecution({
      proposedActionId: 'action1',
      idempotencyKey: 'idem1',
      approvedBy: 'approver1',
      commandPayload: { capabilityId: 'CreateStrategicFront' },
      createdObjectReferences: [],
      updatedObjectReferences: [],
      projectionLinks: [],
    });
    const found = await repo.findExecutionByIdempotencyKey('idem1');

    expect(execution.idempotencyKey).toBe('idem1');
    expect(found?.id).toBe('exec1');
  });

  it('mapea constraint unico de idempotencyKey a error canonico', async () => {
    const prisma = makePrisma();
    prisma.actionExecution.create = vi.fn(async () => {
      throw { code: 'P2002' };
    });
    const repo = new PrismaCopilotRepository(prisma as unknown as PrismaClient);

    await expect(repo.createPendingActionExecution({
      proposedActionId: 'action1',
      idempotencyKey: 'idem1',
      approvedBy: 'approver1',
      commandPayload: {},
      createdObjectReferences: [],
      updatedObjectReferences: [],
      projectionLinks: [],
    })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('resuelve busquedas por organizacion y membresia', async () => {
    const repo = new PrismaCopilotRepository(makePrisma() as unknown as PrismaClient);

    await expect(repo.getOrganizationAccess('user1', 'org1')).resolves.toMatchObject({
      organizationExists: true,
      isMember: true,
      membershipRole: 'member',
    });
  });
});
