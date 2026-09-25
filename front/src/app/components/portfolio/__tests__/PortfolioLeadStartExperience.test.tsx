import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PortfolioLeadStartExperience } from '../PortfolioLeadStartExperience';

const { start } = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock('../../../../features/portfolio-lead/strategic-framing/service', () => ({ createOrReuseStrategicFramingFromSource: start }));

const props = () => ({ importOpen: false, onImportOpenChange: vi.fn(), onNavigate: vi.fn() });

describe('PortfolioLeadStartExperience SF-3D entries', () => {
  beforeEach(() => { vi.clearAllMocks(); start.mockResolvedValue({ workspacePath: '/portfolio/framing/state-1' }); });

  it('uses the same direct idempotency key when a failed request is retried', async () => {
    const user = userEvent.setup();
    start.mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce({ workspacePath: '/portfolio/framing/state-1' });
    render(<PortfolioLeadStartExperience {...props()} />);
    await user.click(screen.getByRole('button', { name: 'Iniciar framing' }));
    await user.type(screen.getByLabelText(/Qué quieres mover/i), 'Mover margen');
    await user.click(screen.getByRole('button', { name: 'Continuar a Strategic Framing' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Continuar a Strategic Framing' }));
    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[0][1]).toBeTruthy();
    expect(start.mock.calls[1][1]).toBe(start.mock.calls[0][1]);
  });

  it('generates a new key for a deliberately new direct start', async () => {
    const user = userEvent.setup();
    render(<PortfolioLeadStartExperience {...props()} />);
    await user.click(screen.getByRole('button', { name: 'Iniciar framing' }));
    await user.type(screen.getByLabelText(/Qué quieres mover/i), 'Mover margen');
    await user.click(screen.getByRole('button', { name: 'Continuar a Strategic Framing' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Iniciar framing' }));
    await user.click(screen.getByRole('button', { name: 'Continuar a Strategic Framing' }));
    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[1][1]).not.toBe(start.mock.calls[0][1]);
  });

  it('disables the direct submit while the request is in flight', async () => {
    const user = userEvent.setup();
    start.mockImplementation(() => new Promise(() => undefined));
    render(<PortfolioLeadStartExperience {...props()} />);
    await user.click(screen.getByRole('button', { name: 'Iniciar framing' }));
    await user.type(screen.getByLabelText(/Qué quieres mover/i), 'Mover margen');
    const submit = screen.getByRole('button', { name: 'Continuar a Strategic Framing' });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('requires an internal source id for the first Existing Portfolio UI', async () => {
    const user = userEvent.setup();
    render(<PortfolioLeadStartExperience {...props()} />);
    expect(screen.getByText('Revisar algo que ya existe')).toBeInTheDocument();
    expect(screen.getByText(/Revisa un Frente, Reto o iniciativa existente/)).toBeInTheDocument();
    expect(screen.getByText('Existing Portfolio')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir revisión estratégica' }));
    expect(screen.getByLabelText('ID de origen')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Revisar en Strategic Framing' }).at(-1)).toBeDisabled();
  });
});
