import { describe, expect, it } from 'vitest';
import { buildAdaptiveCoreFromInitialReview, materializeQuestionsForCheckpoint } from '../adaptiveCore';

describe('adaptiveCore PRD-03 v0.4', () => {
  it('creates a deterministic master context, Step 0 configuration and progress signal on route confirmation', () => {
    const core = buildAdaptiveCoreFromInitialReview({
      snapshotId: 'snap-1',
      challengeType: 'growth',
      contextInitial: 'Aumentar adopcion comercial.',
      initialFocus: 'Validar si la propuesta ayuda a anticipar decisiones.',
      expectedImpact: 'Uso semanal recurrente',
      mainRisk: 'Evidencia inicial debil por falta de entrevistas.',
      nextRecommendedStep: 'Completar Step 0',
      pendingQuestions: [{ id: 'q1', question: 'Quien decide?' }],
      challengeContext: { challengeId: 'ch-1' },
      now: '2026-07-29T10:00:00.000Z',
    });

    expect(core.schemaVersion).toBe('PRD-03-v0.4');
    expect(core.masterContext.routeType).toBe('explore_validate');
    expect(core.stepConfigurations[0].step).toBe(0);
    expect(core.stepConfigurations[0].checkpoints).toHaveLength(3);
    expect(core.stepConfigurations[0].checkpoints[0].status).toBe('ready');
    expect(core.progressSignal.checkpointCode).toBe('CP-0.1');
    expect(core.challengeContribution?.contributionType).toBe('discover');
  });

  it('materializes only the requested checkpoint questions', () => {
    const core = buildAdaptiveCoreFromInitialReview({
      snapshotId: 'snap-2',
      challengeType: 'correction',
      mainRisk: 'Riesgo legal por uso de datos productivos.',
      pendingQuestions: ['Que datos se usaran?', 'Quien autoriza?', 'Cual es el baseline?', 'Que restricciones aplican?'],
      companyContext: { id: 'company-1' },
      now: '2026-07-29T10:00:00.000Z',
    });

    expect(core.masterContext.depthLevel).toBe('extended');
    expect(materializeQuestionsForCheckpoint(core, 'CP-0.1').map(question => question.checkpointId)).toEqual(['CP-0.1']);
    expect(materializeQuestionsForCheckpoint(core, 'CP-0.2').some(question => question.source === 'company_context')).toBe(true);
  });
});
