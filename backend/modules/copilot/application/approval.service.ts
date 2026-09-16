import { CopilotErrors } from '../domain/copilot.errors';
import type { ActionPlan, CopilotActor, CopilotConversation, ProposedAction } from '../domain/copilot.types';
import { approveProposedActionSchema, rejectProposedActionSchema } from '../schemas/copilot.schemas';
import type { CapabilityRegistry } from './capability-registry';
import { canCreateStrategicFront } from './strategic-front.authorization';
import { deriveActionPlanStatus } from './action-plan-status';
import type { CopilotRepository } from '../infrastructure/copilot.repository';

export type ApproveProposedActionInput = {
  actionId: string;
  expectedVersion: number;
  approvedBy: CopilotActor;
  organizationId: string;
};

export type RejectProposedActionInput = {
  actionId: string;
  expectedVersion: number;
  rejectedBy: CopilotActor;
  organizationId: string;
  reason?: string;
};

type LoadedActionGraph = {
  action: ProposedAction;
  plan: ActionPlan;
  conversation: CopilotConversation;
  actions: ProposedAction[];
};

const APPROVABLE_STATUSES = new Set<ProposedAction['status']>(['proposed', 'edited']);
const REJECTABLE_STATUSES = new Set<ProposedAction['status']>(['proposed', 'edited', 'approved']);

export class ApprovalService {
  constructor(
    private readonly repository: CopilotRepository,
    private readonly capabilityRegistry: CapabilityRegistry,
  ) {}

  async approveProposedAction(input: ApproveProposedActionInput): Promise<ProposedAction> {
    const parsed = approveProposedActionSchema.parse({
      actionId: input.actionId,
      expectedVersion: input.expectedVersion,
      approvedBy: input.approvedBy.id,
      organizationId: input.organizationId,
    });
    const graph = await this.loadActionGraph(parsed.actionId);

    await this.validateCommon({
      graph,
      actor: input.approvedBy,
      organizationId: parsed.organizationId,
      expectedVersion: parsed.expectedVersion,
    });

    if (!APPROVABLE_STATUSES.has(graph.action.status)) {
      throw CopilotErrors.actionNotApproved(graph.action.id);
    }

    const approved = await this.repository.approveProposedAction(graph.action.id, {
      expectedVersion: parsed.expectedVersion,
      approvedBy: parsed.approvedBy,
    });

    await this.recalculatePlanStatus(graph.plan.id, graph.actions, approved);
    await this.repository.writeAudit({
      userId: parsed.approvedBy,
      action: 'copilot.proposed_action.approved',
      resource: 'ProposedAction',
      resourceId: approved.id,
      details: {
        event: 'ProposedActionApproved',
        actionPlanId: approved.actionPlanId,
        capabilityId: approved.capabilityId,
        commandType: approved.commandType,
        organizationId: parsed.organizationId,
        version: approved.version,
      },
    });

    return approved;
  }

  async rejectProposedAction(input: RejectProposedActionInput): Promise<ProposedAction> {
    const parsed = rejectProposedActionSchema.parse({
      actionId: input.actionId,
      expectedVersion: input.expectedVersion,
      rejectedBy: input.rejectedBy.id,
      organizationId: input.organizationId,
      reason: input.reason,
    });
    const graph = await this.loadActionGraph(parsed.actionId);

    await this.validateCommon({
      graph,
      actor: input.rejectedBy,
      organizationId: parsed.organizationId,
      expectedVersion: parsed.expectedVersion,
    });

    if (!REJECTABLE_STATUSES.has(graph.action.status)) {
      throw CopilotErrors.actionAlreadyCompleted(graph.action.id);
    }

    const rejected = await this.repository.rejectProposedAction(graph.action.id, {
      expectedVersion: parsed.expectedVersion,
      rejectedBy: parsed.rejectedBy,
    });

    const blockedDependents: ProposedAction[] = [];
    for (const dependent of graph.actions) {
      if (
        dependent.id !== rejected.id &&
        dependent.dependencyActionIds.includes(rejected.id) &&
        dependent.status !== 'completed'
      ) {
        blockedDependents.push(await this.repository.updateProposedActionStatus(dependent.id, 'blocked'));
      }
    }

    await this.recalculatePlanStatus(graph.plan.id, graph.actions, rejected, blockedDependents);
    await this.repository.writeAudit({
      userId: parsed.rejectedBy,
      action: 'copilot.proposed_action.rejected',
      resource: 'ProposedAction',
      resourceId: rejected.id,
      details: {
        event: 'ProposedActionRejected',
        actionPlanId: rejected.actionPlanId,
        capabilityId: rejected.capabilityId,
        commandType: rejected.commandType,
        organizationId: parsed.organizationId,
        reason: parsed.reason ?? null,
        blockedDependentActionIds: blockedDependents.map((action) => action.id),
      },
    });

    return rejected;
  }

  private async validateCommon(input: {
    graph: LoadedActionGraph;
    actor: CopilotActor;
    organizationId: string;
    expectedVersion: number;
  }): Promise<void> {
    const { graph, actor, organizationId, expectedVersion } = input;
    if (graph.conversation.organizationId !== organizationId) {
      await this.auditOrganizationRejection(actor.id, graph.action, organizationId, 'conversation_organization_mismatch');
      throw CopilotErrors.organizationAccessDenied(organizationId, 'conversation_organization_mismatch');
    }
    if (graph.action.version !== expectedVersion) {
      throw CopilotErrors.staleActionVersion(expectedVersion, graph.action.version);
    }

    const capability = this.capabilityRegistry.getById(graph.action.capabilityId);
    if (capability.commandType !== graph.action.commandType || capability.ownerPrd !== graph.action.ownerPrd) {
      throw CopilotErrors.capabilityNotFound(graph.action.capabilityId);
    }

    const validation = this.capabilityRegistry.validatePayload(graph.action.capabilityId, graph.action.proposedPayload);
    if (validation.success === false) {
      throw CopilotErrors.invalidCapabilityPayload(validation.error.message);
    }

    const payloadOrganizationId = graph.action.proposedPayload.organizationId;
    if (payloadOrganizationId !== organizationId) {
      await this.auditOrganizationRejection(actor.id, graph.action, organizationId, 'payload_organization_mismatch');
      throw CopilotErrors.organizationAccessDenied(organizationId, 'payload_organization_mismatch');
    }

    const auth = await canCreateStrategicFront(actor, organizationId, this.repository);
    if (!auth.allowed) {
      await this.repository.writeAudit({
        userId: actor.id,
        action: 'copilot.permission_denied.approval',
        resource: 'ProposedAction',
        resourceId: graph.action.id,
        details: {
          event: 'PermissionDeniedAtApproval',
          organizationId,
          capabilityId: graph.action.capabilityId,
          reason: auth.reason,
        },
      });
      throw CopilotErrors.permissionDenied(auth.permission);
    }
  }

  private async loadActionGraph(actionId: string): Promise<LoadedActionGraph> {
    const action = await this.repository.findProposedActionById(actionId);
    if (!action) {
      throw CopilotErrors.proposedActionNotFound(actionId);
    }

    const plan = await this.repository.findActionPlanById(action.actionPlanId);
    if (!plan) {
      throw CopilotErrors.actionPlanNotFound(action.actionPlanId);
    }

    const conversation = await this.repository.findConversationById(plan.conversationId);
    if (!conversation) {
      throw CopilotErrors.conversationNotFound(plan.conversationId);
    }

    return { action, plan, conversation, actions: plan.proposedActions ?? [action] };
  }

  private async recalculatePlanStatus(
    planId: string,
    previousActions: ProposedAction[],
    updatedAction: ProposedAction,
    additionalUpdatedActions: ProposedAction[] = [],
  ): Promise<void> {
    const replacements = new Map<string, ProposedAction>([
      [updatedAction.id, updatedAction],
      ...additionalUpdatedActions.map((action): [string, ProposedAction] => [action.id, action]),
    ]);
    const nextActions = previousActions.map((action) => replacements.get(action.id) ?? action);
    const nextStatus = deriveActionPlanStatus(nextActions);
    await this.repository.updateActionPlanStatus(planId, nextStatus);
  }

  private async auditOrganizationRejection(
    userId: string,
    action: ProposedAction,
    organizationId: string,
    reason: string,
  ): Promise<void> {
    await this.repository.writeAudit({
      userId,
      action: 'copilot.organization_access.denied',
      resource: 'ProposedAction',
      resourceId: action.id,
      details: {
        organizationId,
        capabilityId: action.capabilityId,
        reason,
      },
    });
  }
}

