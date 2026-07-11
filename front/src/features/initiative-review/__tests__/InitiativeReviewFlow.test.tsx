import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const navigate = vi.fn();
let params: Record<string, string> = { reviewId: 'rev1' };
vi.mock('react-router', () => ({
  useParams: () => params,
  useNavigate: () => navigate,
}));

const client = {
  getReview: vi.fn(),
  createReview: vi.fn(),
  addContext: vi.fn(),
  saveStrategicAnswers: vi.fn(),
  confirmRoute: vi.fn(),
};
vi.mock('../services/initiativeReviewClient', () => ({
  getReview: (id: string) => client.getReview(id),
  createReview: (t: string, ctx?: string[]) => client.createReview(t, ctx),
  addContext: (id: string, context: string) => client.addContext(id, context),
  saveStrategicAnswers: (id: string, answers: Array<{ id: string; answer?: string; unknown?: boolean }>) => client.saveStrategicAnswers(id, answers),
  confirmRoute: (id: string) => client.confirmRoute(id),
}));

import { InitiativeReviewResultPage } from '../pages/InitiativeReviewResultPage';
import { InitiativeReviewStartPage } from '../pages/InitiativeReviewStartPage';

const SNAPSHOT = {
  id: 'snap1',
  version: 1,
  understandingSummary: 'Entiendo que quieres ordenar las compras.',
  suggestedChallengeType: 'correction',
  selectedChallengeType: 'correction',
  challengeTypeReason: 'Reduce una fricción existente.',
  informationReadiness: 'low',
  critique: { solid: 's', weak: 'w', risky: 'r', recommendedAdjustment: 'a', mainRisk: 'mr' },
  strategicQuestions: [
    { id: 'q1', question: '¿Dónde empezar?', options: ['Un área', 'Un proceso'], allowsUnknown: true, status: 'unanswered' },
  ],
  improvedProposal: { suggestedName: 'Optimización de compras', improvedDescription: 'd', initialFocus: 'f', expectedImpact: 'menos tiempo', nextRecommendedStep: 'Step 0' },
  routePreview: [0, 1, 2, 3, 4].map((n) => ({ step: n, name: `Step ${n}`, whatWillHappen: 'x', expectedOutput: 'y', status: n === 0 ? 'active' : 'locked' })),
};

describe('InitiativeReviewResultPage (IR-F1/F3)', () => {
  beforeEach(() => {
    navigate.mockReset();
    params = { reviewId: 'rev1' };
    client.getReview.mockReset().mockResolvedValue({ id: 'rev1', status: 'generated', originalInput: 'x', addedContext: [], challengeId: null, snapshot: SNAPSHOT });
    client.addContext.mockReset().mockResolvedValue({ id: 'rev1', status: 'updated', originalInput: 'x', addedContext: ['ctx'], challengeId: null, snapshot: { ...SNAPSHOT, id: 'snap2', version: 2 } });
    client.saveStrategicAnswers.mockReset().mockResolvedValue({
      id: 'rev1',
      status: 'updated',
      originalInput: 'x',
      addedContext: [],
      challengeId: null,
      snapshot: { ...SNAPSHOT, strategicQuestions: [{ ...SNAPSHOT.strategicQuestions[0], status: 'unknown' }] },
    });
    client.confirmRoute.mockReset().mockResolvedValue({ routeConfirmationId: 'rc1', initiativeId: 'proj1', overviewUrl: '/initiatives/proj1/overview' });
  });

  it('renderiza los 6 bloques, incl. understanding y challenge type', async () => {
    render(<InitiativeReviewResultPage />);
    expect(await screen.findByTestId('card-understanding')).toHaveTextContent('ordenar las compras');
    expect(screen.getByTestId('card-challenge-type')).toHaveTextContent('Corrección');
    for (const id of ['card-critique', 'card-questions', 'card-proposal', 'card-route']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it('guarda respuestas estratégicas incluyendo No lo sé aún', async () => {
    render(<InitiativeReviewResultPage />);
    const unknown = await screen.findByRole('button', { name: /No lo sé aún/i });
    fireEvent.click(unknown);
    await waitFor(() => expect(client.saveStrategicAnswers).toHaveBeenCalledWith('rev1', [{ id: 'q1', unknown: true }]));
  });

  it('agrega contexto y regenera el snapshot via API real', async () => {
    render(<InitiativeReviewResultPage />);
    fireEvent.change(await screen.findByLabelText(/Agregar contexto antes de confirmar/i), { target: { value: 'Tenemos dos semanas.' } });
    fireEvent.click(screen.getByRole('button', { name: /Actualizar revisión/i }));
    await waitFor(() => expect(client.addContext).toHaveBeenCalledWith('rev1', 'Tenemos dos semanas.'));
  });

  it('el CTA confirma la ruta via API real y navega al Overview', async () => {
    render(<InitiativeReviewResultPage />);
    const cta = await screen.findByRole('button', { name: /Estoy de acuerdo con esta ruta/i });
    fireEvent.click(cta);
    await waitFor(() => expect(client.confirmRoute).toHaveBeenCalledWith('rev1'));
    expect(navigate).toHaveBeenCalledWith('/initiatives/proj1/overview');
  });
});

describe('InitiativeReviewStartPage (IR-F3)', () => {
  beforeEach(() => {
    navigate.mockReset();
    client.createReview.mockReset().mockResolvedValue({ id: 'revNew', status: 'generated', originalInput: 'x', addedContext: [], challengeId: null, snapshot: SNAPSHOT });
  });

  it('crea la revision via API con contexto opcional y navega al Result', async () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.change(screen.getByLabelText(/Describe tu iniciativa/i), { target: { value: 'Quiero mejorar el proceso de compras menores.' } });
    fireEvent.change(screen.getByLabelText(/Contexto adicional opcional/i), { target: { value: 'Solo tenemos dos semanas.' } });
    fireEvent.click(screen.getByRole('button', { name: /Revisar mi propuesta/i }));
    await waitFor(() => expect(client.createReview).toHaveBeenCalledWith('Quiero mejorar el proceso de compras menores.', ['Solo tenemos dos semanas.']));
    expect(navigate).toHaveBeenCalledWith('/initiatives/review/revNew');
  });

  it('no permite enviar con input demasiado corto', () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.change(screen.getByLabelText(/Describe tu iniciativa/i), { target: { value: 'corto' } });
    expect(screen.getByRole('button', { name: /Revisar mi propuesta/i })).toBeDisabled();
  });
});
