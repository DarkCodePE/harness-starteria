export function createIdempotencyKey(scope = 'portfolio-entry'): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  const uuid = cryptoApi?.randomUUID?.();
  if (uuid) return `${scope}:${uuid}`;
  return `${scope}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
}
