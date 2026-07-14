type EntryLike = {
  dimension: string;
  fieldKey: string;
  valueJson: unknown;
  sourceType: string;
  verificationStatus?: string | null;
  createdAt?: Date | string;
};

type SourceLike = {
  status: string;
  sourceType: string;
  processedAt?: Date | string | null;
};

export interface ContextScoreResult {
  score: number;
  level: 'INITIAL' | 'BASIC' | 'USEFUL' | 'SOLID';
  label: string;
  breakdown: {
    coverage: number;
    evidence: number;
    freshness: number;
  };
  missing: string[];
}

const coverageWeights: Record<string, number> = {
  IDENTITY: 10,
  CULTURE: 10,
  STRUCTURE: 15,
  POLICIES: 10,
  INNOVATION: 10,
  RESOURCES: 5,
};

const requiredLabels: Record<string, string> = {
  IDENTITY: 'identidad basica',
  CULTURE: 'cultura y apertura al cambio',
  STRUCTURE: 'estructura y toma de decisiones',
  POLICIES: 'politicas y validaciones internas',
  INNOVATION: 'madurez de innovacion y escalamiento',
  RESOURCES: 'recursos disponibles',
};

function hasConcreteValue(value: unknown): boolean {
  const raw = typeof value === 'object' && value && 'value' in value
    ? (value as { value?: unknown }).value
    : value;
  if (raw === null || raw === undefined) return false;
  if (Array.isArray(raw)) return raw.some((item) => String(item).trim() && String(item).toLowerCase() !== 'no lo se');
  const text = String(raw).trim().toLowerCase();
  return Boolean(text) && text !== 'no lo se' && text !== 'no_lo_se' && text !== 'unknown';
}

function daysSince(value: Date | string | null | undefined): number {
  if (!value) return 999;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return 999;
  return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
}

function coverageConfidence(entry: EntryLike): number {
  if (entry.verificationStatus === 'USER_CONFIRMED') return 1;
  if (entry.verificationStatus === 'NEEDS_REVIEW') return 0.25;
  if (entry.verificationStatus === 'INFERRED') return 0.45;
  if (entry.sourceType === 'USER_INPUT') return 0.8;
  if (entry.sourceType === 'AGENT_INFERENCE') return 0.35;
  return 0.5;
}

function isConfirmedContextDimension(entry: EntryLike): boolean {
  return entry.dimension !== 'IDENTITY' && entry.verificationStatus === 'USER_CONFIRMED';
}

function isInferred(entry: EntryLike): boolean {
  return entry.verificationStatus === 'INFERRED' || entry.sourceType === 'AGENT_INFERENCE';
}

export function calculateContextScore(entries: EntryLike[], sources: SourceLike[]): ContextScoreResult {
  let coverage = 0;
  const missing: string[] = [];
  for (const [dimension, weight] of Object.entries(coverageWeights)) {
    const dimensionEntries = entries.filter((entry) => entry.dimension === dimension && hasConcreteValue(entry.valueJson));
    if (dimensionEntries.length > 0) {
      const confidence = Math.max(...dimensionEntries.map(coverageConfidence));
      coverage += weight * confidence;
      if (confidence < 0.75) {
        missing.push(requiredLabels[dimension]);
      }
    } else {
      missing.push(requiredLabels[dimension]);
    }
  }

  const processedSources = sources.filter((source) => source.status === 'PROCESSED' || source.status === 'PARTIAL');
  const confirmedContext = entries.filter(isConfirmedContextDimension).length;
  const inferred = entries.filter(isInferred).length;
  let evidence = 0;
  evidence += Math.min(8, processedSources.length * 4);
  evidence += Math.min(10, confirmedContext * 2);
  evidence += Math.min(4, entries.filter((entry) => !isInferred(entry)).length);
  evidence -= Math.min(6, inferred);
  evidence = Math.max(0, Math.min(25, evidence));

  const newestEntryDays = Math.min(...entries.map((entry) => daysSince(entry.createdAt)), 999);
  const newestSourceDays = Math.min(...sources.map((source) => daysSince(source.processedAt)), 999);
  const newest = Math.min(newestEntryDays, newestSourceDays);
  let freshness = newest <= 30 ? 15 : newest <= 180 ? 11 : newest <= 365 ? 7 : entries.length ? 4 : 0;
  const needsReview = entries.some((entry) => entry.verificationStatus === 'NEEDS_REVIEW');
  if (needsReview) freshness = Math.max(0, freshness - 4);

  const score = Math.max(0, Math.min(100, Math.round(coverage + evidence + freshness)));
  const level = score >= 80 ? 'SOLID' : score >= 60 ? 'USEFUL' : score >= 30 ? 'BASIC' : 'INITIAL';
  const label = level === 'SOLID'
    ? 'Contexto solido'
    : level === 'USEFUL'
    ? 'Contexto util'
    : level === 'BASIC'
    ? 'Contexto basico'
    : 'Contexto inicial';

  return {
    score,
    level,
    label,
    breakdown: { coverage: Math.round(coverage), evidence, freshness },
    missing,
  };
}
