import { isPortfolioAnchorSufficient } from './anchor';
import type { NextBestPortfolioAction, PortfolioBootstrapState } from './types';

const ACTIONS: Record<NextBestPortfolioAction['id'], NextBestPortfolioAction> = {
  resolve_information_conflict: {
    id: 'resolve_information_conflict',
    label: 'Resolver conflicto de informacion',
    reason: 'Hay una contradiccion critica que cambia el sentido del portfolio.',
  },
  complete_portfolio_anchor: {
    id: 'complete_portfolio_anchor',
    label: 'Completar anchor de portfolio',
    reason: 'Aun falta contexto minimo para organizar el trabajo.',
  },
  bring_existing_work: {
    id: 'bring_existing_work',
    label: 'Traer trabajo existente',
    reason: 'El anchor ya permite revisar iniciativas o lineas de trabajo actuales.',
  },
  review_proposed_structure: {
    id: 'review_proposed_structure',
    label: 'Revisar estructura propuesta',
    reason: 'Hay trabajo detectado pendiente de revision material.',
  },
  review_blocking_condition: {
    id: 'review_blocking_condition',
    label: 'Revisar condicion bloqueante',
    reason: 'Una condicion afecta el movimiento del portfolio.',
  },
  review_decision: {
    id: 'review_decision',
    label: 'Revisar decision pendiente',
    reason: 'La lectura contiene una decision que requiere atencion.',
  },
  review_portfolio_attention: {
    id: 'review_portfolio_attention',
    label: 'Revisar atencion de portfolio',
    reason: 'La primera lectura ya existe y hay senales que revisar.',
  },
};

export function resolveNextBestPortfolioAction(state: PortfolioBootstrapState): NextBestPortfolioAction {
  const blockers = (state.attentionSignals ?? []).filter(
    (condition) => condition.severity === 'blocking' && condition.affectsMovement,
  );
  const workItems = state.detectedWorkItems ?? [];

  if ((state.anchor?.criticalContradictions ?? []).length > 0) return ACTIONS.resolve_information_conflict;
  if (!isPortfolioAnchorSufficient(state.anchor)) return ACTIONS.complete_portfolio_anchor;
  if (workItems.length === 0 && state.existingWorkStatus !== 'no_existing_work') return ACTIONS.bring_existing_work;
  if (state.materialReviewPending || workItems.some((item) => item.materialReviewRequired)) {
    return ACTIONS.review_proposed_structure;
  }
  if (blockers.length > 0) return ACTIONS.review_blocking_condition;
  if (state.decisionRequired) return ACTIONS.review_decision;

  return ACTIONS.review_portfolio_attention;
}

export function isForbiddenPortfolioActionLabel(label: string): boolean {
  const normalized = label.toLowerCase();
  return [
    'crear primer frente',
    'crear primer reto',
    'empezar step 0',
    'crear iniciativa individual',
  ].some((forbidden) => normalized.includes(forbidden));
}
