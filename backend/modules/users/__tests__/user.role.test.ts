/**
 * user.role.test.ts — ADR-028.
 *
 * Cubre `PATCH /api/v1/users/:userId/role`, la superficie más sensible que introduce
 * ADR-028: es la que concede privilegios. Dos niveles:
 *
 *  - el CABLEADO del router (quién llega al handler), con el `requireRole` de verdad;
 *  - las GUARDAS del servicio (no cambiar el propio rol, revocar los refresh tokens),
 *    que son la parte que de verdad protege.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../shared/errors/error-handler';
import type { Role } from '../../../shared/types';

let currentUser: { id: string; email: string; role: Role } = {
  id: 'u-admin',
  email: 'admin@starteria.io',
  role: 'admin',
};

vi.mock('../../auth/auth.middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/auth.middleware')>();
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = currentUser;
      next();
    },
  };
});

vi.mock('../../../shared/db/prisma', () => ({ default: {}, prisma: {} }));

const updatePlatformRole = vi.fn();
vi.mock('../user.service', () => ({
  UserService: class {
    updatePlatformRole = updatePlatformRole;
  },
}));

vi.mock('../../billing/entitlement.middleware', () => ({
  requireEntitlement: () => (_req: any, _res: any, next: any) => next(),
}));

const { userRouter } = await import('../user.router');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.requestId = 'req-role-1';
    next();
  });
  app.use('/api/v1/users', userRouter);
  app.use(errorHandler);
  return app;
}

describe('PATCH /users/:userId/role — cableado (ADR-028)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePlatformRole.mockResolvedValue({ id: 'u-target', role: 'portfolio_lead' });
  });

  it('un admin puede convertir a otro usuario en portfolio_lead', async () => {
    currentUser = { id: 'u-admin', email: 'admin@starteria.io', role: 'admin' };

    const res = await request(makeApp())
      .patch('/api/v1/users/u-target/role')
      .send({ role: 'portfolio_lead' });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(updatePlatformRole).toHaveBeenCalledWith('u-admin', 'u-target', 'portfolio_lead');
  });

  it.each<Role>(['mentor', 'portfolio_lead', 'participante', 'sponsor'])(
    'un %s NO puede asignar roles',
    async (role) => {
      currentUser = { id: 'u-x', email: 'x@starteria.io', role };

      const res = await request(makeApp())
        .patch('/api/v1/users/u-target/role')
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
      expect(updatePlatformRole).not.toHaveBeenCalled();
    },
  );

  it('rechaza un rol que no existe', async () => {
    currentUser = { id: 'u-admin', email: 'admin@starteria.io', role: 'admin' };

    const res = await request(makeApp())
      .patch('/api/v1/users/u-target/role')
      .send({ role: 'superadmin' });

    expect(res.status).toBe(400);
    expect(updatePlatformRole).not.toHaveBeenCalled();
  });
});

describe('UserService.updatePlatformRole — guardas (ADR-028)', () => {
  // El servicio real, con un prisma de mentira: aquí es donde viven las guardas.
  async function makeService(overrides: Record<string, any> = {}) {
    vi.doUnmock('../user.service');
    vi.resetModules();
    const { UserService } = await vi.importActual<typeof import('../user.service')>(
      '../user.service',
    );
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'u-target', role: 'viewer' }),
        update: vi.fn().mockResolvedValue({ id: 'u-target', role: 'portfolio_lead' }),
      },
      refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      ...overrides,
    };
    return { service: new UserService(prisma as any), prisma };
  }

  it('un admin no puede cambiar su PROPIO rol', async () => {
    const { service, prisma } = await makeService();

    await expect(service.updatePlatformRole('u-me', 'u-me', 'admin')).rejects.toMatchObject({
      statusCode: 403,
      code: 'CANNOT_CHANGE_OWN_ROLE',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('NUNCA devuelve passwordHash ni el estado de bloqueo de cuenta', async () => {
    // Salió al probar el endpoint a mano contra el stack local: devolver la fila
    // entera de Prisma filtra el hash de la contraseña en la respuesta HTTP.
    const { service, prisma } = await makeService();

    await service.updatePlatformRole('u-admin', 'u-target', 'portfolio_lead');

    const call = prisma.user.update.mock.calls[0][0];
    expect(call.select, 'el update debe llevar un select explícito').toBeTruthy();
    for (const prohibido of ['passwordHash', 'googleId', 'failedLoginAttempts', 'lockedUntil']) {
      expect(call.select[prohibido]).toBeFalsy();
    }
  });

  it('revoca los refresh tokens del usuario objetivo al cambiar el rol', async () => {
    const { service, prisma } = await makeService();

    await service.updatePlatformRole('u-admin', 'u-target', 'portfolio_lead');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-target' },
        data: { role: 'portfolio_lead' },
      }),
    );
    // Sin esto el cambio no aterriza hasta que el usuario decida renovar.
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u-target', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('404 si el usuario objetivo no existe, sin tocar nada', async () => {
    const { service, prisma } = await makeService({
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
    });

    await expect(
      service.updatePlatformRole('u-admin', 'u-fantasma', 'portfolio_lead'),
    ).rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
