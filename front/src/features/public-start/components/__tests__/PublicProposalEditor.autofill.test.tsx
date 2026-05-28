import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import {
  AutofillProvider,
  useAutofillContext,
} from '../../../../app/context/AutofillContext';
import type { AutofillProposalDto } from '../../../../app/services/pdfAutofillService';
import { PublicProposalEditor } from '../PublicProposalEditor';
import type { PublicDraft } from '../../domain/types';

/**
 * Issue #25 — editor proposals.
 *
 * Mounts the REAL PublicProposalEditor inside the REAL AutofillProvider (no
 * reducer mock) and seeds a proposal for the active field's `step0.*` path
 * (`proposalTitle` → `step0.initiativeTitle`). Asserts the "Propuesto por IA"
 * chip and the Confirmar action surface, proving the editor wiring works.
 *
 * The backend mutation calls are stubbed; the public path is local-only
 * anyway (AutofillLocalPersistenceProvider), but stubbing keeps the test
 * hermetic regardless.
 */

vi.mock('../../../../app/services/featureFlags', () => ({
  isEnabled: () => true,
  isPdfAutofillEnabled: () => true,
}));

vi.mock('../../../../app/services/pdfAutofillService', async () => {
  const actual = await vi.importActual<
    typeof import('../../../../app/services/pdfAutofillService')
  >('../../../../app/services/pdfAutofillService');
  return {
    ...actual,
    confirmProposal: vi.fn().mockResolvedValue(undefined),
    editProposal: vi.fn().mockResolvedValue(undefined),
    discardProposal: vi.fn().mockResolvedValue(undefined),
    restoreProposal: vi.fn().mockResolvedValue(undefined),
    resolveConflict: vi.fn().mockResolvedValue(undefined),
  };
});

const DRAFT_ID = 'draft-editor-1';

function makeDraft(): PublicDraft {
  const now = new Date();
  return {
    id: DRAFT_ID,
    anonymousSessionId: 'anon-1',
    mode: 'initiative',
    inputText: 'Documento: propuesta.pdf',
    sourceType: 'file',
    aiOutput: {
      proposalTitle: '',
      whatToMove: '',
      whyNow: '',
      impactedAudience: '',
      initialEvidence: '',
      supportNeeded: '',
      decisionRequested: '',
      suggestedChallengeType: 'correction',
      suggestedKpiOrSignal: '',
      missingCriticalFields: [],
      risks: [],
      nextRecommendedAction: '',
      confidenceScore: 0.5,
    },
    status: 'created',
    questions: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
  };
}

function makeDto(): AutofillProposalDto {
  return {
    fieldPath: 'step0.initiativeTitle',
    proposedValue: 'Programa de retención de clientes',
    status: 'unconfirmed',
    provenance: {
      sourcePdfId: 'pdf-1',
      sourcePdfName: 'propuesta.pdf',
      pageNumbers: [1],
      quotedExcerpt: 'Iniciativa: Programa de retención de clientes',
      confidenceScore: 0.92,
      confidenceBand: 'high',
    },
    confidenceScore: 0.92,
    confidenceBand: 'high',
    runId: 'run-1',
  };
}

// Seeds a proposal into the real context for the draft, keyed by draftId.
function SeededHarness({
  proposal,
  children,
}: {
  proposal: AutofillProposalDto;
  children: React.ReactNode;
}) {
  const { dispatch } = useAutofillContext();
  React.useEffect(() => {
    dispatch({ type: 'MERGE_FROM_RUN', initiativeId: DRAFT_ID, proposals: [proposal] });
  }, [dispatch, proposal]);
  return <>{children}</>;
}

describe('PublicProposalEditor autofill wiring (issue #25)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Propuesto por IA" chip for the seeded step0.* field', async () => {
    render(
      <MemoryRouter>
        <AutofillProvider>
          <SeededHarness proposal={makeDto()}>
            <PublicProposalEditor initialDraft={makeDraft()} />
          </SeededHarness>
        </AutofillProvider>
      </MemoryRouter>,
    );

    // Default active field is `proposalTitle` → `step0.initiativeTitle`.
    expect(await screen.findByText('Propuesto por IA')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Confirmar/i }),
    ).toBeInTheDocument();
  });
});
