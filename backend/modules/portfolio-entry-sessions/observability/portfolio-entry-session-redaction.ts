import type { PortfolioEntrySession } from '../domain/portfolio-entry-session.types';
import type { PortfolioEntryModelExecutionRecord } from './portfolio-entry-execution-metadata';

const REDACTED = '[REDACTED]';

export function redactPortfolioEntrySessionForLog(session: PortfolioEntrySession): Record<string, unknown> {
  return {
    id: session.id,
    ownerUserId: session.ownerUserId ?? null,
    ownershipState: session.ownershipState,
    entryOrigin: session.entryOrigin,
    lifecycleStatus: session.lifecycleStatus,
    executionStatus: session.executionStatus,
    interactionMode: session.interactionMode,
    hasRawEntry: session.rawEntry.length > 0,
    publicAccessTokenHash: session.publicAccessTokenHash ? REDACTED : null,
    sourceMetadata: redactMetadata(session.sourceMetadata),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    lastActivityAt: session.lastActivityAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    expiredAt: session.expiredAt?.toISOString() ?? null,
  };
}

export function redactPortfolioEntryExecutionForLog(
  execution: PortfolioEntryModelExecutionRecord,
): Record<string, unknown> {
  return {
    id: execution.id,
    sessionId: execution.sessionId,
    turnId: execution.turnId ?? null,
    handoffId: execution.handoffId ?? null,
    purpose: execution.purpose,
    provider: execution.provider,
    requestedModel: execution.requestedModel,
    providerReportedModel: execution.providerReportedModel ?? null,
    callId: execution.callId,
    durationMs: execution.durationMs,
    retryCount: execution.retryCount,
    schemaErrorCount: execution.schemaErrors.length,
    parsedOutputPresent: execution.parsedOutputPresent,
    validatedOutputPresent: execution.validatedOutputPresent,
    technicalError: execution.technicalError ? REDACTED : null,
    createdAt: execution.createdAt.toISOString(),
  };
}

export function redactArbitraryPortfolioEntryPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactArbitraryPortfolioEntryPayload);
  if (!value || typeof value !== 'object') return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      redacted[key] = REDACTED;
      continue;
    }
    redacted[key] = redactArbitraryPortfolioEntryPayload(child);
  }
  return redacted;
}

function redactMetadata(metadata: PortfolioEntrySession['sourceMetadata']): Record<string, unknown> | null {
  if (!metadata) return null;
  return redactArbitraryPortfolioEntryPayload(metadata) as Record<string, unknown>;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized.includes('rawentry')
    || normalized.includes('raw_entry')
    || normalized.includes('message')
    || normalized.includes('token')
    || normalized.includes('secret')
    || normalized.includes('apikey')
    || normalized.includes('api_key')
    || normalized.includes('providerraw')
    || normalized.includes('provider_raw')
    || normalized.includes('email')
    || normalized.includes('phone')
    || normalized.includes('useragent')
    || normalized.includes('ipaddress');
}
