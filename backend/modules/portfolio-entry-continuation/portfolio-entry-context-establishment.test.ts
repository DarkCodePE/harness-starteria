import { describe, expect, it, vi } from 'vitest';
import { PortfolioEntryContinuationService } from './portfolio-entry-continuation.service';

function makeService(input?: { owner?: string; memberships?: string[]; grants?: string[]; organizations?: Record<string, string> }) {
  const owner = input?.owner ?? 'user-1';
  const memberships = new Set(input?.memberships ?? ['org-a']);
  const grants = new Set(input?.grants ?? ['org-a']);
  const organizations = input?.organizations ?? { 'org-a': 'Alpha' };
  const prisma = {
    user: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id })) },
    organization: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => organizations[where.id] ? { id: where.id } : null) },
    organizationMember: {
      findMany: vi.fn(async () => [...memberships].filter((id) => organizations[id]).map((organizationId) => ({ organizationId, organization: { id: organizationId, name: organizations[organizationId] } }))),
      findFirst: vi.fn(async ({ where }: { where: { organizationId: string } }) => memberships.has(where.organizationId) ? { id: 'membership' } : null),
    },
    organizationPortfolioAccessGrant: {
      findFirst: vi.fn(async ({ where }: { where: { organizationId: string; capability: string } }) => grants.has(where.organizationId) && where.capability === 'portfolio:read' ? { id: 'grant' } : null),
    },
    portfolioEntrySession: {
      findUnique: vi.fn(async () => ({ id: 'session-1', ownerUserId: owner, ownershipState: 'CLAIMED', revision: 7, expiresAt: new Date(Date.now() + 60_000), expiredAt: null, lifecycleStatus: 'CONFIRMED' })),
    },
  } as any;
  const idempotency = {} as any;
  return { service: new PortfolioEntryContinuationService(prisma, idempotency), prisma };
}

describe('authenticated Portfolio context establishment', () => {
  it('CTX-01/02/03 returns no authorized context without creating anything', async () => {
    const { service, prisma } = makeService({ memberships: [], grants: [], organizations: {} });
    await expect(service.listPortfolioContexts({ sessionId: 'session-1', authenticatedUserId: 'user-1' })).resolves.toMatchObject({ contexts: [] });
    expect(prisma.portfolioEntrySession.findUnique).toHaveBeenCalledTimes(1);
  });

  it('CTX-04 returns one existing authorized context', async () => {
    const { service } = makeService();
    await expect(service.listPortfolioContexts({ sessionId: 'session-1', authenticatedUserId: 'user-1' })).resolves.toMatchObject({ contexts: [{ organizationId: 'org-a', name: 'Alpha' }] });
  });

  it('CTX-05/06/16/17/18 filters to membership plus scoped read grant', async () => {
    const { service } = makeService({
      memberships: ['org-a', 'org-b', 'org-c', 'org-d'],
      grants: ['org-a', 'org-d'],
      organizations: { 'org-a': 'Alpha', 'org-b': 'Member only', 'org-c': 'Missing grant', 'org-d': 'Delta' },
    });
    await expect(service.listPortfolioContexts({ sessionId: 'session-1', authenticatedUserId: 'user-1' })).resolves.toMatchObject({ contexts: [{ organizationId: 'org-a' }, { organizationId: 'org-d' }] });
  });

  it('CTX-07/08 deny cross-user and anonymous access', async () => {
    const { service } = makeService();
    await expect(service.listPortfolioContexts({ sessionId: 'session-1', authenticatedUserId: 'other-user' })).rejects.toMatchObject({ code: 'PORTFOLIO_ENTRY_CONTINUATION_FORBIDDEN' });
    await expect(service.listPortfolioContexts({ sessionId: 'session-1', authenticatedUserId: '' })).rejects.toMatchObject({ code: 'PORTFOLIO_ENTRY_CONTINUATION_AUTH_REQUIRED' });
  });

  it('CTX-22 keeps organization isolation and performs no cognition', async () => {
    const { service, prisma } = makeService({ memberships: ['org-a', 'org-b'], grants: ['org-a'], organizations: { 'org-a': 'Alpha', 'org-b': 'Beta' } });
    const result = await service.listPortfolioContexts({ sessionId: 'session-1', authenticatedUserId: 'user-1' });
    expect(result.contexts.map((context) => context.organizationId)).toEqual(['org-a']);
    expect(prisma).not.toHaveProperty('llm');
  });
});
