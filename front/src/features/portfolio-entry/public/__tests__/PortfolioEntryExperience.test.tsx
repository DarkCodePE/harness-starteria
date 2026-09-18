import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PortfolioEntryExperience } from '../PortfolioEntryExperience';
import type { PortfolioEntryHandoff, PortfolioEntrySessionDto } from '../types';
import {
  readPendingPortfolioEntryClaim,
  saveClaimedPortfolioEntrySession,
  savePortfolioEntryCurrentSession,
} from '../storage';

const serviceMocks = vi.hoisted(() => ({
  createPortfolioEntrySession: vi.fn(),
  getPortfolioEntrySession: vi.fn(),
  getClaimedPortfolioEntrySession: vi.fn(),
  submitPortfolioEntryMessage: vi.fn(),
  chooseGuidedExploration: vi.fn(),
  materializePortfolioEntryHandoff: vi.fn(),
  correctPortfolioEntryHandoff: vi.fn(),
  confirmPortfolioEntryHandoff: vi.fn(),
  continuePortfolioEntryToPortfolio: vi.fn(),
  normalizePortfolioEntryApiError: vi.fn((err: { kind?: string; status?: number }) => ({
    kind: err.kind ?? 'network',
    status: err.status,
  })),
}));

const navigateSpy = vi.hoisted(() => vi.fn());

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

vi.mock('../portfolioEntryPublicService', () => serviceMocks);

vi.mock('../analytics', () => ({
  trackPortfolioEntryEvent: vi.fn(),
}));

function renderExperience() {
  return render(
    <MemoryRouter>
      <PortfolioEntryExperience />
    </MemoryRouter>,
  );
}

function makeHandoff(overrides: Partial<PortfolioEntryHandoff> = {}): PortfolioEntryHandoff {
  return {
    understanding: {
      value: 'El usuario necesita ordenar varias iniciativas antes del comite.',
      provenance: { origin: 'AI_INFERRED' },
    },
    desired_outcome: {
      value: 'Llegar con una lectura clara de foco y decisiones pendientes.',
      provenance: { origin: 'AI_INFERRED' },
    },
    decision_to_enable: {
      value: 'Decidir que iniciativas requieren continuidad o ajuste.',
      provenance: { origin: 'AI_INFERRED' },
    },
    recommended_approach: {
      description: 'Separar primero claridad de objetivo, iniciativas activas e incertidumbre.',
      rationale: 'Así la decisión parte del portfolio real y no de trabajo nuevo sin foco.',
      assumption: 'La actividad y la evidencia disponibles permiten comparar las iniciativas.',
      origin: 'AI_SUGGESTED',
      review_disposition: 'UNREVIEWED',
    },
    alternative_approaches: [{
      description: 'Empezar por la decisión más próxima si el tiempo del comité es limitado.',
      rationale: 'Reduce el alcance inicial, pero deja fuera parte del portfolio.',
      origin: 'AI_SUGGESTED',
      review_disposition: 'UNREVIEWED',
    }],
    known_context: [],
    unresolved_context: [{ gap_id: 'gap-1', description: 'Aun falta confirmar la metrica principal.' }],
    gap_resolution_map: [{
      gap_id: 'gap-1',
      gap_description: 'Aun falta confirmar la metrica principal.',
      resolution_type: 'REQUIRES_EXTERNAL_EVIDENCE',
      resolution_stage: 'PORTFOLIO',
    }],
    evidence_or_clarity_needed: [{ value: 'Metrica o senal de exito pendiente.' }],
    starteria_path: [{ action: 'structure', description: 'Estructurar las iniciativas y sus señales relevantes.' }],
    recommended_cta: 'Crear una lectura revisada antes de pasar a una cuenta.',
    provenance_summary: [],
    handoff_status: 'ready_with_uncertainty',
    ...overrides,
  };
}

function makeSession(overrides: Partial<PortfolioEntrySessionDto> = {}): PortfolioEntrySessionDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    lifecycleStatus: 'ENTRY_CAPTURED',
    executionStatus: 'ACTIVE',
    revision: 0,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ownership: { state: 'ANONYMOUS' },
    conversation: [],
    clarification: {
      interactionMode: 'quick_clarification',
      quickQuestionBudget: 3,
      quickQuestionsAsked: 0,
      explorationRound: 0,
      questionsAskedCurrentRound: 0,
      previousQuestions: [],
      answeredGaps: [],
    },
    semanticProjection: {},
    nextAction: 'submit_message',
    ...overrides,
  };
}

function sessionWithQuestion(): PortfolioEntrySessionDto {
  return makeSession({
    lifecycleStatus: 'CLARIFYING',
    revision: 1,
    nextAction: 'answer_clarification',
    conversation: [
      {
        id: 'turn-1',
        turnIndex: 0,
        userInput: 'Necesito ordenar mis iniciativas para comite.',
        respondedResolves: [],
        createdAt: new Date().toISOString(),
        emittedQuestions: [
          {
            id: 'q-1',
            question: 'Que decision necesitas habilitar con esta lectura?',
            resolves: ['decision_need'],
            turn_index: 0,
            interaction_mode: 'quick_clarification',
            asked_at_budget_remaining: 2,
          },
        ],
      },
    ],
    clarification: {
      interactionMode: 'quick_clarification',
      quickQuestionBudget: 3,
      quickQuestionsAsked: 1,
      explorationRound: 0,
      questionsAskedCurrentRound: 1,
      previousQuestions: [],
      answeredGaps: [],
    },
  });
}

function sessionWithHandoff(overrides: Partial<PortfolioEntrySessionDto> = {}): PortfolioEntrySessionDto {
  return makeSession({
    lifecycleStatus: 'HANDOFF_READY',
    revision: 3,
    nextAction: 'review_handoff',
    handoff: {
      id: 'handoff-1',
      version: 1,
      status: 'ready_with_uncertainty',
      reviewDisposition: 'UNREVIEWED',
      handoff: makeHandoff(),
      createdAt: new Date().toISOString(),
    },
    ...overrides,
  });
}

describe('PortfolioEntryExperience', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    navigateSpy.mockClear();
    vi.clearAllMocks();
  });

  it('keeps public examples editable before explicit analysis', () => {
    renderExperience();

    fireEvent.click(screen.getByRole('button', { name: /tengo varias iniciativas/i }));

    const input = screen.getByLabelText(/necesitas conseguir/i);
    expect(input).toHaveValue('Tengo varias iniciativas y necesito entender cuales realmente contribuyen a nuestros objetivos.');

    fireEvent.change(input, {
      target: { value: 'Necesito ordenar iniciativas para decidir que sigue.' },
    });

    expect(input).toHaveValue('Necesito ordenar iniciativas para decidir que sigue.');
    expect(serviceMocks.createPortfolioEntrySession).not.toHaveBeenCalled();
  });

  it('creates a session, submits the first message and renders quick clarification from backend DTO', async () => {
    serviceMocks.createPortfolioEntrySession.mockResolvedValue({
      session: makeSession(),
      publicAccessToken: 'entry-token',
    });
    serviceMocks.submitPortfolioEntryMessage.mockResolvedValue(sessionWithQuestion());

    renderExperience();

    fireEvent.change(screen.getByLabelText(/necesitas conseguir/i), {
      target: { value: 'Necesito ordenar mis iniciativas antes del comite de direccion.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analizar mi situaci[oó]n/i }));

    expect(await screen.findByText(/que decision necesitas habilitar/i)).toBeInTheDocument();
    expect(serviceMocks.submitPortfolioEntryMessage).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'entry-token',
      expect.objectContaining({
        expectedRevision: 0,
        message: 'Necesito ordenar mis iniciativas antes del comite de direccion.',
      }),
    );
  });

  it('answers clarification without calculating backend semantic fields', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(sessionWithQuestion());
    serviceMocks.submitPortfolioEntryMessage.mockResolvedValue(makeSession({
      lifecycleStatus: 'CLARIFYING',
      revision: 2,
      nextAction: 'answer_clarification',
    }));

    renderExperience();

    fireEvent.change(await screen.findByLabelText(/tu respuesta/i), {
      target: { value: 'Necesito decidir que iniciativas mantener este trimestre.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar respuesta/i }));

    await waitFor(() => {
      expect(serviceMocks.submitPortfolioEntryMessage).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
        'entry-token',
        expect.not.objectContaining({ respondedResolves: expect.anything() }),
      );
    });
  });

  it('renders Guided Exploration only when offered and transports accept/reject choice', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(makeSession({
      lifecycleStatus: 'CLARIFYING',
      revision: 2,
      nextAction: 'offer_guided_exploration',
    }));
    serviceMocks.chooseGuidedExploration.mockResolvedValue(sessionWithQuestion());

    renderExperience();

    fireEvent.click(await screen.findByRole('button', { name: /profundizar un poco mas/i }));

    await waitFor(() => {
      expect(serviceMocks.chooseGuidedExploration).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
        'entry-token',
        expect.objectContaining({ expectedRevision: 2, choice: 'accept' }),
      );
    });
  });

  it('materializes handoff, displays provenance language and confirms explicitly', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(makeSession({
      lifecycleStatus: 'HANDOFF_ELIGIBLE',
      revision: 2,
      nextAction: 'generate_handoff',
    }));
    serviceMocks.materializePortfolioEntryHandoff.mockResolvedValue(sessionWithHandoff());
    serviceMocks.confirmPortfolioEntryHandoff.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'CONFIRMED',
      revision: 4,
      nextAction: 'claim_or_close',
      confirmation: {
        id: 'confirmation-1',
        version: 1,
        status: 'CONFIRMED',
        acceptedFields: ['understanding.value'],
        correctedFields: {},
        rejectedFields: [],
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    }));

    renderExperience();

    expect(await screen.findByText(/Así abordaría tu situación/i)).toBeInTheDocument();
    expect(screen.getByText(/Por qué empezaría por ahí/i)).toBeInTheDocument();
    expect(screen.getByText(/Lo que todavía puede cambiar la decisión/i)).toBeInTheDocument();
    expect(screen.getByText(/Cómo Starteria convierte esto en trabajo/i)).toBeInTheDocument();
    expect(screen.getByText(/Propuesta de Starteria/i)).toBeInTheDocument();
    expect(screen.getByText(/Otras formas de empezar/i)).toBeInTheDocument();
    expect(screen.getByText(/Requiere evidencia que Starteria puede registrar/i)).toBeInTheDocument();
    expect(screen.queryByText('source_path')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continuar con mi portafolio/i }));

    expect(await screen.findByText(/Esta lectura esta lista para continuar/i)).toBeInTheDocument();
    expect(screen.getByText('Propuesta de Starteria', { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Así la decisión parte del portfolio real/i)).toBeInTheDocument();
    expect(screen.getByText(/Decidir que iniciativas requieren continuidad/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta y conservar lectura/i }));
    expect(readPendingPortfolioEntryClaim()).toEqual({
      sessionId: '11111111-1111-4111-8111-111111111111',
      credential: 'entry-token',
    });
  });

  it('supports field-level correction without JSON editing', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(sessionWithHandoff());
    serviceMocks.correctPortfolioEntryHandoff.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'REVISIONS_REQUESTED',
      revision: 4,
      nextAction: 'claim_or_close',
      confirmation: {
        id: 'confirmation-1',
        version: 1,
        status: 'REVISIONS_REQUESTED',
        acceptedFields: [],
        correctedFields: { 'understanding.value': 'Correccion del usuario' },
        rejectedFields: [],
        createdAt: new Date().toISOString(),
      },
    }));

    renderExperience();

    fireEvent.click(await screen.findByRole('button', { name: /ajustar esta lectura/i }));
    const fields = screen.getAllByLabelText(/que entendio Starteria/i);
    fireEvent.change(fields[0], { target: { value: 'Correccion del usuario' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar correcciones/i }));

    await waitFor(() => {
      expect(serviceMocks.correctPortfolioEntryHandoff).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
        'entry-token',
        expect.objectContaining({
          correctedFields: { 'understanding.value': 'Correccion del usuario' },
        }),
      );
    });
  });

  it('keeps an unresolved decision visible as uncertainty and renders a resolution-less gap safely', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    const session = sessionWithHandoff();
    session.handoff!.handoff = makeHandoff({
      decision_to_enable: 'unresolved',
      gap_resolution_map: [],
      alternative_approaches: [],
      starteria_path: [],
    });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(session);

    renderExperience();

    expect(await screen.findByText(/Pendiente de aclarar antes de decidir/i)).toBeInTheDocument();
    expect(screen.getByText(/No hay un tratamiento definido todavía para este pendiente/i)).toBeInTheDocument();
    expect(screen.getByText(/La ruta de trabajo todavía se está preparando/i)).toBeInTheDocument();
  });

  it('clears expired anonymous sessions and offers restart', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockRejectedValue({ kind: 'expired', status: 410 });

    renderExperience();

    expect(await screen.findByText(/la sesion expiro/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem('starteria.portfolioEntry.current')).toBeNull();
  });

  it('hides conversion CTA before claim and keeps signup as the explicit next action', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'CONFIRMED',
      revision: 5,
      nextAction: 'claim_or_close',
      ownership: { state: 'ANONYMOUS' },
    }));

    renderExperience();

    expect(await screen.findByRole('button', { name: /crear cuenta y conservar lectura/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continuar con mi portafolio/i })).not.toBeInTheDocument();
  });

  it('uses the handoff CTA for confirmation before conversion', async () => {
    savePortfolioEntryCurrentSession({ sessionId: '11111111-1111-4111-8111-111111111111', credential: 'entry-token' });
    serviceMocks.getPortfolioEntrySession.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'HANDOFF_READY',
      revision: 4,
      ownership: { state: 'ANONYMOUS' },
    }));
    serviceMocks.confirmPortfolioEntryHandoff.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'CONFIRMED',
      revision: 5,
      nextAction: 'claim_or_close',
      ownership: { state: 'ANONYMOUS' },
    }));

    renderExperience();

    fireEvent.click(await screen.findByRole('button', { name: /continuar con mi portafolio/i }));

    await waitFor(() => expect(serviceMocks.confirmPortfolioEntryHandoff).toHaveBeenCalled());
    expect(serviceMocks.continuePortfolioEntryToPortfolio).not.toHaveBeenCalled();
  });

  it('requires an explicit click to convert a claimed confirmed session and navigates to backend destination', async () => {
    saveClaimedPortfolioEntrySession({ sessionId: '11111111-1111-4111-8111-111111111111' });
    serviceMocks.getClaimedPortfolioEntrySession.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'CONFIRMED',
      revision: 8,
      nextAction: 'claim_or_close',
      ownership: { state: 'CLAIMED', ownerUserId: 'user-1' },
    }));
    serviceMocks.continuePortfolioEntryToPortfolio.mockResolvedValue({
      continuationId: 'continuation-1',
      sessionId: '11111111-1111-4111-8111-111111111111',
      status: 'CONTINUED',
      destinationRoute: '/portfolio/inicio?portfolioEntryContinuationId=continuation-1',
      continuedAt: new Date().toISOString(),
      portfolioScope: { kind: 'platform_portfolio_permission', userId: 'user-1', organizationId: null },
      context: {},
    });

    renderExperience();

    const cta = await screen.findByRole('button', { name: /continuar con mi portafolio/i });
    expect(serviceMocks.continuePortfolioEntryToPortfolio).not.toHaveBeenCalled();

    fireEvent.click(cta);

    await waitFor(() => {
      expect(serviceMocks.continuePortfolioEntryToPortfolio).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
        expect.objectContaining({ expectedRevision: 8 }),
      );
    });
    expect(serviceMocks.continuePortfolioEntryToPortfolio.mock.calls[0][1]).not.toHaveProperty('ownerUserId');
    expect(serviceMocks.continuePortfolioEntryToPortfolio.mock.calls[0][1]).not.toHaveProperty('projectId');
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/portfolio/inicio?portfolioEntryContinuationId=continuation-1'));
    expect(window.sessionStorage.getItem('starteria.portfolioEntry.current')).toBeNull();
    expect(window.sessionStorage.getItem('starteria.portfolioEntry.pendingClaim')).toBeNull();
    expect(window.sessionStorage.getItem('starteria.portfolioEntry.claimedSession')).toBeNull();
  });

  it('reuses the same conversion idempotency key when retrying after a server failure', async () => {
    saveClaimedPortfolioEntrySession({ sessionId: '11111111-1111-4111-8111-111111111111' });
    serviceMocks.getClaimedPortfolioEntrySession.mockResolvedValue(sessionWithHandoff({
      lifecycleStatus: 'CONFIRMED',
      revision: 8,
      nextAction: 'claim_or_close',
      ownership: { state: 'CLAIMED', ownerUserId: 'user-1' },
    }));
    serviceMocks.continuePortfolioEntryToPortfolio
      .mockRejectedValueOnce({ kind: 'server_error', status: 500 })
      .mockResolvedValueOnce({
        continuationId: 'continuation-1',
        sessionId: '11111111-1111-4111-8111-111111111111',
        status: 'CONTINUED',
        destinationRoute: '/portfolio/inicio?portfolioEntryContinuationId=continuation-1',
        continuedAt: new Date().toISOString(),
        portfolioScope: { kind: 'platform_portfolio_permission', userId: 'user-1', organizationId: null },
        context: {},
      });

    renderExperience();

    const cta = await screen.findByRole('button', { name: /continuar con mi portafolio/i });
    fireEvent.click(cta);

    expect(await screen.findByText(/continuidad Portfolio todavia/i)).toBeInTheDocument();
    const firstKey = serviceMocks.continuePortfolioEntryToPortfolio.mock.calls[0][1].idempotencyKey;

    fireEvent.click(screen.getByRole('button', { name: /continuar con mi portafolio/i }));

    await waitFor(() => expect(serviceMocks.continuePortfolioEntryToPortfolio).toHaveBeenCalledTimes(2));
    expect(serviceMocks.continuePortfolioEntryToPortfolio.mock.calls[1][1].idempotencyKey).toBe(firstKey);
    expect(navigateSpy).toHaveBeenCalledWith('/portfolio/inicio?portfolioEntryContinuationId=continuation-1');
  });

  it('recovers latest claimed session on conversion conflict without auto-resubmitting conversion', async () => {
    saveClaimedPortfolioEntrySession({ sessionId: '11111111-1111-4111-8111-111111111111' });
    serviceMocks.getClaimedPortfolioEntrySession
      .mockResolvedValueOnce(sessionWithHandoff({
        lifecycleStatus: 'CONFIRMED',
        revision: 8,
        nextAction: 'claim_or_close',
        ownership: { state: 'CLAIMED', ownerUserId: 'user-1' },
      }))
      .mockResolvedValueOnce(sessionWithHandoff({
        lifecycleStatus: 'CONFIRMED',
        revision: 9,
        nextAction: 'claim_or_close',
        ownership: { state: 'CLAIMED', ownerUserId: 'user-1' },
      }));
    serviceMocks.continuePortfolioEntryToPortfolio.mockRejectedValue({ kind: 'conflict', status: 409 });

    renderExperience();

    fireEvent.click(await screen.findByRole('button', { name: /continuar con mi portafolio/i }));

    await waitFor(() => expect(serviceMocks.getClaimedPortfolioEntrySession).toHaveBeenCalledTimes(2));
    expect(serviceMocks.continuePortfolioEntryToPortfolio).toHaveBeenCalledTimes(1);
  });
});
