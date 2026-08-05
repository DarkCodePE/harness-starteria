import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import prisma from '../../shared/db/prisma';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CopilotErrors } from './domain/copilot.errors';
import { ConversationService } from './application/conversation.service';
import { ActionPlanService } from './application/action-plan.service';
import { ApprovalService } from './application/approval.service';
import { ActionExecutor } from './application/action-executor';
import { CopilotFeatureGuard } from './application/copilot-feature-guard';
import { createDefaultCapabilityRegistry } from './application/capability-registry';
import { CopilotOrchestrationService } from './application/copilot-orchestration.service';
import type { CopilotAssessmentAdapter } from './application/copilot-assessment.adapter';
import { DeterministicCopilotAdapter } from './application/deterministic-copilot.adapter';
import { getCopilotRuntimeConfig } from './application/copilot-runtime-config';
import { CreateStrategicFrontCommandHandler } from './commands/create-strategic-front.command';
import { PrismaCopilotRepository } from './infrastructure/prisma-copilot.repository';
import type { CopilotRepository } from './infrastructure/copilot.repository';
import { CopilotController } from './copilot.controller';
import { createCopilotRateLimiter } from './copilot-rate-limit';
import {
  approveActionHttpSchema,
  createConversationHttpSchema,
  editProposedActionHttpSchema,
  executeActionHttpSchema,
  rejectActionHttpSchema,
  sendMessageHttpSchema,
} from './schemas/copilot.schemas';

export type BuildCopilotRouterOptions = {
  prisma?: PrismaClient;
  repository?: CopilotRepository;
  adapter?: CopilotAssessmentAdapter;
  createStrategicFrontHandler?: CreateStrategicFrontCommandHandler;
  featureGuard?: CopilotFeatureGuard;
};

class UnavailableCopilotAdapter implements CopilotAssessmentAdapter {
  readonly adapterType = 'unavailable';
  readonly version = 'unavailable';

  async assess(): Promise<never> {
    throw CopilotErrors.adapterNotAvailable();
  }
}

export function buildCopilotRouter(options: BuildCopilotRouterOptions = {}): Router {
  const db = options.prisma ?? prisma;
  const repository = options.repository ?? new PrismaCopilotRepository(db);
  const registry = createDefaultCapabilityRegistry();
  const conversationService = new ConversationService(repository);
  const actionPlanService = new ActionPlanService(repository, registry);
  const approvalService = new ApprovalService(repository, registry);
  const portfolioService = new PortfolioService(db);
  const commandHandler = options.createStrategicFrontHandler ?? new CreateStrategicFrontCommandHandler(portfolioService);
  const actionExecutor = new ActionExecutor(repository, registry, commandHandler);
  const adapter = options.adapter ?? buildConfiguredAdapter();
  const orchestrationService = new CopilotOrchestrationService(
    repository,
    actionPlanService,
    registry,
    adapter,
  );
  const controller = new CopilotController(
    repository,
    conversationService,
    actionPlanService,
    approvalService,
    actionExecutor,
    orchestrationService,
    options.featureGuard ?? new CopilotFeatureGuard(),
  );

  const router = Router();
  router.use(authenticate);
  const runtimeConfig = getCopilotRuntimeConfig();
  const messageLimiter = createCopilotRateLimiter({
    windowMs: 60_000,
    maxRequests: runtimeConfig.rateLimitMessage,
    scope: 'copilot-message',
  });
  const executionLimiter = createCopilotRateLimiter({
    windowMs: 60_000,
    maxRequests: runtimeConfig.rateLimitExecution,
    scope: 'copilot-execution',
  });

  router.post('/conversations', messageLimiter, validate(createConversationHttpSchema), controller.createConversation);
  router.get('/conversations/:conversationId', controller.getConversation);
  router.get('/conversations/:conversationId/messages', controller.getMessages);
  router.post('/conversations/:conversationId/messages', messageLimiter, validate(sendMessageHttpSchema), controller.sendMessage);
  router.get('/conversations/:conversationId/intent-assessment', controller.getLatestIntentAssessment);
  router.get('/conversations/:conversationId/action-plan', controller.getCurrentActionPlan);
  router.get('/action-plans/:actionPlanId', controller.getActionPlan);
  router.patch('/actions/:actionId', messageLimiter, validate(editProposedActionHttpSchema), controller.editAction);
  router.post('/actions/:actionId/approve', messageLimiter, validate(approveActionHttpSchema), controller.approveAction);
  router.post('/actions/:actionId/reject', messageLimiter, validate(rejectActionHttpSchema), controller.rejectAction);
  router.post('/actions/:actionId/execute', executionLimiter, validate(executeActionHttpSchema), controller.executeAction);
  router.get('/executions/:executionId', controller.getExecution);
  router.get('/actions/:actionId/executions', controller.listActionExecutions);

  return router;
}

function buildConfiguredAdapter(): CopilotAssessmentAdapter {
  const runtimeConfig = getCopilotRuntimeConfig();
  if (runtimeConfig.assessmentAdapter === 'deterministic' || process.env.NODE_ENV === 'test') {
    return new DeterministicCopilotAdapter();
  }
  return new UnavailableCopilotAdapter();
}

export const copilotRouter = buildCopilotRouter();
