import { describe, expect, it } from 'vitest';
import { StrategicFramingLensSuggestionEvaluator } from '../strategic-framing.lens-suggestions';
import type { StrategicFramingProvisionalState, StrategicLensKey } from '../strategic-framing.types';

const base = (overrides: Partial<StrategicFramingProvisionalState> = {}): StrategicFramingProvisionalState => ({
  id: 'state-1', userId: 'user-1', organizationId: 'org-1', sourceMode: 'enterprise_direct', logicalContextKey: 'key', sourceRefs: ['trusted:movement'], provenance: [{ sourceRef: 'trusted:movement', kind: 'user_declared' }], intendedMovement: 'Mejorar retención', whyItMatters: 'Reduce abandono', movementSignalStatus: 'confirmed', movementSignalValue: 'retention', horizonContext: '12 meses', decisionToEnable: null, subjectLevel: 'challenge_like', scopeAssessment: { level: 'challenge_like', confidence: 'high', rationale: [], provenance: [], canonicalized: false }, rationaleUncertainty: null, parentStatus: 'known', parentContext: { label: 'Growth', sourceRefs: [] }, sufficiency: { status: 'sufficient', blockers: [], softGaps: [], optionalContext: [] }, version: 3, createdAt: '2026-09-25T00:00:00.000Z', updatedAt: '2026-09-25T00:00:00.000Z', ...overrides,
});

describe('StrategicFramingLensSuggestionEvaluator', () => {
  const evaluator = new StrategicFramingLensSuggestionEvaluator();

  it('allows a clear/light state to return zero suggestions', () => {
    const result = evaluator.evaluate(base(), () => new Date('2026-09-25T00:00:00.000Z'));
    expect(result.depthHint).toBe('light');
    expect(result.suggestions).toEqual([]);
  });

  it('suggests outcome and evidence lenses for missing clarity', () => {
    const result = evaluator.evaluate(base({ intendedMovement: null, whyItMatters: null, movementSignalStatus: 'unknown', sufficiency: { status: 'insufficient', blockers: ['Falta claridad de resultado'], softGaps: [], optionalContext: [] } }));
    expect(result.suggestions.map((item) => item.lens)).toEqual(['value_outcome', 'learning_evidence']);
    expect(result.suggestions.every((item) => item.sourceRefs.every((ref) => base().sourceRefs.includes(ref)))).toBe(true);
  });

  it('uses material structured context for specialized lenses and does not spray weak ones', () => {
    const weakInputs: Array<[string, StrategicLensKey]> = [
      ['El coste parece importante', 'financial'],
      ['La cultura debería mejorar', 'culture_organization'],
      ['La tecnología parece necesaria', 'technology'],
      ['El riesgo podría existir', 'risk_compliance'],
      ['Necesitamos partners', 'ecosystem_partners'],
    ];
    for (const [intendedMovement, lens] of weakInputs) {
      const weak = evaluator.evaluate(base({ intendedMovement, whyItMatters: 'Valor', sufficiency: { status: 'sufficient', blockers: [], softGaps: [], optionalContext: [] } }));
      expect(weak.suggestions.some((item) => item.lens === lens), `${lens} must remain conservative`).toBe(false);
    }
    const material = evaluator.evaluate(base({ decisionToEnable: 'Aprobar presupuesto de plataforma', rationaleUncertainty: 'La arquitectura, la cultura organizativa, los partners y el riesgo legal no están resueltos', sufficiency: { status: 'insufficient', blockers: ['Dependencia técnica'], softGaps: [], optionalContext: [] }, intendedMovement: 'Modernizar datos y reducir coste', whyItMatters: 'Mejorar retorno', movementSignalStatus: 'unknown' }));
    expect(material.suggestions.map((item) => item.lens)).toEqual(expect.arrayContaining(['financial', 'culture_organization', 'technology', 'risk_compliance', 'ecosystem_partners']));
  });

  it('allows empty sourceRefs and degrades confidence conservatively', () => {
    const result = evaluator.evaluate(base({ sourceRefs: [], provenance: [], intendedMovement: null, movementSignalStatus: 'unknown' }));
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every((item) => item.sourceRefs.length === 0)).toBe(true);
    expect(result.suggestions.every((item) => item.confidence === 'low')).toBe(true);
  });

  it('is invariant across source modes, deterministic in order, and read-only', () => {
    const state = base({ movementSignalStatus: 'conflicting', sufficiency: { status: 'conflicting', blockers: ['Dependencia'], softGaps: [], optionalContext: [] } });
    const before = structuredClone(state);
    const modes = ['public_entry', 'enterprise_direct', 'existing_portfolio'] as const;
    const results = modes.map((sourceMode) => evaluator.evaluate({ ...state, sourceMode }, () => new Date('2026-09-25T00:00:00.000Z')));
    expect(results.map((result) => result.suggestions.map((item) => item.lens))).toEqual([results[0].suggestions.map((item) => item.lens), results[0].suggestions.map((item) => item.lens), results[0].suggestions.map((item) => item.lens)]);
    expect(results[0].suggestions.map((item) => item.lens)).toEqual(['value_outcome', 'process_capability', 'learning_evidence']);
    expect(results[0].suggestions).toEqual(evaluator.evaluate(state, () => new Date('2026-09-25T00:00:00.000Z')).suggestions);
    expect(state).toEqual(before);
  });
});
