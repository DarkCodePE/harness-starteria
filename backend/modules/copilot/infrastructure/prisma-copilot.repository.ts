import { Prisma, type PrismaClient } from '@prisma/client';
import {
  commandExecutionResultSchema,
  createActionExecutionPendingSchema,
  createActionPlanSchema,
  createCopilotConversationSchema,
  createCopilotMessageSchema,
  createIntentAssessmentSchema,
  createProposedActionSchema,
  editProposedActionPayloadSchema,
  objectReferenceSchema,
  projectionLinkSchema,
  sourceReferenceSchema,
} from '../schemas/copilot.schemas';
import { CopilotErrors } from '../domain/copilot.errors';
import type {
  ActionExecution,
  ActionPlan,
  CommandExecutionError,
  CommandExecutionResult,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
  ObjectReference,
  ProjectionLink,
  ProposedAction,
  SourceReference,
} from '../domain/copilot.types';
import type {
  ApproveProposedActionInput,
  AuditEventInput,
  CompleteActionExecutionInput,
  CopilotRepository,
  CreateActionExecutionPendingInput,
  CreateActionPlanInput,
  CreateCopilotConversationInput,
  CreateCopilotMessageInput,
  CreateIntentAssessmentInput,
  CreateProposedActionInput,
  EditProposedActionInput,
  FailActionExecutionInput,
  ClaimStaleExecutionInput,
  MarkExecutionManualReviewInput,
  RejectProposedActionInput,
  UpdateActionExecutionStatusInput,
} from './copilot.repository';
import type { OrganizationAccessSnapshot } from '../application/strategic-front.authorization';

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toNullableInputJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : toInputJson(value);
}

function parseSourceReferences(value: unknown): SourceReference[] {
  return sourceReferenceSchema.array().parse(value).map((item) => ({
    type: item.type,
    id: item.id,
    label: item.label,
  }));
}

function parseObjectReferences(value: unknown): ObjectReference[] {
  return objectReferenceSchema.array().parse(value).map((item) => ({
    type: item.type,
    id: item.id,
    label: item.label,
  }));
}

function parseProjectionLinks(value: unknown): ProjectionLink[] {
  return projectionLinkSchema.array().parse(value).map((item) => ({
    label: item.label,
    href: item.href,
    objectType: item.objectType,
    objectId: item.objectId,
  }));
}

function parseCommandExecutionResult(value: unknown): CommandExecutionResult | null {
  if (value === null || value === undefined) return null;
  const parsed = commandExecutionResultSchema.parse(value);
  return {
    success: parsed.success,
    commandType: parsed.commandType,
    createdObjects: parsed.createdObjects.map((item) => ({
      type: item.type,
      id: item.id,
      label: item.label,
    })),
    updatedObjects: parsed.updatedObjects.map((item) => ({
      type: item.type,
      id: item.id,
      label: item.label,
    })),
    warnings: parsed.warnings,
    projectionLinks: parsed.projectionLinks.map((item) => ({
      label: item.label,
      href: item.href,
      objectType: item.objectType,
      objectId: item.objectId,
    })),
    error: parsed.error
      ? {
          code: parsed.error.code,
          message: parsed.error.message,
          retryable: parsed.error.retryable,
        }
      : undefined,
  };
}

function parseCommandExecutionError(value: unknown): CommandExecutionError | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.code === 'string' &&
    typeof record.message === 'string' &&
    typeof record.retryable === 'boolean'
  ) {
    return {
      code: record.code,
      message: record.message,
      retryable: record.retryable,
    };
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function isUniqueConstraintError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: unknown }).code === 'P2002',
  );
}

function isMissingRelationError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      ((err as { code?: unknown }).code === 'P2021' || (err as { code?: unknown }).code === 'P2022'),
  );
}

export class PrismaCopilotRepository implements CopilotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getActorOrganizationId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
    if (user?.organizationId) return user.organizationId;

    try {
      const membership = await this.prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true },
        orderBy: { createdAt: 'asc' },
      });
      return membership?.organizationId ?? null;
    } catch (err) {
      if (!isMissingRelationError(err)) {
        throw err;
      }
      return null;
    }
  }

  async getOrganizationAccess(userId: string, organizationId: string): Promise<OrganizationAccessSnapshot> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });

    try {
      const [organization, membership] = await Promise.all([
        this.prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } }),
        this.prisma.organizationMember.findFirst({
          where: { organizationId, userId },
          select: { role: true },
        }),
      ]);

      return {
        organizationExists: Boolean(organization) || user?.organizationId === organizationId,
        isMember: Boolean(membership) || user?.organizationId === organizationId,
        membershipRole: membership?.role ?? null,
      };
    } catch (err) {
      if (!isMissingRelationError(err)) {
        throw err;
      }
    }

    return {
      organizationExists: user?.organizationId === organizationId,
      isMember: user?.organizationId === organizationId,
      membershipRole: null,
    };
  }

  async createConversation(input: CreateCopilotConversationInput): Promise<CopilotConversation> {
    const data = createCopilotConversationSchema.parse(input);
    const createData: Prisma.CopilotConversationUncheckedCreateInput = {
      organizationId: data.organizationId,
      userId: data.userId,
      status: data.status,
      contextObjectType: data.contextObjectType,
      contextObjectId: data.contextObjectId,
    };
    const row = await this.prisma.copilotConversation.create({ data: createData });
    return this.toConversation(row);
  }

  async findConversationById(id: string): Promise<CopilotConversation | null> {
    const row = await this.prisma.copilotConversation.findUnique({ where: { id } });
    return row ? this.toConversation(row) : null;
  }

  async updateConversationStatus(id: string, status: CopilotConversation['status']): Promise<CopilotConversation> {
    const row = await this.prisma.copilotConversation.update({
      where: { id },
      data: { status },
    });
    return this.toConversation(row);
  }

  async addMessage(input: CreateCopilotMessageInput): Promise<CopilotMessage> {
    const data = createCopilotMessageSchema.parse(input);
    const createData: Prisma.CopilotMessageUncheckedCreateInput = {
      conversationId: data.conversationId,
      role: data.role,
      messageType: data.messageType,
      content: data.content,
      sourceReferences: toInputJson(data.sourceReferences),
    };
    const row = await this.prisma.copilotMessage.create({
      data: createData,
    });
    return this.toMessage(row);
  }

  async listMessages(conversationId: string): Promise<CopilotMessage[]> {
    const rows = await this.prisma.copilotMessage.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.toMessage(row));
  }

  async saveIntentAssessment(input: CreateIntentAssessmentInput): Promise<IntentAssessment> {
    const data = createIntentAssessmentSchema.parse(input);
    const createData: Prisma.IntentAssessmentUncheckedCreateInput = {
      conversationId: data.conversationId,
      originalMessageId: data.originalMessageId,
      primaryIntent: data.primaryIntent,
      operation: data.operation,
      detectedEntities: toInputJson(data.detectedEntities),
      ambiguousObjects: toInputJson(data.ambiguousObjects),
      missingInformation: toInputJson(data.missingInformation),
      recommendedCapabilities: toInputJson(data.recommendedCapabilities),
      confidence: data.confidence,
      sourceReferences: toInputJson(data.sourceReferences),
      adapterType: data.adapterType,
      rubricVersion: data.rubricVersion,
    };
    const row = await this.prisma.intentAssessment.create({
      data: createData,
    });
    return this.toIntentAssessment(row);
  }

  async findLatestIntentAssessmentByConversation(conversationId: string): Promise<IntentAssessment | null> {
    const row = await this.prisma.intentAssessment.findFirst({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? this.toIntentAssessment(row) : null;
  }

  async createActionPlan(input: CreateActionPlanInput): Promise<ActionPlan> {
    const data = createActionPlanSchema.parse(input);
    const createData: Prisma.ActionPlanUncheckedCreateInput = {
      conversationId: data.conversationId,
      intentAssessmentId: data.intentAssessmentId,
      summary: data.summary,
      status: data.status,
      version: data.version,
      createdBy: data.createdBy,
    };
    const row = await this.prisma.actionPlan.create({ data: createData });
    return this.toActionPlan(row);
  }

  async createProposedAction(input: CreateProposedActionInput): Promise<ProposedAction> {
    const data = createProposedActionSchema.parse(input);
    const createData: Prisma.ProposedActionUncheckedCreateInput = {
      actionPlanId: data.actionPlanId,
      capabilityId: data.capabilityId,
      ownerPrd: data.ownerPrd,
      operation: data.operation,
      commandType: data.commandType,
      title: data.title,
      explanation: data.explanation,
      proposedPayload: toInputJson(data.proposedPayload),
      editableFields: toInputJson(data.editableFields),
      requiredPermissions: toInputJson(data.requiredPermissions),
      requiresConfirmation: data.requiresConfirmation,
      dependencyActionIds: toInputJson(data.dependencyActionIds),
      status: data.status,
      version: data.version,
    };
    const row = await this.prisma.proposedAction.create({
      data: createData,
    });
    return this.toProposedAction(row);
  }

  async findActionPlanById(id: string): Promise<ActionPlan | null> {
    const row = await this.prisma.actionPlan.findUnique({
      where: { id },
      include: { proposedActions: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
    });
    if (!row) return null;
    return {
      ...this.toActionPlan(row),
      proposedActions: row.proposedActions.map((action) => this.toProposedAction(action)),
    };
  }

  async findCurrentActionPlanByConversation(conversationId: string): Promise<ActionPlan | null> {
    const row = await this.prisma.actionPlan.findFirst({
      where: {
        conversationId,
        status: { not: 'superseded' },
      },
      orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
      include: { proposedActions: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
    });
    if (!row) return null;
    return {
      ...this.toActionPlan(row),
      proposedActions: row.proposedActions.map((action) => this.toProposedAction(action)),
    };
  }

  async findProposedActionById(id: string): Promise<ProposedAction | null> {
    const row = await this.prisma.proposedAction.findUnique({ where: { id } });
    return row ? this.toProposedAction(row) : null;
  }

  async updateProposedActionPayload(id: string, input: EditProposedActionInput): Promise<ProposedAction> {
    const data = editProposedActionPayloadSchema.parse(input);
    const existing = await this.findProposedActionById(id);
    if (!existing) {
      throw CopilotErrors.proposedActionNotFound(id);
    }
    if (existing.version !== data.expectedVersion) {
      throw CopilotErrors.staleActionVersion(data.expectedVersion, existing.version);
    }

    const row = await this.prisma.proposedAction.update({
      where: { id },
      data: {
        proposedPayload: toInputJson(data.proposedPayload),
        version: { increment: 1 },
        status: 'edited',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
      },
    });
    return this.toProposedAction(row);
  }

  async approveProposedAction(id: string, input: ApproveProposedActionInput): Promise<ProposedAction> {
    const existing = await this.findProposedActionById(id);
    if (!existing) {
      throw CopilotErrors.proposedActionNotFound(id);
    }
    if (existing.version !== input.expectedVersion) {
      throw CopilotErrors.staleActionVersion(input.expectedVersion, existing.version);
    }

    const row = await this.prisma.proposedAction.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: input.approvedBy,
        approvedAt: input.approvedAt ?? new Date(),
        rejectedBy: null,
        rejectedAt: null,
      },
    });
    return this.toProposedAction(row);
  }

  async rejectProposedAction(id: string, input: RejectProposedActionInput): Promise<ProposedAction> {
    const existing = await this.findProposedActionById(id);
    if (!existing) {
      throw CopilotErrors.proposedActionNotFound(id);
    }
    if (existing.version !== input.expectedVersion) {
      throw CopilotErrors.staleActionVersion(input.expectedVersion, existing.version);
    }

    const row = await this.prisma.proposedAction.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: input.rejectedBy,
        rejectedAt: input.rejectedAt ?? new Date(),
        approvedBy: null,
        approvedAt: null,
      },
    });
    return this.toProposedAction(row);
  }

  async updateProposedActionStatus(id: string, status: ProposedAction['status']): Promise<ProposedAction> {
    const row = await this.prisma.proposedAction.update({
      where: { id },
      data: { status },
    });
    return this.toProposedAction(row);
  }

  async updateActionPlanStatus(id: string, status: ActionPlan['status']): Promise<ActionPlan> {
    const row = await this.prisma.actionPlan.update({
      where: { id },
      data: { status },
    });
    return this.toActionPlan(row);
  }

  async supersedeActionPlan(id: string, supersededById: string): Promise<ActionPlan> {
    const row = await this.prisma.actionPlan.update({
      where: { id },
      data: {
        status: 'superseded',
        supersededById,
      },
    });
    return this.toActionPlan(row);
  }

  async createPendingActionExecution(input: CreateActionExecutionPendingInput): Promise<ActionExecution> {
    const data = createActionExecutionPendingSchema.parse(input);
    try {
      const row = await this.prisma.actionExecution.create({
        data: {
          proposedActionId: data.proposedActionId,
          idempotencyKey: data.idempotencyKey,
          status: 'pending',
          attempt: 1,
          approvedBy: data.approvedBy,
          executedBy: data.executedBy ?? null,
          correlationId: data.correlationId ?? null,
          commandPayload: toInputJson(data.commandPayload),
          result: data.result === undefined ? undefined : toInputJson(data.result),
          error: data.error === undefined ? undefined : toInputJson(data.error),
          createdObjectReferences: toInputJson(data.createdObjectReferences),
          updatedObjectReferences: toInputJson(data.updatedObjectReferences),
          projectionLinks: toInputJson(data.projectionLinks),
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
      });
      return this.toActionExecution(row);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw CopilotErrors.idempotencyConflict(data.idempotencyKey);
      }
      throw err;
    }
  }

  async findExecutionByIdempotencyKey(idempotencyKey: string): Promise<ActionExecution | null> {
    const row = await this.prisma.actionExecution.findUnique({ where: { idempotencyKey } });
    return row ? this.toActionExecution(row) : null;
  }

  async findExecutionById(id: string): Promise<ActionExecution | null> {
    const row = await this.prisma.actionExecution.findUnique({ where: { id } });
    return row ? this.toActionExecution(row) : null;
  }

  async listExecutionsByAction(proposedActionId: string): Promise<ActionExecution[]> {
    const rows = await this.prisma.actionExecution.findMany({
      where: { proposedActionId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => this.toActionExecution(row));
  }

  async listStaleNonTerminalExecutions(staleBefore: Date, limit: number): Promise<ActionExecution[]> {
    const rows = await this.prisma.actionExecution.findMany({
      where: {
        status: { in: ['pending', 'validating', 'executing'] },
        updatedAt: { lt: staleBefore },
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return rows.map((row) => this.toActionExecution(row));
  }

  async claimStaleActionExecution(id: string, input: ClaimStaleExecutionInput): Promise<ActionExecution | null> {
    const result = await this.prisma.actionExecution.updateMany({
      where: {
        id,
        status: { in: ['pending', 'validating', 'executing'] },
        updatedAt: { lt: input.staleBefore },
        reconciliationClaimId: null,
      },
      data: {
        reconciliationClaimId: input.claimId,
        reconciliationClaimedAt: new Date(),
      },
    });
    if (result.count !== 1) return null;
    return this.findExecutionById(id);
  }

  async updateActionExecutionStatus(
    id: string,
    input: UpdateActionExecutionStatusInput,
  ): Promise<ActionExecution> {
    const row = await this.prisma.actionExecution.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        ...(input.executedBy !== undefined ? { executedBy: input.executedBy } : {}),
      },
    });
    return this.toActionExecution(row);
  }

  async completeActionExecution(
    id: string,
    input: CompleteActionExecutionInput,
  ): Promise<ActionExecution> {
    const completedAt = input.completedAt ?? new Date();
    const row = await this.prisma.actionExecution.update({
      where: { id },
      data: {
        status: 'completed',
        result: toInputJson(input.result),
        error: Prisma.JsonNull,
        createdObjectReferences: toInputJson(input.createdObjectReferences),
        updatedObjectReferences: toInputJson(input.updatedObjectReferences),
        projectionLinks: toInputJson(input.projectionLinks),
        completedAt,
      },
    });
    return this.toActionExecution(row);
  }

  async failActionExecution(id: string, input: FailActionExecutionInput): Promise<ActionExecution> {
    const completedAt = input.completedAt ?? new Date();
    const row = await this.prisma.actionExecution.update({
      where: { id },
      data: {
        status: input.result?.success === true ? 'partially_completed' : 'failed',
        result: input.result === undefined ? undefined : toNullableInputJson(input.result),
        error: toInputJson(input.error),
        completedAt,
      },
    });
    return this.toActionExecution(row);
  }

  async markActionExecutionManualReview(
    id: string,
    input: MarkExecutionManualReviewInput,
  ): Promise<ActionExecution> {
    const completedAt = input.completedAt ?? new Date();
    const row = await this.prisma.actionExecution.update({
      where: { id },
      data: {
        status: 'manual_review_required',
        error: toInputJson(input.error),
        completedAt,
      },
    });
    return this.toActionExecution(row);
  }

  async writeAudit(event: AuditEventInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: event.userId ?? null,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId ?? null,
        details: toInputJson(event.details ?? {}),
      },
    });
  }

  private toConversation(row: {
    id: string;
    organizationId: string;
    userId: string;
    status: string;
    contextObjectType: string | null;
    contextObjectId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CopilotConversation {
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      status: row.status as CopilotConversation['status'],
      contextObjectType: row.contextObjectType,
      contextObjectId: row.contextObjectId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toMessage(row: {
    id: string;
    conversationId: string;
    role: string;
    messageType: string;
    content: string;
    sourceReferences: Prisma.JsonValue;
    createdAt: Date;
  }): CopilotMessage {
    return {
      id: row.id,
      conversationId: row.conversationId,
      role: row.role as CopilotMessage['role'],
      messageType: row.messageType as CopilotMessage['messageType'],
      content: row.content,
      sourceReferences: parseSourceReferences(row.sourceReferences),
      createdAt: row.createdAt,
    };
  }

  private toIntentAssessment(row: {
    id: string;
    conversationId: string;
    originalMessageId: string;
    primaryIntent: string;
    operation: string;
    detectedEntities: Prisma.JsonValue;
    ambiguousObjects: Prisma.JsonValue;
    missingInformation: Prisma.JsonValue;
    recommendedCapabilities: Prisma.JsonValue;
    confidence: string;
    sourceReferences: Prisma.JsonValue;
    adapterType: string;
    rubricVersion: string;
    createdAt: Date;
  }): IntentAssessment {
    return {
      id: row.id,
      conversationId: row.conversationId,
      originalMessageId: row.originalMessageId,
      primaryIntent: row.primaryIntent as IntentAssessment['primaryIntent'],
      operation: row.operation as IntentAssessment['operation'],
      detectedEntities: asRecord(row.detectedEntities),
      ambiguousObjects: parseObjectReferences(row.ambiguousObjects),
      missingInformation: typeof row.missingInformation === 'object' && Array.isArray(row.missingInformation)
        ? row.missingInformation.filter((item): item is string => typeof item === 'string')
        : [],
      recommendedCapabilities: typeof row.recommendedCapabilities === 'object' && Array.isArray(row.recommendedCapabilities)
        ? row.recommendedCapabilities.filter((item): item is string => typeof item === 'string')
        : [],
      confidence: row.confidence as IntentAssessment['confidence'],
      sourceReferences: parseSourceReferences(row.sourceReferences),
      adapterType: row.adapterType as IntentAssessment['adapterType'],
      rubricVersion: row.rubricVersion,
      createdAt: row.createdAt,
    };
  }

  private toActionPlan(row: {
    id: string;
    conversationId: string;
    intentAssessmentId: string;
    summary: string;
    status: string;
    version: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    supersededById: string | null;
  }): ActionPlan {
    return {
      id: row.id,
      conversationId: row.conversationId,
      intentAssessmentId: row.intentAssessmentId,
      summary: row.summary,
      status: row.status as ActionPlan['status'],
      version: row.version,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      supersededById: row.supersededById,
    };
  }

  private toProposedAction(row: {
    id: string;
    actionPlanId: string;
    capabilityId: string;
    ownerPrd: string;
    operation: string;
    commandType: string;
    title: string;
    explanation: string;
    proposedPayload: Prisma.JsonValue;
    editableFields: Prisma.JsonValue;
    requiredPermissions: Prisma.JsonValue;
    requiresConfirmation: boolean;
    dependencyActionIds: Prisma.JsonValue;
    status: string;
    version: number;
    approvedAt: Date | null;
    approvedBy: string | null;
    rejectedAt: Date | null;
    rejectedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ProposedAction {
    return {
      id: row.id,
      actionPlanId: row.actionPlanId,
      capabilityId: row.capabilityId,
      ownerPrd: row.ownerPrd,
      operation: row.operation as ProposedAction['operation'],
      commandType: row.commandType,
      title: row.title,
      explanation: row.explanation,
      proposedPayload: asRecord(row.proposedPayload),
      editableFields: Array.isArray(row.editableFields)
        ? row.editableFields.filter((item): item is string => typeof item === 'string')
        : [],
      requiredPermissions: Array.isArray(row.requiredPermissions)
        ? row.requiredPermissions.filter((item): item is string => typeof item === 'string')
        : [],
      requiresConfirmation: row.requiresConfirmation,
      dependencyActionIds: Array.isArray(row.dependencyActionIds)
        ? row.dependencyActionIds.filter((item): item is string => typeof item === 'string')
        : [],
      status: row.status as ProposedAction['status'],
      version: row.version,
      approvedAt: row.approvedAt,
      approvedBy: row.approvedBy,
      rejectedAt: row.rejectedAt,
      rejectedBy: row.rejectedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toActionExecution(row: {
    id: string;
    proposedActionId: string;
    idempotencyKey: string;
    status: string;
    attempt: number;
    approvedBy: string;
    executedBy: string | null;
    correlationId: string | null;
    reconciliationClaimId: string | null;
    reconciliationClaimedAt: Date | null;
    commandPayload: Prisma.JsonValue;
    result: Prisma.JsonValue | null;
    error: Prisma.JsonValue | null;
    createdObjectReferences: Prisma.JsonValue;
    updatedObjectReferences: Prisma.JsonValue;
    projectionLinks: Prisma.JsonValue;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ActionExecution {
    return {
      id: row.id,
      proposedActionId: row.proposedActionId,
      idempotencyKey: row.idempotencyKey,
      status: row.status as ActionExecution['status'],
      attempt: row.attempt,
      approvedBy: row.approvedBy,
      executedBy: row.executedBy,
      correlationId: row.correlationId,
      reconciliationClaimId: row.reconciliationClaimId,
      reconciliationClaimedAt: row.reconciliationClaimedAt,
      commandPayload: asRecord(row.commandPayload),
      result: parseCommandExecutionResult(row.result),
      error: parseCommandExecutionError(row.error),
      createdObjectReferences: parseObjectReferences(row.createdObjectReferences),
      updatedObjectReferences: parseObjectReferences(row.updatedObjectReferences),
      projectionLinks: parseProjectionLinks(row.projectionLinks),
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
