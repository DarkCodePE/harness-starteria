import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/errors/error-handler';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { buildStrategicFramingRouter } from '../strategic-framing.router';

const { userLookup } = vi.hoisted(() => ({ userLookup: vi.fn() }));
vi.mock('../../../shared/db/prisma', () => ({ prisma: { user: { findUnique: userLookup } } }));

const service = { getCurrent: vi.fn() };
const evaluator = { evaluate: vi.fn() };
let currentUser: any;
const state = { id: 'state-1', userId: 'user-1', organizationId: 'org-1', sourceMode: 'enterprise_direct', version: 3 };

const authenticate: RequestHandler = (req: any, _res, next) => { if (currentUser) req.user = currentUser; next(); };
function makeApp() { const app = express(); app.use('/api/v1/strategic-framing', buildStrategicFramingRouter({ authenticate, service: service as any, lensEvaluator: evaluator as any })); app.use(errorHandler); return app; }

describe('SF-4B lens suggestions HTTP boundary', () => {
  beforeEach(() => { vi.clearAllMocks(); currentUser = { id: 'user-1', permissions: permissionsForRoles(['portfolio_lead']) }; userLookup.mockResolvedValue({ id: 'user-1', organizationId: 'org-1' }); service.getCurrent.mockResolvedValue(state); evaluator.evaluate.mockReturnValue({ stateId: 'state-1', stateVersion: 3, sourceMode: 'enterprise_direct', depthHint: 'light', suggestions: [], generatedAt: '2026-09-25T00:00:00.000Z' }); });

  it('requires authentication and portfolio:read', async () => {
    currentUser = null;
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/lens-suggestions').expect(401);
    currentUser = { id: 'user-1', permissions: new Set() };
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/lens-suggestions').expect(403);
  });

  it('uses current state and server-side organization, ignoring overrides', async () => {
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1/lens-suggestions?organizationId=attacker&sourceMode=public_entry&depth=deep').expect(200).expect(({ body }) => expect(body.data.stateVersion).toBe(3));
    expect(userLookup).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { id: true, organizationId: true } });
    expect(service.getCurrent).toHaveBeenCalledWith({ stateId: 'state-1', actorUserId: 'user-1', organizationId: 'org-1', permissions: expect.anything() });
    expect(evaluator.evaluate).toHaveBeenCalledWith(state);
  });
});
