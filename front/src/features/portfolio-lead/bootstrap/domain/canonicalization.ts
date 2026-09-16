import type { ProposedMutation, ProvenanceStatus } from './types';

export function canTransitionProvenance(
  from: ProvenanceStatus,
  to: ProvenanceStatus,
  hasHumanConfirmation = false,
): boolean {
  if (from === to) return true;
  if (from === 'AI_SUGGESTED' && to === 'USER_CONFIRMED') return hasHumanConfirmation;
  if (from === 'AI_INFERRED' && to === 'USER_CONFIRMED') return hasHumanConfirmation;
  if (from === 'USER_CONFIRMED' && to === 'CANONICAL') return true;
  if (from === 'AI_INFERRED' && to === 'CANONICAL') return false;
  if (from === 'AI_SUGGESTED' && to === 'CANONICAL') return false;
  return false;
}

export function canApplyProposedMutation(mutation: ProposedMutation): boolean {
  if (mutation.status !== 'confirmed') return false;
  if (mutation.material && !mutation.humanConfirmation) return false;
  return canTransitionProvenance(mutation.provenance, 'USER_CONFIRMED', Boolean(mutation.humanConfirmation));
}

export function applyProposedMutationToGovernedState<TState extends Record<string, unknown>>(
  governedState: TState,
  mutation: ProposedMutation<Partial<TState>>,
): TState {
  if (!canApplyProposedMutation(mutation)) return governedState;
  return { ...governedState, ...mutation.proposedValue };
}
