import type { DecisionReadinessRun, NextAction } from '../portfolio-entry-decision-readiness/decision-readiness-adapter';
import {
  projectItem,
  type AuthoritativeReadinessMetadata,
  type ProjectedItem,
  type RelationshipItem,
} from './authoritative-current-later-projection';

export type DecisionReadinessDiagnostic = AuthoritativeReadinessMetadata & {
  selected_material_gap: string | null;
};

export type IntegratedConversionState = 'NOT_READY' | 'READY_WITH_OPEN_ITEMS' | 'READY';
export type IntegratedContinuationMode = 'CLARIFY' | 'CONTINUE_WITH_OPEN_ITEM' | 'CONTINUE_TO_NEXT_WORK';

export type IntegratedProjection = {
  decision_readiness: DecisionReadinessDiagnostic;
  projected: ProjectedItem;
  current_relevance: ProjectedItem['current_relevance'];
  current_open_items: RelationshipItem[];
  later_work_items: RelationshipItem[];
  unresolved_relationship_items: RelationshipItem[];
  relationship_resolution_required: boolean;
  need_sufficient: boolean;
  conversion_readiness: IntegratedConversionState;
  continuation_mode: IntegratedContinuationMode;
  visible_response: string;
};

export function extractDecisionReadinessMetadata(run: DecisionReadinessRun): DecisionReadinessDiagnostic {
  const gap = run.final.selected_gap;
  return {
    selected_material_gap: gap?.description ?? null,
    current_decision_dependency: gap?.current_decision_dependency,
    decision_sensitivity: gap?.decision_sensitivity,
    decision_branch_type: gap?.decision_branch_type,
    answerability: gap?.answerability,
    next_action: run.final.next_action,
  };
}

export function deriveConversionState(needSufficient: boolean, currentOpenItems: RelationshipItem[]): IntegratedConversionState {
  if (!needSufficient) return 'NOT_READY';
  return currentOpenItems.length > 0 ? 'READY_WITH_OPEN_ITEMS' : 'READY';
}

export function deriveContinuationMode(readiness: IntegratedConversionState): IntegratedContinuationMode {
  if (readiness === 'NOT_READY') return 'CLARIFY';
  if (readiness === 'READY_WITH_OPEN_ITEMS') return 'CONTINUE_WITH_OPEN_ITEM';
  return 'CONTINUE_TO_NEXT_WORK';
}

function actionType(action: NextAction | undefined): NextAction['type'] | null {
  return action?.type ?? null;
}

export function realizeProjectedResponse(
  projected: ProjectedItem,
  conversionReadiness: IntegratedConversionState,
  rawVisibleResponse: string | null,
  rawNextAction: NextAction | undefined,
): string {
  if (projected.current_relevance === 'LATER' && conversionReadiness === 'READY') {
    return 'La decisión actual está clara y podemos continuar; este detalle pertenece al trabajo posterior.';
  }
  if (conversionReadiness === 'READY_WITH_OPEN_ITEMS') return rawVisibleResponse ?? 'La decisión puede continuar con este punto abierto.';
  if (conversionReadiness === 'NOT_READY') return rawVisibleResponse ?? (actionType(rawNextAction) === 'ASK' ? 'Aún falta una aclaración para continuar.' : 'Aún no hay base suficiente para continuar.');
  return rawVisibleResponse ?? 'La decisión actual está clara y podemos continuar.';
}

export function integrateDecisionReadinessProjection(input: {
  decision_readiness: DecisionReadinessRun;
  unresolved_item: RelationshipItem;
  need_sufficient: boolean;
  raw_visible_response?: string | null;
}): IntegratedProjection {
  const metadata = extractDecisionReadinessMetadata(input.decision_readiness);
  const projected = projectItem(input.unresolved_item, metadata);
  const current_open_items = projected.current_open_items;
  const later_work_items = projected.later_work_items;
  const unresolved_relationship_items = projected.current_relevance === 'UNRESOLVED' ? [input.unresolved_item] : [];
  const conversion_readiness = deriveConversionState(input.need_sufficient, current_open_items);
  const continuation_mode = deriveContinuationMode(conversion_readiness);
  return {
    decision_readiness: metadata,
    projected,
    current_relevance: projected.current_relevance,
    current_open_items,
    later_work_items,
    unresolved_relationship_items,
    relationship_resolution_required: unresolved_relationship_items.length > 0,
    need_sufficient: input.need_sufficient,
    conversion_readiness,
    continuation_mode,
    visible_response: realizeProjectedResponse(projected, conversion_readiness, input.raw_visible_response ?? null, metadata.next_action),
  };
}
