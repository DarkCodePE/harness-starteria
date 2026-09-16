import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PortfolioLeadHomePage } from '../PortfolioLeadHomePage';
import { makeBootstrap } from '../../../features/portfolio-lead/bootstrap/testing/bootstrapFixtures';

const createOrReuse = vi.fn();

vi.mock('../../../features/portfolio-lead/bootstrap/services/portfolioBootstrapClient', () => ({
  createOrReusePortfolioBootstrapSession: (...args: unknown[]) => createOrReuse(...args),
  getPortfolioBootstrapSession: vi.fn(),
  updatePortfolioBootstrapAnchor: vi.fn(),
  confirmPortfolioBootstrapAnchor: vi.fn(),
  pastePortfolioBootstrapWorkItems: vi.fn(),
  addManualPortfolioBootstrapWorkItem: vi.fn(),
  declareNoExistingPortfolioBootstrapWork: vi.fn(),
  updatePortfolioBootstrapWorkItem: vi.fn(),
  removePortfolioBootstrapWorkItem: vi.fn(),
  analyzePortfolioBootstrapWork: vi.fn(),
  confirmPortfolioBootstrapProposedMutation: vi.fn(),
  correctPortfolioBootstrapProposedMutation: vi.fn(),
  rejectPortfolioBootstrapProposedMutation: vi.fn(),
  leavePortfolioBootstrapProposedMutationPending: vi.fn(),
  publishPortfolioBootstrapFirstReading: vi.fn(),
  getLatestPortfolioBootstrapReading: vi.fn(),
  PortfolioBootstrapClientError: class PortfolioBootstrapClientError extends Error {
    apiError = { message: this.message };
  },
}));

vi.mock('../../../features/portfolio-lead', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../features/portfolio-lead')>();
  return {
    ...actual,
    usePortfolioLead: () => ({
      strategicFronts: [],
      challenges: [],
      initiatives: [],
      initiativeOverlaps: [],
      portfolioDecisions: [],
      executiveOutputs: [],
      refreshPortfolioData: vi.fn(),
    }),
  };
});

vi.mock('../../services/featureFlags', () => ({
  isPortfolioCopilotEnabled: () => false,
}));

function renderPage(path = '/portfolio/inicio?portfolioEntryContinuationId=cont-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PortfolioLeadHomePage />
    </MemoryRouter>,
  );
}

describe('PortfolioLeadHomePage Bootstrap integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOrReuse.mockResolvedValue(makeBootstrap('anchor_sufficient'));
  });

  it('uses continuation query to create or reuse BootstrapSession and render HOME_B', async () => {
    renderPage();

    expect(await screen.findByTestId('portfolio-bootstrap-home-b')).toBeInTheDocument();
    expect(createOrReuse).toHaveBeenCalledWith('cont-1');
    expect(screen.getByRole('button', { name: /Incorporar trabajo existente/i })).toBeInTheDocument();
  });

  it('does not render object-first primary actions when continuation governs the page', async () => {
    renderPage();

    await waitFor(() => expect(createOrReuse).toHaveBeenCalled());
    expect(screen.queryByText(/Crear frente estrategico/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Crear reto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Crear iniciativa individual/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 0/i)).not.toBeInTheDocument();
  });

  it('preserves the operational Home when no continuation is present', () => {
    renderPage('/portfolio/inicio');

    expect(createOrReuse).not.toHaveBeenCalled();
    expect(screen.getByText(/Resumen secundario del portafolio/i)).toBeInTheDocument();
  });
});
