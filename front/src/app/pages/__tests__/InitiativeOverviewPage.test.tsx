/**
 * InitiativeOverviewPage.test.tsx — IR-F2 (ADR-025, PRD §12, AC-OV-001..008).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InitiativeOverviewPage } from '../InitiativeOverviewPage';

const navigate = vi.fn();
vi.mock('react-router', () => ({
  useParams: () => ({ projectId: 'p1' }),
  useNavigate: () => navigate,
}));

const getById = vi.fn();
vi.mock('../../services/projectService', () => ({
  getById: (id: string) => getById(id),
}));

const PROJECT = {
  id: 'p1',
  name: 'Optimización de aprobación de compras',
  status: 'DRAFT',
  step0Status: 'NOT_STARTED',
  step0Data: {
    source: 'initial_review',
    challengeType: 'correction',
    mainRisk: 'Solución prematura sin evidencia.',
    contextInitial: 'Reducir demoras en aprobaciones.',
    pendingQuestions: [{ id: 'q1' }, { id: 'q2' }],
  },
};

describe('InitiativeOverviewPage (IR-F2)', () => {
  beforeEach(() => {
    navigate.mockReset();
    getById.mockReset();
    getById.mockResolvedValue(PROJECT);
  });

  it('muestra la iniciativa en Draft con el mapa Step 0–4 (Step 0 activo, 1–4 bloqueados)', async () => {
    render(<InitiativeOverviewPage />);

    expect(await screen.findByText(/Estado: Draft/i)).toBeInTheDocument();
    expect(screen.getByText(PROJECT.name)).toBeInTheDocument();

    // AC-OV-003/004: Step 0 activo, 1–4 bloqueados.
    expect(screen.getByTestId('overview-step-0')).toHaveAttribute('data-state', 'active');
    for (const n of [1, 2, 3, 4]) {
      expect(screen.getByTestId(`overview-step-${n}`)).toHaveAttribute('data-state', 'locked');
    }
  });

  it('muestra el resumen de la revisión inicial (AC-OV-005)', async () => {
    render(<InitiativeOverviewPage />);
    expect(await screen.findByText(/Corrección/)).toBeInTheDocument(); // challengeType mapeado
    expect(screen.getByText(/Solución prematura/)).toBeInTheDocument(); // riesgo principal
    expect(screen.getByText(/2 pasan al Step 0/)).toBeInTheDocument(); // preguntas pendientes
  });

  it('el CTA "Empezar Step 0" navega al Step 0 (AC-OV-006)', async () => {
    render(<InitiativeOverviewPage />);
    const cta = await screen.findByRole('button', { name: /Empezar Step 0/i });
    fireEvent.click(cta);
    expect(navigate).toHaveBeenCalledWith('/projects/p1/step/0');
  });

  it('muestra un error si no se puede cargar la iniciativa', async () => {
    getById.mockRejectedValueOnce(new Error('boom'));
    render(<InitiativeOverviewPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos cargar/i);
  });
});
