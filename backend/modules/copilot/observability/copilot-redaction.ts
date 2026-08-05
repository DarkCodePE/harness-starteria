const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'password',
  'token',
  'secret',
  'content',
  'message',
  'proposedPayload',
  'commandPayload',
  'sponsor',
]);

export function redactCopilotValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactCopilotValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key) || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    redacted[key] = redactCopilotValue(item);
  }
  return redacted;
}

export function fingerprintIdempotencyKey(idempotencyKey: string): string {
  if (idempotencyKey.length <= 12) return idempotencyKey;
  return `${idempotencyKey.slice(0, 6)}...${idempotencyKey.slice(-6)}`;
}
