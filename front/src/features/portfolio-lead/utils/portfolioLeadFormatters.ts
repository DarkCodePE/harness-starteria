export function estimateVisibleDays(lastActivity: string) {
  const normalized = lastActivity.toLowerCase();
  if (normalized.includes('hoy')) return 1;
  if (normalized.includes('ayer')) return 2;
  const daysMatch = normalized.match(/(\d+)/);
  if (daysMatch) return Number(daysMatch[1]);
  if (normalized.includes('semana')) return 7;
  return 5;
}

export function humanizeUnderscoreValue(value: string) {
  return value.replaceAll('_', ' ');
}

export function hasTechnicalBlocker(text: string) {
  return /tecnic|integraci|sistema/i.test(text);
}
