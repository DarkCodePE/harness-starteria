import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { AppError } from '../../../shared/errors/AppError';
import { errorHandler } from '../../../shared/errors/error-handler';
import { generateAccessToken } from '../../auth/token.service';
import { buildCopilotRouter } from '../copilot.router';
import { CopilotFeatureGuard } from '../application/copilot-feature-guard';
import type { CopilotRuntimeConfig } from '../application/copilot-runtime-config';
import type { CreateStrategicFrontCommandHandler } from '../commands/create-strategic-front.command';
import type { CopilotRepository } from '../infrastructure/copilot.repository';
import type {
  ActionExecution,
  ActionPlan,
  CopilotConversation,
  CopilotMessage,
  IntentAssessment,
  ProposedAction,
} from '../domain/copilot.types';
import { makeAction, makeConversation, makeExecution, makePlan, makeResult, testNow } from './test-utils';

function token(userId = 'user1', role: 'mentor' | 'viewer' = 'mentor') {
  return generateAccessToken({ sub: userId, email: `${userId}@starteria.test`, role });
}

function makeHttpHarness(
  handlerOverride?: Partial<CreateStrategicFrontCommandHandler>,
  featureConfig?: Partial<CopilotRuntimeConfig>,
) {
  const conversations = new Map<string, CopilotConversation>();
  const messages: CopilotMessage[] = [];
  const assessments: IntentAssessment[] = [];
  const plans = new Map<string, ActionPlan>();
  const actions = new Map<string, ProposedAction>();
  const executions = new Map<string, ActionExecution>();
  const organizations = new Map<string, string | null>([
    ['user1', 'org1'],
    ['user2', 'org2'],
    ['viewer1', 'org1'],
  ]);
  const audits: Array<Record<string, unknown>> = [];
  let convSeq = 0;
  let msgSeq = 0;
  let assessmentSeq = 0;
  let planSeq = 0;
  let actionSeq = 0;
  let execSeq = 0;

  const repo: CopilotRepository = {
    getActorOrganizationId: vi.fn(async (userId) => organizations.get(userId) ?? null),
    getOrganizationAccess: vi.fn(async (userId, organizationId) => ({
      organizationExists: [...organizations.values()].includes(organizationId),
      isMember: organizations.get(userId) === organizationId,
      membershipRole: null,
    })),
    createConversation: vi.fn(async (input) => {
      const conversation = makeConversation({
        id: `conv${++convSeq}`,
        organizationId: input.organizationId,
        userId: input.userId,
        status: input.status,
        contextObjectType: input.contextObjectType ?? null,
        contextObjectId: input.contextObjectId ?? null,
      });
      conversations.set(conversation.id, conversation);
      return conversation;
    }),
    findConversationById: vi.fn(async (id) => conversations.get(id) ?? null),
    updateConversationStatus: vi.fn(async (id, status) => {
      const current = conversations.get(id);
      if (!current) throw new Error('missing conversation');
      const updated = { ...current, status, updatedAt: testNow };
      conversations.set(id, updated);
      return updated;
    }),
    addMessage: vi.fn(async (input) => {
      const message: CopilotMessage = {
        id: `msg${++msgSeq}`,
        conversationId: input.conversationId,
        role: input.role,
        messageType: input.messageType,
        content: input.content,
        sourceReferences: input.sourceReferences,
        createdAt: testNow,
      };
      messages.push(message);
      return message;
    }),
    listMessages: vi.fn(async (conversationId) => messages.filter((message) => message.conversationId === conversationId)),
    saveIntentAssessment: vi.fn(async (input) => {
      const assessment: IntentAssessment = {
        id: `ia${++assessmentSeq}`,
        conversationId: input.conversationId,
        originalMessageId: input.originalMessageId,
        primaryIntent: input.primaryIntent,
        operation: input.operation,
        detectedEntities: input.detectedEntities,
        ambiguousObjects: input.ambiguousObjects,
        missingInformation: input.missingInformation,
        recommendedCapabilities: input.recommendedCapabilities,
        confidence: input.confidence,
        sourceReferences: input.sourceReferences,
        adapterType: input.adapterType,
        rubricVersion: input.rubricVersion,
        createdAt: testNow,
      };
      assessments.push(assessment);
      return assessment;
    }),
    findLatestIntentAssessmentByConversation: vi.fn(async (conversationId) =>
      assessments.filter((assessment) => assessment.conversationId === conversationId).at(-1) ?? null),
    createActionPlan: vi.fn(async (input) => {
      const plan = makePlan({
        id: `plan${++planSeq}`,
        conversationId: input.conversationId,
        intentAssessmentId: input.intentAssessmentId,
        summary: input.summary,
        status: input.status,
        version: input.version,
        createdBy: input.createdBy,
        proposedActions: [],
      });
      plans.set(plan.id, plan);
      return plan;
    }),
    createProposedAction: vi.fn(async (input) => {
      const action = makeAction({
        id: `action${++actionSeq}`,
        actionPlanId: input.actionPlanId,
        capabilityId: input.capabilityId,
        ownerPrd: input.ownerPrd,
        operation: input.operation,
        commandType: input.commandType,
        title: input.title,
        explanation: input.explanation,
        proposedPayload: input.proposedPayload,
        editableFields: input.editableFields,
        requiredPermissions: input.requiredPermissions,
        requiresConfirmation: input.requiresConfirmation,
        dependencyActionIds: input.dependencyActionIds,
        status: input.status,
        version: input.version,
      });
      actions.set(action.id, action);
      const plan = plans.get(action.actionPlanId);
      if (plan) plans.set(plan.id, { ...plan, proposedActions: [action] });
      return action;
    }),
    findActionPlanById: vi.fn(async (id) => {
      const plan = plans.get(id);
      if (!plan) return null;
      return {
        ...plan,
        proposedActions: [...actions.values()].filter((action) => action.actionPlanId === id),
      };
    }),
    findCurrentActionPlanByConversation: vi.fn(async (conversationId) =>
      [...plans.values()].find((plan) => plan.conversationId === conversationId && plan.status !== 'superseded') ?? null),
    findProposedActionById: vi.fn(async (id) => actions.get(id) ?? null),
    updateProposedActionPayload: vi.fn(async (id, input) => {
      const current = actions.get(id);
      if (!current) throw new Error('missing action');
      if (current.version !== input.expectedVersion) {
        throw AppError.conflict('stale', 'STALE_ACTION_VERSION');
      }
      const updated = makeAction({
        ...current,
        proposedPayload: input.proposedPayload,
        version: current.version + 1,
        status: 'edited',
        approvedAt: null,
        approvedBy: null,
      });
      actions.set(id, updated);
      return updated;
    }),
    approveProposedAction: vi.fn(async (id, input) => {
      const current = actions.get(id);
      if (!current) throw new Error('missing action');
      const updated = makeAction({
        ...current,
        status: 'approved',
        approvedBy: input.approvedBy,
        approvedAt: testNow,
      });
      actions.set(id, updated);
      return updated;
    }),
    rejectProposedAction: vi.fn(async (id, input) => {
      const current = actions.get(id);
      if (!current) throw new Error('missing action');
      const updated = makeAction({
        ...current,
        status: 'rejected',
        rejectedBy: input.rejectedBy,
        rejectedAt: testNow,
        approvedBy: null,
        approvedAt: null,
      });
      actions.set(id, updated);
      return updated;
    }),
    updateProposedActionStatus: vi.fn(async (id, status) => {
      const current = actions.get(id);
      if (!current) throw new Error('missing action');
      const updated = makeAction({ ...current, status });
      actions.set(id, updated);
      return updated;
    }),
    updateActionPlanStatus: vi.fn(async (id, status) => {
      const current = plans.get(id);
      if (!current) throw new Error('missing plan');
      const updated = { ...current, status };
      plans.set(id, updated);
      return updated;
    }),
    supersedeActionPlan: vi.fn(async (id, supersededById) => {
      const current = plans.get(id);
      if (!current) throw new Error('missing plan');
      const updated = { ...current, status: 'superseded' as const, supersededById };
      plans.set(id, updated);
      return updated;
    }),
    createPendingActionExecution: vi.fn(async (input) => {
      const existing = [...executions.values()].find((execution) => execution.idempotencyKey === input.idempotencyKey);
      if (existing) throw AppError.conflict('idem', 'IDEMPOTENCY_CONFLICT');
      const execution = makeExecution({
        id: `exec${++execSeq}`,
        proposedActionId: input.proposedActionId,
        idempotencyKey: input.idempotencyKey,
        approvedBy: input.approvedBy,
        executedBy: input.executedBy,
        commandPayload: input.commandPayload,
      });
      executions.set(execution.id, execution);
      return execution;
    }),
    findExecutionById: vi.fn(async (id) => executions.get(id) ?? null),
    findExecutionByIdempotencyKey: vi.fn(async (idempotencyKey) =>
      [...executions.values()].find((execution) => execution.idempotencyKey === idempotencyKey) ?? null),
    listExecutionsByAction: vi.fn(async (actionId) =>
      [...executions.values()].filter((execution) => execution.proposedActionId === actionId)),
    listStaleNonTerminalExecutions: vi.fn(async () =>
      [...executions.values()].filter((execution) => ['pending', 'validating', 'executing'].includes(execution.status))),
    claimStaleActionExecution: vi.fn(async (id, input) => {
      const current = executions.get(id);
      if (!current || !['pending', 'validating', 'executing'].includes(current.status)) return null;
      if (current.updatedAt >= input.staleBefore) return null;
      const updated = makeExecution({
        ...current,
        reconciliationClaimId: input.claimId,
        reconciliationClaimedAt: testNow,
      });
      executions.set(id, updated);
      return updated;
    }),
    updateActionExecutionStatus: vi.fn(async (id, input) => {
      const current = executions.get(id);
      if (!current) throw new Error('missing execution');
      const updated = makeExecution({ ...current, status: input.status, startedAt: input.startedAt ?? current.startedAt });
      executions.set(id, updated);
      return updated;
    }),
    completeActionExecution: vi.fn(async (id, input) => {
      const current = executions.get(id);
      if (!current) throw new Error('missing execution');
      const updated = makeExecution({
        ...current,
        status: 'completed',
        result: input.result,
        createdObjectReferences: input.createdObjectReferences,
        updatedObjectReferences: input.updatedObjectReferences,
        projectionLinks: input.projectionLinks,
        completedAt: testNow,
      });
      executions.set(id, updated);
      return updated;
    }),
    failActionExecution: vi.fn(async (id, input) => {
      const current = executions.get(id);
      if (!current) throw new Error('missing execution');
      const updated = makeExecution({ ...current, status: 'failed', error: input.error, result: input.result ?? null });
      executions.set(id, updated);
      return updated;
    }),
    markActionExecutionManualReview: vi.fn(async (id, input) => {
      const current = executions.get(id);
      if (!current) throw new Error('missing execution');
      const updated = makeExecution({
        ...current,
        status: 'manual_review_required',
        error: input.error,
        completedAt: input.completedAt ?? testNow,
      });
      executions.set(id, updated);
      return updated;
    }),
    writeAudit: vi.fn(async (event) => { audits.push(event); }),
  };

  const handler = {
    execute: vi.fn(async () => makeResult()),
    ...handlerOverride,
  } as CreateStrategicFrontCommandHandler;
  const app = express();
  app.use(express.json());
  const featureGuard = featureConfig
    ? new CopilotFeatureGuard(() => ({
        enabled: true,
        writeEnabled: true,
        createStrategicFrontEnabled: true,
        allowedOrganizationIds: [],
        assessmentAdapter: 'deterministic',
        executionStaleAfterSeconds: 900,
        reconciliationEnabled: true,
        reconciliationIntervalSeconds: 60,
        rateLimitMessage: 30,
        rateLimitExecution: 10,
        maxMessageLength: 20_000,
        maxPayloadBytes: 12_000,
        ...featureConfig,
      }))
    : undefined;
  app.use('/api/v1/copilot', buildCopilotRouter({ repository: repo, createStrategicFrontHandler: handler, featureGuard }));
  app.use(errorHandler);
  return { app, repo, handler, conversations, plans, actions, executions, audits };
}

async function createCompletePlan(app: express.Express) {
  const auth = `Bearer ${token()}`;
  const conv = await request(app)
    .post('/api/v1/copilot/conversations')
    .set('Authorization', auth)
    .send({});
  const message = await request(app)
    .post(`/api/v1/copilot/conversations/${conv.body.data.id}/messages`)
    .set('Authorization', auth)
    .send({
      content: 'Crea un frente llamado Eficiencia operativa. Su objetivo es reducir retrabajo. El KPI principal sera horas de retrabajo, con baseline 500, meta 300, horizonte de 6 meses, area de Operaciones, prioridad alta y sponsor Operaciones.',
    });
  const action = message.body.data.actionPlan.proposedActions[0];
  return { auth, conversationId: conv.body.data.id as string, actionId: action.id as string, actionVersion: action.version as number };
}

describe('Copilot HTTP router', () => {
  it('crea conversacion autenticada y rechaza sin auth', async () => {
    const { app } = makeHttpHarness();
    const unauthorized = await request(app).post('/api/v1/copilot/conversations').send({});
    expect(unauthorized.status).toBe(401);

    const res = await request(app)
      .post('/api/v1/copilot/conversations')
      .set('Authorization', `Bearer ${token()}`)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ userId: 'user1', organizationId: 'org1' });
  });

  it('envia mensaje completo, recupera assessment y plan', async () => {
    const { app } = makeHttpHarness();
    const { auth, conversationId } = await createCompletePlan(app);

    const assessment = await request(app)
      .get(`/api/v1/copilot/conversations/${conversationId}/intent-assessment`)
      .set('Authorization', auth);
    const plan = await request(app)
      .get(`/api/v1/copilot/conversations/${conversationId}/action-plan`)
      .set('Authorization', auth);

    expect(assessment.status).toBe(200);
    expect(assessment.body.data.primaryIntent).toBe('create_strategic_front');
    expect(plan.status).toBe(200);
    expect(plan.body.data.proposedActions).toHaveLength(1);
  });

  it('mensaje incompleto pide clarificacion y desconocido no crea plan', async () => {
    const { app } = makeHttpHarness();
    const auth = `Bearer ${token()}`;
    const conv = await request(app).post('/api/v1/copilot/conversations').set('Authorization', auth).send({});

    const incomplete = await request(app)
      .post(`/api/v1/copilot/conversations/${conv.body.data.id}/messages`)
      .set('Authorization', auth)
      .send({ content: 'Quiero crear un frente de eficiencia operativa.' });
    expect(incomplete.body.data.actionPlan).toBeNull();
    expect(incomplete.body.data.missingInformation).toEqual([
      'objective',
      'mainKpi',
      'baseline',
      'target',
      'horizon',
      'areaOrBusinessUnit',
      'priority',
    ]);

    const unknownConv = await request(app).post('/api/v1/copilot/conversations').set('Authorization', auth).send({});
    const unknown = await request(app)
      .post(`/api/v1/copilot/conversations/${unknownConv.body.data.id}/messages`)
      .set('Authorization', auth)
      .send({ content: 'Necesito revisar bloqueos.' });
    expect(unknown.body.data.assessment.primaryIntent).toBe('unknown');
  });

  it('no crea ActionPlan cuando hay proposedPayload parcial pero faltan campos requeridos', async () => {
    const { app, plans, actions } = makeHttpHarness();
    const auth = `Bearer ${token()}`;
    const conv = await request(app).post('/api/v1/copilot/conversations').set('Authorization', auth).send({});

    const partial = await request(app)
      .post(`/api/v1/copilot/conversations/${conv.body.data.id}/messages`)
      .set('Authorization', auth)
      .send({
        content: 'Crea un frente llamado Eficiencia operativa. Su objetivo es reducir retrabajo. El KPI principal sera horas de retrabajo.',
      });

    expect(partial.status).toBe(201);
    expect(partial.body.data.assessment.detectedEntities.portfolioCopilotSession.proposal).toBeTruthy();
    expect(partial.body.data.actionPlan).toBeNull();
    expect(partial.body.data.missingInformation).toEqual(['baseline', 'target', 'horizon', 'areaOrBusinessUnit', 'priority']);
    expect(plans.size).toBe(0);
    expect(actions.size).toBe(0);
  });

  it('edita accion, detecta stale version, aprueba y rechaza', async () => {
    const { app } = makeHttpHarness();
    const { auth, actionId, actionVersion } = await createCompletePlan(app);

    const edited = await request(app)
      .patch(`/api/v1/copilot/actions/${actionId}`)
      .set('Authorization', auth)
      .send({
        expectedVersion: actionVersion,
        proposedPayload: {
          organizationId: 'org1',
          name: 'Eficiencia operativa ajustada',
          objective: 'Reducir retrabajo',
          mainKpi: 'Horas de retrabajo',
          createdBy: 'user1',
        },
      });
    expect(edited.status).toBe(200);
    expect(edited.body.data.version).toBe(2);

    const stale = await request(app)
      .patch(`/api/v1/copilot/actions/${actionId}`)
      .set('Authorization', auth)
      .send({ expectedVersion: 1, proposedPayload: edited.body.data.proposedPayload });
    expect(stale.status).toBe(409);

    const approved = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/approve`)
      .set('Authorization', auth)
      .send({ expectedVersion: 2 });
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('approved');

    const { app: rejectApp } = makeHttpHarness();
    const created = await createCompletePlan(rejectApp);
    const rejected = await request(rejectApp)
      .post(`/api/v1/copilot/actions/${created.actionId}/reject`)
      .set('Authorization', created.auth)
      .send({ expectedVersion: 1, reason: 'No aplica' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.status).toBe('rejected');
  });

  it('exige Idempotency-Key, ejecuta con key y replay no duplica', async () => {
    const { app, handler } = makeHttpHarness();
    const { auth, actionId, actionVersion } = await createCompletePlan(app);
    await request(app).post(`/api/v1/copilot/actions/${actionId}/approve`).set('Authorization', auth).send({ expectedVersion: actionVersion });

    const missing = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/execute`)
      .set('Authorization', auth)
      .send({ expectedVersion: actionVersion });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');

    const first = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/execute`)
      .set('Authorization', auth)
      .set('Idempotency-Key', 'idem-http-1')
      .send({ expectedVersion: actionVersion });
    const replay = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/execute`)
      .set('Authorization', auth)
      .set('Idempotency-Key', 'idem-http-1')
      .send({ expectedVersion: actionVersion });

    expect(first.status).toBe(201);
    expect(first.body.data.status).toBe('completed');
    expect(replay.status).toBe(200);
    expect(replay.body.data.status).toBe('idempotent_replay');
    expect(handler.execute).toHaveBeenCalledTimes(1);

    const execution = await request(app)
      .get(`/api/v1/copilot/executions/${first.body.data.id}`)
      .set('Authorization', auth);
    expect(execution.status).toBe(200);
    expect(execution.body.data.projectionLinks[0].objectType).toBe('StrategicFront');
  });

  it('impide acceso, aprobacion y ejecucion desde otra organizacion', async () => {
    const { app } = makeHttpHarness();
    const { conversationId, actionId } = await createCompletePlan(app);
    const otherAuth = `Bearer ${token('user2')}`;

    const read = await request(app).get(`/api/v1/copilot/conversations/${conversationId}`).set('Authorization', otherAuth);
    const approve = await request(app).post(`/api/v1/copilot/actions/${actionId}/approve`).set('Authorization', otherAuth).send({ expectedVersion: 1 });
    const execute = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/execute`)
      .set('Authorization', otherAuth)
      .set('Idempotency-Key', 'idem-other-1')
      .send({ expectedVersion: 1 });

    expect(read.status).toBe(403);
    expect(approve.status).toBe(403);
    expect(execute.status).toBe(403);
  });

  it('normaliza error Portfolio en ActionExecution failed', async () => {
    const { app } = makeHttpHarness({
      execute: vi.fn(async () => {
        throw AppError.badRequest('Portfolio rechazo el payload.', 'DOMAIN_VALIDATION_FAILED');
      }),
    });
    const { auth, actionId, actionVersion } = await createCompletePlan(app);
    await request(app).post(`/api/v1/copilot/actions/${actionId}/approve`).set('Authorization', auth).send({ expectedVersion: actionVersion });

    const res = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/execute`)
      .set('Authorization', auth)
      .set('Idempotency-Key', 'idem-domain-error')
      .send({ expectedVersion: actionVersion });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('failed');
    expect(res.body.data.error.code).toBe('DOMAIN_VALIDATION_FAILED');
  });

  it('bloquea escrituras cuando el kill switch Copilot esta apagado y conserva lecturas', async () => {
    const { app, conversations } = makeHttpHarness(undefined, { writeEnabled: false });
    conversations.set('conv-existing', makeConversation({ id: 'conv-existing', organizationId: 'org1', userId: 'user1' }));
    const auth = `Bearer ${token()}`;

    const write = await request(app).post('/api/v1/copilot/conversations').set('Authorization', auth).send({});
    const read = await request(app).get('/api/v1/copilot/conversations/conv-existing').set('Authorization', auth);

    expect(write.status).toBe(403);
    expect(write.body.error.code).toBe('COPILOT_WRITE_DISABLED');
    expect(read.status).toBe(200);
  });

  it('bloquea ejecucion cuando CreateStrategicFront esta deshabilitado', async () => {
    const { app } = makeHttpHarness(undefined, { createStrategicFrontEnabled: false });
    const { auth, actionId, actionVersion } = await createCompletePlan(app);

    const res = await request(app)
      .post(`/api/v1/copilot/actions/${actionId}/execute`)
      .set('Authorization', auth)
      .set('Idempotency-Key', 'idem-disabled-capability')
      .send({ expectedVersion: actionVersion });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('COPILOT_CAPABILITY_DISABLED');
  });

  it('capability desconocida produce error controlado', async () => {
    const { app, actions, plans, conversations } = makeHttpHarness();
    conversations.set('conv-custom', makeConversation({ id: 'conv-custom', organizationId: 'org1', userId: 'user1' }));
    plans.set('plan-custom', makePlan({ id: 'plan-custom', conversationId: 'conv-custom', proposedActions: [] }));
    actions.set('action-custom', makeAction({ id: 'action-custom', actionPlanId: 'plan-custom', capabilityId: 'MissingCapability' }));

    const res = await request(app)
      .post('/api/v1/copilot/actions/action-custom/approve')
      .set('Authorization', `Bearer ${token()}`)
      .send({ expectedVersion: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CAPABILITY_NOT_FOUND');
  });
});
