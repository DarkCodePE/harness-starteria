import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from '../../../shared/errors/error-handler';
import { generateAccessToken } from '../../auth/token.service';
import { buildCopilotRouter } from '../copilot.router';

const describeIntegration = process.env.COPILOT_DB_INTEGRATION === '1' ? describe : describe.skip;
const prisma = new PrismaClient();
const organizationId = 'org-copilot-api-vertical';
const userId = 'user-copilot-api-vertical';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/copilot', buildCopilotRouter({ prisma }));
  app.use(errorHandler);
  return app;
}

function authHeader() {
  const token = generateAccessToken({
    sub: userId,
    email: 'copilot.api.vertical@starteria.test',
    role: 'mentor',
  });
  return `Bearer ${token}`;
}

async function clean() {
  await prisma.actionExecution.deleteMany({ where: { proposedAction: { actionPlan: { conversation: { userId } } } } });
  await prisma.proposedAction.deleteMany({ where: { actionPlan: { conversation: { userId } } } });
  await prisma.actionPlan.deleteMany({ where: { conversation: { userId } } });
  await prisma.intentAssessment.deleteMany({ where: { conversation: { userId } } });
  await prisma.copilotMessage.deleteMany({ where: { conversation: { userId } } });
  await prisma.copilotConversation.deleteMany({ where: { userId } });
  await prisma.strategicFront.deleteMany({ where: { organizationId, ownerId: userId } });
  await prisma.auditLog.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

describeIntegration('Copilot API vertical integration', () => {
  beforeAll(async () => {
    await clean();
    await prisma.user.create({
      data: {
        id: userId,
        email: 'copilot.api.vertical@starteria.test',
        name: 'Copilot API Vertical',
        role: 'mentor',
        initials: 'CA',
        skills: [],
        organizationId,
      },
    });
  });

  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('recorre conversation -> message -> plan -> edit -> approve -> execute -> replay sin duplicar frente', async () => {
    const app = makeApp();
    const auth = authHeader();

    const conversation = await request(app)
      .post('/api/v1/copilot/conversations')
      .set('Authorization', auth)
      .send({});
    expect(conversation.status).toBe(201);

    const message = await request(app)
      .post(`/api/v1/copilot/conversations/${conversation.body.data.id}/messages`)
      .set('Authorization', auth)
      .send({
        content: 'Crea un frente llamado Eficiencia operativa. Su objetivo es reducir retrabajo. El KPI principal sera horas de retrabajo, con baseline 500, meta 300, horizonte de 6 meses, prioridad alta y sponsor Operaciones.',
      });
    expect(message.status).toBe(201);
    expect(message.body.data.assessment.primaryIntent).toBe('create_strategic_front');
    expect(message.body.data.actionPlan.status).toBe('awaiting_confirmation');

    const action = message.body.data.actionPlan.proposedActions[0];
    const edited = await request(app)
      .patch(`/api/v1/copilot/actions/${action.id}`)
      .set('Authorization', auth)
      .send({
        expectedVersion: action.version,
        proposedPayload: {
          ...action.proposedPayload,
          name: 'Eficiencia operativa API',
        },
      });
    expect(edited.status).toBe(200);
    expect(edited.body.data.version).toBe(action.version + 1);

    const approved = await request(app)
      .post(`/api/v1/copilot/actions/${action.id}/approve`)
      .set('Authorization', auth)
      .send({ expectedVersion: edited.body.data.version });
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('approved');

    const executed = await request(app)
      .post(`/api/v1/copilot/actions/${action.id}/execute`)
      .set('Authorization', auth)
      .set('Idempotency-Key', 'idem-api-vertical-001')
      .send({ expectedVersion: edited.body.data.version });
    expect(executed.status).toBe(201);
    expect(executed.body.data.status).toBe('completed');
    expect(executed.body.data.createdObjectReferences).toHaveLength(1);

    const fetchedExecution = await request(app)
      .get(`/api/v1/copilot/executions/${executed.body.data.id}`)
      .set('Authorization', auth);
    expect(fetchedExecution.status).toBe(200);
    expect(fetchedExecution.body.data.projectionLinks[0].objectType).toBe('StrategicFront');

    const frontsAfterFirst = await prisma.strategicFront.findMany({
      where: { organizationId, ownerId: userId },
    });
    expect(frontsAfterFirst).toHaveLength(1);
    expect(frontsAfterFirst[0].name).toBe('Eficiencia operativa API');

    const replay = await request(app)
      .post(`/api/v1/copilot/actions/${action.id}/execute`)
      .set('Authorization', auth)
      .set('Idempotency-Key', 'idem-api-vertical-001')
      .send({ expectedVersion: edited.body.data.version });
    expect(replay.status).toBe(200);
    expect(replay.body.data.status).toBe('idempotent_replay');

    const frontsAfterReplay = await prisma.strategicFront.findMany({
      where: { organizationId, ownerId: userId },
    });
    expect(frontsAfterReplay).toHaveLength(1);

    const refresh = await request(app)
      .get(`/api/v1/copilot/conversations/${conversation.body.data.id}/action-plan`)
      .set('Authorization', auth);
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.proposedActions[0].status).toBe('completed');

    const audits = await prisma.auditLog.findMany({ where: { userId } });
    expect(audits.some((audit) => audit.action === 'copilot.action_plan.generated')).toBe(true);
    expect(audits.some((audit) => audit.action === 'copilot.execution.completed')).toBe(true);
  });
});
