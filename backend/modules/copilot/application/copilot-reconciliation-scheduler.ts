import type { PrismaClient } from '@prisma/client';
import { logger } from '../../../shared/utils/logger';
import { getCopilotRuntimeConfig } from './copilot-runtime-config';
import { CopilotExecutionReconciler } from './copilot-execution-reconciler';
import { PrismaCopilotRepository } from '../infrastructure/prisma-copilot.repository';

export type CopilotReconciliationScheduler = {
  stop(): void;
};

export function startCopilotReconciliationScheduler(prisma: PrismaClient): CopilotReconciliationScheduler {
  const config = getCopilotRuntimeConfig();
  if (!config.reconciliationEnabled) {
    return { stop: () => undefined };
  }

  const reconciler = new CopilotExecutionReconciler(new PrismaCopilotRepository(prisma), {
    staleAfterSeconds: config.executionStaleAfterSeconds,
  });
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await reconciler.reconcileStaleExecutions();
      if (result.scanned > 0) {
        logger.warn({ result }, 'copilot.execution.reconciliation_tick');
      }
    } catch (err) {
      logger.error({ err }, 'copilot.execution.reconciliation_failed');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(run, config.reconciliationIntervalSeconds * 1000);
  timer.unref();

  return {
    stop: () => clearInterval(timer),
  };
}
