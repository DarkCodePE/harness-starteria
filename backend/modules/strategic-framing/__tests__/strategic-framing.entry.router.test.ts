import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/errors/error-handler';
import { permissionsForRoles } from '../../../shared/authz/permissions';
import { buildStrategicFramingRouter } from '../strategic-framing.router';

const { userLookup } = vi.hoisted(() => ({ userLookup: vi.fn() }));
vi.mock('../../../shared/db/prisma', () => ({ prisma: { user: { findUnique: userLookup } } }));

const service = { getCurrent: vi.fn(), correct: vi.fn() };
const entryService = { createOrReuse: vi.fn() };
let currentUser: any;
const authenticate: RequestHandler = (req: any, _res, next) => { if (currentUser) req.user = currentUser; next(); };

function makeApp() {
  const app = express(); app.use(express.json());
  app.use('/api/v1/strategic-framing', buildStrategicFramingRouter({ authenticate, service: service as any, entryService: entryService as any }));
  app.use(errorHandler); return app;
}

describe('SF-3D multi-entry orchestration boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'user-1', permissions: permissionsForRoles(['portfolio_lead']) };
    userLookup.mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
    entryService.createOrReuse.mockResolvedValue({ state: { id: 'state-1' }, reused: false, sourceMode: 'enterprise_direct', workspacePath: '/portfolio/framing/state-1' });
  });

  it('requires authentication and portfolio write permission', async () => {
    currentUser = null;
    await request(makeApp()).post('/api/v1/strategic-framing/states/from-source').send({ sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' }).expect(401);
    currentUser = { id: 'user-1', permissions: new Set() };
    await request(makeApp()).post('/api/v1/strategic-framing/states/from-source').send({ sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' }).expect(403);
    expect(entryService.createOrReuse).not.toHaveBeenCalled();
  });

  it('rejects unknown fields and client organization scope', async () => {
    await request(makeApp()).post('/api/v1/strategic-framing/states/from-source').send({ sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen', organizationId: 'attacker' }).set('Idempotency-Key', 'direct-1').expect(400);
    expect(entryService.createOrReuse).not.toHaveBeenCalled();
  });

  it('passes trusted actor scope and idempotency to the shared orchestrator', async () => {
    const response = await request(makeApp()).post('/api/v1/strategic-framing/states/from-source')
      .send({ sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen', whyItMatters: 'Importa para clientes' })
      .set('Idempotency-Key', 'direct-1').expect(200);
    expect(response.body.data).toMatchObject({ sourceMode: 'enterprise_direct', workspacePath: '/portfolio/framing/state-1' });
    expect(entryService.createOrReuse).toHaveBeenCalledWith(expect.objectContaining({ actor: { id: 'user-1', organizationId: 'org-1' }, idempotencyKey: 'direct-1' }));
    expect(entryService).not.toHaveProperty('createFront');
    expect(entryService).not.toHaveProperty('createChallenge');
  });

  it('accepts all three discriminated source modes through one boundary', async () => {
    for (const source of [
      { sourceMode: 'public_entry', bootstrapSessionId: 'bootstrap-1' },
      { sourceMode: 'enterprise_direct', intendedMovement: 'Mover margen' },
      { sourceMode: 'existing_portfolio', sourceType: 'strategic_front', sourceId: 'front-1' },
    ]) {
      await request(makeApp()).post('/api/v1/strategic-framing/states/from-source').send(source).set('Idempotency-Key', 'same-key').expect(200);
    }
    expect(entryService.createOrReuse).toHaveBeenCalledTimes(3);
  });
});
