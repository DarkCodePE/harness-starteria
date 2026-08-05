import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../shared/db/prisma';
import type { ApiResponse } from '../../shared/types/api.types';
import { createDefaultCapabilityRegistry, CREATE_STRATEGIC_FRONT_CAPABILITY_ID } from './application/capability-registry';
import { getCopilotRuntimeConfig } from './application/copilot-runtime-config';

export type CopilotReadinessData = {
  status: 'ready' | 'not_ready';
  checks: Record<string, 'ok' | 'failed' | 'disabled'>;
  requestId?: string;
  correlationId?: string;
};

export async function copilotReadinessHandler(
  req: Request,
  res: Response<ApiResponse<CopilotReadinessData>>,
): Promise<void> {
  const checks: CopilotReadinessData['checks'] = {
    database: 'failed',
    capabilityRegistry: 'failed',
    assessmentAdapter: 'failed',
    featureFlags: 'failed',
    reconciliation: 'failed',
  };

  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    checks.database = 'ok';
  } catch {
    checks.database = 'failed';
  }

  try {
    createDefaultCapabilityRegistry().assertExists(CREATE_STRATEGIC_FRONT_CAPABILITY_ID);
    checks.capabilityRegistry = 'ok';
  } catch {
    checks.capabilityRegistry = 'failed';
  }

  const runtimeConfig = getCopilotRuntimeConfig();
  checks.featureFlags = runtimeConfig.enabled ? 'ok' : 'disabled';
  checks.assessmentAdapter = runtimeConfig.assessmentAdapter === 'deterministic' || process.env.NODE_ENV !== 'production'
    ? 'ok'
    : 'disabled';
  checks.reconciliation = runtimeConfig.reconciliationEnabled ? 'ok' : 'disabled';

  const ready = checks.database === 'ok' &&
    checks.capabilityRegistry === 'ok' &&
    checks.assessmentAdapter === 'ok' &&
    (checks.featureFlags === 'ok' || checks.featureFlags === 'disabled') &&
    (checks.reconciliation === 'ok' || checks.reconciliation === 'disabled');

  res.status(ready ? 200 : 503).json({
    success: true,
    data: {
      status: ready ? 'ready' : 'not_ready',
      checks,
      requestId: req.requestId,
      correlationId: req.correlationId,
    },
  });
}
