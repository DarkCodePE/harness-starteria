import { isPortfolioAnchorSufficient } from './anchor';
import type { HomeState, PortfolioBootstrapState } from './types';

export function resolvePortfolioHomeState(state: PortfolioBootstrapState): HomeState {
  const workItems = state.detectedWorkItems ?? [];
  const attentionSignals = state.attentionSignals ?? [];

  if (!state.continuationExists || !isPortfolioAnchorSufficient(state.anchor)) {
    return 'HOME_A';
  }

  if (state.firstReadingPublished && state.decisionRequired) {
    return 'HOME_F';
  }

  if (state.firstReadingPublished && attentionSignals.length > 0) {
    return 'HOME_E';
  }

  if (state.firstReadingPublished) {
    return 'HOME_D';
  }

  if (workItems.length === 0 && state.existingWorkStatus !== 'no_existing_work') {
    return 'HOME_B';
  }

  if (state.materialReviewPending || workItems.some((item) => item.materialReviewRequired)) {
    return 'HOME_C';
  }

  return 'HOME_C';
}
