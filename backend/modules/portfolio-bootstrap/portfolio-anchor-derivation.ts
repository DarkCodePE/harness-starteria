import type { Prisma } from '@prisma/client';

export type DerivedPortfolioAnchor = {
  outcomeStatement: string;
  contextSummary: string | null;
  decisionToEnable: string | null;
  businessSignalStatus: 'confirmed' | 'proxy' | 'suggested' | 'unknown' | 'conflicting';
  businessSignalValue: string | null;
  status: 'anchor_insufficient' | 'anchor_provisional' | 'anchor_sufficient' | 'anchor_confirmed' | 'anchor_conflicting';
  sourceRefs: Prisma.InputJsonValue;
  provenanceStatus: 'raw_entry' | 'extracted' | 'ai_inferred' | 'ai_suggested' | 'user_confirmed';
};

type UnknownRecord = Record<string, unknown>;

export function derivePortfolioAnchorFromContinuation(continuation: {
  id: string;
  sessionId: string;
  sourceSnapshot: Prisma.JsonValue;
  pendingItems?: Prisma.JsonValue | null;
}): DerivedPortfolioAnchor {
  const snapshot = asRecord(continuation.sourceSnapshot);
  const session = asRecord(snapshot.session);
  const handoff = asRecord(snapshot.handoff);
  const confirmation = asRecord(snapshot.confirmation);
  const correctedFields = asRecord(confirmation.correctedFields);

  const outcomeStatement = firstText(
    fieldValue(correctedFields.desired_outcome),
    fieldValue(correctedFields.outcomeStatement),
    fieldValue(correctedFields.understanding),
    fieldValue(handoff.desired_outcome),
    fieldValue(handoff.priority),
    fieldValue(handoff.understanding),
    fieldValue(session.rawEntry),
  ) ?? 'Portfolio intent pending clarification';

  const contextSummary = firstText(
    fieldValue(correctedFields.context_summary),
    fieldValue(correctedFields.known_context),
    summarizeList(handoff.known_context),
    fieldValue(handoff.context_summary),
    fieldValue(handoff.understanding),
  );
  const decisionToEnable = firstText(
    fieldValue(correctedFields.decision_to_enable),
    fieldValue(handoff.decision_to_enable),
  );
  const businessSignal = deriveBusinessSignal(handoff, correctedFields);
  const conflicts = collectCriticalContradictions(handoff, continuation.pendingItems);

  const hasOutcome = hasInterpretableText(outcomeStatement);
  const hasMinimumContext = hasInterpretableText(contextSummary) || (hasOutcome && hasInterpretableText(fieldValue(handoff.priority)));
  const hasDecisionOrSignal = hasInterpretableText(decisionToEnable) || businessSignal.status === 'confirmed' || businessSignal.status === 'proxy';
  const provenanceStatus = deriveProvenanceStatus(handoff, confirmation);
  const hasAnyAnchorSignal = Boolean(
    firstText(outcomeStatement, contextSummary ?? undefined, decisionToEnable ?? undefined, businessSignal.value ?? undefined),
  );

  const status = conflicts.length > 0
    ? 'anchor_conflicting'
    : hasOutcome && hasMinimumContext && hasDecisionOrSignal
      ? 'anchor_sufficient'
      : hasOutcome || hasMinimumContext || hasDecisionOrSignal
        ? 'anchor_insufficient'
        : hasAnyAnchorSignal
          ? 'anchor_insufficient'
          : 'anchor_provisional';

  return {
    outcomeStatement,
    contextSummary,
    decisionToEnable,
    businessSignalStatus: conflicts.length > 0 ? 'conflicting' : businessSignal.status,
    businessSignalValue: businessSignal.value,
    status,
    sourceRefs: {
      source: 'PortfolioEntryPortfolioContinuation',
      continuationId: continuation.id,
      portfolioEntrySessionId: continuation.sessionId,
      fields: {
        outcomeStatement: 'sourceSnapshot.handoff.desired_outcome',
        contextSummary: 'sourceSnapshot.handoff.known_context',
        decisionToEnable: 'sourceSnapshot.handoff.decision_to_enable',
      },
      unresolvedCriticalContradictions: conflicts,
    } as Prisma.InputJsonValue,
    provenanceStatus,
  };
}

export function deriveAnchorStatus(input: {
  outcomeStatement?: string | null;
  contextSummary?: string | null;
  decisionToEnable?: string | null;
  businessSignalStatus?: string | null;
  sourceRefs?: unknown;
}): DerivedPortfolioAnchor['status'] {
  const conflicts = collectConflictStrings(input.sourceRefs);
  if (conflicts.length > 0 || input.businessSignalStatus === 'conflicting') return 'anchor_conflicting';

  const hasOutcome = hasInterpretableText(input.outcomeStatement);
  const hasContext = hasInterpretableText(input.contextSummary);
  const hasDecisionOrSignal =
    hasInterpretableText(input.decisionToEnable) ||
    input.businessSignalStatus === 'confirmed' ||
    input.businessSignalStatus === 'proxy';

  return hasOutcome && hasContext && hasDecisionOrSignal ? 'anchor_sufficient' : 'anchor_insufficient';
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
}

function fieldValue(value: unknown): string | undefined {
  if (typeof value === 'string') return clean(value);
  if (Array.isArray(value)) return summarizeList(value);
  const record = asRecord(value);
  return firstText(record.value, record.text, record.description, record.summary, record.statement, record.label);
}

function summarizeList(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const parts = value.map((item) => fieldValue(item)).filter(Boolean) as string[];
  return clean(parts.join('; '));
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const cleaned = clean(value);
    if (cleaned) return cleaned;
  }
  return undefined;
}

function clean(value?: string | null): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : undefined;
}

function hasInterpretableText(value?: string | null): boolean {
  const cleaned = clean(value);
  if (!cleaned) return false;
  const normalized = cleaned.toLowerCase();
  if (['innovar', 'innovar mas', 'innovar más', 'mejorar', 'crecer', 'hacer algo', 'priorizar'].includes(normalized)) {
    return false;
  }
  return normalized.replace(/[^a-z0-9áéíóúñü]/gi, '').length >= 12;
}

function deriveBusinessSignal(handoff: UnknownRecord, correctedFields: UnknownRecord): { status: DerivedPortfolioAnchor['businessSignalStatus']; value: string | null } {
  const corrected = fieldValue(correctedFields.business_signal);
  if (corrected) return { status: 'confirmed', value: corrected };

  const direct = fieldValue(handoff.business_signal) ?? fieldValue(handoff.businessSignal);
  if (direct) return { status: 'proxy', value: direct };

  const evidence = summarizeList(handoff.evidence_or_clarity_needed);
  if (evidence) return { status: 'suggested', value: evidence };

  return { status: 'unknown', value: null };
}

function deriveProvenanceStatus(handoff: UnknownRecord, confirmation: UnknownRecord): DerivedPortfolioAnchor['provenanceStatus'] {
  if (confirmation.status === 'CONFIRMED') return 'extracted';
  const provenance = JSON.stringify(handoff.provenance_summary ?? handoff.provenance ?? '').toLowerCase();
  if (provenance.includes('ai_inferred')) return 'ai_inferred';
  if (provenance.includes('ai_suggested')) return 'ai_suggested';
  return 'raw_entry';
}

function collectCriticalContradictions(handoff: UnknownRecord, pendingItems?: unknown): string[] {
  return [
    ...collectConflictStrings(handoff.unresolved_context),
    ...collectConflictStrings(handoff.contradictions),
    ...collectConflictStrings(pendingItems),
  ];
}

function collectConflictStrings(value: unknown): string[] {
  const found: string[] = [];
  visit(value);
  return found;

  function visit(item: unknown): void {
    if (typeof item === 'string') {
      if (item.toLowerCase().includes('conflict') || item.toLowerCase().includes('contradic')) found.push(item);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    const record = asRecord(item);
    if (Object.keys(record).length === 0) return;
    const severity = String(record.severity ?? record.materiality ?? record.type ?? '').toLowerCase();
    const text = firstText(
      fieldValue(record.description),
      fieldValue(record.summary),
      fieldValue(record.value),
      fieldValue(record.label),
      fieldValue(record.message),
    );
    if (severity.includes('critical') || severity.includes('conflict') || text?.toLowerCase().includes('contradic')) {
      found.push(text ?? severity);
      return;
    }
    Object.values(record).forEach(visit);
  }
}
