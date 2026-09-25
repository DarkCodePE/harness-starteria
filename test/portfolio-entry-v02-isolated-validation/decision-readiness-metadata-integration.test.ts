import { describe, expect, it } from 'vitest';
import { runDecisionReadinessFixture, type DecisionReadinessRun } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';
import { integrateDecisionReadinessProjection } from './decision-readiness-metadata-integration';

function runWithGap(overrides: Record<string, unknown> = {}): DecisionReadinessRun {
  const gap = {
    id: 'gap-1',
    dimension: 'ROUTING',
    description: 'detalle posterior',
    resolution_type: 'DEFER_TO_LATER_STAGE',
    decision_impact: 'LOW',
    route_impact: 'LOW',
    stage_fit: 'INITIATIVE',
    evidence_basis: ['structured fixture'],
    current_decision_dependency: 'NON_BLOCKING',
    answerability: 'LATER_STAGE_DISCOVERY',
    execution_gap_classification: 'LATER_STAGE_EXECUTION_DETAIL',
    decision_sensitivity: 'LOW',
    decision_branch_type: 'DETAIL_CHANGE',
    counterfactual_decision_test: { plausible_answer_a: 'A', plausible_answer_b: 'B', decision_branching: 'NO', branching_reason: 'later detail' },
    answer_shape: 'OPEN_EXPLORATION',
    ...overrides,
  } as any;
  return {
    case_id: 'integration',
    evaluations: [],
    final: {
      dimensions: { RELEVANCE: 'SUFFICIENT', DECISION: 'SUFFICIENT', EXECUTION_REALITY: 'SUFFICIENT', EVIDENCE_AUTHORITY: 'SUFFICIENT', ROUTING: 'PARTIAL' },
      candidate_gaps: [gap],
      selected_gap: gap,
      deferred_gaps: [],
      next_action: { type: 'ROUTE', route: 'later_stage' },
      rationale_trace: [],
    },
    violations: [],
    human_review: {},
  };
}

describe('Decision Readiness metadata integration', () => {
  it('A/B: passes actual structured metadata unchanged, never visible text', () => {
    const result = integrateDecisionReadinessProjection({ decision_readiness: runWithGap(), unresolved_item: { id: 'item', description: 'detalle posterior' }, need_sufficient: true, raw_visible_response: 'texto contradictorio' });
    expect(result.decision_readiness.current_decision_dependency).toBe('NON_BLOCKING');
    expect(result.decision_readiness.selected_material_gap).toBe('detalle posterior');
    expect(result.current_relevance).toBe('LATER');
    expect(result.visible_response).not.toBe('texto contradictorio');
  });

  it('uses the frozen adapter result as the metadata source', () => {
    const frozen = runDecisionReadinessFixture({ id: 'frozen-source', title: 'frozen source', turns: ['La decisión de continuar está suficientemente encuadrada y la capacidad está confirmada.', 'El workflow exacto se descubrirá al preparar la iniciativa.'] });
    const result = integrateDecisionReadinessProjection({ decision_readiness: frozen, unresolved_item: { id: 'item', description: 'workflow posterior' }, need_sufficient: true });
    expect(result.decision_readiness.selected_material_gap).toBe(frozen.final.selected_gap?.description ?? null);
    expect(result.decision_readiness.next_action).toEqual(frozen.final.next_action);
  });

  it('C/D/E: projected placement drives conversion and continuation', () => {
    const later = integrateDecisionReadinessProjection({ decision_readiness: runWithGap(), unresolved_item: { id: 'item', description: 'detalle' }, need_sufficient: true });
    expect(later.current_open_items).toHaveLength(0);
    expect(later.later_work_items).toHaveLength(1);
    expect(later.conversion_readiness).toBe('READY');
    expect(later.continuation_mode).toBe('CONTINUE_TO_NEXT_WORK');

    const current = integrateDecisionReadinessProjection({ decision_readiness: runWithGap({ current_decision_dependency: 'BLOCKING', decision_sensitivity: 'HIGH', decision_branch_type: 'ENABLEMENT_CHANGE', answerability: 'USER_CAN_ANSWER' }), unresolved_item: { id: 'item', description: 'blocker' }, need_sufficient: true });
    expect(current.current_relevance).toBe('CURRENT');
    expect(current.current_open_items).toHaveLength(1);
    expect(current.later_work_items).toHaveLength(0);
    expect(current.conversion_readiness).toBe('READY_WITH_OPEN_ITEMS');
    expect(current.continuation_mode).toBe('CONTINUE_WITH_OPEN_ITEM');
  });

  it('F/G: visible realization follows projected continuation, not raw STOP/ROUTE', () => {
    const result = integrateDecisionReadinessProjection({ decision_readiness: { ...runWithGap(), final: { ...runWithGap().final, next_action: { type: 'STOP', reason: 'raw stop' } } }, unresolved_item: { id: 'item', description: 'later detail' }, need_sufficient: true, raw_visible_response: 'STOP: no podemos continuar' });
    expect(result.continuation_mode).toBe('CONTINUE_TO_NEXT_WORK');
    expect(result.visible_response).toContain('podemos continuar');
    expect(result.visible_response).not.toContain('STOP:');
  });

  it('H: explicit null selected gap survives structured adapter extraction', () => {
    const source = runWithGap();
    source.final.selected_gap = null;
    source.final.next_action = { type: 'STOP', reason: 'sufficient' };
    const result = integrateDecisionReadinessProjection({ decision_readiness: source, unresolved_item: { id: 'item', description: 'unknown' }, need_sufficient: true });
    expect(result.decision_readiness.selected_material_gap).toBeNull();
    expect(result.current_relevance).toBe('UNRESOLVED');
    expect(result.unresolved_relationship_items).toHaveLength(1);
    expect(result.relationship_resolution_required).toBe(true);
  });
});
