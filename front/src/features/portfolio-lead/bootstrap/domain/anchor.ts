import type {
  BusinessSignalStatus,
  PortfolioAnchor,
  PortfolioAnchorInput,
  ProvenancedValue,
  ProvenanceStatus,
} from './types';

function unwrapText(value?: string | ProvenancedValue<string>): string | undefined {
  if (typeof value === 'string') return normalizeText(value);
  return normalizeText(value?.value);
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : undefined;
}

function hasInterpretableText(value?: string): boolean {
  if (!value) return false;

  const normalized = value.toLowerCase();
  const vagueOnly = [
    'innovar',
    'innovar mas',
    'innovar más',
    'mejorar',
    'crecer',
    'hacer algo',
    'priorizar',
  ];

  if (vagueOnly.includes(normalized)) return false;

  return normalized.replace(/[^a-z0-9áéíóúñü]/gi, '').length >= 12;
}

function highestInputProvenance(input: PortfolioAnchorInput): ProvenanceStatus {
  if (input.humanConfirmation) return 'USER_CONFIRMED';

  const provenances = [
    typeof input.desiredOutcome === 'object' ? input.desiredOutcome.provenance : undefined,
    typeof input.priority === 'object' ? input.priority.provenance : undefined,
    typeof input.contextSummary === 'object' ? input.contextSummary.provenance : undefined,
    typeof input.decisionToEnable === 'object' ? input.decisionToEnable.provenance : undefined,
    input.businessSignal?.provenance,
  ].filter(Boolean) as ProvenanceStatus[];

  if (provenances.includes('CANONICAL')) return 'CANONICAL';
  if (provenances.includes('USER_CONFIRMED')) return 'USER_CONFIRMED';
  if (provenances.includes('AI_INFERRED')) return 'AI_INFERRED';
  if (provenances.includes('AI_SUGGESTED')) return 'AI_SUGGESTED';

  return 'AI_SUGGESTED';
}

export function derivePortfolioAnchor(input: PortfolioAnchorInput): PortfolioAnchor {
  const desiredOutcome = unwrapText(input.desiredOutcome);
  const priority = unwrapText(input.priority);
  const contextSummary = unwrapText(input.contextSummary);
  const decisionToEnable = unwrapText(input.decisionToEnable);
  const businessSignalStatus: BusinessSignalStatus = input.businessSignal?.status ?? 'unknown';
  const criticalContradictions = input.criticalContradictions ?? [];

  const hasInterpretableOutcomeOrPriority =
    hasInterpretableText(desiredOutcome) || hasInterpretableText(priority);
  const hasMinimumContext =
    hasInterpretableText(contextSummary) || (hasInterpretableText(desiredOutcome) && hasInterpretableText(priority));
  const hasDecisionOrSignal = hasInterpretableText(decisionToEnable) || businessSignalStatus === 'known' || businessSignalStatus === 'proxy';

  const missing: string[] = [];
  if (!hasInterpretableOutcomeOrPriority) missing.push('interpretable_desired_outcome_or_priority');
  if (!hasMinimumContext) missing.push('minimum_context_to_organize_work');
  if (!hasDecisionOrSignal) missing.push('decision_to_enable_or_business_signal');
  if (criticalContradictions.length > 0) missing.push('critical_contradiction_resolution');

  const sufficient = missing.length === 0;
  const confirmed = sufficient && Boolean(input.humanConfirmation);
  const hasAnyAnchorSignal = Boolean(desiredOutcome || priority || contextSummary);

  return {
    status: confirmed
      ? 'anchor_confirmed'
      : sufficient
        ? 'anchor_provisional'
        : hasAnyAnchorSignal
          ? 'anchor_insufficient'
          : 'anchor_missing',
    desiredOutcome,
    priority,
    contextSummary,
    decisionToEnable,
    businessSignalStatus,
    criticalContradictions,
    missing,
    provenance: highestInputProvenance(input),
  };
}

export function isPortfolioAnchorSufficient(anchor?: PortfolioAnchor): boolean {
  return anchor?.status === 'anchor_sufficient' || anchor?.status === 'anchor_confirmed';
}

export function isPortfolioAnchorReadyForConfirmation(anchor?: PortfolioAnchor): boolean {
  return anchor?.status === 'anchor_provisional' || isPortfolioAnchorSufficient(anchor);
}
