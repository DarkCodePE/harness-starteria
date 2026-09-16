import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Alert, AlertDescription, AlertTitle } from '../alert';

describe('Alert', () => {
  it('renders semantic feedback variants without domain states', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Check this</AlertTitle>
        <AlertDescription>Something needs attention.</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole('alert');
    expect(alert.className).toMatch(/status-feedback-warning/);
    expect(screen.getByText('Check this')).toHaveAttribute('data-slot', 'alert-title');
  });

  it('keeps destructive as a compatibility alias for danger feedback', () => {
    render(<Alert variant="destructive">Danger</Alert>);
    expect(screen.getByRole('alert').className).toMatch(/status-feedback-danger/);
  });
});
