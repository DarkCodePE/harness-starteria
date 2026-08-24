import { randomUUID } from 'crypto';
import type { ActionExecution, CommandExecutionError } from '../domain/copilot.types';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type { CopilotMetrics } from '../observability/copilot-metrics';
import { noopCopilotMetrics } from '../observability/copilot-metrics';
import { logCopilotEvent } from '../observability/copilot-logger';

export type CopilotExecutionReconcilerOptions = {
  staleAfterSeconds: number;
  batchSize?: number;
  now?: () => Date;
  metrics?: CopilotMetrics;
};

export type ReconciliationOutcome =
  | 'skipped_not_claimed'
  | 'reconciled_completed'
  | 'manual_review_required';

export type ReconciliationResult = {
  scanned: number;
  reconciledCompleted: number;
  manualReviewRequired: number;
  skipped: number;
};

const NON_TERMINAL_STATUSES = new Set<ActionExecution['status']>(['pending', 'validating', 'executing']);

export class CopilotExecutionReconciler {
  private readonly batchSize: number;
  private readonly now: () => Date;
  private readonly metrics: CopilotMetrics;

  constructor(
    private readonly repository: CopilotRepository,
    options: CopilotExecutionReconcilerOptions,
  ) {
    this.batchSize = options.batchSize ?? 50;
    this.now = options.now ?? (() => new Date());
    this.metrics = options.metrics ?? noopCopilotMetrics;
    if (options.staleAfterSeconds <= 0) {
      throw new Error('staleAfterSeconds must be positive');
    }
    this.staleAfterSeconds = options.staleAfterSeconds;
  }

  private readonly staleAfterSeconds: number;

  async reconcileStaleExecutions(): Promise<ReconciliationResult> {
    const staleBefore = new Date(this.now().getTime() - this.staleAfterSeconds * 1000);
    const candidates = await this.repository.listStaleNonTerminalExecutions(staleBefore, this.batchSize);
    const result: ReconciliationResult = {
      scanned: candidates.length,
      reconciledCompleted: 0,
      manualReviewRequired: 0,
      skipped: 0,
    };

    this.metrics.gauge('copilot.executions.stale', candidates.length);

    for (const candidate of candidates) {
      const outcome = await this.reconcileOne(candidate, staleBefore);
      if (outcome === 'reconciled_completed') result.reconciledCompleted += 1;
      if (outcome === 'manual_review_required') result.manualReviewRequired += 1;
      if (outcome === 'skipped_not_claimed') result.skipped += 1;
    }

    return result;
  }

  private async reconcileOne(execution: ActionExecution, staleBefore: Date): Promise<ReconciliationOutcome> {
    if (!NON_TERMINAL_STATUSES.has(execution.status)) {
      return 'skipped_not_claimed';
    }

    const claimId = `copilot-reconcile:${randomUUID()}`;
    const claimed = await this.repository.claimStaleActionExecution(execution.id, { claimId, staleBefore });
    if (!claimed) {
      return 'skipped_not_claimed';
    }

    this.metrics.increment('copilot.reconciliation.started');
    logCopilotEvent('warn', {
      eventName: 'copilot.execution.reconciliation_started',
      actionExecutionId: claimed.id,
      proposedActionId: claimed.proposedActionId,
      correlationId: claimed.correlationId ?? undefined,
      resultStatus: claimed.status,
    });

    if (claimed.result?.success === true && claimed.createdObjectReferences.length > 0) {
      await this.repository.completeActionExecution(claimed.id, {
        result: claimed.result,
        createdObjectReferences: claimed.createdObjectReferences,
        updatedObjectReferences: claimed.updatedObjectReferences,
        projectionLinks: claimed.projectionLinks,
        completedAt: this.now(),
      });
      this.metrics.increment('copilot.reconciliation.completed');
      logCopilotEvent('info', {
        eventName: 'copilot.execution.reconciled',
        actionExecutionId: claimed.id,
        proposedActionId: claimed.proposedActionId,
        correlationId: claimed.correlationId ?? undefined,
        resultStatus: 'completed',
      });
      return 'reconciled_completed';
    }

    const error: CommandExecutionError = {
      code: 'MANUAL_REVIEW_REQUIRED',
      message: 'Ejecucion no terminal detectada como stale; no se reejecuta automaticamente.',
      retryable: false,
    };
    await this.repository.markActionExecutionManualReview(claimed.id, {
      error,
      completedAt: this.now(),
    });
    await this.repository.writeAudit({
      userId: claimed.executedBy,
      action: 'copilot.execution.manual_review_required',
      resource: 'ActionExecution',
      resourceId: claimed.id,
      details: {
        event: 'ActionExecutionManualReviewRequired',
        proposedActionId: claimed.proposedActionId,
        correlationId: claimed.correlationId,
        claimId,
        previousStatus: claimed.status,
      },
    });
    this.metrics.increment('copilot.reconciliation.manual_review_required');
    logCopilotEvent('error', {
      eventName: 'copilot.execution.manual_review_required',
      actionExecutionId: claimed.id,
      proposedActionId: claimed.proposedActionId,
      correlationId: claimed.correlationId ?? undefined,
      resultStatus: 'manual_review_required',
      errorCode: error.code,
    });
    return 'manual_review_required';
  }
}
