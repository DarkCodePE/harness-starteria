/**
 * STEP0_FIELD_PATH — shared map from the public editor's local field ids
 * (keys of `PublicDraftOutput`) to the canonical `step0.*` field paths used by
 * the AutofillContext proposals (and the authenticated Step0Page).
 *
 * Kept in a tiny, self-contained module so both `PublicProposalEditor` and
 * `ProgressiveSignupPage` can run the same auto-seed logic without duplicating
 * the constant. Mirrors the keys used by Step0Page so a draft converts cleanly
 * once the user signs up.
 */
export const STEP0_FIELD_PATH: Record<string, string> = {
  proposalTitle: 'step0.initiativeTitle',
  whatToMove: 'step0.quePasaQueQuieres',
  whyNow: 'step0.whyNowText',
  impactedAudience: 'step0.impactWho',
  initialEvidence: 'step0.currentEvidence',
  supportNeeded: 'step0.supportNeeded',
  decisionRequested: 'step0.decisionRequested',
};
