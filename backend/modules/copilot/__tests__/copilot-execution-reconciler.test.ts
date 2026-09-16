import { describe, expect, it, vi } from 'vitest';
import { CopilotExecutionReconciler } from '../application/copilot-execution-reconciler';
import { TestCopilotMetrics } from '../observability/copilot-metrics';
import { makeExecution, makeRepository, makeResult, testNow } from './test-utils';

describe('CopilotExecutionReconciler', () => {
  it('marca revision manual para ejecucion stale ambigua sin reejecutar Portfolio', async () => {
    const stale = makeExecution({
      id: 'exec-stale',
      status: 'executing',
      updatedAt: new Date('2026-07-26T11:00:00Z'),
    });
    const repo = makeRepository({
      listStaleNonTerminalExecutions: vi.fn(async () => [stale]),
      claimStaleActionExecution: vi.fn(async () => stale),
    });
    const metrics = new TestCopilotMetrics();
    const reconciler = new CopilotExecutionReconciler(repo, {
      staleAfterSeconds: 60,
      now: () => testNow,
      metrics,
    });

    const result = await reconciler.reconcileStaleExecutions();

    expect(result).toMatchObject({ scanned: 1, manualReviewRequired: 1, reconciledCompleted: 0 });
    expect(repo.markActionExecutionManualReview).toHaveBeenCalledWith('exec-stale', expect.objectContaining({
      error: expect.objectContaining({ code: 'MANUAL_REVIEW_REQUIRED', retryable: false }),
    }));
    expect(metrics.events.some((event) => event.name === 'copilot.reconciliation.manual_review_required')).toBe(true);
  });

  it('normaliza completed cuando el resultado ya estaba persistido', async () => {
    const resultPayload = makeResult();
    const stale = makeExecution({
      id: 'exec-completed-stale',
      status: 'executing',
      result: resultPayload,
      createdObjectReferences: resultPayload.createdObjects,
      projectionLinks: resultPayload.projectionLinks,
      updatedAt: new Date('2026-07-26T11:00:00Z'),
    });
    const repo = makeRepository({
      listStaleNonTerminalExecutions: vi.fn(async () => [stale]),
      claimStaleActionExecution: vi.fn(async () => stale),
    });
    const reconciler = new CopilotExecutionReconciler(repo, {
      staleAfterSeconds: 60,
      now: () => testNow,
    });

    const result = await reconciler.reconcileStaleExecutions();

    expect(result).toMatchObject({ scanned: 1, reconciledCompleted: 1, manualReviewRequired: 0 });
    expect(repo.completeActionExecution).toHaveBeenCalledWith('exec-completed-stale', expect.objectContaining({
      result: resultPayload,
    }));
    expect(repo.markActionExecutionManualReview).not.toHaveBeenCalled();
  });

  it('omite ejecuciones que otra instancia ya reclamo', async () => {
    const stale = makeExecution({ id: 'exec-race', status: 'pending' });
    const repo = makeRepository({
      listStaleNonTerminalExecutions: vi.fn(async () => [stale]),
      claimStaleActionExecution: vi.fn(async () => null),
    });
    const reconciler = new CopilotExecutionReconciler(repo, {
      staleAfterSeconds: 60,
      now: () => testNow,
    });

    const result = await reconciler.reconcileStaleExecutions();

    expect(result.skipped).toBe(1);
    expect(repo.markActionExecutionManualReview).not.toHaveBeenCalled();
  });
});
