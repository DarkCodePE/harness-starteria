import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Checkbox } from '../checkbox';
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Switch } from '../switch';
import { Select, SelectTrigger, SelectValue } from '../select';

describe('Selection primitives', () => {
  it('supports checkbox accessible interaction', async () => {
    render(<Checkbox aria-label="Accept" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('supports radio accessible interaction', async () => {
    render(
      <RadioGroup aria-label="Mode">
        <RadioGroupItem value="compact" aria-label="Compact" />
        <RadioGroupItem value="comfortable" aria-label="Comfortable" />
      </RadioGroup>,
    );

    const compact = screen.getByRole('radio', { name: 'Compact' });
    await userEvent.click(compact);
    expect(compact).toBeChecked();
  });

  it('supports switch accessible interaction', async () => {
    render(<Switch aria-label="Enable" />);

    const control = screen.getByRole('switch', { name: 'Enable' });
    await userEvent.click(control);
    expect(control).toBeChecked();
  });

  it('renders a labelled select trigger', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Status">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAttribute('data-slot', 'select-trigger');
  });
});
