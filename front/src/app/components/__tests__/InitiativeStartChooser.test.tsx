import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { InitiativeStartChooser } from '../InitiativeStartChooser';

/**
 * Unit (London-style) test for the Option C first-run chooser. The component
 * is pure/prop-driven; the parent (ProjectHomePage) owns the gating logic, so
 * here we only assert the contract: which options render and which callbacks
 * fire. Collaborators are mocked with vi.fn().
 */
describe('InitiativeStartChooser (Option C first-run chooser)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows both options when autofill is enabled', () => {
    render(
      <InitiativeStartChooser
        autofillEnabled
        onChooseManual={vi.fn()}
        onChooseUpload={vi.fn()}
      />,
    );
    expect(screen.getByTestId('start-option-upload')).toBeInTheDocument();
    expect(screen.getByTestId('start-option-manual')).toBeInTheDocument();
    expect(screen.getByText('Tengo un documento')).toBeInTheDocument();
    expect(screen.getByText('Empezar en blanco')).toBeInTheDocument();
  });

  it('hides the document option when autofill is disabled', () => {
    render(
      <InitiativeStartChooser
        autofillEnabled={false}
        onChooseManual={vi.fn()}
        onChooseUpload={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('start-option-upload')).toBeNull();
    expect(screen.getByTestId('start-option-manual')).toBeInTheDocument();
  });

  it('fires onChooseManual when "Empezar en blanco" is clicked', () => {
    const onChooseManual = vi.fn();
    render(
      <InitiativeStartChooser
        autofillEnabled
        onChooseManual={onChooseManual}
        onChooseUpload={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('start-option-manual'));
    expect(onChooseManual).toHaveBeenCalledTimes(1);
  });

  it('fires onChooseUpload when "Tengo un documento" is clicked', () => {
    const onChooseUpload = vi.fn();
    render(
      <InitiativeStartChooser
        autofillEnabled
        onChooseManual={vi.fn()}
        onChooseUpload={onChooseUpload}
      />,
    );
    fireEvent.click(screen.getByTestId('start-option-upload'));
    expect(onChooseUpload).toHaveBeenCalledTimes(1);
  });
});
