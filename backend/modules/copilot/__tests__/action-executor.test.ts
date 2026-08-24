import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/AppError';
import { ActionExecutor } from '../application/action-executor';
import { createDefaultCapabilityRegistry } from '../application/capability-registry';
import { CopilotErrors } from '../domain/copilot.errors';
import type { CreateStrategicFrontCommandHandler } from '../commands/create-strategic-front.command';
import {
  makeAction,
  makeConversation,
  makeExecution,
  makePlan,
  makeRepository,
  makeResult,
  validCreateFrontPayload,
} from './test-utils';

function makeHandler(result = makeResult()): CreateStrategicFrontCommandHandler {
  return {
    execute: vi.fn(async () => result),
  } as unknown as CreateStrategicFrontCommandHandler;
}

function approvedAction(overrides = {}) {
  return makeAction({
    status: 'approved',
    approvedAt: new Date('2026-07-26T12:00:00Z'),
    approvedBy: 'approver1',
    ...overrides,
  });
}

describe('ActionExecutor', () => {
  it('ejecuta accion aprobada, llama Portfolio una vez y completa ledger/action/plan', async () => {
    const action = approvedAction();
    const repo = makeRepository({
      findProposedActionById: vi.fn(async () => action),
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [action] })),
    });
    const handler = makeHandler();
    const executor = new ActionExecutor(repo, createDefaultCapabilityRegistry(), handler);

    const execution = await executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(handler.execute).toHaveBeenCalledTimes(1);
    expect(handler.execute).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org1',
      name: 'Eficiencia operativa',
      createdBy: 'user1',
    }));
    expect(execution.status).toBe('completed');
    expect(execution.createdObjectReferences).toEqual([
      { type: 'StrategicFront', id: 'front1', label: 'Eficiencia operativa' },
    ]);
    expect(repo.updateProposedActionStatus).toHaveBeenCalledWith('action1', 'completed');
    expect(repo.updateActionPlanStatus).toHaveBeenCalledWith('plan1', 'completed');
    expect(repo.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'copilot.execution.completed',
    }));
  });

  it('rechaza accion no aprobada', async () => {
    const executor = new ActionExecutor(makeRepository(), createDefaultCapabilityRegistry(), makeHandler());

    await expect(executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'ACTION_NOT_APPROVED' });
  });

  it('valida version antes de ejecutar', async () => {
    const action = approvedAction();
    const executor = new ActionExecutor(makeRepository({
      findProposedActionById: vi.fn(async () => action),
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [action] })),
    }), createDefaultCapabilityRegistry(), makeHandler());

    await expect(executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 2,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'STALE_ACTION_VERSION' });
  });

  it('valida permisos al ejecutar', async () => {
    const action = approvedAction();
    const executor = new ActionExecutor(makeRepository({
      findProposedActionById: vi.fn(async () => action),
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [action] })),
    }), createDefaultCapabilityRegistry(), makeHandler());

    await expect(executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'viewer1', role: 'viewer', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });

  it('impide ejecucion con organizacion cruzada y no llama Portfolio', async () => {
    const action = approvedAction();
    const handler = makeHandler();
    const executor = new ActionExecutor(makeRepository({
      findConversationById: vi.fn(async () => makeConversation({ organizationId: 'org2' })),
      findProposedActionById: vi.fn(async () => action),
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [action] })),
    }), createDefaultCapabilityRegistry(), handler);

    await expect(executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'ORGANIZATION_ACCESS_DENIED' });
    expect(handler.execute).not.toHaveBeenCalled();
  });

  it('misma key completada devuelve replay sin reejecutar Portfolio', async () => {
    const existing = makeExecution({ status: 'completed', result: makeResult() });
    const handler = makeHandler();
    const executor = new ActionExecutor(makeRepository({
      findExecutionByIdempotencyKey: vi.fn(async () => existing),
    }), createDefaultCapabilityRegistry(), handler);

    const replay = await executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(replay.status).toBe('idempotent_replay');
    expect(handler.execute).not.toHaveBeenCalled();
  });

  it('misma key en otra accion genera conflicto', async () => {
    const executor = new ActionExecutor(makeRepository({
      findExecutionByIdempotencyKey: vi.fn(async () => makeExecution({ proposedActionId: 'other-action' })),
    }), createDefaultCapabilityRegistry(), makeHandler());

    await expect(executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('ejecucion en curso no duplica Portfolio', async () => {
    const handler = makeHandler();
    const executor = new ActionExecutor(makeRepository({
      findExecutionByIdempotencyKey: vi.fn(async () => makeExecution({ status: 'executing' })),
    }), createDefaultCapabilityRegistry(), handler);

    const execution = await executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(execution.status).toBe('executing');
    expect(handler.execute).not.toHaveBeenCalled();
  });

  it('fallo previo no reintenta automaticamente con la misma key', async () => {
    const handler = makeHandler();
    const executor = new ActionExecutor(makeRepository({
      findExecutionByIdempotencyKey: vi.fn(async () => makeExecution({
        status: 'failed',
        error: { code: 'COMMAND_EXECUTION_FAILED', message: 'fallo', retryable: true },
      })),
    }), createDefaultCapabilityRegistry(), handler);

    const execution = await executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(execution.status).toBe('failed');
    expect(handler.execute).not.toHaveBeenCalled();
  });

  it('doble llamada con ledger pendiente recupera ejecucion existente sin ejecutar de nuevo', async () => {
    const handler = makeHandler();
    const repo = makeRepository({
      findExecutionByIdempotencyKey: vi.fn(async () => makeExecution({ status: 'pending' })),
    });
    const executor = new ActionExecutor(repo, createDefaultCapabilityRegistry(), handler);

    const execution = await executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(execution.status).toBe('pending');
    expect(handler.execute).not.toHaveBeenCalled();
    expect(repo.createPendingActionExecution).not.toHaveBeenCalled();
  });

  it('serializa llamadas concurrentes con la misma key y despacha Portfolio una sola vez', async () => {
    const action = approvedAction();
    const executionsById = new Map<string, ReturnType<typeof makeExecution>>();
    const executionsByKey = new Map<string, ReturnType<typeof makeExecution>>();
    let executionSeq = 0;
    const repo = makeRepository({
      findProposedActionById: vi.fn(async () => action),
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [action] })),
      findExecutionByIdempotencyKey: vi.fn(async (idempotencyKey) => executionsByKey.get(idempotencyKey) ?? null),
      createPendingActionExecution: vi.fn(async (input) => {
        if (executionsByKey.has(input.idempotencyKey)) {
          throw AppError.conflict('Idempotency key already exists.', 'IDEMPOTENCY_CONFLICT');
        }
        const execution = makeExecution({
          id: `exec${++executionSeq}`,
          proposedActionId: input.proposedActionId,
          idempotencyKey: input.idempotencyKey,
          status: 'pending',
          commandPayload: input.commandPayload,
        });
        executionsById.set(execution.id, execution);
        executionsByKey.set(execution.idempotencyKey, execution);
        return execution;
      }),
      updateActionExecutionStatus: vi.fn(async (id, input) => {
        const current = executionsById.get(id)!;
        const updated = makeExecution({ ...current, status: input.status, startedAt: input.startedAt ?? current.startedAt });
        executionsById.set(id, updated);
        executionsByKey.set(updated.idempotencyKey, updated);
        return updated;
      }),
      completeActionExecution: vi.fn(async (id, input) => {
        const current = executionsById.get(id)!;
        const completed = makeExecution({
          ...current,
          status: 'completed',
          result: input.result,
          createdObjectReferences: input.createdObjectReferences,
          updatedObjectReferences: input.updatedObjectReferences,
          projectionLinks: input.projectionLinks,
          completedAt: input.completedAt ?? new Date(),
        });
        executionsById.set(id, completed);
        executionsByKey.set(completed.idempotencyKey, completed);
        return completed;
      }),
    });
    const handler = makeHandler();
    const executor = new ActionExecutor(repo, createDefaultCapabilityRegistry(), handler);
    const input = {
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem-concurrent',
      executedBy: { id: 'mentor1', role: 'mentor' as const, organizationId: 'org1' },
      organizationId: 'org1',
    };

    const [first, second] = await Promise.all([
      executor.executeApprovedAction(input),
      executor.executeApprovedAction(input),
    ]);

    expect(first.status).toBe('completed');
    expect(second.status).toBe('idempotent_replay');
    expect(handler.execute).toHaveBeenCalledTimes(1);
    expect(repo.createPendingActionExecution).toHaveBeenCalledTimes(1);
  });

  it('registra fallo del servicio Portfolio y marca ejecucion/action/plan como failed', async () => {
    const action = approvedAction({ proposedPayload: validCreateFrontPayload() });
    const handler = {
      execute: vi.fn(async () => {
        throw AppError.badRequest('Portfolio rechazo los datos.', 'DOMAIN_VALIDATION_FAILED');
      }),
    } as unknown as CreateStrategicFrontCommandHandler;
    const repo = makeRepository({
      findProposedActionById: vi.fn(async () => action),
      findActionPlanById: vi.fn(async () => makePlan({ proposedActions: [action] })),
    });
    const executor = new ActionExecutor(repo, createDefaultCapabilityRegistry(), handler);

    const execution = await executor.executeApprovedAction({
      actionId: 'action1',
      expectedVersion: 1,
      idempotencyKey: 'idem1',
      executedBy: { id: 'mentor1', role: 'mentor', organizationId: 'org1' },
      organizationId: 'org1',
    });

    expect(execution.status).toBe('failed');
    expect(execution.error?.code).toBe('DOMAIN_VALIDATION_FAILED');
    expect(repo.updateProposedActionStatus).toHaveBeenCalledWith('action1', 'failed');
    expect(repo.updateActionPlanStatus).toHaveBeenCalledWith('plan1', 'failed');
  });
});
