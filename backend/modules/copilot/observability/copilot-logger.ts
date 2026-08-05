import { logger } from '../../../shared/utils/logger';
import { redactCopilotValue } from './copilot-redaction';

export type CopilotLogLevel = 'info' | 'warn' | 'error';

export type CopilotLogEvent = {
  eventName: string;
  requestId?: string;
  correlationId?: string;
  conversationId?: string;
  actionPlanId?: string;
  proposedActionId?: string;
  actionExecutionId?: string;
  capabilityId?: string;
  commandType?: string;
  organizationId?: string;
  userId?: string;
  idempotencyKey?: string;
  durationMs?: number;
  resultStatus?: string;
  errorCode?: string;
  details?: Record<string, unknown>;
};

export function logCopilotEvent(level: CopilotLogLevel, event: CopilotLogEvent): void {
  logger[level](redactCopilotValue(event), event.eventName);
}
