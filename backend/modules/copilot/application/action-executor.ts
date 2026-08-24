import { AppError } from '../../../shared/errors/AppError';
import { CopilotErrors } from '../domain/copilot.errors';
import type {
  ActionExecution,
  ActionPlan,
  CommandExecutionError,
  CommandExecutionResult,
  CopilotActor,
  CopilotConversation,
  ProposedAction,
} from '../domain/copilot.types';
import { executeApprovedActionSchema } from '../schemas/copilot.schemas';
import type { CapabilityRegistry } from './capability-registry';
import { CREATE_STRATEGIC_FRONT_COMMAND_TYPE } from './capability-registry';
import { canCreateStrategicFront } from './strategic-front.authorization';
import { deriveActionPlanStatus } from './action-plan-status';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type {
  CreateStrategicFrontCommand,
  CreateStrategicFrontCommandHandler,
} from '../commands/create-strategic-front.command';
import { fingerprintIdempotencyKey } from '../observability/copilot-redaction';

export type ExecuteApprovedActionInput = {
  actionId: string;
  expectedVersion: number;
  idempotencyKey: string;
  executedBy: CopilotActor;
  organizationId: string;
  correlationId?: string;
};

type LoadedExecutionGraph = {
  action: ProposedAction;
  plan: ActionPlan;
  conversation: CopilotConversation;
  actions: ProposedAction[];
};

export class ActionExecutor {
  private static readonly inProcessIdempotencyLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly repository: CopilotRepository,
    private readonly capabilityRegistry: CapabilityRegistry,
    private readonly createStrategicFrontHandler: CreateStrategicFrontCommandHandler,
  ) {}

  async executeApprovedAction(input: ExecuteApprovedActionInput): Promise<ActionExecution> {
    const parsed = executeApprovedActionSchema.parse({
      actionId: input.actionId,
      expectedVersion: input.expectedVersion,
      idempotencyKey: input.idempotencyKey,
      executedBy: input.executedBy.id,
      organizationId: input.organizationId,
    }) as {
      actionId: string;
      expectedVersion: number;
      idempotencyKey: string;
      executedBy: string;
      organizationId: string;
    };

    return ActionExecutor.runWithInProcessIdempotencyLock(parsed.idempotencyKey, async () =>
      this.executeApprovedActionLocked(input, parsed),
    );
  }

  private static async runWithInProcessIdempotencyLock<T>(idempotencyKey: string, fn: () => Promise<T>): Promise<T> {
    const previous = ActionExecutor.inProcessIdempotencyLocks.get(idempotencyKey) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(fn);
    const tail = run.then(() => undefined, () => undefined);
    ActionExecutor.inProcessIdempotencyLocks.set(idempotencyKey, tail);
    try {
      return await run;
    } finally {
      if (ActionExecutor.inProcessIdempotencyLocks.get(idempotencyKey) === tail) {
        ActionExecutor.inProcessIdempotencyLocks.delete(idempotencyKey);
      }
    }
  }

  private async executeApprovedActionLocked(
    input: ExecuteApprovedActionInput,
    parsed: {
      actionId: string;
      expectedVersion: number;
      idempotencyKey: string;
      executedBy: string;
      organizationId: string;
    },
  ): Promise<ActionExecution> {
    const existingExecution = await this.repository.findExecutionByIdempotencyKey(parsed.idempotencyKey);
    if (existingExecution) {
      return this.handleExistingExecution(existingExecution, parsed.actionId, input.executedBy.id, parsed.organizationId);
    }

    const graph = await this.loadExecutionGraph(parsed.actionId);
    await this.validateExecutableAction({
      graph,
      actor: input.executedBy,
      organizationId: parsed.organizationId,
      expectedVersion: parsed.expectedVersion,
    });

    const commandPayload = graph.action.proposedPayload;
    const execution = await this.createExecutionLedger({
      action: graph.action,
      idempotencyKey: parsed.idempotencyKey,
      executedBy: parsed.executedBy,
      commandPayload,
      organizationId: parsed.organizationId,
      correlationId: input.correlationId,
    });

    if (execution.status !== 'pending') {
      return execution;
    }

    return this.runCreatedExecution(execution, graph, commandPayload as CreateStrategicFrontCommand, parsed.organizationId);
  }

  private async handleExistingExecution(
    execution: ActionExecution,
    actionId: string,
    userId: string,
    organizationId: string,
  ): Promise<ActionExecution> {
    if (execution.proposedActionId !== actionId) {
      await this.repository.writeAudit({
        userId,
        action: 'copilot.execution.idempotency_conflict',
        resource: 'ActionExecution',
        resourceId: execution.id,
        details: {
          event: 'IdempotencyConflictDetected',
          organizationId,
          existingActionId: execution.proposedActionId,
          requestedActionId: actionId,
          idempotencyKeyFingerprint: fingerprintIdempotencyKey(execution.idempotencyKey),
        },
      });
      throw CopilotErrors.idempotencyConflict(execution.idempotencyKey);
    }

    await this.repository.writeAudit({
      userId,
      action: 'copilot.execution.idempotent_replay',
      resource: 'ActionExecution',
      resourceId: execution.id,
      details: {
        event: 'IdempotentReplayDetected',
        organizationId,
        proposedActionId: execution.proposedActionId,
        idempotencyKeyFingerprint: fingerprintIdempotencyKey(execution.idempotencyKey),
        status: execution.status,
      },
    });

    if (execution.status === 'completed') {
      return { ...execution, status: 'idempotent_replay' };
    }
    return execution;
  }

  private async createExecutionLedger(input: {
    action: ProposedAction;
    idempotencyKey: string;
    executedBy: string;
    commandPayload: Record<string, unknown>;
    organizationId: string;
    correlationId?: string;
  }): Promise<ActionExecution> {
    try {
      const execution = await this.repository.createPendingActionExecution({
        proposedActionId: input.action.id,
        idempotencyKey: input.idempotencyKey,
        approvedBy: input.action.approvedBy ?? input.executedBy,
        executedBy: input.executedBy,
        correlationId: input.correlationId,
        commandPayload: input.commandPayload,
        createdObjectReferences: [],
        updatedObjectReferences: [],
        projectionLinks: [],
      });

      await this.repository.writeAudit({
        userId: input.executedBy,
        action: 'copilot.execution.created',
        resource: 'ActionExecution',
        resourceId: execution.id,
        details: {
          event: 'ActionExecutionCreated',
          organizationId: input.organizationId,
          proposedActionId: input.action.id,
          idempotencyKeyFingerprint: fingerprintIdempotencyKey(input.idempotencyKey),
          capabilityId: input.action.capabilityId,
          commandType: input.action.commandType,
        },
      });
      return execution;
    } catch (err) {
      if (err instanceof AppError && err.code === 'IDEMPOTENCY_CONFLICT') {
        const existing = await this.repository.findExecutionByIdempotencyKey(input.idempotencyKey);
        if (!existing) {
          throw err;
        }
        return this.handleExistingExecution(existing, input.action.id, input.executedBy, input.organizationId);
      }
      throw err;
    }
  }

  private async runCreatedExecution(
    execution: ActionExecution,
    graph: LoadedExecutionGraph,
    commandPayload: CreateStrategicFrontCommand,
    organizationId: string,
  ): Promise<ActionExecution> {
    let currentExecution = execution;
    try {
      currentExecution = await this.repository.updateActionExecutionStatus(execution.id, {
        status: 'validating',
        startedAt: new Date(),
      });
      await this.repository.updateActionPlanStatus(graph.plan.id, 'executing');
      await this.repository.updateProposedActionStatus(graph.action.id, 'executing');
      currentExecution = await this.repository.updateActionExecutionStatus(execution.id, {
        status: 'executing',
      });

      await this.repository.writeAudit({
        userId: currentExecution.executedBy,
        action: 'copilot.execution.started',
        resource: 'ActionExecution',
        resourceId: currentExecution.id,
        details: {
          event: 'ActionExecutionStarted',
          organizationId,
          proposedActionId: graph.action.id,
          capabilityId: graph.action.capabilityId,
          commandType: graph.action.commandType,
        },
      });
      await this.repository.writeAudit({
        userId: currentExecution.executedBy,
        action: 'copilot.command.dispatched',
        resource: 'ProposedAction',
        resourceId: graph.action.id,
        details: {
          event: 'StrategicFrontCommandDispatched',
          organizationId,
          commandType: graph.action.commandType,
          capabilityId: graph.action.capabilityId,
        },
      });

      const result = await this.dispatchCommand(graph.action, commandPayload);
      const completed = await this.repository.completeActionExecution(currentExecution.id, {
        result,
        createdObjectReferences: result.createdObjects,
        updatedObjectReferences: result.updatedObjects,
        projectionLinks: result.projectionLinks,
      });

      await this.repository.writeAudit({
        userId: completed.executedBy,
        action: 'portfolio.strategic_front.created',
        resource: 'StrategicFront',
        resourceId: result.createdObjects[0]?.id ?? null,
        details: {
          event: 'StrategicFrontCreated',
          organizationId,
          actionExecutionId: completed.id,
          proposedActionId: graph.action.id,
          commandType: graph.action.commandType,
        },
      });

      const completedAction = await this.repository.updateProposedActionStatus(graph.action.id, 'completed');
      await this.recalculatePlanStatus(graph.plan.id, graph.actions, completedAction);
      await this.repository.writeAudit({
        userId: completed.executedBy,
        action: 'copilot.execution.completed',
        resource: 'ActionExecution',
        resourceId: completed.id,
        details: {
          event: 'ActionExecutionCompleted',
          organizationId,
          proposedActionId: graph.action.id,
          createdObjects: result.createdObjects,
          projectionLinks: result.projectionLinks,
        },
      });

      return completed;
    } catch (err) {
      const normalized = normalizeExecutionError(err);
      const failedResult: CommandExecutionResult = {
        success: false,
        commandType: graph.action.commandType,
        createdObjects: [],
        updatedObjects: [],
        warnings: [],
        projectionLinks: [],
        error: normalized,
      };

      let failedExecution: ActionExecution | null = null;
      try {
        failedExecution = await this.repository.failActionExecution(currentExecution.id, {
          error: normalized,
          result: failedResult,
        });
        const failedAction = await this.repository.updateProposedActionStatus(graph.action.id, 'failed');
        await this.recalculatePlanStatus(graph.plan.id, graph.actions, failedAction);
        await this.repository.writeAudit({
          userId: currentExecution.executedBy,
          action: 'copilot.execution.failed',
          resource: 'ActionExecution',
          resourceId: currentExecution.id,
          details: {
            event: 'ActionExecutionFailed',
            organizationId,
            proposedActionId: graph.action.id,
            error: normalized,
          },
        });
      } catch {
        throw CopilotErrors.partialExecution('El comando pudo tener efectos, pero fallo la actualizacion del ledger Copilot.');
      }

      return failedExecution;
    }
  }

  private async dispatchCommand(
    action: ProposedAction,
    commandPayload: CreateStrategicFrontCommand,
  ): Promise<CommandExecutionResult> {
    if (action.commandType !== CREATE_STRATEGIC_FRONT_COMMAND_TYPE) {
      throw CopilotErrors.capabilityNotFound(action.capabilityId);
    }
    return this.createStrategicFrontHandler.execute(commandPayload);
  }

  private async validateExecutableAction(input: {
    graph: LoadedExecutionGraph;
    actor: CopilotActor;
    organizationId: string;
    expectedVersion: number;
  }): Promise<void> {
    const { graph, actor, organizationId, expectedVersion } = input;
    if (graph.conversation.organizationId !== organizationId) {
      await this.auditExecutionPermissionDenied(actor.id, graph.action, organizationId, 'conversation_organization_mismatch');
      throw CopilotErrors.organizationAccessDenied(organizationId, 'conversation_organization_mismatch');
    }
    if (graph.action.proposedPayload.organizationId !== organizationId) {
      await this.auditExecutionPermissionDenied(actor.id, graph.action, organizationId, 'payload_organization_mismatch');
      throw CopilotErrors.organizationAccessDenied(organizationId, 'payload_organization_mismatch');
    }
    if (graph.action.version !== expectedVersion) {
      throw CopilotErrors.staleActionVersion(expectedVersion, graph.action.version);
    }
    if (graph.action.status === 'completed') {
      throw CopilotErrors.actionAlreadyCompleted(graph.action.id);
    }
    if (graph.action.status !== 'approved' || !graph.action.approvedBy || !graph.action.approvedAt) {
      throw CopilotErrors.actionNotApproved(graph.action.id);
    }

    const capability = this.capabilityRegistry.getById(graph.action.capabilityId);
    if (capability.commandType !== graph.action.commandType || capability.ownerPrd !== graph.action.ownerPrd) {
      throw CopilotErrors.capabilityNotFound(graph.action.capabilityId);
    }
    const validation = this.capabilityRegistry.validatePayload(graph.action.capabilityId, graph.action.proposedPayload);
    if (validation.success === false) {
      throw CopilotErrors.invalidCapabilityPayload(validation.error.message);
    }

    const auth = await canCreateStrategicFront(actor, organizationId, this.repository);
    if (!auth.allowed) {
      await this.auditExecutionPermissionDenied(actor.id, graph.action, organizationId, auth.reason);
      throw CopilotErrors.permissionDenied(auth.permission);
    }
  }

  private async loadExecutionGraph(actionId: string): Promise<LoadedExecutionGraph> {
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
  ): Promise<void> {
    const nextActions = previousActions.map((action) => action.id === updatedAction.id ? updatedAction : action);
    await this.repository.updateActionPlanStatus(planId, deriveActionPlanStatus(nextActions));
  }

  private async auditExecutionPermissionDenied(
    userId: string,
    action: ProposedAction,
    organizationId: string,
    reason: string,
  ): Promise<void> {
    await this.repository.writeAudit({
      userId,
      action: 'copilot.permission_denied.execution',
      resource: 'ProposedAction',
      resourceId: action.id,
      details: {
        event: 'PermissionDeniedAtExecution',
        organizationId,
        capabilityId: action.capabilityId,
        commandType: action.commandType,
        reason,
      },
    });
  }
}

function normalizeExecutionError(err: unknown): CommandExecutionError {
  if (err instanceof AppError) {
    return {
      code: err.code ?? 'COMMAND_EXECUTION_FAILED',
      message: err.message,
      retryable: err.statusCode >= 500,
    };
  }
  return {
    code: 'COMMAND_EXECUTION_FAILED',
    message: 'No se pudo ejecutar el comando de dominio.',
    retryable: true,
  };
}
