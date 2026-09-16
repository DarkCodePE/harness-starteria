import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XIcon } from 'lucide-react';

import { IconButton } from '../icon-button';

describe('IconButton', () => {
  it('requires an accessible name through aria-label at use sites', () => {
    render(
      <IconButton aria-label="Close panel">
        <XIcon />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Close panel' });
    expect(button).toHaveAttribute('data-slot', 'icon-button');
  });

  it('forwards disabled state through the Button foundation', () => {
    render(
      <IconButton aria-label="Disabled action" disabled>
        <XIcon />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Disabled action' })).toBeDisabled();
  });
});
