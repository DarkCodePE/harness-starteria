import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { type Permission } from '../../../shared/authz/permissions';
import { PortfolioBootstrapService } from '../portfolio-bootstrap.service';

const userId = 'scoped-bootstrap-user';

function permissions(...values: Permission[]): ReadonlySet<Permission> {
  return new Set(values);
}

function fixture(options: { member?: boolean; grant?: boolean; grantCapability?: 'portfolio:read' | 'portfolio:write'; grantOrganizationId?: string } = {}) {
  const state = {
    member: options.member ?? true,
    grant: options.grant ?? true,
    grantCapability: options.grantCapability ?? 'portfolio:read',
    grantOrganizationId: options.grantOrganizationId ?? 'org-a',
    userUpdates: 0,
  };
  const db = {
    user: { findUnique: async () => ({ id: userId }) },
    organization: { findUnique: async () => ({ id: 'org-a' }) },
    organizationMember: { findFirst: async () => (state.member ? { userId, organizationId: 'org-a' } : null) },
    organizationPortfolioAccessGrant: {
      findFirst: async ({ where }: any) => (
        state.grant
        && where.organizationId === state.grantOrganizationId
        && where.capability === state.grantCapability
          ? { userId, organizationId: where.organizationId, capability: where.capability }
          : null
      ),
    },
    userUpdates: { update: async () => { state.userUpdates += 1; } },
  };
  return { state, db };
}

async function authorize(
  service: PortfolioBootstrapService,
  db: any,
  session: any,
  capability: 'portfolio:read' | 'portfolio:write',
  permissionSet: ReadonlySet<Permission> = permissions(),
) {
  return (service as any).authorizeSessionCapability({
    db,
    session,
    authenticatedUserId: userId,
    permissions: permissionSet,
    capability,
  });
}

describe('Portfolio Bootstrap scoped authority', () => {
  it('BOOTSTRAP-SCOPE-01/02: global read/write permissions remain valid', async () => {
    const { db } = fixture({ member: false, grant: false });
    const service = new PortfolioBootstrapService({} as PrismaClient);
    const session = { userId, organizationId: 'org-a' };

    await expect(authorize(service, db, session, 'portfolio:read', permissions('portfolio:read'))).resolves.toBeUndefined();
    await expect(authorize(service, db, session, 'portfolio:write', permissions('portfolio:write'))).resolves.toBeUndefined();
  });

  it('BOOTSTRAP-SCOPE-03/04/06: matching scoped grants authorize read and write', async () => {
    const readFixture = fixture({ grantCapability: 'portfolio:read' });
    const writeFixture = fixture({ grantCapability: 'portfolio:write' });
    const service = new PortfolioBootstrapService({} as PrismaClient);
    const session = { userId, organizationId: 'org-a', sourceContinuationId: 'historical-continuation' };

    await expect(authorize(service, readFixture.db, session, 'portfolio:read')).resolves.toBeUndefined();
    await expect(authorize(service, writeFixture.db, session, 'portfolio:write')).resolves.toBeUndefined();
  });

  it('BOOTSTRAP-SCOPE-05: scoped read never implies write', async () => {
    const { db } = fixture({ grantCapability: 'portfolio:read' });
    const service = new PortfolioBootstrapService({} as PrismaClient);

    await expect(authorize(service, db, { userId, organizationId: 'org-a' }, 'portfolio:write')).rejects.toThrow(
      'No tienes permiso Portfolio para modificar Bootstrap.',
    );
  });

  it('BOOTSTRAP-SCOPE-07/08: membership and grant are both required', async () => {
    const service = new PortfolioBootstrapService({} as PrismaClient);
    const noMember = fixture({ member: false });
    const noGrant = fixture({ grant: false });

    await expect(authorize(service, noMember.db, { userId, organizationId: 'org-a' }, 'portfolio:read')).rejects.toThrow();
    await expect(authorize(service, noGrant.db, { userId, organizationId: 'org-a' }, 'portfolio:read')).rejects.toThrow();
  });

  it('BOOTSTRAP-SCOPE-09/12: organization and current session scope are enforced', async () => {
    const { db } = fixture({ grantOrganizationId: 'org-a' });
    const service = new PortfolioBootstrapService({} as PrismaClient);

    await expect(authorize(service, db, { userId, organizationId: 'org-b', sourceContinuationId: 'historical-continuation' }, 'portfolio:read')).rejects.toThrow();
  });

  it('BOOTSTRAP-SCOPE-10/11: revoked current grants deny subsequent access', async () => {
    const scoped = fixture();
    const service = new PortfolioBootstrapService({} as PrismaClient);
    const session = { userId, organizationId: 'org-a' };

    await expect(authorize(service, scoped.db, session, 'portfolio:read')).resolves.toBeUndefined();
    scoped.state.grant = false;
    await expect(authorize(service, scoped.db, session, 'portfolio:read')).rejects.toThrow();

    const writeScoped = fixture({ grantCapability: 'portfolio:write' });
    await expect(authorize(service, writeScoped.db, session, 'portfolio:write')).resolves.toBeUndefined();
    writeScoped.state.grant = false;
    await expect(authorize(service, writeScoped.db, session, 'portfolio:write')).rejects.toThrow();
  });

  it('BOOTSTRAP-SCOPE-13: authorization does not mutate roles or global permissions', async () => {
    const { db, state } = fixture();
    const service = new PortfolioBootstrapService({} as PrismaClient);

    await authorize(service, db, { userId, organizationId: 'org-a' }, 'portfolio:read');
    expect(state.userUpdates).toBe(0);
  });
});
