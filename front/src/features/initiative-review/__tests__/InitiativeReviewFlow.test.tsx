import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const navigate = vi.fn();
let params: Record<string, string> = { reviewId: 'rev1' };
vi.mock('react-router', () => ({
  useParams: () => params,
  useNavigate: () => navigate,
}));

const companies = [
  {
    id: 'co1',
    name: 'Unimaq',
    sector: 'Maquinaria',
    country: 'Peru',
    scope: 'PERSONAL',
    status: 'ACTIVE',
    versions: [{ id: 'v1', versionNumber: 1, contextScore: 74, contextLevel: 'USEFUL' }],
    areas: [{ id: 'area1', name: 'Servicios Offsite' }, { id: 'area2', name: 'Administracion' }],
    sources: [],
  },
  {
    id: 'co2',
    name: 'Starteria Org',
    sector: 'Innovacion',
    country: 'Peru',
    scope: 'ORGANIZATION',
    status: 'ACTIVE',
    versions: [{ id: 'v2', versionNumber: 1, contextScore: 81, contextLevel: 'SOLID' }],
    areas: [],
    sources: [],
  },
];

const companyService = {
  listCompanies: vi.fn(),
  createCompany: vi.fn(),
  createArea: vi.fn(),
};
vi.mock('../../../app/services/companyService', () => ({
  listCompanies: () => companyService.listCompanies(),
  createCompany: (payload: unknown) => companyService.createCompany(payload),
  createArea: (companyId: string, payload: unknown) => companyService.createArea(companyId, payload),
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
  createReview: (t: string, ctx?: string[], companyContext?: { companyId: string; areaId?: string } | null) => client.createReview(t, ctx, companyContext),
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
    companyService.listCompanies.mockReset().mockResolvedValue(companies);
    companyService.createCompany.mockReset().mockResolvedValue({ ...companies[0], id: 'co-new', name: 'Nueva Empresa', versions: [{ id: 'vn', versionNumber: 1, contextScore: 0, contextLevel: 'INITIAL' }], areas: [] });
    companyService.createArea.mockReset().mockResolvedValue({ id: 'area-new', name: 'Prime' });
  });

  it('renderiza un composer unico y elimina el contexto adicional opcional', async () => {
    render(<InitiativeReviewStartPage />);
    expect(screen.getByTestId('initiative-composer')).toBeInTheDocument();
    expect(screen.queryByText(/Contexto adicional opcional/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Contexto de empresa$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empresa o contexto/i })).toBeInTheDocument();
  });

  it('crea la revision sin empresa y navega al Result', async () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.change(screen.getByLabelText(/Describe tu iniciativa/i), { target: { value: 'Quiero mejorar el proceso de compras menores para reducir retrabajo operativo.' } });
    fireEvent.click(screen.getByRole('button', { name: /Revisar propuesta/i }));
    await waitFor(() => expect(client.createReview).toHaveBeenCalledWith('Quiero mejorar el proceso de compras menores para reducir retrabajo operativo.', [], null));
    expect(screen.getByText(/Puedes continuar sin empresa/i)).toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith('/initiatives/review/revNew');
  });

  it('no permite enviar con input demasiado corto', () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.change(screen.getByLabelText(/Describe tu iniciativa/i), { target: { value: 'corto' } });
    expect(screen.getByRole('button', { name: /Revisar propuesta/i })).toBeDisabled();
  });

  it('permite buscar empresa, seleccionar empresa y area, y conserva companyId y areaId al enviar', async () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.click(screen.getByRole('button', { name: /Empresa o contexto/i }));
    expect(await screen.findByText('Empresas recientes')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Buscar empresas/i), { target: { value: 'unimaq' } });
    fireEvent.click(await screen.findByRole('button', { name: /Unimaq/i }));
    fireEvent.click(screen.getByRole('button', { name: /Servicios Offsite/i }));
    expect(screen.getByRole('button', { name: /Unimaq · Servicios Offsite · 74 %/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Describe tu iniciativa/i), { target: { value: 'Quiero mejorar el proceso de compras menores para reducir retrabajo operativo.' } });
    fireEvent.click(screen.getByRole('button', { name: /Revisar propuesta/i }));
    await waitFor(() => expect(client.createReview).toHaveBeenCalledWith(
      'Quiero mejorar el proceso de compras menores para reducir retrabajo operativo.',
      [],
      { companyId: 'co1', areaId: 'area1' },
    ));
  });

  it('crea una empresa desde el selector y queda seleccionada', async () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.click(screen.getByRole('button', { name: /Empresa o contexto/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^Agregar una empresa$/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Nombre de empresa/i), { target: { value: 'Nueva Empresa' } });
    fireEvent.change(within(dialog).getByLabelText(/^Sector$/i), { target: { value: 'Retail' } });
    fireEvent.change(within(dialog).getByLabelText(/Pais principal/i), { target: { value: 'Peru' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Agregar una empresa/i }));
    await waitFor(() => expect(companyService.createCompany).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: /Nueva Empresa · 0 %/i })).toBeInTheDocument();
  });

  it('permite crear y seleccionar una nueva area', async () => {
    render(<InitiativeReviewStartPage />);
    fireEvent.click(screen.getByRole('button', { name: /Empresa o contexto/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Unimaq/i }));
    fireEvent.change(screen.getByPlaceholderText(/Agregar area/i), { target: { value: 'Prime' } });
    fireEvent.click(screen.getByRole('button', { name: /^Agregar$/i }));
    await waitFor(() => expect(companyService.createArea).toHaveBeenCalledWith('co1', { name: 'Prime' }));
    expect(screen.getByRole('button', { name: /Unimaq · Prime · 74 %/i })).toBeInTheDocument();
  });
});
