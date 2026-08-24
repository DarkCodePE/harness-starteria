import { describe, expect, it } from 'vitest';
import {
  toActionExecutionDto,
  toActionPlanDto,
  toConversationDto,
  toIntentAssessmentDto,
} from '../copilot.dto';
import {
  makeConversation,
  makeExecution,
  makePlan,
  makeAction,
  makeResult,
  testNow,
} from './test-utils';

describe('copilot DTO mappers', () => {
  it('convierte fechas y conserva enums canonicos', () => {
    expect(toConversationDto(makeConversation())).toMatchObject({
      id: 'conv1',
      status: 'collecting_context',
      createdAt: testNow.toISOString(),
    });
  });

  it('mapea ActionPlan con ProposedActions sin exponer objetos Prisma', () => {
    const dto = toActionPlanDto(makePlan({ proposedActions: [makeAction()] }));

    expect(dto.proposedActions[0]).toMatchObject({
      id: 'action1',
      capabilityId: 'CreateStrategicFront',
      version: 1,
      approvedAt: null,
    });
  });

  it('mapea assessment y execution con JSON tipado y projection links', () => {
    const assessment = toIntentAssessmentDto({
      id: 'ia1',
      conversationId: 'conv1',
      originalMessageId: 'msg1',
      primaryIntent: 'create_strategic_front',
      operation: 'create',
      detectedEntities: { name: 'Frente' },
      ambiguousObjects: [],
      missingInformation: [],
      recommendedCapabilities: ['CreateStrategicFront'],
      confidence: 'high',
      sourceReferences: [{ type: 'message', id: 'msg1' }],
      adapterType: 'deterministic',
      rubricVersion: 'v1',
      createdAt: testNow,
    });
    const execution = toActionExecutionDto(makeExecution({
      status: 'completed',
      result: makeResult(),
      projectionLinks: makeResult().projectionLinks,
    }));

    expect(assessment.detectedEntities).toEqual({ name: 'Frente' });
    expect(execution.projectionLinks[0]).toMatchObject({ objectType: 'StrategicFront' });
    expect(execution.createdAt).toBe(testNow.toISOString());
  });
});
