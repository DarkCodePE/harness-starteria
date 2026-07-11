export type InitialReviewEventName =
  | 'initial_review_started'
  | 'initial_review_generated'
  | 'initial_review_context_added'
  | 'initial_review_question_answered'
  | 'initial_review_route_confirmed'
  | 'initial_review_route_confirm_failed'
  | 'initial_review_overview_viewed'
  | 'initial_review_step0_started';

export interface InitialReviewEventDimensions {
  reviewId?: string;
  initiativeId?: string;
  snapshotId?: string;
  snapshotVersion?: number;
  questionId?: string;
  unknown?: boolean;
  contextCount?: number;
  source?: string;
  reason?: string;
}

export function trackInitialReviewEvent(
  event: InitialReviewEventName,
  dims: InitialReviewEventDimensions = {},
): void {
  const detail = { event, feature: 'initial_review', ...dims };
  const dataLayer = typeof window !== 'undefined'
    ? (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer
    : undefined;
  dataLayer?.push(detail);
  // eslint-disable-next-line no-console
  console.info('[initial-review-telemetry]', event, dims);
}
