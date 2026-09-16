import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { PublicCompletionAdvisor } from '../PublicCompletionAdvisor';
import type { PublicDraftOutput } from '../../domain/types';

/**
 * PublicCompletionAdvisor — unit tests for the coach-style "what's missing"
 * card rendered on the public-to-signup landing page.
 *
 * The advisor reads the editable fields the editor cares about and emits a
 * completion meter, a tone-based status sentence and a list of missing
 * fields with per-field tips + a navigation CTA.
 */

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

function renderAdvisor(output: PublicDraftOutput, draftId = 'draft-1') {
  return render(
    <MemoryRouter>
      <PublicCompletionAdvisor draftId={draftId} output={output} />
    </MemoryRouter>,
  );
}

describe('PublicCompletionAdvisor', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the meter with the correct N/M for a partial draft', () => {
    // 2 of 6 filled → expect "2/6"
    const output = makeOutput({
      proposalTitle: 'Programa de retención',
      impactedAudience: 'Equipo comercial',
    });
    renderAdvisor(output);

    expect(screen.getByTestId('advisor-meter-label')).toHaveTextContent('2/6 campos completos');
    // Progress bar reflects the same ratio in its aria-valuenow.
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '2');
    expect(progress).toHaveAttribute('aria-valuemax', '6');
  });

  it('renders nothing when all editable fields are filled', () => {
    const output = makeOutput({
      proposalTitle: 'Programa de retención',
      whatToMove: 'Reducir abandono de clientes con planes activos',
      whyNow: 'Si se posterga, el churn semanal sigue creciendo',
      impactedAudience: 'Equipo comercial y clientes prioritarios',
      initialEvidence: 'Reporte de churn mensual',
      supportNeeded: 'Acceso al dato de churn y permiso para entrevistar a clientes',
    });
    renderAdvisor(output);

    // The advisor returns null → its testid should NOT be in the DOM.
    expect(screen.queryByTestId('public-completion-advisor')).toBeNull();
  });

  it('shows the indigo "buena base" copy when at least half the fields are filled', () => {
    // 4 of 6 filled → tone: indigo, missing 2.
    const output = makeOutput({
      proposalTitle: 'Programa de retención',
      whatToMove: 'Reducir abandono de clientes con planes activos',
      whyNow: 'Si se posterga, el churn semanal sigue creciendo',
      impactedAudience: 'Equipo comercial y clientes prioritarios',
    });
    renderAdvisor(output);

    expect(screen.getByText(/Buena base\./i)).toBeInTheDocument();
    expect(screen.getByText(/Faltan 2 campos para que tu propuesta sea más sólida/i)).toBeInTheDocument();
  });

  it('shows the amber "necesita más detalle" copy when fewer than half are filled', () => {
    // 1 of 6 filled → tone: amber, missing 5.
    const output = makeOutput({ proposalTitle: 'Programa de retención' });
    renderAdvisor(output);

    expect(screen.getByText(/Tu propuesta necesita más detalle/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltan 5 campos clave/i)).toBeInTheDocument();
  });

  it('lists the labels of the missing fields', () => {
    // Only proposalTitle filled. Expect labels for the other 5 to appear.
    const output = makeOutput({ proposalTitle: 'Programa de retención' });
    renderAdvisor(output);

    const card = screen.getByTestId('public-completion-advisor');
    // The 5 missing labels — drawn from ADVISOR_FIELDS.
    expect(within(card).getByText('Qué quiere mover')).toBeInTheDocument();
    expect(within(card).getByText('Por qué importa ahora')).toBeInTheDocument();
    expect(within(card).getByText('A quién impacta')).toBeInTheDocument();
    expect(within(card).getByText('Evidencia o señal')).toBeInTheDocument();
    expect(within(card).getByText('Apoyo necesario')).toBeInTheDocument();
    // The proposalTitle is filled — it must NOT be listed as missing.
    expect(within(card).queryByText('Nombre de la iniciativa')).toBeNull();
  });

  it('navigates to /public/draft/:draftId/edit when "Completar en el editor" is clicked', () => {
    const output = makeOutput({ proposalTitle: 'Programa de retención' });
    renderAdvisor(output, 'draft-abc');

    // Click the first CTA — it should navigate back to the editor.
    const buttons = screen.getAllByRole('button', { name: /Completar en el editor/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const call = mockNavigate.mock.calls[0][0] as string;
    expect(call).toMatch(/^\/public\/draft\/draft-abc\/edit/);
  });

  it('uses the onNavigateToEditor override when provided (bypasses useNavigate)', () => {
    // Allows hosts (or tests) to intercept the click. When provided, the
    // hook should NOT call useNavigate at all.
    const onNav = vi.fn();
    const output = makeOutput({ proposalTitle: 'Programa de retención' });
    render(
      <MemoryRouter>
        <PublicCompletionAdvisor draftId="draft-xyz" output={output} onNavigateToEditor={onNav} />
      </MemoryRouter>,
    );

    const buttons = screen.getAllByRole('button', { name: /Completar en el editor/i });
    fireEvent.click(buttons[0]);
    expect(onNav).toHaveBeenCalledTimes(1);
    expect(onNav).toHaveBeenCalledWith('draft-xyz', expect.any(String));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
