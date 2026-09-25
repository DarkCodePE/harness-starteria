import { describe, expect, it } from 'vitest';
import type { StrategicFramingPriorityCandidate, StrategicFramingProvisionalState } from '../strategic-framing.types';
import { STRATEGIC_FRAMING_RECOMMENDATION_VERSION, StrategicFramingPrioritizationRecommendationEvaluator } from '../strategic-framing.prioritization-recommendation';

const candidate = (id: string, statement: string, overrides: Partial<StrategicFramingPriorityCandidate> = {}): StrategicFramingPriorityCandidate => ({
  candidateId: id, kind: 'gap', statementSnapshot: statement, sourceCandidateRef: `source:${id}`, sourceVersion: 'read-1', sourceRefs: [`ref:${id}`], provenance: 'extracted', confidence: 'medium', uncertainty: null, humanDisposition: 'undecided', humanDecision: null, ...overrides,
});

const base = (overrides: Partial<StrategicFramingProvisionalState> = {}): StrategicFramingProvisionalState => ({
  id: 'state-1', userId: 'user-1', organizationId: 'org-1', sourceMode: 'enterprise_direct', logicalContextKey: 'ctx', sourceRefs: ['state:1'], provenance: [], intendedMovement: 'Mover margen', whyItMatters: 'Importa', movementSignalStatus: 'proxy', movementSignalValue: null, horizonContext: 'Q4', decisionToEnable: 'Decidir foco', subjectLevel: 'challenge_like', scopeAssessment: { level: 'challenge_like', confidence: 'medium', rationale: [], provenance: [], canonicalized: false }, rationaleUncertainty: null, parentStatus: 'provisional', parentContext: { label: 'Growth', sourceRefs: [] }, sufficiency: { status: 'insufficient', blockers: [], softGaps: [], optionalContext: [] }, prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: null, focusRationale: null, candidates: [] }, version: 7, createdAt: '2026-09-25T00:00:00.000Z', updatedAt: '2026-09-25T00:00:00.000Z', ...overrides,
});

describe('StrategicFramingPrioritizationRecommendationEvaluator', () => {
  const evaluator = new StrategicFramingPrioritizationRecommendationEvaluator();

  it('returns an empty, neutral result without mutating input', () => {
    const state = base();
    const before = structuredClone(state);
    const result = evaluator.evaluate(state);
    expect(result.recommendations).toEqual([]);
    expect(result.limitations.join(' ')).toContain('No hay candidatos');
    expect(state).toEqual(before);
  });

  it('is deterministic and includes a stable compatible snapshot', () => {
    const state = base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates: [candidate('a', 'Falta evidencia')] }, sufficiency: { status: 'insufficient', blockers: [' falta   evidencia '], softGaps: [], optionalContext: [] } });
    const first = evaluator.evaluate(state);
    expect(evaluator.evaluate(state)).toEqual(first);
    expect(first.recommendationVersion).toBe(STRATEGIC_FRAMING_RECOMMENDATION_VERSION);
    expect(first.recommendations[0].recommendationSnapshot).toMatchObject({ recommendationVersion: STRATEGIC_FRAMING_RECOMMENDATION_VERSION, inputStateVersion: 7, recommendedDisposition: 'address_now' });
  });

  it('keeps unknown capacity visible and does not fabricate ADDRESS NOW', () => {
    const result = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: null, focusRationale: null, candidates: [candidate('a', 'Falta evidencia')] }, sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: [], optionalContext: [] } }));
    expect(result.capacityStatus).toBe('unknown');
    expect(result.recommendations[0].recommendedDisposition).toBe('needs_clarification');
    expect(result.recommendations.some((item) => item.recommendedDisposition === 'address_now')).toBe(false);
  });

  it('handles zero capacity and permits unused positive capacity', () => {
    const candidates = [candidate('a', 'Falta evidencia'), candidate('b', 'Otra brecha')];
    const zero = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 0, focusRationale: null, candidates }, sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: [], optionalContext: [] } }));
    expect(zero.recommendations.some((item) => item.recommendedDisposition === 'address_now')).toBe(false);
    const spare = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 3, focusRationale: null, candidates }, sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: [], optionalContext: [] } }));
    expect(spare.recommendations.filter((item) => item.recommendedDisposition === 'address_now')).toHaveLength(1);
  });

  it('supports one blocker, keeps soft-gap-only candidates observable, and never auto-discards', () => {
    const result = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates: [candidate('blocker', 'Validar señal'), candidate('soft', 'Aclarar contexto'), candidate('opp', 'Mejorar oportunidad', { kind: 'opportunity', confidence: 'low', sourceRefs: [] })] }, sufficiency: { status: 'insufficient', blockers: ['Validar señal'], softGaps: ['Aclarar contexto'], optionalContext: [] } }));
    expect(result.recommendations.map((item) => item.recommendedDisposition)).toEqual(['address_now', 'observe', 'observe']);
    expect(result.recommendations.every((item) => item.recommendedDisposition !== 'discard')).toBe(true);
    expect(result.recommendations[2].evidenceQuality).toBe('low');
  });

  it('keeps all five candidates visible with one defensible ADDRESS NOW at capacity one', () => {
    const candidates = [candidate('c1', 'Blocker estructurado'), candidate('c2', 'Otra brecha'), candidate('c3', 'Otra oportunidad'), candidate('c4', 'Más contexto'), candidate('c5', 'Señal abierta')];
    const result = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates }, sufficiency: { status: 'insufficient', blockers: ['Blocker estructurado'], softGaps: [], optionalContext: [] } }));
    expect(result.recommendations).toHaveLength(5);
    expect(result.recommendations.filter((item) => item.recommendedDisposition === 'address_now')).toHaveLength(1);
    expect(result.recommendations.every((item) => item.recommendedDisposition !== 'discard')).toBe(true);
  });

  it('does not select a winner among five equivalent candidates at capacity one', () => {
    const candidates = ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => candidate(id, 'Mismo blocker'));
    const result = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates }, sufficiency: { status: 'insufficient', blockers: ['Mismo blocker'], softGaps: [], optionalContext: [] } }));
    expect(result.recommendations).toHaveLength(5);
    expect(result.recommendations.every((item) => item.recommendedDisposition === 'needs_clarification')).toBe(true);
    expect(result.recommendations.some((item) => item.recommendedDisposition === 'address_now')).toBe(false);
  });

  it('keeps five candidates visible and capacity unknown when focusSlots is null', () => {
    const candidates = ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => candidate(id, id === 'c1' ? 'Blocker estructurado' : `Candidato ${id}`));
    const result = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: null, focusRationale: null, candidates }, sufficiency: { status: 'insufficient', blockers: ['Blocker estructurado'], softGaps: [], optionalContext: [] } }));
    expect(result.capacityStatus).toBe('unknown');
    expect(result.recommendations).toHaveLength(5);
    expect(result.recommendations.some((item) => item.recommendedDisposition === 'address_now')).toBe(false);
    expect(result.warnings.join(' ')).toContain('desconocida');
  });

  it('does not rank by source-ref count, confidence, candidate id, horizon text, or free-text dependencies', () => {
    const state = base({
      prioritizationState: {
        schemaVersion: 1,
        nonCanonical: true,
        focusSlots: 1,
        focusRationale: null,
        candidates: [
          candidate('z', 'Sin señal', { sourceRefs: ['a', 'b', 'c'], confidence: 'high', uncertainty: 'depende de z' }),
          candidate('a', 'Otra señal', { confidence: 'low' }),
        ],
      },
      sufficiency: { status: 'insufficient', blockers: [], softGaps: [], optionalContext: [] },
      horizonContext: 'Q4 urgente',
    });
    const result = evaluator.evaluate(state);
    expect(result.recommendations.every((item) => item.recommendedDisposition !== 'address_now')).toBe(true);
    expect(result.recommendations.map((item) => item.candidateId)).toEqual(['z', 'a']);
    expect(result.limitations.join(' ')).toContain('dependencias');
  });

  it('surfaces an equal-capacity tie instead of choosing by id or array order', () => {
    const result = evaluator.evaluate(base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates: [candidate('z', 'Mismo blocker'), candidate('a', 'Mismo blocker')] }, sufficiency: { status: 'insufficient', blockers: ['Mismo blocker'], softGaps: [], optionalContext: [] } }));
    expect(result.recommendations.every((item) => item.recommendedDisposition === 'needs_clarification')).toBe(true);
    expect(result.recommendations.some((item) => item.recommendedDisposition === 'address_now')).toBe(false);
    expect(result.warnings.join(' ')).toContain('empate');
  });

  it('keeps human disposition independent and does not change sufficiency or source refs', () => {
    const state = base({ sufficiency: { status: 'insufficient', blockers: [], softGaps: [], optionalContext: [] }, prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates: [candidate('a', 'Candidate', { humanDisposition: 'discard', sourceRefs: ['trusted:1'] })] } });
    const before = structuredClone(state);
    const result = evaluator.evaluate(state);
    expect(result.recommendations[0].humanDisposition).toBe('discard');
    expect(result.recommendations[0].recommendedDisposition).toBe('observe');
    expect(result.recommendations[0].sourceRefs).toEqual(['trusted:1']);
    expect(state.sufficiency).toEqual(before.sufficiency);
  });

  it.each(['undecided', 'address_now', 'observe', 'discard'] as const)('does not let persisted human disposition %s force the live recommendation', (humanDisposition) => {
    const state = base({ prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates: [candidate('a', 'No structured priority', { humanDisposition })] } });
    expect(evaluator.evaluate(state).recommendations[0].recommendedDisposition).toBe('observe');
  });

  it('is invariant across source modes for equivalent state evidence', () => {
    const states = (['public_entry', 'enterprise_direct', 'existing_portfolio'] as const).map((sourceMode) => base({ sourceMode, prioritizationState: { schemaVersion: 1, nonCanonical: true, focusSlots: 1, focusRationale: null, candidates: [candidate('a', 'Falta evidencia')] }, sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: [], optionalContext: [] } }));
    const results = states.map((state) => evaluator.evaluate(state));
    expect(results.map(({ sourceMode, ...result }) => result)).toEqual([results[0], results[0], results[0]].map(({ sourceMode, ...result }) => result));
  });
});
