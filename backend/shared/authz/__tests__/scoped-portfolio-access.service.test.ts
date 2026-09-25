import { describe, expect, it, vi } from 'vitest';
import { ScopedPortfolioAccessService } from '../scoped-portfolio-access.service';

type Fixture = {
  users: Set<string>;
  memberships: Set<string>;
  grants: Set<string>;
};

function makeResolver(fixture: Fixture) {
  const db = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        fixture.users.has(where.id) ? { id: where.id } : null),
    },
    organizationMember: {
      findFirst: vi.fn(async ({ where }: { where: { userId: string; organizationId: string } }) =>
        fixture.memberships.has(`${where.userId}:${where.organizationId}`) ? { id: 'membership-1' } : null),
    },
    organizationPortfolioAccessGrant: {
      findFirst: vi.fn(async ({ where }: { where: { userId: string; organizationId: string; capability: string } }) =>
        fixture.grants.has(`${where.userId}:${where.organizationId}:${where.capability}`) ? { id: 'grant-1' } : null),
    },
  };
  return { resolver: new ScopedPortfolioAccessService(db as never), db };
}

describe('Scoped Portfolio access authority', () => {
  it('AUTH-SCOPE-01 allows matching membership and read grant', async () => {
    const { resolver } = makeResolver({
      users: new Set(['u1']),
      memberships: new Set(['u1:o1']),
      grants: new Set(['u1:o1:portfolio:read']),
    });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'portfolio:read' })).resolves.toBe(true);
  });

  it('AUTH-SCOPE-02 denies membership without a grant', async () => {
    const { resolver } = makeResolver({ users: new Set(['u1']), memberships: new Set(['u1:o1']), grants: new Set() });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'portfolio:read' })).resolves.toBe(false);
  });

  it('AUTH-SCOPE-03 denies a grant without membership', async () => {
    const { resolver } = makeResolver({ users: new Set(['u1']), memberships: new Set(), grants: new Set(['u1:o1:portfolio:read']) });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'portfolio:read' })).resolves.toBe(false);
  });

  it('AUTH-SCOPE-04 isolates organizations', async () => {
    const { resolver } = makeResolver({ users: new Set(['u1']), memberships: new Set(['u1:o1', 'u1:o2']), grants: new Set(['u1:o1:portfolio:read']) });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o2', capability: 'portfolio:read' })).resolves.toBe(false);
  });

  it('AUTH-SCOPE-05 and AUTH-SCOPE-06 reject global role/permission state without a scoped grant', async () => {
    const { resolver } = makeResolver({ users: new Set(['u1']), memberships: new Set(['u1:o1']), grants: new Set() });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'portfolio:read' })).resolves.toBe(false);
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'portfolio:write' })).resolves.toBe(false);
  });

  it('AUTH-SCOPE-07 rejects client-provided or speculative capabilities', async () => {
    const { resolver, db } = makeResolver({ users: new Set(['u1']), memberships: new Set(['u1:o1']), grants: new Set(['u1:o1:portfolio:read']) });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'admin' as never })).resolves.toBe(false);
    expect(db.organizationPortfolioAccessGrant.findFirst).not.toHaveBeenCalled();
  });

  it('AUTH-SCOPE-13 performs no model or LLM calls', async () => {
    const { resolver, db } = makeResolver({ users: new Set(['u1']), memberships: new Set(['u1:o1']), grants: new Set(['u1:o1:portfolio:write']) });
    await expect(resolver.canUserAccessPortfolio({ userId: 'u1', organizationId: 'o1', capability: 'portfolio:write' })).resolves.toBe(true);
    expect(db.user.findUnique).toHaveBeenCalledTimes(1);
    expect(db.organizationMember.findFirst).toHaveBeenCalledTimes(1);
    expect(db.organizationPortfolioAccessGrant.findFirst).toHaveBeenCalledTimes(1);
  });
});
