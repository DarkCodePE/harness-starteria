import { describe, expect, it } from 'vitest';
import { projectItem, validateProjectedItem, type AuthoritativeReadinessMetadata } from './authoritative-current-later-projection';

const cases: Array<{ id: string; expected: 'CURRENT' | 'LATER'; metadata: AuthoritativeReadinessMetadata }> = [
  { id: 'CR-ADV-05', expected: 'LATER', metadata: { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'DETAIL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'ROUTE', route: 'later_stage' } } },
  { id: 'LW-CTRL-01', expected: 'LATER', metadata: { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'DETAIL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'ROUTE', route: 'later_stage' } } },
  { id: 'LW-CTRL-02', expected: 'CURRENT', metadata: { current_decision_dependency: 'BLOCKING', decision_sensitivity: 'HIGH', decision_branch_type: 'ENABLEMENT_CHANGE', answerability: 'EXTERNAL_EVIDENCE_REQUIRED', next_action: { type: 'ASK', gap_id: 'regulatory-proof' } } },
  { id: 'LW-CTRL-03', expected: 'LATER', metadata: { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'NO_MATERIAL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'ROUTE', route: 'later_stage' } } },
  { id: 'LW-CTRL-04', expected: 'CURRENT', metadata: { current_decision_dependency: 'CONSTRAINING', decision_sensitivity: 'MEDIUM', decision_branch_type: 'CONDITION_CHANGE', answerability: 'EXTERNAL_EVIDENCE_REQUIRED', next_action: { type: 'ASK', gap_id: 'provider-cost' } } },
  { id: 'LW-CTRL-05', expected: 'LATER', metadata: { current_decision_dependency: 'NON_BLOCKING', decision_sensitivity: 'LOW', decision_branch_type: 'NO_MATERIAL_CHANGE', answerability: 'LATER_STAGE_DISCOVERY', next_action: { type: 'STOP', reason: 'later_stage_detail' } } },
];

describe('authoritative current/later projection', () => {
  it('projects the six frozen controls without a second semantic judgment', () => {
    expect(cases.map(({ id, expected, metadata }) => projectItem({ id, description: id }, metadata).current_relevance)).toEqual(cases.map(({ expected }) => expected));
  });

  it('keeps blocker/condition variation inside CURRENT for conversion', () => {
    const blocker = projectItem({ id: 'blocker', description: 'blocker' }, cases[2].metadata);
    const condition = projectItem({ id: 'condition', description: 'condition' }, cases[4].metadata);
    expect(blocker.current_relevance).toBe('CURRENT');
    expect(condition.current_relevance).toBe('CURRENT');
    expect(blocker.current_open_items).toHaveLength(1);
    expect(condition.current_open_items).toHaveLength(1);
  });

  it('does not place missing metadata silently', () => {
    const unresolved = projectItem({ id: 'missing', description: 'missing' }, undefined);
    expect(unresolved.current_relevance).toBe('UNRESOLVED');
    expect(unresolved.relationship_resolution_required).toBe(true);
    expect(unresolved.current_open_items).toHaveLength(0);
    expect(unresolved.later_work_items).toHaveLength(0);
  });

  it('passes the semantic validator for authoritative placement and realization', () => {
    for (const { id, expected, metadata } of cases) {
      const projected = projectItem({ id, description: id }, metadata);
      const failures = validateProjectedItem({
        projected,
        visible_question: expected === 'LATER' ? null : '¿Qué falta confirmar?',
        visible_response: expected === 'LATER' ? 'La decisión actual está clara y podemos continuar.' : 'Este punto permanece abierto para la decisión actual.',
        conversion_readiness: expected === 'LATER' ? 'READY' : 'READY_WITH_OPEN_ITEMS',
      });
      expect(failures, id).toEqual([]);
    }
  });
});
