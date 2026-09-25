import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/errors/error-handler';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { AppError } from '../../../shared/errors/AppError';
import { buildStrategicFramingRouter } from '../strategic-framing.router';

const { userLookup } = vi.hoisted(() => ({ userLookup: vi.fn() }));
vi.mock('../../../shared/db/prisma', () => ({ prisma: { user: { findUnique: userLookup } } }));

const service = { getCurrent: vi.fn() };
const evaluator = { evaluate: vi.fn() };
let currentUser: any;
const authenticate: RequestHandler = (req: any, _res, next) => { if (currentUser) req.user = currentUser; next(); };
const state = { id: 'state-1', userId: 'user-1', organizationId: 'org-1', sourceMode: 'enterprise_direct', version: 4, prioritizationState: { focusSlots: 1, candidates: [] } };

function makeApp() {
  const app = express(); app.use(express.json());
  app.use('/api/v1/strategic-framing', buildStrategicFramingRouter({ authenticate, service: service as any, prioritizationRecommendationEvaluator: evaluator as any }));
  app.use(errorHandler); return app;
}

describe('SF-5C prioritization recommendation route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'user-1', permissions: permissionsForRoles(['portfolio_lead']) };
    userLookup.mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
    service.getCurrent.mockResolvedValue(state);
    evaluator.evaluate.mockReturnValue({ stateId: 'state-1', stateVersion: 4, sourceMode: 'enterprise_direct', focusSlots: 1, capacityStatus: 'limited', recommendations: [], warnings: [], limitations: [], recommendationVersion: 'sf5c-v1' });
  });

  it('rejects unauthenticated and missing portfolio:read access', async () => {
    currentUser = null;
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/prioritization-recommendations').expect(401);
    currentUser = { id: 'user-1', permissions: new Set() };
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/prioritization-recommendations').expect(403);
    expect(userLookup).not.toHaveBeenCalled();
  });

  it('returns the current server-owned state and ignores client overrides', async () => {
    const response = await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/prioritization-recommendations?organizationId=attacker&sourceMode=public_entry&focusSlots=99&version=99').send({ focusSlots: 99, candidates: [{ candidateId: 'attacker' }] }).expect(200);
    expect(response.body.data.recommendationVersion).toBe('sf5c-v1');
    expect(userLookup).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { id: true, organizationId: true } });
    expect(service.getCurrent).toHaveBeenCalledWith(expect.objectContaining({ stateId: 'state-1', actorUserId: 'user-1', organizationId: 'org-1' }));
    expect(evaluator.evaluate).toHaveBeenCalledWith(state);
  });

  it('propagates cross-user, cross-org and not-found failures and performs no write', async () => {
    for (const status of [403, 404]) {
      service.getCurrent.mockRejectedValueOnce(status === 403 ? AppError.forbidden('No autorizado.', 'SF_PROVISIONAL_STATE_FORBIDDEN') : AppError.notFound('Estado provisional', 'SF_PROVISIONAL_STATE_NOT_FOUND'));
      await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/prioritization-recommendations').expect(status);
    }
    expect(service).not.toHaveProperty('reviewPrioritization');
    expect(service).not.toHaveProperty('correct');
  });
});
