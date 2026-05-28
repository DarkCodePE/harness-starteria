import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { AutofillProvider } from '../../../../app/context/AutofillContext';
import { PublicProposalEditor } from '../PublicProposalEditor';
import type { PublicDraft, PublicDraftOutput } from '../../domain/types';

/**
 * Field-selector dropdown — replaces the previous vertical button list.
 *
 * The trigger reflects the active field, opens to reveal every editable
 * field with its status icon + status pill, and remains keyboard accessible
 * (Arrow keys / Enter / Escape) and outside-click dismissable.
 */

vi.mock('../../../../app/services/featureFlags', () => ({
  isEnabled: () => false,
  isPdfAutofillEnabled: () => false,
}));

const DRAFT_ID = 'draft-dropdown-1';

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
    inputText: 'Idea original de prueba para dropdown selector.',
    sourceType: 'text',
    aiOutput: output,
    status: 'created',
    questions: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
  };
}

function renderEditor(draft: PublicDraft = makeDraft()) {
  return render(
    <MemoryRouter>
      <AutofillProvider>
        <PublicProposalEditor initialDraft={draft} />
      </AutofillProvider>
    </MemoryRouter>,
  );
}

const FIELD_LABELS = [
  'Nombre de la iniciativa',
  'Que quieres mover',
  'Por que importa ahora',
  'A quien impacta',
  'Que respaldo o senal tienes',
  'Que apoyo necesitas',
];

describe('PublicProposalEditor field dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger with the active field label', () => {
    renderEditor();
    const trigger = screen.getByRole('button', { name: /Seleccionar campo/i });
    // Trigger should expose the active field's label.
    expect(trigger).toHaveTextContent('Nombre de la iniciativa');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the dropdown and reveals every editable field option', async () => {
    const user = userEvent.setup();
    renderEditor();

    const trigger = screen.getByRole('button', { name: /Seleccionar campo/i });
    await user.click(trigger);

    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(FIELD_LABELS.length);

    FIELD_LABELS.forEach(label => {
      expect(within(listbox).getByText(label)).toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the status pill for a completed field inside the dropdown', async () => {
    const user = userEvent.setup();
    renderEditor(
      makeDraft(
        makeOutput({
          proposalTitle: 'Programa de retencion de clientes con datos reales',
        }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /Seleccionar campo/i }));

    const listbox = await screen.findByRole('listbox');
    const titleOption = within(listbox)
      .getByText('Nombre de la iniciativa')
      .closest('[role="option"]') as HTMLElement;
    expect(titleOption).not.toBeNull();
    expect(within(titleOption).getByText('Completo')).toBeInTheDocument();
    expect(titleOption).toHaveAttribute('aria-selected', 'true');
  });

  it('selecting an option updates the trigger and the active editor section', async () => {
    const user = userEvent.setup();
    renderEditor();

    const trigger = screen.getByRole('button', { name: /Seleccionar campo/i });
    await user.click(trigger);

    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Por que importa ahora'));

    // Dropdown closes and trigger reflects the newly active field.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Por que importa ahora');
    // The editor heading for the active field also updates.
    expect(
      screen.getByRole('heading', { name: /Por que importa resolverlo ahora\?/i }),
    ).toBeInTheDocument();
  });

  it('Escape closes the dropdown without changing the active field', async () => {
    const user = userEvent.setup();
    renderEditor();

    const trigger = screen.getByRole('button', { name: /Seleccionar campo/i });
    await user.click(trigger);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Nombre de la iniciativa');
  });

  it('Arrow keys navigate and Enter selects the highlighted option', async () => {
    const user = userEvent.setup();
    renderEditor();

    const trigger = screen.getByRole('button', { name: /Seleccionar campo/i });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();

    // ArrowDown twice from initially-highlighted index 0 -> index 2 ("Por que importa ahora").
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Por que importa ahora');
  });

  it('clicking outside the dropdown closes the panel', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: /Seleccionar campo/i }));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();

    // Click on the page heading (well outside the dropdown).
    await user.click(
      screen.getByRole('heading', { level: 1, name: /Propuesta de iniciativa/i }),
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
