import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { prisma } from '../../shared/db/prisma';
import { authenticate } from '../auth/auth.middleware';
import { PrismaPortfolioEntrySessionRepository } from '../portfolio-entry-sessions/infrastructure/prisma-portfolio-entry-session.repository';
import { PortfolioEntrySessionService } from '../portfolio-entry-sessions/application/portfolio-entry-session.service';
import type { PortfolioEntrySessionRepository } from '../portfolio-entry-sessions/application/portfolio-entry-session.repository';
import {
  DeterministicPortfolioEntryAgentAdapter,
  PortfolioEntryExperimentalSessionService,
  UnconfiguredPortfolioEntryAgentAdapter,
} from './application/portfolio-entry-experimental-session.service';
import {
  DeterministicPortfolioEntryHandoffMaterializer,
  UnconfiguredPortfolioEntryHandoffMaterializer,
  type PortfolioEntryAgentAdapterV2,
  type PortfolioEntryHandoffMaterializer,
  FetchStructuredModelAdapter,
  LivePortfolioEntryAgentAdapter,
  LivePortfolioEntryHandoffMaterializer,
  loadPortfolioEntryProviderConfig,
  loadResolvedPromptManifest,
} from '../portfolio-entry-runtime';
import type { PortfolioEntryIdempotencyRepository } from './application/portfolio-entry-idempotency.repository';
import { PrismaPortfolioEntryIdempotencyRepository } from './infrastructure/prisma-portfolio-entry-idempotency.repository';
import { PortfolioEntryController } from './portfolio-entry.controller';
import { createPortfolioEntryRateLimiter } from './portfolio-entry-rate-limit';
import { PortfolioEntryConversionController } from '../portfolio-entry-conversion/portfolio-entry-conversion.controller';
import { PortfolioEntryConversionService } from '../portfolio-entry-conversion/portfolio-entry-conversion.service';
import { PortfolioEntryContinuationController } from '../portfolio-entry-continuation/portfolio-entry-continuation.controller';
import { PortfolioEntryContinuationService } from '../portfolio-entry-continuation/portfolio-entry-continuation.service';

const versioning = {
  contractVersion: 'portfolio-entry-contract-v0.1',
  runtimeVersion: 'portfolio-entry-runtime-v0.2',
  schemaVersion: 'portfolio-entry-schema-v0.2',
  promptManifestId: 'portfolio-entry-prompts-v0.2',
};

export interface PortfolioEntryRouterOptions {
  maxCreateRequests?: number;
  maxSubmitRequests?: number;
  maxHandoffRequests?: number;
  windowMs?: number;
}

export interface PortfolioEntryRouterDeps {
  sessionRepository?: PortfolioEntrySessionRepository;
  idempotencyRepository?: PortfolioEntryIdempotencyRepository;
  agentAdapter?: PortfolioEntryAgentAdapterV2;
  handoffMaterializer?: PortfolioEntryHandoffMaterializer;
  authenticate?: RequestHandler;
  optionalAuthenticate?: RequestHandler;
  conversionService?: PortfolioEntryConversionService;
  continuationService?: PortfolioEntryContinuationService;
  sessionTtlMs?: number;
  idempotencyTtlMs?: number;
}

export function buildPortfolioEntryRouter(
  options: PortfolioEntryRouterOptions = {},
  deps: PortfolioEntryRouterDeps = {},
): Router {
  const sessionRepository = deps.sessionRepository ?? new PrismaPortfolioEntrySessionRepository(prisma);
  const sessionService = new PortfolioEntrySessionService(sessionRepository, {
    ttlMs: deps.sessionTtlMs ?? config.portfolioEntrySessionTtlSeconds * 1000,
    versioning,
  });
  const idempotencyRepository = deps.idempotencyRepository ?? new PrismaPortfolioEntryIdempotencyRepository(prisma);
  const agentAdapter = deps.agentAdapter ?? configuredAgentAdapter();
  const handoffMaterializer = deps.handoffMaterializer
    ?? (deps.agentAdapter ? new DeterministicPortfolioEntryHandoffMaterializer() : configuredHandoffMaterializer());
  const appService = new PortfolioEntryExperimentalSessionService(
    sessionService,
    sessionRepository,
    idempotencyRepository,
    agentAdapter,
    handoffMaterializer,
    {
      idempotencyTtlMs: deps.idempotencyTtlMs ?? config.portfolioEntryIdempotencyTtlSeconds * 1000,
      versioning,
    },
  );
  const controller = new PortfolioEntryController(appService);
  const conversionController = new PortfolioEntryConversionController(
    deps.conversionService ?? new PortfolioEntryConversionService(prisma, idempotencyRepository),
  );
  const continuationController = new PortfolioEntryContinuationController(
    deps.continuationService ?? new PortfolioEntryContinuationService(prisma, idempotencyRepository),
  );
  const router = Router();
  const auth = deps.authenticate ?? authenticate;
  const optionalAuth = deps.optionalAuthenticate ?? createOptionalAuthenticate(auth);
  const windowMs = options.windowMs ?? 10 * 60_000;
  const createLimiter = createPortfolioEntryRateLimiter({
    windowMs,
    maxRequests: options.maxCreateRequests ?? 20,
    scope: 'portfolio-entry:create',
  });
  const submitLimiter = createPortfolioEntryRateLimiter({
    windowMs,
    maxRequests: options.maxSubmitRequests ?? 20,
    scope: 'portfolio-entry:submit',
  });
  const handoffLimiter = createPortfolioEntryRateLimiter({
    windowMs,
    maxRequests: options.maxHandoffRequests ?? 10,
    scope: 'portfolio-entry:handoff',
  });

  router.post('/sessions', createLimiter, controller.createSession);
  router.get('/sessions/:sessionId', optionalAuth, submitLimiter, controller.readSession);
  router.post('/sessions/:sessionId/messages', optionalAuth, submitLimiter, controller.submitMessage);
  router.post('/sessions/:sessionId/guided-exploration', optionalAuth, submitLimiter, controller.guidedExploration);
  router.post('/sessions/:sessionId/handoff', optionalAuth, handoffLimiter, controller.materializeHandoff);
  router.get('/sessions/:sessionId/handoff', optionalAuth, submitLimiter, controller.readHandoff);
  router.post('/sessions/:sessionId/handoff/confirmation', optionalAuth, handoffLimiter, controller.confirmOrCorrectHandoff);
  router.post('/sessions/:sessionId/claim', auth, handoffLimiter, controller.claim);
  router.post('/sessions/:sessionId/convert', auth, handoffLimiter, conversionController.convert);
  router.post('/sessions/:sessionId/continue-portfolio', auth, handoffLimiter, continuationController.continueToPortfolio);
  router.get('/continuations/:continuationId', auth, submitLimiter, continuationController.readContinuation);

  return router;
}

function configuredAgentAdapter(): PortfolioEntryAgentAdapterV2 {
  if (config.portfolioEntryRuntimeMode === 'deterministic') {
    if (config.nodeEnv === 'production') {
      throw new Error('PORTFOLIO_ENTRY_RUNTIME_MODE=deterministic is not allowed in production.');
    }
    return new DeterministicPortfolioEntryAgentAdapter();
  }
  try {
    const provider = loadPortfolioEntryProviderConfig();
    const prompts = loadResolvedPromptManifest();
    const candidate = createLiveCandidate(provider, prompts);
    return new LivePortfolioEntryAgentAdapter(new FetchStructuredModelAdapter(provider), candidate, prompts);
  } catch (err) {
    // Degrading silently here surfaces later as PORTFOLIO_ENTRY_MODEL_PROVIDER_FAILURE
    // on every request, which points at the provider instead of the real cause.
    logger.error({ err }, 'Portfolio Entry live agent adapter is not configured; falling back to unconfigured.');
    return new UnconfiguredPortfolioEntryAgentAdapter();
  }
}

function configuredHandoffMaterializer(): PortfolioEntryHandoffMaterializer {
  if (config.portfolioEntryRuntimeMode === 'deterministic') {
    if (config.nodeEnv === 'production') {
      throw new Error('PORTFOLIO_ENTRY_RUNTIME_MODE=deterministic is not allowed in production.');
    }
    return new DeterministicPortfolioEntryHandoffMaterializer();
  }
  try {
    const provider = loadPortfolioEntryProviderConfig();
    const prompts = loadResolvedPromptManifest();
    const candidate = createLiveCandidate(provider, prompts);
    return new LivePortfolioEntryHandoffMaterializer(new FetchStructuredModelAdapter(provider), candidate, prompts);
  } catch (err) {
    // Degrading silently here surfaces later as PORTFOLIO_ENTRY_MODEL_PROVIDER_FAILURE
    // on every request, which points at the provider instead of the real cause.
    logger.error({ err }, 'Portfolio Entry live handoff materializer is not configured; falling back to unconfigured.');
    return new UnconfiguredPortfolioEntryHandoffMaterializer();
  }
}

function createLiveCandidate(
  provider: ReturnType<typeof loadPortfolioEntryProviderConfig>,
  prompts: ReturnType<typeof loadResolvedPromptManifest>,
) {
  return {
    candidate_id: 'portfolio-entry-live-openai-v0.2',
    adapter_mode: 'live_llm_candidate' as const,
    provider: provider.provider,
    model: provider.model,
    prompt_manifest_hash: prompts.prompt_manifest_hash,
    contract_manifest_hash: versioning.contractVersion,
    seed_support: provider.seed === undefined ? 'not_requested' as const : 'unavailable' as const,
  };
}

function createOptionalAuthenticate(authenticateMiddleware: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('Authorization');
    if (!header) {
      next();
      return;
    }
    void Promise.resolve(authenticateMiddleware(req, res, next)).catch(next);
  };
}

export const portfolioEntryRouter = buildPortfolioEntryRouter();
