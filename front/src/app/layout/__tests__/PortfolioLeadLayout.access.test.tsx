/**
 * PortfolioLeadLayout.access.test.tsx — quién puede ver la capa estratégica.
 *
 * El borde que fijaron estos tests en #156 (ADR-028) se conserva intacto: admin y
 * portfolio lead entran, los demás siguen fuera. Lo que cambió con ADR-029 es CÓMO
 * se decide — el guard pregunta por el permiso `portfolio:read`, no por el rol.
 *
 * REPARTO DE RESPONSABILIDAD: que `portfolio_lead` y `admin` TENGAN ese permiso lo
 * prueba el backend (`backend/shared/authz/__tests__/permissions.test.ts`), que es
 * donde vive la tabla de derivación. Aquí se prueba lo del frontend: dado el
 * permiso, se renderiza; sin él, se redirige. Duplicar la tabla en este archivo
 * repetiría el defecto que ADR-028 denunció.
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

// Lo que el backend envía en el payload del usuario para cada rol (ADR-029).
// Es un espejo de la tabla real, sólo para armar el fixture — la tabla se prueba allí.
const PERMISOS_POR_ROL: Record<string, string[]> = {
  portfolio_lead: ['portfolio:read', 'portfolio:write'],
  admin: ['portfolio:read', 'portfolio:write', 'users:assign-roles', 'project:own'],
  owner: ['project:own'],
  mentor: ['mentor:panel'],
  sponsor: ['sponsor:decide'],
};

const sesion = (role: string) => ({ role, permissions: PERMISOS_POR_ROL[role] ?? [] });

let currentUser: { role: string; permissions: string[] } | null = sesion('portfolio_lead');
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
    currentUser = sesion('portfolio_lead');
    render(<PortfolioLeadLayout />);
    expect(entra()).toBe(true);
  });

  it('un admin entra: el backend ya le autoriza las escrituras de portafolio', () => {
    currentUser = sesion('admin');
    render(<PortfolioLeadLayout />);
    expect(entra()).toBe(true);
    expect(navigate).not.toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it.each(['owner', 'mentor', 'sponsor'])('un %s sigue fuera, redirigido al dashboard', role => {
    currentUser = sesion(role);
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
