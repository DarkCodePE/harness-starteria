import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { appRoutes } from './routes';
import { LandingPage } from './pages/LandingPage';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('./context/AppContext', () => ({
  useApp: () => ({
    isAuthenticated: false,
  }),
}));

vi.mock('./components/landing/HeroTunnel', () => ({
  HeroTunnel: () => null,
}));

describe('public entry routing', () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it('mantiene / como landing publica fuera del guard autenticado', () => {
    const root = appRoutes[0];
    const indexRoute = root.children?.find(route => route.index === true);

    expect(indexRoute?.Component).toBe(LandingPage);
  });

  it('permite ir desde la landing al login real', () => {
    render(<LandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesi/i }));

    expect(navigate).toHaveBeenCalledWith('/auth');
  });

  it('expone Portfolio Entry desde la landing sin CTA legacy de preproyecto', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', {
      name: /Convierte tus iniciativas en decisiones conectadas al negocio/i,
    })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Analizar mi situaci[oó]n/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Crear pre proyecto/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Analizar mi situaci[oó]n/i })[0]);

    expect(navigate).toHaveBeenCalledWith('/public/start');
  });
});
