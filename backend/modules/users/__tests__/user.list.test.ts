/**
 * user.list.test.ts — `GET /api/v1/users` (ADR-029, alimenta la pantalla de roles).
 *
 * Dos cosas que proteger:
 *  1. va con el MISMO permiso que asignar roles — quien no puede cambiarlos tampoco
 *     necesita el padrón de usuarios con sus correos;
 *  2. NUNCA devuelve el hash de contraseña ni el estado de bloqueo. Ese defecto ya
 *     apareció una vez en `updatePlatformRole` (devolver la fila entera de Prisma),
 *     así que aquí se fija desde el principio en vez de esperar a repetirlo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../shared/errors/error-handler';
import type { Role } from '../../../shared/types';

let currentUser: { id: string; email: string; role: Role } | null = {
  id: 'u-admin',
  email: 'admin@starteria.io',
  role: 'admin',
};

vi.mock('../../auth/auth.middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/auth.middleware')>();
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = currentUser ? actual.buildRequestUser(currentUser) : currentUser;
      next();
    },
  };
});

vi.mock('../../../shared/db/prisma', () => ({ default: {}, prisma: {} }));

const listUsers = vi.fn();
vi.mock('../user.service', () => ({
  UserService: class {
    listUsers = listUsers;
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
    req.requestId = 'req-list-1';
    next();
  });
  app.use('/api/v1/users', userRouter);
  app.use(errorHandler);
  return app;
}

describe('GET /users — cableado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsers.mockResolvedValue([
      { id: 'u1', name: 'Ana', email: 'ana@x.com', role: 'participante', roles: ['participante'], initials: 'A' },
    ]);
  });

  it('un admin obtiene la lista', async () => {
    currentUser = { id: 'u-admin', email: 'admin@starteria.io', role: 'admin' };

    const res = await request(makeApp()).get('/api/v1/users');

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(listUsers).toHaveBeenCalled();
  });

  it.each<Role>(['participante', 'mentor', 'sponsor', 'portfolio_lead'])(
    'un %s recibe 403 y el servicio NI SE LLAMA',
    async (role) => {
      currentUser = { id: 'u-x', email: 'x@starteria.io', role };

      const res = await request(makeApp()).get('/api/v1/users');

      expect(res.status).toBe(403);
      expect(listUsers).not.toHaveBeenCalled();
    },
  );

  it('sin sesión es 401', async () => {
    currentUser = null;

    const res = await request(makeApp()).get('/api/v1/users');

    expect(res.status).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });
});

describe('UserService.listUsers — qué se expone', () => {
  async function makeService(rows: unknown[]) {
    vi.doUnmock('../user.service');
    vi.resetModules();
    const { UserService } = await vi.importActual<typeof import('../user.service')>('../user.service');
    const prisma = { user: { findMany: vi.fn().mockResolvedValue(rows) } };
    return { service: new UserService(prisma as any), prisma };
  }

  it('NUNCA selecciona passwordHash ni el estado de bloqueo de cuenta', async () => {
    const { service, prisma } = await makeService([]);

    await service.listUsers();

    const select = prisma.user.findMany.mock.calls[0][0].select;
    for (const prohibido of ['passwordHash', 'googleId', 'failedLoginAttempts', 'lockedUntil']) {
      expect(select[prohibido], `la lista expone ${prohibido}`).toBeFalsy();
    }
    expect(select.roles).toBe(true);
  });

  it('una fila SIN migrar se normaliza a su rol escalar', async () => {
    // Fase 1: `roles` puede venir vacío. Sin esta normalización la UI pintaría a un
    // admin como "sin roles" y al guardar le quitaría todo.
    const { service } = await makeService([
      { id: 'u1', name: 'Admin', email: 'a@x.com', role: 'admin', roles: [], initials: 'A' },
    ]);

    const [user] = await service.listUsers();

    expect(user.roles).toEqual(['admin']);
  });

  it('respeta el conjunto de una fila ya migrada', async () => {
    const { service } = await makeService([
      {
        id: 'u2',
        name: 'Dual',
        email: 'd@x.com',
        role: 'participante',
        roles: ['participante', 'portfolio_lead'],
        initials: 'D',
      },
    ]);

    const [user] = await service.listUsers();

    expect(user.roles).toEqual(['participante', 'portfolio_lead']);
  });

  it('acota el límite para que nadie pida la tabla entera', async () => {
    const { service, prisma } = await makeService([]);

    await service.listUsers(99999);

    expect(prisma.user.findMany.mock.calls[0][0].take).toBe(500);
  });
});
