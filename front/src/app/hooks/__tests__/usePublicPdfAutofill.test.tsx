import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

import {
  AutofillProvider,
  selectProposal,
  useAutofillContext,
} from '../../context/AutofillContext';
import type { AutofillProposalDto } from '../../services/pdfAutofillService';
import { usePublicPdfAutofill } from '../usePublicPdfAutofill';

/**
 * Issue #24 — public upload flow.
 *
 * Verifies that `usePublicPdfAutofill` (the anonymous mirror of the
 * authenticated hook) uploads → polls → merges the returned proposals into the
 * AutofillContext keyed by the anonymous `draftId`. The public service is
 * mocked so no real HTTP happens.
 */

vi.mock('../../services/publicPdfAutofillService', () => ({
  uploadPublicPdf: vi.fn(),
  getPublicExtractionRunStatus: vi.fn(),
  listPublicProposals: vi.fn(),
}));

import {
  uploadPublicPdf,
  getPublicExtractionRunStatus,
  listPublicProposals,
} from '../../services/publicPdfAutofillService';

const uploadMock = vi.mocked(uploadPublicPdf);
const statusMock = vi.mocked(getPublicExtractionRunStatus);
const proposalsMock = vi.mocked(listPublicProposals);

const DRAFT_ID = 'draft-abc';
const SESSION_ID = 'anon-123';

function makeDto(overrides: Partial<AutofillProposalDto> = {}): AutofillProposalDto {
  return {
    fieldPath: 'step0.initiativeTitle',
    proposedValue: 'Reducir demoras en aprobaciones',
    status: 'unconfirmed',
    provenance: {
      sourcePdfId: 'pdf-1',
      sourcePdfName: 'propuesta.pdf',
      pageNumbers: [1],
      quotedExcerpt: 'Iniciativa: reducir demoras',
      confidenceScore: 0.88,
      confidenceBand: 'high',
    },
    confidenceScore: 0.88,
    confidenceBand: 'high',
    runId: 'run-9',
    ...overrides,
  };
}

// Harness: drives the upload and renders what the context holds for the draft.
function Harness({ file }: { file: File }) {
  const { upload, status } = usePublicPdfAutofill(DRAFT_ID, SESSION_ID);
  const { state } = useAutofillContext();
  const proposal = selectProposal(state, DRAFT_ID, 'step0.initiativeTitle');

  return (
    <div>
      <button type="button" onClick={() => upload(file)}>
        do-upload
      </button>
      <span data-testid="status">{status}</span>
      <span data-testid="merged-value">
        {proposal ? String(proposal.proposedValue) : 'none'}
      </span>
    </div>
  );
}

describe('usePublicPdfAutofill — public upload flow (issue #24)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads, polls to completion, and merges proposals into context keyed by draftId', async () => {
    uploadMock.mockResolvedValue({ runId: 'run-9', draftId: DRAFT_ID });
    statusMock.mockResolvedValue({ status: 'completed' });
    proposalsMock.mockResolvedValue([makeDto()]);

    const file = new File(['%PDF-1.4'], 'propuesta.pdf', { type: 'application/pdf' });

    render(
      <AutofillProvider>
        <Harness file={file} />
      </AutofillProvider>,
    );

    await act(async () => {
      screen.getByText('do-upload').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('merged-value').textContent).toBe(
        'Reducir demoras en aprobaciones',
      );
    });

    expect(uploadMock).toHaveBeenCalledWith(
      file,
      SESSION_ID,
      DRAFT_ID,
      expect.any(Function),
    );
    expect(proposalsMock).toHaveBeenCalledWith('run-9');
    expect(screen.getByTestId('status').textContent).toBe('done');
  });

  it('marks the run failed when the backend reports a failure', async () => {
    uploadMock.mockResolvedValue({ runId: 'run-x', draftId: DRAFT_ID });
    statusMock.mockResolvedValue({ status: 'failed', errorMessage: 'boom' });

    const file = new File(['%PDF-1.4'], 'propuesta.pdf', { type: 'application/pdf' });

    render(
      <AutofillProvider>
        <Harness file={file} />
      </AutofillProvider>,
    );

    await act(async () => {
      screen.getByText('do-upload').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('failed');
    });
    expect(screen.getByTestId('merged-value').textContent).toBe('none');
    expect(proposalsMock).not.toHaveBeenCalled();
  });
});
