import { useEffect, useMemo } from 'react';
import { selectProposal, useAutofillContext } from '../../../app/context/AutofillContext';
import { getPublicDraft } from '../services/publicDraftStorage';
import { updatePublicDraftAnswers } from '../services/publicDraftService';
import type { PublicDraft, PublicDraftOutput } from '../domain/types';
import { STEP0_FIELD_PATH } from '../domain/step0FieldPath';
import { ADVISOR_FIELDS } from '../components/PublicCompletionAdvisor';

/**
 * usePublicDraftAutoSeed — defensive mirror of `PublicProposalEditor`'s
 * auto-seed effect for pages that ALSO consume the public draft (e.g.
 * `ProgressiveSignupPage`).
 *
 * Why a second seed? The extractor occasionally drops some step0.* fields
 * (e.g. under transient 429 rate-limits) and the editor's seed runs only
 * while the editor is mounted. When the user navigates onwards before all
 * proposals have arrived, the draft they see on the next page can still be
 * partial. This hook re-runs the patching logic on mount and whenever the
 * AutofillContext proposals for `draftId` change, so late-arriving values
 * still make it into the draft.
 *
 * It is idempotent (only seeds empty fields), safe when AutofillContext is
 * empty (no proposals → no patch), and persists through the existing
 * `updatePublicDraftAnswers` storage helper.
 *
 * The hook returns nothing — it invokes `onPatched(refreshed)` so callers can
 * refresh their local state with the persisted draft. We deliberately keep
 * the storage read out of the hook's return to avoid stale-closure issues.
 */
export function usePublicDraftAutoSeed(
  draftId: string | undefined,
  draft: PublicDraft | null,
  onPatched: (refreshed: PublicDraft) => void,
): void {
  const { state: autofillState } = useAutofillContext();

  // Value-based signature so the seed effect only re-runs when proposals for
  // the editor's tracked field paths actually change. Keeps the dependency
  // boring and avoids re-firing for unrelated context dispatches.
  const proposalSignature = useMemo(() => {
    if (!draftId) return '';
    const slice = autofillState.byInitiative[draftId];
    if (!slice) return '';
    const parts: string[] = [];
    for (const advisorField of ADVISOR_FIELDS) {
      const path = STEP0_FIELD_PATH[advisorField.id as string];
      if (!path) continue;
      const proposal = slice[path];
      if (!proposal) continue;
      const effective = (proposal.finalValue ?? proposal.proposedValue) as unknown;
      parts.push(`${advisorField.id}:${typeof effective === 'string' ? effective : ''}`);
    }
    return parts.join('|');
  }, [autofillState.byInitiative, draftId]);

  useEffect(() => {
    if (!draftId || !draft) return;
    const current = draft.aiOutput;
    const patch: Record<string, string> = {};
    for (const advisorField of ADVISOR_FIELDS) {
      const fieldId = advisorField.id as keyof PublicDraftOutput;
      const path = STEP0_FIELD_PATH[fieldId as string];
      if (!path) continue;
      const proposal = selectProposal(autofillState, draftId, path);
      if (!proposal) continue;
      const raw = (proposal.finalValue ?? proposal.proposedValue) as unknown;
      if (typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const existing = String(current[fieldId] ?? '').trim();
      if (existing) continue;
      patch[String(fieldId)] = trimmed;
    }
    if (Object.keys(patch).length === 0) return;
    updatePublicDraftAnswers(draftId, patch);
    const refreshed = getPublicDraft(draftId);
    if (refreshed) onPatched(refreshed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalSignature, draftId]);
}
