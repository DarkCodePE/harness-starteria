import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { errorHandler } from '../../../shared/errors/error-handler';
import { buildPortfolioBootstrapRouter } from '../portfolio-bootstrap.router';

const service = {
  createOrReuseFromContinuation: vi.fn(),
  getSession: vi.fn(),
  updateAnchor: vi.fn(),
  confirmAnchor: vi.fn(),
  pasteWorkItems: vi.fn(),
  addManualWorkItem: vi.fn(),
  declareNoExistingWork: vi.fn(),
  listWorkItems: vi.fn(),
  updateWorkItem: vi.fn(),
  removeWorkItem: vi.fn(),
  analyze: vi.fn(),
  listProposedMutations: vi.fn(),
  confirmProposedMutation: vi.fn(),
  rejectProposedMutation: vi.fn(),
  leaveProposedMutationPending: vi.fn(),
  correctProposedMutation: vi.fn(),
  publishFirstReading: vi.fn(),
  getLatestReading: vi.fn(),
};

let currentUser: any;

const fakeAuthenticate: RequestHandler = (req: any, _res, next) => {
  req.user = currentUser;
  next();
};

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/portfolio-bootstrap', buildPortfolioBootstrapRouter({
    authenticate: fakeAuthenticate,
    service: service as any,
  }));
  app.use(errorHandler);
  return app;
}

describe('portfolio-bootstrap router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
      id: 'portfolio-lead-1',
      email: 'pl@starteria.test',
      role: 'portfolio_lead',
      roles: ['portfolio_lead'],
      permissions: permissionsForRoles(['portfolio_lead']),
    };
    service.createOrReuseFromContinuation.mockResolvedValue({ bootstrapSession: { id: 'bs-1' }, anchor: { id: 'a-1' } });
    service.getSession.mockResolvedValue({ bootstrapSession: { id: 'bs-1' }, anchor: { id: 'a-1' } });
    service.updateAnchor.mockResolvedValue({ bootstrapSession: { id: 'bs-1' }, anchor: { id: 'a-1', status: 'anchor_sufficient' } });
    service.confirmAnchor.mockResolvedValue({ bootstrapSession: { id: 'bs-1' }, anchor: { id: 'a-1', status: 'anchor_confirmed' } });
    service.pasteWorkItems.mockResolvedValue({ sessionId: 'bs-1', existingWorkStatus: 'has_work', items: [{ id: 'wi-1' }] });
    service.addManualWorkItem.mockResolvedValue({ sessionId: 'bs-1', existingWorkStatus: 'has_work', items: [{ id: 'wi-1' }] });
    service.declareNoExistingWork.mockResolvedValue({ sessionId: 'bs-1', existingWorkStatus: 'no_existing_work', items: [] });
    service.listWorkItems.mockResolvedValue({ sessionId: 'bs-1', existingWorkStatus: 'has_work', items: [{ id: 'wi-1' }] });
    service.updateWorkItem.mockResolvedValue({ sessionId: 'bs-1', existingWorkStatus: 'has_work', items: [{ id: 'wi-1' }] });
    service.removeWorkItem.mockResolvedValue({ sessionId: 'bs-1', existingWorkStatus: 'has_work', items: [] });
    service.analyze.mockResolvedValue({ analysisRunId: 'run-1', proposedMutations: [{ id: 'pm-1' }], homeState: 'HOME_C' });
    service.listProposedMutations.mockResolvedValue({
      sessionId: 'bs-1',
      proposedMutations: [{ id: 'pm-1' }],
      materialReviewComplete: false,
      nextAction: 'review_proposed_structure',
    });
    service.confirmProposedMutation.mockResolvedValue({ mutation: { id: 'pm-1', status: 'confirmed' } });
    service.rejectProposedMutation.mockResolvedValue({ mutation: { id: 'pm-1', status: 'rejected' } });
    service.leaveProposedMutationPending.mockResolvedValue({ mutation: { id: 'pm-1', status: 'reviewed' } });
    service.correctProposedMutation.mockResolvedValue({ mutation: { id: 'pm-1', status: 'reviewed' } });
    service.publishFirstReading.mockResolvedValue({
      reading: { id: 'reading-1', version: 1 },
      homeState: 'HOME_E',
      nextBestAction: 'Revisar atencion prioritaria',
    });
    service.getLatestReading.mockResolvedValue({ id: 'reading-1', version: 1 });
  });

  it('creates or reuses a bootstrap session from a continuation through the pre-canonical endpoint', async () => {
    const res = await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/from-continuation')
      .send({ portfolioEntryContinuationId: 'cont-1' })
      .expect(200);

    expect(res.body.data).toMatchObject({ bootstrapSession: { id: 'bs-1' }, anchor: { id: 'a-1' } });
    expect(service.createOrReuseFromContinuation).toHaveBeenCalledWith(expect.objectContaining({
      portfolioEntryContinuationId: 'cont-1',
      authenticatedUserId: 'portfolio-lead-1',
    }));
  });

  it('returns reload-safe session plus current anchor', async () => {
    await request(makeApp())
      .get('/api/v1/portfolio-bootstrap/sessions/bs-1')
      .expect(200);

    expect(service.getSession).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1' }));
  });

  it('updates anchor without confirming it through the PATCH endpoint', async () => {
    const res = await request(makeApp())
      .patch('/api/v1/portfolio-bootstrap/sessions/bs-1/anchor')
      .send({ outcomeStatement: 'Reducir abandono en onboarding B2B' })
      .expect(200);

    expect(res.body.data.anchor.status).toBe('anchor_sufficient');
    expect(service.updateAnchor).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      body: { outcomeStatement: 'Reducir abandono en onboarding B2B' },
    }));
  });

  it('confirms anchor through an explicit human action endpoint', async () => {
    const res = await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/anchor/confirm')
      .send({})
      .expect(200);

    expect(res.body.data.anchor.status).toBe('anchor_confirmed');
    expect(service.confirmAnchor).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      authenticatedUserId: 'portfolio-lead-1',
    }));
  });

  it('pastes provisional work items with idempotency key', async () => {
    const res = await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/work-items/paste')
      .set('Idempotency-Key', 'paste-key-1')
      .send({ text: 'Nuevo onboarding\nChatbot soporte' })
      .expect(200);

    expect(res.body.data.items).toHaveLength(1);
    expect(service.pasteWorkItems).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      authenticatedUserId: 'portfolio-lead-1',
      body: { text: 'Nuevo onboarding\nChatbot soporte' },
      idempotencyKey: 'paste-key-1',
    }));
  });

  it('adds a manual provisional work item', async () => {
    await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/work-items/manual')
      .send({ label: 'Programa loyalty', purpose: 'Aumentar recurrencia', currentStateHint: 'active' })
      .expect(200);

    expect(service.addManualWorkItem).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      body: { label: 'Programa loyalty', purpose: 'Aumentar recurrencia', currentStateHint: 'active' },
    }));
  });

  it('stores explicit no-existing-work state without a fake item', async () => {
    const res = await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/work-items/none')
      .send({})
      .expect(200);

    expect(res.body.data.existingWorkStatus).toBe('no_existing_work');
    expect(res.body.data.items).toEqual([]);
    expect(service.declareNoExistingWork).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1' }));
  });

  it('lists and edits/removes provisional work items', async () => {
    await request(makeApp()).get('/api/v1/portfolio-bootstrap/sessions/bs-1/work-items').expect(200);
    await request(makeApp())
      .patch('/api/v1/portfolio-bootstrap/sessions/bs-1/work-items/wi-1')
      .send({ label: 'Onboarding digital corregido' })
      .expect(200);
    await request(makeApp())
      .delete('/api/v1/portfolio-bootstrap/sessions/bs-1/work-items/wi-1')
      .expect(200);

    expect(service.listWorkItems).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1' }));
    expect(service.updateWorkItem).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1', workItemId: 'wi-1' }));
    expect(service.removeWorkItem).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1', workItemId: 'wi-1' }));
  });

  it('analyzes provisional work with an explicit idempotency key', async () => {
    const res = await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/analyze')
      .set('Idempotency-Key', 'analysis-key-1')
      .send({})
      .expect(200);

    expect(res.body.data).toMatchObject({ analysisRunId: 'run-1', homeState: 'HOME_C' });
    expect(service.analyze).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      authenticatedUserId: 'portfolio-lead-1',
      idempotencyKey: 'analysis-key-1',
    }));
  });

  it('lists proposed mutations for material review without applying them', async () => {
    const res = await request(makeApp())
      .get('/api/v1/portfolio-bootstrap/sessions/bs-1/proposed-mutations?status=proposed&targetType=strategic_connection')
      .expect(200);

    expect(res.body.data.proposedMutations).toEqual([{ id: 'pm-1' }]);
    expect(service.listProposedMutations).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      authenticatedUserId: 'portfolio-lead-1',
      status: 'proposed',
      targetType: 'strategic_connection',
    }));
  });

  it('routes confirm, reject, leave pending, and correct actions per mutation', async () => {
    await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/proposed-mutations/pm-1/confirm')
      .send({})
      .expect(200);
    await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/proposed-mutations/pm-2/reject')
      .send({ reviewNote: 'No aplica' })
      .expect(200);
    await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/proposed-mutations/pm-3/review')
      .send({})
      .expect(200);
    await request(makeApp())
      .patch('/api/v1/portfolio-bootstrap/sessions/bs-1/proposed-mutations/pm-4')
      .send({ proposedValue: { status: 'partial_alignment' }, reviewNote: 'Ajuste humano' })
      .expect(200);

    expect(service.confirmProposedMutation).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1', mutationId: 'pm-1' }));
    expect(service.rejectProposedMutation).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1', mutationId: 'pm-2', reviewNote: 'No aplica' }));
    expect(service.leaveProposedMutationPending).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'bs-1', mutationId: 'pm-3' }));
    expect(service.correctProposedMutation).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      mutationId: 'pm-4',
      body: { proposedValue: { status: 'partial_alignment' }, reviewNote: 'Ajuste humano' },
    }));
  });

  it('publishes and retrieves first portfolio reading with idempotency', async () => {
    await request(makeApp())
      .post('/api/v1/portfolio-bootstrap/sessions/bs-1/readings')
      .set('Idempotency-Key', 'reading-key-1')
      .send({})
      .expect(200);
    const latest = await request(makeApp())
      .get('/api/v1/portfolio-bootstrap/sessions/bs-1/readings/latest')
      .expect(200);

    expect(latest.body.data).toMatchObject({ id: 'reading-1', version: 1 });
    expect(service.publishFirstReading).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      authenticatedUserId: 'portfolio-lead-1',
      idempotencyKey: 'reading-key-1',
    }));
    expect(service.getLatestReading).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'bs-1',
      authenticatedUserId: 'portfolio-lead-1',
    }));
  });
});
