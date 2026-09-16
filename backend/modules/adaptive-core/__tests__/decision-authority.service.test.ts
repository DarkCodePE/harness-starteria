import { describe, expect, it } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('DecisionAuthority service entrypoint', () => {
  it('uses owner_governed backward compatibility when no governance config exists', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const result = await service.getDecisionAuthority(project.id, 'u1', 'participante', 'implement');

    expect(result).toMatchObject({
      governanceMode: 'owner_governed',
      authorityType: 'initiative_owner',
      authorityUserId: 'u1',
      authorityStatus: 'resolved',
      currentUserCanDecide: true,
      currentUserCanSubmit: true,
    });
    expect(result.rationale).toContain('Sin configuracion explicita, se usa compatibilidad conservadora owner_governed.');
  });

  it('resolves the operational cycle backend-side', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store);
    store.initiativeCycle[0].status = 'superseded';
    store.initiativeCycle.push({
      id: 'cycle-2-active',
      projectId: project.id,
      cycleNumber: 2,
      startStep: 2,
      currentStep: 2,
      status: 'active',
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const result = await service.getDecisionAuthority(project.id, 'u1', 'participante', 'pause');

    expect(result.cycleId).toBe('cycle-2-active');
  });

  it('does not let raw extra arguments force governanceMode or authorityUserId', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const result = await (service.getDecisionAuthority as any)(project.id, 'u1', 'participante', 'implement', {
      governanceMode: 'portfolio_governed',
      authorityUserId: 'attacker',
    });

    expect(result.governanceMode).toBe('owner_governed');
    expect(result.authorityUserId).toBe('u1');
    expect(result.currentUserCanDecide).toBe(true);
  });

  it('does not let global role portfolio_lead decide without assignment', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store, {
      teamMembers: [
        { userId: 'u1', projectId: 'project-authority-service', status: 'ACTIVE', role: 'OWNER' },
        { userId: 'global-lead', projectId: 'project-authority-service', status: 'ACTIVE', role: 'VIEWER' },
      ],
    });
    store.initiativeGovernance.push({
      id: 'gov-portfolio',
      projectId: project.id,
      mode: 'portfolio_governed',
      portfolioLeadUserId: 'assigned-lead',
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const result = await service.getDecisionAuthority(project.id, 'global-lead', 'portfolio_lead', 'implement');

    expect(result.authorityType).toBe('portfolio_lead');
    expect(result.authorityUserId).toBe('assigned-lead');
    expect(result.currentUserCanDecide).toBe(false);
    expect(result.currentUserCanSubmit).toBe(false);
  });

  it('lets the assigned portfolio lead decide implement when access exists', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store, {
      teamMembers: [
        { userId: 'u1', projectId: 'project-authority-service', status: 'ACTIVE', role: 'OWNER' },
        { userId: 'assigned-lead', projectId: 'project-authority-service', status: 'ACTIVE', role: 'VIEWER' },
      ],
    });
    store.initiativeGovernance.push({
      id: 'gov-portfolio',
      projectId: project.id,
      mode: 'portfolio_governed',
      portfolioLeadUserId: 'assigned-lead',
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const result = await service.getDecisionAuthority(project.id, 'assigned-lead', 'participante', 'scale');

    expect(result.authorityType).toBe('portfolio_lead');
    expect(result.currentUserCanDecide).toBe(true);
    expect(result.currentUserCanSubmit).toBe(true);
  });

  it('reports unassigned when portfolio_governed requires a portfolio lead but none is configured', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store);
    store.initiativeGovernance.push({
      id: 'gov-portfolio-unassigned',
      projectId: project.id,
      mode: 'portfolio_governed',
      portfolioLeadUserId: null,
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const result = await service.getDecisionAuthority(project.id, 'u1', 'participante', 'implement');

    expect(result.authorityType).toBe('portfolio_lead');
    expect(result.authorityStatus).toBe('unassigned');
    expect(result.currentUserCanDecide).toBe(false);
    expect(result.currentUserCanSubmit).toBe(true);
  });

  it('is read-only for project progression, cycles, CriticalChange and Truth/Evidence state', async () => {
    const store = createCycleStore();
    const project = seedAuthorityProject(store);
    store.criticalChange.push({ id: 'critical-change-1', projectId: project.id, sourceCycleId: 'cycle-1-active', status: 'assessment_ready' });
    store.truthClaim.push({ id: 'claim-1', projectId: project.id, verificationState: 'supported' });
    store.evidence.push({ id: 'evidence-1', projectId: project.id, truthStatus: 'supports' });
    const before = snapshot(store, ['project', 'initiativeCycle', 'criticalChange', 'truthClaim', 'evidence', 'initiativeGovernance']);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    await service.getDecisionAuthority(project.id, 'u1', 'participante', 'close_with_learning');

    expect(snapshot(store, ['project', 'initiativeCycle', 'criticalChange', 'truthClaim', 'evidence', 'initiativeGovernance'])).toEqual(before);
  });
});

function seedAuthorityProject(store: ReturnType<typeof createCycleStore>, overrides: Record<string, any> = {}) {
  const project = seedCycleProject(store, {
    id: 'project-authority-service',
    ownerId: 'u1',
    currentStep: 2,
    portfolioMeta: [{ id: 'meta-1', projectId: 'project-authority-service', challengeId: 'challenge-1', currentStep: 'Step 2' }],
    ...overrides,
  });
  project.teamMembers = overrides.teamMembers ?? [{ userId: 'u1', projectId: project.id, status: 'ACTIVE', role: 'OWNER' }];
  store.initiativeCycle.push({
    id: 'cycle-1-active',
    projectId: project.id,
    cycleNumber: 1,
    startStep: 0,
    currentStep: project.currentStep,
    status: 'active',
  });
  return project;
}

function snapshot(store: Record<string, unknown>, keys: string[]) {
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, store[key]])));
}
