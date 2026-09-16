import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PortfolioAttentionList } from '../PortfolioAttentionList';
import type { PortfolioAlert, PortfolioNextAction } from '../../../domain/types';

const fallbackAction: PortfolioNextAction = {
  label: 'Revisar portafolio',
  description: 'Mantener seguimiento.',
  path: '/portfolio/inicio',
};

describe('PortfolioAttentionList', () => {
  it('renders existing alerts through the DS attention pattern without changing action destinations', () => {
    const onNavigate = vi.fn();
    const alerts: PortfolioAlert[] = [
      {
        id: 'alert-1',
        tone: 'rose',
        type: 'blocker',
        title: 'Iniciativa bloqueada',
        description: 'Necesita una decision de destrabe.',
        contextLabel: 'Frente / Reto',
        whyItMatters: 'El caso ya no avanza solo.',
        recommendedAction: 'Resolver bloqueo.',
        actionLabel: 'Ir a seguimiento',
        actionPath: '/portfolio/iniciativas?initiativeId=init-1',
      },
    ];

    render(<PortfolioAttentionList alerts={alerts} fallbackAction={fallbackAction} onNavigate={onNavigate} />);

    expect(screen.getByText('Iniciativa bloqueada')).toBeInTheDocument();
    expect(screen.getByText('Frente / Reto')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ir a seguimiento/i }));

    expect(onNavigate).toHaveBeenCalledWith('/portfolio/iniciativas?initiativeId=init-1');
  });

  it('uses the canonical empty state and preserves the fallback action path', () => {
    const onNavigate = vi.fn();

    render(<PortfolioAttentionList alerts={[]} fallbackAction={fallbackAction} onNavigate={onNavigate} />);

    expect(screen.getByText(/No hay alertas operativas criticas ahora/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Revisar portafolio/i }));

    expect(onNavigate).toHaveBeenCalledWith('/portfolio/inicio');
  });
});
