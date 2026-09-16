import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('renders a textarea and forwards props', async () => {
    render(<Textarea aria-label="Notes" placeholder="Write notes" />);

    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute('data-slot', 'textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Write notes');

    await userEvent.type(textarea, 'hello');
    expect(textarea.value).toBe('hello');
  });

  it('supports invalid and disabled states', () => {
    render(<Textarea aria-label="Notes" aria-invalid="true" disabled />);

    const textarea = screen.getByLabelText('Notes');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toBeDisabled();
  });
});
