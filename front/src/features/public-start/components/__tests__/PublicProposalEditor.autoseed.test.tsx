import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import {
  AutofillProvider,
  useAutofillContext,
} from '../../../../app/context/AutofillContext';
import type { AutofillProposalDto } from '../../../../app/services/pdfAutofillService';
import { PublicProposalEditor } from '../PublicProposalEditor';
import type { PublicDraft, PublicDraftOutput } from '../../domain/types';

/**
 * Issue — auto-seed `draft.aiOutput.*` from AutofillContext proposals.
 *
 * After uploading a PDF on /public/start, the agent emits proposals into
 * AutofillContext keyed by `draft.id`. The one-pager preview on the right
 * reads `draft.aiOutput.*` and used to show "Pendiente por completar."
 * until the user confirmed each chip on the left editor. This is bad UX:
 * the user expects the extracted values to populate the preview
 * immediately so they can review the proposal as a whole and only tweak
 * what's wrong.
 *
 * These tests assert the editor seeds `aiOutput` from proposals on mount,
 * does NOT overwrite values the user already typed, and marks the seeded
 * fields as "Afinado con IA".
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

const DRAFT_ID = 'draft-autoseed-1';

function makeOutput(overrides: Partial<PublicDraftOutput> = {}): PublicDraftOutput {
  return {
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
    ...overrides,
  };
}

function makeDraft(output: PublicDraftOutput = makeOutput()): PublicDraft {
  const now = new Date();
  return {
    id: DRAFT_ID,
    anonymousSessionId: 'anon-1',
    mode: 'initiative',
    inputText: 'Documento: propuesta.pdf',
    sourceType: 'file',
    aiOutput: output,
    status: 'created',
    questions: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
  };
}

function makeProposal(
  fieldPath: string,
  proposedValue: string,
): AutofillProposalDto {
  return {
    fieldPath,
    proposedValue,
    status: 'unconfirmed',
    provenance: {
      sourcePdfId: 'pdf-1',
      sourcePdfName: 'propuesta.pdf',
      pageNumbers: [1],
      quotedExcerpt: proposedValue,
      confidenceScore: 0.9,
      confidenceBand: 'high',
    },
    confidenceScore: 0.9,
    confidenceBand: 'high',
    runId: 'run-autoseed',
  };
}

// Seeds proposals into the real context for the draft, keyed by DRAFT_ID.
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

function renderEditor(
  proposals: AutofillProposalDto[],
  draft: PublicDraft = makeDraft(),
) {
  return render(
    <MemoryRouter>
      <AutofillProvider>
        <SeededHarness proposals={proposals}>
          <PublicProposalEditor initialDraft={draft} />
        </SeededHarness>
      </AutofillProvider>
    </MemoryRouter>,
  );
}

describe('PublicProposalEditor — auto-seed aiOutput from proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds the one-pager preview with proposal values for title and impact', async () => {
    const proposals = [
      makeProposal('step0.initiativeTitle', 'Programa de retención de clientes'),
      makeProposal('step0.impactWho', 'Equipo comercial y clientes prioritarios'),
    ];
    renderEditor(proposals);

    // The proposal title heading in the preview (h2) — was previously the
    // fallback "Propuesta de iniciativa". Now it must reflect the seeded
    // value.
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: /Programa de retención de clientes/i,
      }),
    ).toBeInTheDocument();

    // The "Que sabemos hoy" panel renders Impacto: <value>. Locate by the
    // panel heading then assert the impact text shows up inside it.
    const queSabemosHeading = await screen.findByRole('heading', {
      level: 3,
      name: /Que sabemos hoy/i,
    });
    const queSabemosPanel = queSabemosHeading.closest('section');
    expect(queSabemosPanel).not.toBeNull();
    expect(
      within(queSabemosPanel as HTMLElement).getByText(
        /Equipo comercial y clientes prioritarios/i,
      ),
    ).toBeInTheDocument();

    // None of the "Pendiente por completar." placeholders should remain on
    // the two seeded slots (Resumen ejecutivo uses whatToMove which is
    // still empty, so that one CAN still show the fallback — we only
    // assert the seeded ones are gone).
    expect(
      within(queSabemosPanel as HTMLElement).queryByText(
        /Pendiente por completar\./,
      ),
    ).toBeNull();
  });

  it('marks the seeded fields as "Afinado con IA" in the field dropdown', async () => {
    const proposals = [
      makeProposal('step0.initiativeTitle', 'Programa de retención de clientes'),
      makeProposal('step0.impactWho', 'Equipo comercial y clientes prioritarios'),
    ];
    renderEditor(proposals);

    // The dropdown trigger label tracks the active field's status pill.
    // proposalTitle is the default active field and just got seeded, so the
    // pill should read "Afinado con IA" (status: ai_refined).
    const trigger = await screen.findByRole('button', {
      name: /Seleccionar campo/i,
    });
    expect(within(trigger).getByText('Afinado con IA')).toBeInTheDocument();
  });

  it('does NOT overwrite a value the user already typed before proposals arrived', async () => {
    // Draft starts with a manually-set proposalTitle — proposals arrive
    // afterwards but must be ignored for that field.
    const userTitle = 'Mi propuesta personalizada';
    const draft = makeDraft(makeOutput({ proposalTitle: userTitle }));
    const proposals = [
      makeProposal(
        'step0.initiativeTitle',
        'Propuesta extraída por IA que no debería sobrescribir',
      ),
      makeProposal('step0.impactWho', 'Equipo comercial'),
    ];

    renderEditor(proposals, draft);

    // The preview h2 still shows the user's title, NOT the proposal's.
    expect(
      await screen.findByRole('heading', { level: 2, name: userTitle }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: /Propuesta extraída por IA que no debería sobrescribir/i,
      }),
    ).toBeNull();

    // Sanity check: the impactWho field WAS empty and HAS been seeded.
    const queSabemosHeading = await screen.findByRole('heading', {
      level: 3,
      name: /Que sabemos hoy/i,
    });
    const queSabemosPanel = queSabemosHeading.closest('section');
    expect(queSabemosPanel).not.toBeNull();
    expect(
      within(queSabemosPanel as HTMLElement).getByText(/Equipo comercial/i),
    ).toBeInTheDocument();
  });
});
