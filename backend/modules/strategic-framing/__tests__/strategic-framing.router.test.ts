import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/AppError';
import { errorHandler } from '../../../shared/errors/error-handler';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { buildStrategicFramingRouter } from '../strategic-framing.router';

const { userLookup } = vi.hoisted(() => ({ userLookup: vi.fn() }));
vi.mock('../../../shared/db/prisma', () => ({ prisma: { user: { findUnique: userLookup } } }));

const service = { getCurrent: vi.fn(), correct: vi.fn() };
let currentUser: any;

const authenticate: RequestHandler = (req: any, _res, next) => { if (currentUser) req.user = currentUser; next(); };
const state = {
  id: 'state-1', userId: 'user-1', organizationId: 'org-1', sourceMode: 'enterprise_direct',
  intendedMovement: 'Mover conversión', whyItMatters: 'Importa', movementSignalStatus: 'proxy', movementSignalValue: '10%',
  horizonContext: null, decisionToEnable: null, subjectLevel: 'challenge_like', scopeAssessment: { confidence: 'medium', rationale: ['signal'] },
  parentStatus: 'provisional', parentContext: { label: 'Growth', sourceRefs: ['trusted:1'] },
  sufficiency: { status: 'insufficient', blockers: ['Falta evidencia'], softGaps: ['Contexto'], optionalContext: [] },
  sourceRefs: ['trusted:1'], provenance: [], version: 1, createdAt: '2026-09-24T10:00:00.000Z', updatedAt: '2026-09-24T10:00:00.000Z',
};

function makeApp() {
  const app = express(); app.use(express.json());
  app.use('/api/v1/strategic-framing', buildStrategicFramingRouter({ authenticate, service: service as any }));
  app.use(errorHandler); return app;
}

describe('SF-3C strategic framing router/controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'user-1', email: 'user@test', role: 'portfolio_lead', roles: ['portfolio_lead'], permissions: permissionsForRoles(['portfolio_lead']) };
    userLookup.mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
    service.getCurrent.mockResolvedValue(state);
    service.correct.mockResolvedValue({ ...state, version: 2, parentContext: { label: 'Nuevo', sourceRefs: ['trusted:1'] } });
  });

  it('rejects unauthenticated and missing permissions for GET/PATCH', async () => {
    currentUser = null;
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(401);
    currentUser = { id: 'user-1', permissions: new Set() };
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(403);
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1 }).expect(403);
  });

  it('rejects unauthenticated requests independently at both HTTP boundaries', async () => {
    currentUser = null;
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(401);
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1 }).expect(401);
    expect(userLookup).not.toHaveBeenCalled();
  });

  it('enforces the read and write permissions independently', async () => {
    currentUser = { id: 'user-1', permissions: new Set(['portfolio:read']) };
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(200);
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1 }).expect(403);

    currentUser = { id: 'user-1', permissions: new Set(['portfolio:write']) };
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(403);
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1 }).expect(200);
  });

  it('resolves trusted organization from User and ignores client organizationId', async () => {
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1?organizationId=org-attacker').expect(200);
    expect(userLookup).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { id: true, organizationId: true } });
    expect(service.getCurrent).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 'user-1', organizationId: 'org-1' }));
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1, organizationId: 'org-attacker', intendedMovement: 'No' }).expect(400);
    expect(service.correct).not.toHaveBeenCalled();
  });

  it('returns authorized state and propagates not-found, cross-user and cross-org denial', async () => {
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(200).expect(({ body }) => expect(body.data.id).toBe('state-1'));
    service.getCurrent.mockRejectedValueOnce(AppError.notFound('Estado provisional', 'SF_PROVISIONAL_STATE_NOT_FOUND'));
    await request(makeApp()).get('/api/v1/strategic-framing/states/missing').expect(404);
    service.getCurrent.mockRejectedValueOnce(AppError.forbidden('No autorizado.', 'SF_PROVISIONAL_STATE_FORBIDDEN'));
    await request(makeApp()).get('/api/v1/strategic-framing/states/other-user').expect(403);
    service.getCurrent.mockRejectedValueOnce(AppError.forbidden('No autorizado.', 'SF_PROVISIONAL_STATE_FORBIDDEN'));
    await request(makeApp()).get('/api/v1/strategic-framing/states/other-org').expect(403);
  });

  it('passes the authenticated user identity, not a client-supplied identity, to the service', async () => {
    currentUser = { id: 'user-1', permissions: new Set(['portfolio:read']) };
    await request(makeApp()).get('/api/v1/strategic-framing/states/state-1?userId=attacker&organizationId=org-attacker').expect(200);
    expect(service.getCurrent).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 'user-1', organizationId: 'org-1' }));
    expect(service.getCurrent).not.toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 'attacker', organizationId: 'org-attacker' }));
  });

  it('rejects strict/forbidden fields and requires expectedVersion', async () => {
    for (const field of ['organizationId', 'userId', 'sourceRefs', 'provenance', 'strategicFrontId', 'challengeId', 'projectId', 'initiativeId', 'stepId', 'canonicalId']) {
      await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1, [field]: 'spoof' }).expect(400);
    }
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ intendedMovement: 'Missing version' }).expect(400);
  });

  it('passes valid correction/version, preserves parent refs, handles stale conflict and performs no canonical writes', async () => {
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1, parentLabel: 'Nuevo', parentStatus: 'known', intendedMovement: 'Mover margen' }).expect(200);
    expect(service.correct).toHaveBeenCalledWith(expect.objectContaining({ expectedVersion: 1, actorUserId: 'user-1', organizationId: 'org-1', correction: expect.objectContaining({ parentContext: { label: 'Nuevo' } }) }));
    service.correct.mockRejectedValueOnce(AppError.conflict('stale', 'SF_PROVISIONAL_STATE_STALE'));
    await request(makeApp()).patch('/api/v1/strategic-framing/states/state-1').send({ expectedVersion: 1, intendedMovement: 'Stale' }).expect(409);
    expect(service.correct).not.toHaveBeenCalledWith(expect.objectContaining({ correction: expect.objectContaining({ parentContext: expect.objectContaining({ sourceRefs: expect.anything() }) }) }));
  });

  it('returns the provisional state envelope and never exposes a canonical mutation boundary', async () => {
    const response = await request(makeApp()).get('/api/v1/strategic-framing/states/state-1').expect(200);
    expect(response.body).toEqual({ success: true, data: state });
    expect(service).not.toHaveProperty('createFront');
    expect(service).not.toHaveProperty('createChallenge');
    expect(service).not.toHaveProperty('createProject');
    expect(service).not.toHaveProperty('createInitiative');
    expect(service).not.toHaveProperty('createStep');
  });
});
