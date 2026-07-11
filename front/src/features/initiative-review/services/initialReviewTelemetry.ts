export type InitialReviewEventName =
  | 'initial_review_started'
  | 'initial_review_generated'
  | 'initial_review_context_added'
  | 'initial_review_question_answered'
  | 'route_preview_viewed'
  | 'route_confirmed'
  | 'route_confirm_failed'
  | 'initiative_created_from_route'
  | 'initiative_overview_opened'
  | 'step0_started_from_overview';

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
