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
  | 'step0_started_from_overview'
  // ADR-026 (IRC-06): telemetría del chat del asistente (PRD §5).
  | 'chat_message_sent'
  | 'chat_context_added'
  | 'chat_question_answered'
  | 'snapshot_diff_announced'
  | 'chat_confirm_route';

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
  mode?: string; // ADR-026: modo del turno de chat (answer/context/doubt)
  changedCount?: number; // ADR-026: nº de secciones anunciadas como cambiadas
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
