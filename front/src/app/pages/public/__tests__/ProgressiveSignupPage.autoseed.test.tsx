import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import {
  AutofillProvider,
  useAutofillContext,
} from '../../../context/AutofillContext';
import type { AutofillProposalDto } from '../../../services/pdfAutofillService';
import { ProgressiveSignupPage } from '../ProgressiveSignupPage';
import { savePublicDraft } from '../../../../features/public-start/services/publicDraftStorage';
import { getPublicDraft } from '../../../../features/public-start/services/publicDraftStorage';
import type {
  PublicDraft,
  PublicDraftOutput,
} from '../../../../features/public-start/domain/types';

/**
 * Issue — defensive auto-seed on `/auth/continue/:draftId`.
 *
 * The extractor sometimes drops some step0.* fields under transient
 * 429 rate-limits. The editor's seed effect (PublicProposalEditor) only
 * runs while the editor is mounted; once the user clicks "Continuar" and
 * lands on this page, late-arriving proposals would not patch the draft
 * — and the right-hand one-pager kept showing "Pendiente por completar"
 * for fields that proposals actually have values for.
 *
 * This test seeds a partial draft in sessionStorage + a proposal in
 * AutofillContext, mounts the page at /auth/continue/:draftId, and asserts
 * (a) the preview reflects the proposal value (no fallback), and
 * (b) sessionStorage now persists the seeded value.
 */

// Mock AppContext.useApp so we don't need an AppProvider tree.
vi.mock('../../../context/AppContext', () => {
  return {
    useApp: () => ({
      authLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      user: null,
      createProjectFromPublicDraft: vi.fn(),
    }),
  };
});

// Feature flag on (matches the editor's autoseed test).
vi.mock('../../../services/featureFlags', () => ({
  isEnabled: () => true,
  isPdfAutofillEnabled: () => true,
}));

const DRAFT_ID = 'draft-progressive-autoseed-1';

function makeOutput(overrides: Partial<PublicDraftOutput> = {}): PublicDraftOutput {
  return {
    proposalTitle: 'Programa inicial',
    whatToMove: '', // intentionally empty so the auto-seed has work to do.
    whyNow: 'Si se posterga, el equipo seguira perdiendo seguimiento.',
    impactedAudience: 'Equipo comercial y clientes prioritarios',
    initialEvidence: 'Reclamos repetidos en el reporte semanal',
    supportNeeded: 'Permiso para validar con usuarios',
    decisionRequested: '',
    suggestedChallengeType: 'correction',
    suggestedKpiOrSignal: 'Reducción de demoras visibles',
    missingCriticalFields: [],
    risks: [],
    nextRecommendedAction: 'Completar evidencia y apoyo necesario.',
    confidenceScore: 0.5,
    ...overrides,
  };
}

function seedDraft(output: PublicDraftOutput = makeOutput()): PublicDraft {
  const now = new Date();
  const draft: PublicDraft = {
    id: DRAFT_ID,
    anonymousSessionId: 'anon-1',
    mode: 'initiative',
    inputText: 'Documento: propuesta.pdf',
    sourceType: 'file',
    aiOutput: output,
    status: 'edited',
    questions: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
  };
  savePublicDraft(draft);
  return draft;
}

function makeProposal(fieldPath: string, value: string): AutofillProposalDto {
  return {
    fieldPath,
    proposedValue: value,
    status: 'unconfirmed',
    provenance: {
      sourcePdfId: 'pdf-1',
      sourcePdfName: 'propuesta.pdf',
      pageNumbers: [1],
      quotedExcerpt: value,
      confidenceScore: 0.9,
      confidenceBand: 'high',
    },
    confidenceScore: 0.9,
    confidenceBand: 'high',
    runId: 'run-progressive-autoseed',
  };
}

// Seeds proposals into the real AutofillContext for the draft.
function SeededHarness({
  proposals,
  children,
}: {
  proposals: AutofillProposalDto[];
  children: React.ReactNode;
}) {
  const { dispatch } = useAutofillContext();
  React.useEffect(() => {
    dispatch({
      type: 'MERGE_FROM_RUN',
      initiativeId: DRAFT_ID,
      proposals,
    });
  }, [dispatch, proposals]);
  return <>{children}</>;
}

function renderPage(proposals: AutofillProposalDto[]) {
  return render(
    <MemoryRouter initialEntries={[`/auth/continue/${DRAFT_ID}`]}>
      <AutofillProvider>
        <SeededHarness proposals={proposals}>
          <Routes>
            <Route path="/auth/continue/:draftId" element={<ProgressiveSignupPage />} />
          </Routes>
        </SeededHarness>
      </AutofillProvider>
    </MemoryRouter>,
  );
}

describe('ProgressiveSignupPage — defensive auto-seed from AutofillContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure a clean sessionStorage between tests.
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
  });

  it('seeds an empty draft.aiOutput field with the matching proposal value AND persists it', async () => {
    seedDraft();
    const proposals = [
      makeProposal('step0.quePasaQueQuieres', 'Reducir el tiempo de aprobación interna'),
    ];
    renderPage(proposals);

    // The "Qué quiere mover" preview panel must show the seeded value, not
    // the "Pendiente por completar." fallback.
    const heading = await screen.findByText('Qué quiere mover');
    const panel = heading.closest('section') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(
      within(panel).getByText(/Reducir el tiempo de aprobación interna/i),
    ).toBeInTheDocument();
    expect(within(panel).queryByText(/Pendiente por completar\./)).toBeNull();

    // The draft in sessionStorage was patched too — proves the seed went
    // through `updatePublicDraftAnswers` and not just local React state.
    const persisted = getPublicDraft(DRAFT_ID);
    expect(persisted).not.toBeNull();
    expect(persisted?.aiOutput.whatToMove).toBe(
      'Reducir el tiempo de aprobación interna',
    );
  });

  it('does not overwrite a value the user already had in the draft', async () => {
    // whatToMove pre-populated — proposals must NOT clobber it.
    seedDraft(
      makeOutput({ whatToMove: 'Texto previo que el usuario escribió' }),
    );
    const proposals = [
      makeProposal('step0.quePasaQueQuieres', 'Texto IA que no debería sobrescribir'),
    ];
    renderPage(proposals);

    const heading = await screen.findByText('Qué quiere mover');
    const panel = heading.closest('section') as HTMLElement;
    expect(
      within(panel).getByText(/Texto previo que el usuario escribió/i),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByText(/Texto IA que no debería sobrescribir/i),
    ).toBeNull();

    const persisted = getPublicDraft(DRAFT_ID);
    expect(persisted?.aiOutput.whatToMove).toBe(
      'Texto previo que el usuario escribió',
    );
  });

  it('renders the advisor card with the correct N/M meter for partial drafts', async () => {
    // Draft has: proposalTitle, whyNow, impactedAudience, initialEvidence,
    // supportNeeded filled — 5 of 6. Only whatToMove is missing.
    seedDraft();
    renderPage([]);

    const advisor = await screen.findByTestId('public-completion-advisor');
    expect(within(advisor).getByTestId('advisor-meter-label')).toHaveTextContent(
      '5/6 campos completos',
    );
  });

  it('hides the advisor card when all editable fields are present', async () => {
    seedDraft(makeOutput({
      whatToMove: 'Reducir abandono de clientes con planes activos',
    }));
    renderPage([]);

    // Wait for the page to be ready by finding a known heading.
    await screen.findByText('Por qué importa ahora');
    // The advisor must be hidden when nothing is missing.
    expect(screen.queryByTestId('public-completion-advisor')).toBeNull();
  });
});
