/**
 * AppLayout.dual-role.test.tsx — la regresión que motiva ADR-029.
 *
 * `AppLayout` tenía este redirect:
 *
 *     if (user?.role === 'portfolio_lead') navigate('/portfolio/inicio', { replace: true });
 *
 * Comparaba el rol PRIMARIO, así que quien fuera participante Y portfolio lead
 * quedaba encerrado en /portfolio: perdía su dashboard, sus iniciativas y el flujo
 * Step 0-4. No había ningún test que lo cubriera — por eso el encierro sobrevivió.
 *
 * Este archivo existe para que no vuelva.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '../AppLayout';

const navigate = vi.fn();
// Se parte del módulo real y sólo se sustituye la navegación: el árbol usa más
// exports de react-router (matchPath, useParams, ...) y enumerarlos a mano
// convierte el mock en una lista que se rompe cada vez que cambia un hijo.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  Outlet: () => <div data-testid="contenido-workspace" />,
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

let currentUser: { role: string; permissions: string[]; initials: string; name: string } | null = null;
vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    isAuthenticated: currentUser !== null,
    user: currentUser,
    logout: vi.fn(),
    setUserRole: vi.fn(),
    projects: [],
  }),
}));

const sesion = (role: string, permissions: string[]) => ({
  role,
  permissions,
  initials: 'XX',
  name: 'Usuario de prueba',
});

/** ¿Se le echó del workspace hacia la capa estratégica? */
const expulsadoAPortafolio = () =>
  navigate.mock.calls.some(([destino]) => String(destino).startsWith('/portfolio'));

describe('AppLayout — el portfolio lead ya no queda encerrado (ADR-029)', () => {
  beforeEach(() => {
    navigate.mockReset();
    currentUser = null;
  });

  it('un portfolio lead que TAMBIÉN es participante conserva su workspace', () => {
    // El caso normal, no el borde: quien dirige el portafolio suele ser también
    // quien levanta iniciativas.
    currentUser = sesion('participante', ['project:own', 'portfolio:read', 'portfolio:write']);

    render(<AppLayout />);

    expect(expulsadoAPortafolio(), 'fue expulsado del workspace').toBe(false);
  });

  it('un portfolio lead "puro" tampoco es expulsado: elige zona, no se le impone', () => {
    // Antes, ESTE era el caso que disparaba el redirect. Ahora la zona se elige
    // (WorkspaceSwitcher) en vez de imponerse por igualdad de rol.
    currentUser = sesion('portfolio_lead', ['portfolio:read', 'portfolio:write']);

    render(<AppLayout />);

    expect(expulsadoAPortafolio()).toBe(false);
  });

  it('un participante sin portafolio sigue exactamente igual', () => {
    // Equivalencia: quien pertenece a una sola superficie no debe notar nada.
    currentUser = sesion('participante', ['project:own']);

    render(<AppLayout />);

    expect(expulsadoAPortafolio()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sin sesión sigue yendo a /auth', () => {
    currentUser = null;

    render(<AppLayout />);

    expect(navigate).toHaveBeenCalledWith('/auth', { replace: true });
  });
});

describe('el menú se compone por PERMISOS, no por el rol primario', () => {
  const enMenu = (etiqueta: string | RegExp) => screen.queryAllByRole('button', { name: etiqueta }).length > 0;

  beforeEach(() => {
    navigate.mockReset();
    currentUser = null;
  });

  it('un admin con participante de PRIMARIO ve la sección de administración', () => {
    // La regresión concreta: pasó en producción. `{participante, admin}` tenía el
    // permiso `users:assign-roles` y NO veía el enlace, porque el menú se elegía con
    // `user.role === 'admin'`. Autorizado por API, invisible por pantalla — el mismo
    // defecto que el parche #156 vino a arreglar, reintroducido por la puerta de atrás.
    currentUser = sesion('participante', [
      'project:own',
      'users:assign-roles',
      'cohort:manage',
      'portfolio:read',
    ]);

    render(<AppLayout />);

    expect(enMenu('Roles de plataforma'), 'no ve el enlace que su permiso le concede').toBe(true);
    expect(enMenu('Panel cohorte')).toBe(true);
    expect(enMenu('Portafolio')).toBe(true);
  });

  it('un participante no ve nada de administración', () => {
    currentUser = sesion('participante', ['project:own']);

    render(<AppLayout />);

    expect(enMenu('Roles de plataforma')).toBe(false);
    expect(enMenu('Panel cohorte')).toBe(false);
    expect(enMenu('Portafolio')).toBe(false);
    // Y conserva lo suyo.
    expect(enMenu('Evidencias')).toBe(true);
    expect(enMenu('Mi perfil')).toBe(true);
  });

  it('un mentor ve su panel y nada de admin', () => {
    currentUser = sesion('mentor', ['mentor:panel']);

    render(<AppLayout />);

    expect(enMenu('Revisiones pendientes')).toBe(true);
    expect(enMenu('Roles de plataforma')).toBe(false);
    expect(enMenu('Todos los proyectos')).toBe(true);
  });

  it('un sponsor conserva su menú mínimo', () => {
    currentUser = sesion('sponsor', ['sponsor:decide']);

    render(<AppLayout />);

    expect(enMenu('Iniciativas patrocinadas')).toBe(true);
    expect(enMenu('Evidencias')).toBe(false);
    expect(enMenu('Roles de plataforma')).toBe(false);
  });

  it('un portfolio lead ve el acceso a la capa estratégica', () => {
    currentUser = sesion('portfolio_lead', ['portfolio:read', 'portfolio:write']);

    render(<AppLayout />);

    expect(enMenu('Portafolio')).toBe(true);
    expect(enMenu('Roles de plataforma')).toBe(false);
  });
});
