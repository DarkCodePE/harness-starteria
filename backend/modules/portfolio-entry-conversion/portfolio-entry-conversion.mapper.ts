import type { PortfolioEntryHandoffV2, ProvenancedTextV2 } from '../portfolio-entry-runtime/domain/handoff.schema';
import type { PortfolioEntryConfirmation } from '../portfolio-entry-sessions/domain/portfolio-entry-confirmation.types';
import type { PortfolioEntrySession } from '../portfolio-entry-sessions/domain/portfolio-entry-session.types';

export const PORTFOLIO_ENTRY_CONVERSION_MAPPING_VERSION = 'portfolio-entry-conversion-v0.1';

type CorrectedField = {
  value?: unknown;
  origin?: unknown;
  provenance?: unknown;
};

export type PortfolioEntryCanonicalMapping = {
  projectName: string;
  projectDescription: string;
  step0Data: Record<string, unknown>;
  sourceSnapshot: Record<string, unknown>;
};

export function mapPortfolioEntryToCanonicalProject(input: {
  session: PortfolioEntrySession;
  handoffId: string;
  confirmation: PortfolioEntryConfirmation;
}): PortfolioEntryCanonicalMapping {
  const handoff = input.session.latestHandoff?.handoff;
  if (!handoff) throw new PortfolioEntryConversionMappingError('Portfolio Entry handoff is required for conversion.');

  const rejected = new Set(input.confirmation.rejectedFields ?? []);
  const corrected = input.confirmation.correctedFields ?? {};
  const understanding = textField('understanding', handoff.understanding, corrected, rejected);
  if (!understanding?.value.trim()) {
    throw new PortfolioEntryConversionMappingError('Portfolio Entry understanding is required for conversion.');
  }

  const desiredOutcome = textField('desired_outcome', handoff.desired_outcome, corrected, rejected);
  const decisionToEnable = handoff.decision_to_enable === 'unresolved'
    ? unresolvedText('decision_to_enable')
    : textField('decision_to_enable', handoff.decision_to_enable, corrected, rejected);
  const recommendedApproach = suggestedApproach(handoff, corrected, rejected);

  const projectName = deriveProjectName(corrected, understanding.value);
  const projectDescription = understanding.value.slice(0, 1000);
  const provenanceByField = {
    understanding: understanding.provenance,
    desiredOutcome: desiredOutcome?.provenance,
    decisionToEnable: decisionToEnable?.provenance,
    recommendedApproach: recommendedApproach?.provenance,
  };

  const step0Data = {
    source: 'portfolio_entry',
    portfolioEntrySessionId: input.session.id,
    portfolioEntryHandoffId: input.handoffId,
    portfolioEntryConfirmationId: input.confirmation.id,
    mode: 'independent',
    initiativeTitle: projectName,
    quePasaQueQuieres: understanding.value,
    contextInitial: understanding.value,
    expectedImpact: desiredOutcome?.value ?? '',
    decisionRequested: decisionToEnable?.value ?? '',
    recommendedApproach: recommendedApproach?.value ?? '',
    nextRecommendedStep: handoff.recommended_cta,
    knownContext: handoff.known_context,
    unresolvedContext: handoff.unresolved_context,
    pendingQuestions: handoff.unresolved_context.map((item) => ({
      id: item.gap_id,
      question: item.description,
      provenance: item.provenance,
    })),
    evidenceOrClarityNeeded: handoff.evidence_or_clarity_needed,
    gapResolutionMap: handoff.gap_resolution_map,
    starteriaPath: handoff.starteria_path,
    currentEvidence: handoff.evidence_or_clarity_needed.map((item) => item.value).join('\n'),
    validationSignal: signalFromHandoff(handoff),
    risksUncertainty: {
      handoffStatus: handoff.handoff_status,
      unresolvedContext: handoff.unresolved_context,
      evidenceOrClarityNeeded: handoff.evidence_or_clarity_needed,
    },
    rejectedFields: input.confirmation.rejectedFields,
    acceptedFields: input.confirmation.acceptedFields,
    portfolioEntryProvenance: {
      mappingVersion: PORTFOLIO_ENTRY_CONVERSION_MAPPING_VERSION,
      fields: provenanceByField,
      provenanceSummary: handoff.provenance_summary,
      correctedFields: sanitizedCorrectedFields(corrected),
      rejectedFields: input.confirmation.rejectedFields,
      originRules: {
        aiInferredRemainsInferred: true,
        aiSuggestedRemainsSuggested: true,
        unresolvedRemainsUnresolved: true,
      },
    },
  };

  const sourceSnapshot = {
    kind: 'portfolio_entry_conversion_source',
    mappingVersion: PORTFOLIO_ENTRY_CONVERSION_MAPPING_VERSION,
    session: {
      id: input.session.id,
      lifecycleStatus: input.session.lifecycleStatus,
      ownershipState: input.session.ownershipState,
      ownerUserId: input.session.ownerUserId,
      revision: input.session.revision,
      entryOrigin: input.session.entryOrigin,
    },
    handoff: {
      id: input.handoffId,
      status: handoff.handoff_status,
      payload: handoff,
    },
    confirmation: {
      id: input.confirmation.id,
      status: input.confirmation.status,
      acceptedFields: input.confirmation.acceptedFields,
      correctedFields: sanitizedCorrectedFields(corrected),
      rejectedFields: input.confirmation.rejectedFields,
      notes: input.confirmation.notes,
      confirmedAt: input.confirmation.confirmedAt?.toISOString() ?? null,
    },
    mappedFields: {
      projectName,
      projectDescription,
      step0Data,
    },
  };

  return { projectName, projectDescription, step0Data, sourceSnapshot };
}

export class PortfolioEntryConversionMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioEntryConversionMappingError';
  }
}

function textField(
  key: string,
  fallback: ProvenancedTextV2,
  corrected: Record<string, unknown>,
  rejected: Set<string>,
): { value: string; provenance: unknown } | null {
  if (rejected.has(key)) return null;
  const correction = correctedValue(corrected[key]);
  if (correction) {
    return {
      value: correction.value,
      provenance: {
        origin: correction.origin ?? 'USER_CONFIRMED',
        corrected: true,
        originalProvenance: fallback.provenance,
      },
    };
  }
  return {
    value: fallback.value,
    provenance: fallback.provenance,
  };
}

function unresolvedText(key: string): { value: string; provenance: unknown } {
  return {
    value: '',
    provenance: {
      origin: 'UNRESOLVED',
      source_path: key,
    },
  };
}

function suggestedApproach(
  handoff: PortfolioEntryHandoffV2,
  corrected: Record<string, unknown>,
  rejected: Set<string>,
): { value: string; provenance: unknown } | null {
  const key = 'recommended_approach';
  if (rejected.has(key)) return null;
  const correction = correctedValue(corrected[key]);
  if (correction) {
    return {
      value: correction.value,
      provenance: {
        origin: correction.origin ?? 'USER_CONFIRMED',
        corrected: true,
        originalOrigin: handoff.recommended_approach?.origin,
      },
    };
  }
  if (!handoff.recommended_approach) return null;
  return {
    value: handoff.recommended_approach.description,
    provenance: {
      origin: handoff.recommended_approach.origin,
      review_disposition: handoff.recommended_approach.review_disposition,
      provenance: handoff.recommended_approach.provenance,
    },
  };
}

function correctedValue(value: unknown): { value: string; origin?: unknown } | null {
  if (typeof value === 'string' && value.trim()) return { value: value.trim(), origin: 'USER_CONFIRMED' };
  if (!value || typeof value !== 'object') return null;
  const candidate = value as CorrectedField;
  if (typeof candidate.value !== 'string' || !candidate.value.trim()) return null;
  return { value: candidate.value.trim(), origin: candidate.origin };
}

function deriveProjectName(corrected: Record<string, unknown>, understanding: string): string {
  const explicitTitle = correctedValue(corrected.title)
    ?? correctedValue(corrected.name)
    ?? correctedValue(corrected.initiativeTitle)
    ?? correctedValue(corrected.understanding);
  const source = explicitTitle?.value ?? understanding;
  const firstLine = source.split(/\r?\n/).map((item) => item.trim()).find(Boolean) ?? '';
  const firstSentence = firstLine.split(/[.!?]/).map((item) => item.trim()).find(Boolean) ?? firstLine;
  const compact = firstSentence.replace(/\s+/g, ' ').trim();
  if (compact.length >= 3) return compact.slice(0, 120);
  return 'Iniciativa desde Portfolio Entry';
}

function signalFromHandoff(handoff: PortfolioEntryHandoffV2): string {
  const signal = handoff.known_context.find((item) => /kpi|senal|señal|metrica|métrica|indicador/i.test(item.key));
  return signal?.value ?? '';
}

function sanitizedCorrectedFields(corrected: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(corrected ?? {})) as Record<string, unknown>;
}
