import type {
  Answerability,
  DecisionBranchType,
  DecisionDependency,
  DecisionSensitivity,
  NextAction,
} from '../portfolio-entry-decision-readiness/decision-readiness-adapter';

export type CurrentRelevance = 'CURRENT' | 'LATER' | 'UNRESOLVED';

export type AuthoritativeReadinessMetadata = {
  current_decision_dependency?: DecisionDependency;
  decision_sensitivity?: DecisionSensitivity;
  decision_branch_type?: DecisionBranchType;
  answerability?: Answerability;
  next_action?: NextAction;
};

export type RelationshipItem = {
  id: string;
  description: string;
  relation?: 'CURRENT_DECISION_BLOCKER' | 'CURRENT_DECISION_CONDITION' | 'LATER_WORK' | 'OPTIONAL_ENRICHMENT';
};

export type ProjectionDecision = {
  current_relevance: CurrentRelevance;
  reason: string;
  missing_metadata: string[];
};

export type ProjectedItem = ProjectionDecision & {
  item: RelationshipItem;
  current_open_items: RelationshipItem[];
  later_work_items: RelationshipItem[];
  relationship_resolution_required: boolean;
};

const currentBranches: DecisionBranchType[] = ['ENABLEMENT_CHANGE', 'ROUTE_CHANGE', 'CONDITION_CHANGE', 'SCOPE_CHANGE'];
const laterBranches: DecisionBranchType[] = ['DETAIL_CHANGE', 'NO_MATERIAL_CHANGE'];

export function projectCurrentRelevance(metadata: AuthoritativeReadinessMetadata | null | undefined): ProjectionDecision {
  if (!metadata) return { current_relevance: 'UNRESOLVED', reason: 'Decision Readiness metadata is absent.', missing_metadata: ['current_decision_dependency', 'decision_sensitivity', 'decision_branch_type', 'answerability'] };

  const dependency = metadata.current_decision_dependency;
  const sensitivity = metadata.decision_sensitivity;
  const branch = metadata.decision_branch_type;
  const missing: string[] = [];

  if (dependency === 'BLOCKING' && (!branch || !laterBranches.includes(branch))) {
    return { current_relevance: 'CURRENT', reason: 'BLOCKING is decisive current evidence.', missing_metadata: [] };
  }

  if (dependency === 'CONSTRAINING' && branch && currentBranches.includes(branch) && (sensitivity === 'HIGH' || sensitivity === 'MEDIUM')) {
    return { current_relevance: 'CURRENT', reason: `${dependency} with material ${branch} consequence is current.`, missing_metadata: [] };
  }

  if (dependency === 'NON_BLOCKING' && branch && laterBranches.includes(branch) && sensitivity === 'LOW') {
    return { current_relevance: 'LATER', reason: `${dependency} with ${branch} and LOW sensitivity is later work.`, missing_metadata: [] };
  }

  if (!dependency || dependency === 'UNKNOWN') missing.push('current_decision_dependency');
  if (!sensitivity || sensitivity === 'UNKNOWN') missing.push('decision_sensitivity');
  if (!branch || branch === 'UNKNOWN') missing.push('decision_branch_type');
  if (!metadata.answerability) missing.push('answerability');
  return { current_relevance: 'UNRESOLVED', reason: 'Existing metadata is incomplete or contradictory for a safe binary projection.', missing_metadata: missing };
}

export function projectItem(item: RelationshipItem, metadata: AuthoritativeReadinessMetadata | null | undefined): ProjectedItem {
  const decision = projectCurrentRelevance(metadata);
  const current = decision.current_relevance === 'CURRENT' ? [item] : [];
  const later = decision.current_relevance === 'LATER' ? [item] : [];
  return {
    ...decision,
    item,
    current_open_items: current,
    later_work_items: later,
    relationship_resolution_required: decision.current_relevance === 'UNRESOLVED',
  };
}

export type SemanticValidationInput = {
  projected: ProjectedItem;
  visible_question: string | null;
  visible_response: string;
  conversion_readiness: 'NOT_READY' | 'READY_WITH_OPEN_ITEMS' | 'READY';
  expected_raw_relation?: RelationshipItem['relation'];
};

export function validateProjectedItem(input: SemanticValidationInput): string[] {
  const { projected } = input;
  const failures: string[] = [];
  const hasCurrent = projected.current_open_items.some((item) => item.id === projected.item.id);
  const hasLater = projected.later_work_items.some((item) => item.id === projected.item.id);

  if (projected.current_relevance === 'LATER' && hasCurrent) failures.push('AR-01');
  if (projected.current_relevance === 'CURRENT' && !hasCurrent) failures.push('AR-02');
  if (input.expected_raw_relation && ((projected.current_relevance === 'LATER' && input.expected_raw_relation !== 'LATER_WORK') || (projected.current_relevance === 'CURRENT' && input.expected_raw_relation === 'LATER_WORK'))) failures.push('AR-03');
  if (projected.current_relevance === 'LATER' && (input.visible_question !== null || /bloquea|necesario antes|no puede continuar/i.test(input.visible_response))) failures.push('AR-04');
  const expectedReadiness = projected.current_relevance === 'UNRESOLVED' ? null : projected.current_relevance === 'CURRENT' ? 'READY_WITH_OPEN_ITEMS' : 'READY';
  if (expectedReadiness && input.conversion_readiness !== expectedReadiness) failures.push('AR-05');
  if (projected.current_relevance === 'UNRESOLVED' && (hasCurrent || hasLater || !projected.relationship_resolution_required)) failures.push('AR-06');
  return failures;
}
