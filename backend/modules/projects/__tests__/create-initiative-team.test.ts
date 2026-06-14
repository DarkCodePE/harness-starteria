/**
 * create-initiative-team.test.ts — ADR-023 #111.
 *
 * Pins the create-iniciativa materialization: when an iniciativa is created from a reto,
 * the reto's ChallengeTeamMember roster (real Users) is snapshotted into TeamMember rows
 * marked inheritedFromChallenge=true, deduping the owner and using skipDuplicates.
 */
import { describe, it, expect, vi } from 'vitest';
import { ProjectService } from '../project.service';

function makeTx(overrides: Record<string, any> = {}) {
  return {
    project: {
      create: vi.fn().mockResolvedValue({ id: 'newproj', steps: [], teamMembers: [], evidence: [] }),
    },
    challenge: {
      findUnique: vi.fn().mockResolvedValue({ id: 'ch1', strategicFrontId: 'sf1' }),
    },
    initiativePortfolioMeta: {
      upsert: vi.fn().mockResolvedValue({ id: 'meta1' }),
    },
    challengeTeamMember: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    teamMember: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ...overrides,
  } as any;
}

function makePrisma(tx: any) {
  return {
    $transaction: vi.fn(async (cb: any) => cb(tx)),
  } as any;
}

const baseData = { name: 'Mi Iniciativa', description: 'd' } as any;

describe('ProjectService.createProject — team materialization (#111)', () => {
  it('materializes inherited TeamMembers from the reto, excluding the owner', async () => {
    const tx = makeTx({
      challengeTeamMember: {
        findMany: vi.fn().mockResolvedValue([
          { userId: 'owner', role: 'OWNER', status: 'ACTIVE' }, // == creating user → must be excluded
          { userId: 'u2', role: 'EDITOR', status: 'ACTIVE' },
          { userId: 'u3', role: 'VIEWER', status: 'PENDING' },
        ]),
      },
    });
    const svc = new ProjectService(makePrisma(tx));

    await svc.createProject('owner', { ...baseData, challengeId: 'ch1' });

    expect(tx.initiativePortfolioMeta.upsert).toHaveBeenCalled();
    expect(tx.teamMember.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    const data = tx.teamMember.createMany.mock.calls[0][0].data;
    // owner excluded → only u2 + u3 materialized, all marked inherited
    expect(data).toHaveLength(2);
    expect(data.map((d: any) => d.userId).sort()).toEqual(['u2', 'u3']);
    expect(data.every((d: any) => d.inheritedFromChallenge === true)).toBe(true);
    expect(data.every((d: any) => d.projectId === 'newproj')).toBe(true);
  });

  it('does not call createMany when the reto team is empty (owner-only iniciativa)', async () => {
    const tx = makeTx(); // challengeTeamMember.findMany → []
    const svc = new ProjectService(makePrisma(tx));
    await svc.createProject('owner', { ...baseData, challengeId: 'ch1' });
    expect(tx.initiativePortfolioMeta.upsert).toHaveBeenCalled();
    expect(tx.teamMember.createMany).not.toHaveBeenCalled();
  });

  it('skips reto linking + materialization entirely without challengeId', async () => {
    const tx = makeTx();
    const svc = new ProjectService(makePrisma(tx));
    await svc.createProject('owner', baseData);
    expect(tx.challenge.findUnique).not.toHaveBeenCalled();
    expect(tx.initiativePortfolioMeta.upsert).not.toHaveBeenCalled();
    expect(tx.teamMember.createMany).not.toHaveBeenCalled();
  });

  it('skips materialization when the referenced reto no longer exists', async () => {
    const tx = makeTx({ challenge: { findUnique: vi.fn().mockResolvedValue(null) } });
    const svc = new ProjectService(makePrisma(tx));
    await svc.createProject('owner', { ...baseData, challengeId: 'gone' });
    expect(tx.initiativePortfolioMeta.upsert).not.toHaveBeenCalled();
    expect(tx.teamMember.createMany).not.toHaveBeenCalled();
  });
});
