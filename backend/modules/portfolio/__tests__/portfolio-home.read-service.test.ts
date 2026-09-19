import { describe, expect, it, vi } from 'vitest';
import { PortfolioHomeReadService } from '../portfolio-home.read-service';

function makePrisma(fronts: any[] = [], reading: any | null = null) {
  return {
    strategicFront: { findMany: vi.fn().mockResolvedValue(fronts) },
    portfolioBootstrapSession: {
      findFirst: vi.fn().mockResolvedValue(reading ? { readings: [reading] } : null),
    },
    project: { create: vi.fn(), update: vi.fn() },
    teamMember: { create: vi.fn(), update: vi.fn() },
    step: { create: vi.fn() },
    initiativeCycle: { create: vi.fn() },
    decision: { create: vi.fn() },
    challengeInvitation: { update: vi.fn() },
    initiativePortfolioMeta: { update: vi.fn(), create: vi.fn() },
  };
}

describe('PortfolioHomeReadService', () => {
  it('composes reading, strategic units, invitations and decisions without writes', async () => {
    const prisma = makePrisma([
      {
        id: 'front-1', name: 'Eficiencia', status: 'active', priority: 'Alta',
        strategicObjective: 'Reducir fricción', mainKpi: 'Tiempo de ciclo', horizon: 'Q3', sponsor: 'Sponsor A',
        challenges: [{
          id: 'challenge-1', title: 'Onboarding', status: 'activo_interno', challengeOwner: 'Owner Challenge',
          selectedPeople: [{ id: 'inv-1', value: 'person@example.com', invitationStatus: 'sent', role: 'OWNER', createdAt: new Date('2026-01-01') }],
          initiativeMetas: [{
            projectId: 'project-1', challengeId: 'challenge-1', strategicFrontId: 'front-1',
            estimatedContribution: 'medio', nextActionRecommended: 'Revisar evidencia', updatedAt: new Date('2026-01-02'),
            project: {
              id: 'project-1', name: 'Piloto', status: 'DRAFT', currentStep: 0, step0Status: 'IN_PROGRESS', lastModified: new Date('2026-01-03'),
              owner: { id: 'user-1', name: 'Owner', email: 'owner@example.com' },
              attentionItems: [{ id: 'attention-1', category: 'blocker', reason: 'Falta evidencia', severity: 'high', status: 'open', updatedAt: new Date('2026-01-03') }],
              decisionRequests: [{ id: 'request-1', status: 'pending', requestedAt: new Date('2026-01-03'), updatedAt: new Date('2026-01-03'), decision: null, recommendationSnapshotJson: { recommendation: 'Validar' }, readinessSnapshotJson: { decisionType: 'advance' }, decisionPackageSnapshotJson: {} }],
              decisions: [], _count: { evidence: 0 },
            },
          }],
        }],
      },
    ], { summary: 'Lectura inicial', homeState: 'HOME_E', nextBestAction: 'Revisar señal', publishedAt: new Date('2026-01-04'), primaryAttentionItems: [] });
    const service = new PortfolioHomeReadService(prisma as any);

    const home = await service.getHome('user-1');

    expect(home.portfolioReading).toMatchObject({ summary: 'Lectura inicial', source: 'portfolio_reading', homeState: 'HOME_E' });
    expect(home.strategicUnits[0].challenges[0].initiatives[0]).toMatchObject({ initiativeId: 'project-1', activationVisibility: 'initiative_exists' });
    expect(home.strategicUnits[0].challenges[0].invitations[0]).toMatchObject({ invitationId: 'inv-1', status: 'sent' });
    expect(home.pendingDecisions).toHaveLength(1);
    expect(home.pendingDecisions[0].decisionAuthority).toBeNull();
    expect(home.strategicUnits[0].challenges[0].initiatives[0].contributionSummary).toMatchObject({ expected: 'medio', observed: null, attributed: null });
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(prisma.teamMember.create).not.toHaveBeenCalled();
    expect(prisma.step.create).not.toHaveBeenCalled();
    expect(prisma.initiativeCycle.create).not.toHaveBeenCalled();
    expect(prisma.decision.create).not.toHaveBeenCalled();
    expect(prisma.challengeInvitation.update).not.toHaveBeenCalled();
    expect(prisma.initiativePortfolioMeta.update).not.toHaveBeenCalled();
  });

  it('returns a valid empty structure and preserves unknown data as null', async () => {
    const service = new PortfolioHomeReadService(makePrisma() as any);
    const home = await service.getHome('user-empty');

    expect(home.strategicUnits).toEqual([]);
    expect(home.attention).toEqual([]);
    expect(home.pendingDecisions).toEqual([]);
    expect(home.recommendations).toEqual([]);
    expect(home.portfolioReading).toMatchObject({ source: 'unavailable', coverageGapCount: null, evidenceGapCount: null });
    expect(home.governance.portfolioLead).toBeNull();
  });
});
