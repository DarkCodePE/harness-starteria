import { describe, expect, it } from 'vitest';
import { StrategicFramingReadService } from '../strategic-framing.read-service';

const service = new StrategicFramingReadService();
const context = { userId: 'user-1', sourceMode: 'bootstrap' as const, bootstrapSessionId: 'session-1' };
const anchor = (overrides: any = {}) => ({ id: 'anchor-1', status: 'anchor_sufficient', outcomeStatement: 'Mejorar conversion', contextSummary: 'Reducir friccion en el canal', decisionToEnable: 'Decidir inversion', businessSignalStatus: 'proxy', businessSignalValue: 'Conversion', sourceRefs: ['handoff:1'], provenanceStatus: 'extracted', ...overrides });
const work = { id: 'work-1', rawLabel: 'Resolver friccion', proposedPurpose: 'Mejorar conversion', currentStateHint: 'active', ownerCandidate: 'candidate@example.com', sourceRefs: ['import:1'] };

describe('StrategicFramingReadService', () => {
  it('composes a read-only model with work, alignment, provenance and signals', () => {
    const result = service.compose({ context, anchor: anchor(), workItems: [work], strategicConnections: [{ workItemId: 'work-1', status: 'probable_alignment', provenanceStatus: 'user_confirmed', sourceRefs: ['connection:1'] }], advancementConditions: [{ id: 'gap-1', type: 'required_context', statement: 'Falta contexto', severity: 'attention', provenanceStatus: 'ai_suggested', sourceRefs: ['condition:1'] }], now: () => new Date('2026-09-24T10:00:00.000Z') });
    expect(result.existingWork[0].alignment.status).toBe('probable_alignment');
    expect(result.framingSignals.gaps[0]).toMatchObject({ canonical: false, provenance: 'ai_suggested' });
    expect(result.anchor.provenance[0]).toEqual({ sourceRef: 'handoff:1', kind: 'extracted' });
    expect(result.generatedAt).toBe('2026-09-24T10:00:00.000Z');
  });

  it('is conservative when anchor is insufficient and evidence cannot classify scope', () => {
    const result = service.compose({ context, anchor: anchor({ status: 'anchor_insufficient', outcomeStatement: 'Idea' }), workItems: [] });
    expect(result.scopeAssessment.level).toBe('unresolved');
    expect(result.sufficiency.status).toBe('insufficient');
    expect(result.nextBestAction.kind).toBe('clarify_anchor');
  });

  it('keeps challenge-like context unresolved without creating a canonical Challenge', () => {
    const result = service.compose({ context, anchor: anchor({ outcomeStatement: 'Resolver un problema de friccion' }), workItems: [] });
    expect(result.scopeAssessment.level).toBe('challenge_like');
    expect(result.anchor.parentContext.status).toBe('unresolved');
    expect(result.nextBestAction.kind).toBe('review_parent_context');
    expect(result.scopeAssessment.canonicalized).toBe(false);
  });

  it('preserves pending alignment and does not fabricate business outcomes', () => {
    const result = service.compose({ context, anchor: anchor(), workItems: [work], strategicConnections: [], advancementConditions: [{ type: 'business_signal', statement: 'No hay señal explícita', severity: 'attention', provenanceStatus: 'ai_inferred', sourceRefs: ['analyzer:1'] }] });
    expect(result.existingWork[0].alignment.status).toBe('alignment_unknown');
    expect(result.framingSignals.observations).toHaveLength(1);
    expect(result.framingSignals.observations[0].kind).toBe('observation');
    expect(result).not.toHaveProperty('businessOutcome');
    expect(result).not.toHaveProperty('contribution');
  });

  it('recognizes a confirmed parent context without any mutation capability', () => {
    const result = service.compose({ context, anchor: anchor(), canonicalContext: { strategicFrontId: 'front-1', strategicFrontLabel: 'Growth', sourceRefs: ['canonical:front-1'] }, workItems: [work] });
    expect(result.anchor.parentContext).toMatchObject({ status: 'known', label: 'Growth' });
    expect(result.scopeAssessment.level).toBe('front_like');
  });
});
