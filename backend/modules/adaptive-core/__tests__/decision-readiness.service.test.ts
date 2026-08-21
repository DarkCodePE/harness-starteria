import { describe, expect, it, vi } from 'vitest';
import { AdaptiveCoreService } from '../adaptive-core.service';
import { createCycleStore, makeCyclePrisma, seedCycleProject } from './cycle-test-utils';

describe('DecisionReadiness service entrypoint', () => {
  it('resolves the operational cycle backend-side', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 4 });
    store.initiativeCycle.push(
      {
        id: 'cycle-1',
        projectId: project.id,
        cycleNumber: 1,
        startStep: 0,
        currentStep: 4,
        status: 'superseded',
      },
      {
        id: 'cycle-2',
        projectId: project.id,
        cycleNumber: 2,
        startStep: 2,
        currentStep: 2,
        status: 'active',
      },
    );
    store.adaptiveStepOutput.push({
      id: 'output-cycle-2-step2',
      projectId: project.id,
      cycleId: 'cycle-2',
      stepNumber: 2,
      version: 1,
      status: 'confirmed',
      outputJson: { selectedBet: 'Piloto B', unresolvedQuestions: ['Validar adopcion'] },
    });
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    const assessment = await service.getDecisionReadiness(project.id, 'u1', 'participante', 'continue_experimenting');

    expect(assessment.cycleId).toBe('cycle-2');
    expect(assessment.projectId).toBe(project.id);
    expect(assessment.decisionType).toBe('continue_experimenting');
  });

  it('does not mutate transition, cycle, step, output or truth records', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 3 });
    store.initiativeCycle.push({
      id: 'cycle-readonly',
      projectId: project.id,
      cycleNumber: 1,
      startStep: 0,
      currentStep: 3,
      status: 'active',
    });
    store.cycleStepState.push({ id: 'state-2', cycleId: 'cycle-readonly', stepNumber: 2, state: 'confirmed' });
    store.criticalChange.push({ id: 'critical-change-1', projectId: project.id, sourceCycleId: 'cycle-readonly', status: 'assessment_ready' });
    store.truthClaim.push({ id: 'claim-1', projectId: project.id, verificationState: 'supported' });
    store.evidence.push({ id: 'evidence-1', projectId: project.id, truthStatus: 'supports', targetClaimId: 'claim-1' });
    store.truthValidation.push({ id: 'validation-1', projectId: project.id, result: 'supported', claimId: 'claim-1', evidenceId: 'evidence-1' });
    store.impactAssertion.push({ id: 'impact-1', projectId: project.id, status: 'estimated' });
    store.adaptiveStepOutput.push({
      id: 'output-1',
      projectId: project.id,
      cycleId: 'cycle-readonly',
      stepNumber: 3,
      version: 1,
      status: 'confirmed',
      outputJson: { executionPlan: { owner: 'u1' }, risks: ['Riesgo conocido'], decision: { rationale: 'Aprendizaje capturado' } },
    });
    const before = snapshot(store, [
      'criticalChange',
      'initiativeCycle',
      'cycleStepState',
      'adaptiveStepOutput',
      'truthClaim',
      'evidence',
      'truthValidation',
    ]);
    const service = new AdaptiveCoreService(makeCyclePrisma(store) as any);

    await service.getDecisionReadiness(project.id, 'u1', 'participante', 'implement');

    expect(snapshot(store, [
      'criticalChange',
      'initiativeCycle',
      'cycleStepState',
      'adaptiveStepOutput',
      'truthClaim',
      'evidence',
      'truthValidation',
    ])).toEqual(before);
  });

  it('propagates canonical Truth/Evidence query failures instead of fabricating missing facts', async () => {
    const store = createCycleStore();
    const project = seedCycleProject(store, { currentStep: 2 });
    store.initiativeCycle.push({
      id: 'cycle-readiness-error',
      projectId: project.id,
      cycleNumber: 1,
      startStep: 0,
      currentStep: 2,
      status: 'active',
    });
    store.truthClaim.push({ id: 'claim-1', projectId: project.id, verificationState: 'supported' });
    const prisma = makeCyclePrisma(store) as any;
    prisma.evidence.findMany = vi.fn(async () => {
      throw new Error('evidence table unavailable');
    });
    const service = new AdaptiveCoreService(prisma);

    await expect(service.getDecisionReadiness(project.id, 'u1', 'participante', 'implement')).rejects.toThrow('evidence table unavailable');
  });
});

function snapshot(store: Record<string, unknown>, keys: string[]) {
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, store[key]])));
}
