import type { PortfolioEntryFixtureV2 } from '../schemas/fixture.schema';
import type { SessionTrace } from '../session/session-types';
import type { ContractResultV2, HypothesisEvaluationV2, HypothesisResultV2 } from './evaluation-types-v0.2';

const KNOWN_HYPOTHESES = ['HYP-001', 'HYP-002', 'HYP-003', 'HYP-004'] as const;

export function evaluateHypothesesV2(input: {
  fixture: PortfolioEntryFixtureV2;
  trace: SessionTrace;
  contractResult: ContractResultV2;
}): {
  evaluations: HypothesisEvaluationV2[];
  hypothesis_result: HypothesisResultV2;
} {
  const linked = input.fixture.linked_hypotheses ?? [];
  const evaluations = KNOWN_HYPOTHESES.map<HypothesisEvaluationV2>((hypothesisId) => {
    if (!linked.includes(hypothesisId)) {
      return {
        hypothesis_id: hypothesisId,
        result: 'N/A',
        automatic_signals: [],
        rationale_summary: 'Fixture is not linked to this hypothesis.',
      };
    }

    const contradictionSignals = explicitContradictionSignals(hypothesisId, input.trace);
    if (contradictionSignals.length > 0) {
      return {
        hypothesis_id: hypothesisId,
        result: 'CONTRADICTED',
        automatic_signals: contradictionSignals,
        rationale_summary: 'Explicit automatic contradiction signal is present.',
      };
    }

    return {
      hypothesis_id: hypothesisId,
      result: 'INCONCLUSIVE',
      automatic_signals: collectAutomaticSignals(input.trace),
      rationale_summary: `Phase 3 does not promote ${hypothesisId} to SUPPORTED without Handoff and Human Review. Contract result was ${input.contractResult}.`,
    };
  });

  return {
    evaluations,
    hypothesis_result: summarizeHypothesisResult(evaluations),
  };
}

function explicitContradictionSignals(hypothesisId: string, trace: SessionTrace): string[] {
  const explicit = collectExplicitHypothesisSignals(trace);
  return explicit.filter((signal) => signal === `${hypothesisId}:CONTRADICTED`);
}

function collectAutomaticSignals(trace: SessionTrace): string[] {
  const signals: string[] = [];
  if (trace.quick_questions_total <= 3) signals.push('quick_budget_observed');
  if (trace.mode_transitions.some((transition) => transition.to_mode === 'guided_exploration')) signals.push('guided_exploration_observed');
  if (trace.stop_reason) signals.push(`stop_reason:${trace.stop_reason}`);
  return signals;
}

function collectExplicitHypothesisSignals(source: unknown): string[] {
  if (!source || typeof source !== 'object') return [];
  if (Array.isArray(source)) return source.flatMap(collectExplicitHypothesisSignals);
  return Object.entries(source).flatMap(([key, value]) => {
    if (key === 'hypothesis_contradiction_signals' && Array.isArray(value)) return value.map(String);
    return collectExplicitHypothesisSignals(value);
  });
}

function summarizeHypothesisResult(evaluations: HypothesisEvaluationV2[]): HypothesisResultV2 {
  const applicable = evaluations.filter((evaluation) => evaluation.result !== 'N/A');
  if (applicable.length === 0) return 'N/A';
  if (applicable.some((evaluation) => evaluation.result === 'CONTRADICTED')) return 'CONTRADICTED';
  if (applicable.every((evaluation) => evaluation.result === 'SUPPORTED')) return 'SUPPORTED';
  return 'INCONCLUSIVE';
}
