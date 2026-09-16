import { AppError } from '../../../shared/errors/AppError';
import type { ActionPlan, IntentAssessment, ProposedAction } from '../domain/copilot.types';
import { CopilotErrors } from '../domain/copilot.errors';
import type { CapabilityRegistry } from './capability-registry';
import type {
  CopilotRepository,
  CreateIntentAssessmentInput,
} from '../infrastructure/copilot.repository';
import { deriveActionPlanStatus } from './action-plan-status';

export type CreateDraftActionPlanInput = {
  conversationId: string;
  intentAssessmentId: string;
  summary: string;
  createdBy: string;
};

export type AddProposedActionInput = {
  actionPlanId: string;
  capabilityId: string;
  title: string;
  explanation: string;
  proposedPayload: Record<string, unknown>;
  editableFields?: string[];
  dependencyActionIds?: string[];
};

export class ActionPlanService {
  constructor(
    private readonly repository: CopilotRepository,
    private readonly capabilityRegistry: CapabilityRegistry,
  ) {}

  async saveIntentAssessment(input: CreateIntentAssessmentInput): Promise<IntentAssessment> {
    for (const capabilityId of input.recommendedCapabilities) {
      this.capabilityRegistry.assertExists(capabilityId);
    }

    const assessment = await this.repository.saveIntentAssessment(input);
    await this.repository.writeAudit({
      userId: null,
      action: 'copilot.intent_assessment.saved',
      resource: 'IntentAssessment',
      resourceId: assessment.id,
      details: {
        conversationId: assessment.conversationId,
        primaryIntent: assessment.primaryIntent,
        recommendedCapabilities: assessment.recommendedCapabilities,
      },
    });
    return assessment;
  }

  async createDraftPlan(input: CreateDraftActionPlanInput): Promise<ActionPlan> {
    const conversation = await this.repository.findConversationById(input.conversationId);
    if (!conversation) {
      throw CopilotErrors.conversationNotFound(input.conversationId);
    }

    const plan = await this.repository.createActionPlan({
      conversationId: input.conversationId,
      intentAssessmentId: input.intentAssessmentId,
      summary: input.summary,
      status: 'draft',
      version: 1,
      createdBy: input.createdBy,
    });

    await this.repository.writeAudit({
      userId: input.createdBy,
      action: 'copilot.action_plan.created',
      resource: 'ActionPlan',
      resourceId: plan.id,
      details: {
        conversationId: plan.conversationId,
        intentAssessmentId: plan.intentAssessmentId,
        version: plan.version,
      },
    });

    return plan;
  }

  async addProposedAction(input: AddProposedActionInput): Promise<ProposedAction> {
    const plan = await this.getCurrentPlan(input.actionPlanId);
    const capability = this.capabilityRegistry.getById(input.capabilityId);
    const validation = this.capabilityRegistry.validatePayload(input.capabilityId, input.proposedPayload);
    if (validation.success === false) {
      throw CopilotErrors.invalidCapabilityPayload(validation.error.message);
    }

    const action = await this.repository.createProposedAction({
      actionPlanId: plan.id,
      capabilityId: capability.id,
      ownerPrd: capability.ownerPrd,
      operation: capability.operation as 'create',
      commandType: capability.commandType ?? '',
      title: input.title,
      explanation: input.explanation,
      proposedPayload: input.proposedPayload,
      editableFields: input.editableFields ?? capability.requiredInputs.concat(capability.optionalInputs),
      requiredPermissions: capability.requiredPermissions,
      requiresConfirmation: capability.requiresConfirmation,
      dependencyActionIds: input.dependencyActionIds ?? [],
      status: 'proposed',
      version: 1,
    });

    await this.repository.writeAudit({
      userId: plan.createdBy,
      action: 'copilot.proposed_action.created',
      resource: 'ProposedAction',
      resourceId: action.id,
      details: {
        actionPlanId: action.actionPlanId,
        capabilityId: action.capabilityId,
        commandType: action.commandType,
      },
    });

    return action;
  }

  async getPlan(actionPlanId: string): Promise<ActionPlan> {
    const plan = await this.repository.findActionPlanById(actionPlanId);
    if (!plan) {
      throw CopilotErrors.actionPlanNotFound(actionPlanId);
    }
    return plan;
  }

  async editProposedPayload(
    proposedActionId: string,
    expectedVersion: number,
    proposedPayload: Record<string, unknown>,
  ): Promise<ProposedAction> {
    const action = await this.repository.findProposedActionById(proposedActionId);
    if (!action) {
      throw CopilotErrors.proposedActionNotFound(proposedActionId);
    }
    if (action.version !== expectedVersion) {
      throw CopilotErrors.staleActionVersion(expectedVersion, action.version);
    }

    const capability = this.capabilityRegistry.getById(action.capabilityId);
    const validation = capability.inputSchema.safeParse(proposedPayload);
    if (!validation.success) {
      throw CopilotErrors.invalidCapabilityPayload('Payload invalido para editar la ProposedAction.');
    }

    const updated = await this.repository.updateProposedActionPayload(proposedActionId, {
      expectedVersion,
      proposedPayload,
    });

    await this.repository.writeAudit({
      userId: null,
      action: 'copilot.proposed_action.edited',
      resource: 'ProposedAction',
      resourceId: updated.id,
      details: {
        actionPlanId: updated.actionPlanId,
        capabilityId: updated.capabilityId,
        previousVersion: action.version,
        nextVersion: updated.version,
        approvalInvalidated: Boolean(action.approvedAt || action.approvedBy),
      },
    });

    if (action.approvedAt || action.approvedBy) {
      await this.repository.writeAudit({
        userId: null,
        action: 'copilot.proposed_action.approval_invalidated',
        resource: 'ProposedAction',
        resourceId: updated.id,
        details: {
          event: 'ProposedActionApprovalInvalidated',
          actionPlanId: updated.actionPlanId,
          capabilityId: updated.capabilityId,
          previousApprovedBy: action.approvedBy,
          previousVersion: action.version,
          nextVersion: updated.version,
        },
      });
    }

    const plan = await this.repository.findActionPlanById(updated.actionPlanId);
    if (plan?.proposedActions) {
      const nextActions = plan.proposedActions.map((item) => item.id === updated.id ? updated : item);
      await this.repository.updateActionPlanStatus(plan.id, deriveActionPlanStatus(nextActions));
    }

    return updated;
  }

  async supersedePlan(actionPlanId: string, supersededById: string): Promise<ActionPlan> {
    const plan = await this.repository.findActionPlanById(actionPlanId);
    if (!plan) {
      throw CopilotErrors.actionPlanNotFound(actionPlanId);
    }

    const updated = await this.repository.supersedeActionPlan(actionPlanId, supersededById);
    await this.repository.writeAudit({
      userId: plan.createdBy,
      action: 'copilot.action_plan.superseded',
      resource: 'ActionPlan',
      resourceId: updated.id,
      details: {
        supersededById,
        previousStatus: plan.status,
      },
    });
    return updated;
  }

  private async getCurrentPlan(actionPlanId: string): Promise<ActionPlan> {
    const plan = await this.getPlan(actionPlanId);
    if (plan.status === 'superseded' || plan.supersededById) {
      throw AppError.conflict(
        'El Action Plan fue reemplazado por una version posterior.',
        'STALE_ACTION_VERSION',
        { hint: 'Usa la version vigente del plan antes de continuar.' },
      );
    }
    return plan;
  }
}
