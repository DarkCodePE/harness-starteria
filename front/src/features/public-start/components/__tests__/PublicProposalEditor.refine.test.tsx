/**
 * TASK-014 — editor uses the REAL AI refine bridge, with a local heuristic
 * fallback so the editor never breaks (ADR-016 / PRD-003 US-002 / NFR-3).
 *
 * Locks:
 *   - "Ajustar con IA" calls the refine service and shows its suggestion
 *   - when the service rejects (down/timeout/429), a fallback suggestion still
 *     renders — the UI does not crash and the user is never blocked
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const { refineMock } = vi.hoisted(() => ({ refineMock: vi.fn() }));
vi.mock('../../services/publicFieldRefineService', () => ({
  refinePublicField: refineMock,
}));

import { PublicProposalEditor } from '../PublicProposalEditor';
import type { PublicDraft } from '../../domain/types';

function makeDraft(): PublicDraft {
  return {
    id: 'draft-refine-1',
    anonymousSessionId: 'anon-1',
    mode: 'initiative',
    inputText: 'ordenar la carga de proyectos entre áreas',
    sourceType: 'text',
    status: 'edited',
    createdAt: '2026-05-29T10:00:00.000Z',
    updatedAt: '2026-05-29T10:00:00.000Z',
    expiresAt: '2026-06-29T10:00:00.000Z',
    aiOutput: {
      proposalTitle: 'Orden de proyectos',
      whatToMove: 'ordenar proyectos',
      whyNow: 'hay sobrecarga',
      impactedAudience: 'equipo',
      suggestedChallengeType: 'correction',
      missingCriticalFields: [],
      risks: [],
      nextRecommendedAction: 'seguir',
    },
  };
}

function renderEditor() {
  return render(
    <MemoryRouter>
      <PublicProposalEditor initialDraft={makeDraft()} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  refineMock.mockReset();
  window.localStorage.clear();
});

describe('PublicProposalEditor — AI refine + fallback', () => {
  it('shows the real AI suggestion when the bridge succeeds', async () => {
    refineMock.mockResolvedValue({
      suggestedValue: 'Ordenar la gestión de proyectos simultáneos entre Tax & Legal.',
      rationale: 'Más concreto y accionable.',
      confidence: 0.84,
    });

    renderEditor();
    fireEvent.click(screen.getByText('Ajustar con IA'));

    expect(await screen.findByText(/Ordenar la gestión de proyectos simultáneos/)).toBeInTheDocument();
    expect(refineMock).toHaveBeenCalledTimes(1);
    // NO-PII context: the call must not carry user identity fields.
    const [, , context] = refineMock.mock.calls[0];
    expect(JSON.stringify(context)).not.toMatch(/email|phone|name/i);
  });

  it('falls back to a local suggestion when the bridge fails (UI never breaks)', async () => {
    refineMock.mockRejectedValue(new Error('Network Error / 429'));

    renderEditor();
    fireEvent.click(screen.getByText('Ajustar con IA'));

    // The suggestion panel still appears (fallback heuristic) — no crash.
    await waitFor(() => expect(screen.getByText('Sugerencia IA')).toBeInTheDocument());
    expect(refineMock).toHaveBeenCalledTimes(1);
  });
});
