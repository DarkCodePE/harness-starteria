/**
 * PortfolioLeadLayout.access.test.tsx — quién puede ver la capa estratégica.
 *
 * El guard sólo admitía `portfolio_lead`, pero el backend concede las escrituras de
 * portafolio a `admin` TAMBIÉN (`requireRole('admin', 'portfolio_lead')`, ADR-028).
 * Un admin estaba autorizado por API y bloqueado por pantalla.
 *
 * Lo que estos tests fijan es el borde: admin entra, y los demás roles siguen fuera —
 * que es la parte que de verdad hay que no romper.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioLeadLayout } from '../PortfolioLeadLayout';

const navigate = vi.fn();
vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="contenido-portafolio" />,
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: '/portfolio/inicio' }),
}));

let currentUser: { role: string } | null = { role: 'portfolio_lead' };
vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    isAuthenticated: currentUser !== null,
    user: currentUser,
    logout: vi.fn(),
    setUserRole: vi.fn(),
  }),
}));

vi.mock('../../portfolio/PortfolioLeadContext', () => ({
  usePortfolioLead: () => ({ initiatives: [] }),
}));

const entra = () => screen.queryByTestId('contenido-portafolio') !== null;

describe('PortfolioLeadLayout — quién accede a /portfolio', () => {
  beforeEach(() => navigate.mockReset());

  it('un portfolio_lead entra', () => {
    currentUser = { role: 'portfolio_lead' };
    render(<PortfolioLeadLayout />);
    expect(entra()).toBe(true);
  });

  it('un admin entra: el backend ya le autoriza las escrituras de portafolio', () => {
    currentUser = { role: 'admin' };
    render(<PortfolioLeadLayout />);
    expect(entra()).toBe(true);
    expect(navigate).not.toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it.each(['owner', 'mentor', 'sponsor'])('un %s sigue fuera, redirigido al dashboard', role => {
    currentUser = { role };
    render(<PortfolioLeadLayout />);
    expect(entra()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('sin sesión va a /auth, no al dashboard', () => {
    currentUser = null;
    render(<PortfolioLeadLayout />);
    expect(entra()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/auth', { replace: true });
  });
});
