/**
 * Router de la revisión inicial guiada (ADR-025, PRD §21).
 * Montado en `/api/v1/initial-reviews`. Autenticado (la revisión es privada del creador,
 * PRD §24). IR-B2 usa el generador mock; IR-B3 inyectará el real.
 */
import { Router } from 'express';
import prisma from '../../shared/db/prisma';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { InitialReviewService } from './initial-review.service';
import { InitialReviewController } from './initial-review.controller';
import { MockInitialReviewGenerator } from './mock-generator';
import { AiInitialCritiqueService } from './ai-generator';
import type { InitialReviewGenerator } from './initial-review.types';
import {
  createInitialReviewSchema,
  addContextSchema,
  strategicAnswersSchema,
} from './initial-review.schemas';

// IR-B3: el generador real (ai-service + guardrails §25) se activa con INITIAL_REVIEW_AI=real.
// Por defecto, mock determinista (el endpoint /initial-review del ai-service es pendiente).
const generator: InitialReviewGenerator =
  process.env.INITIAL_REVIEW_AI === 'real' ? new AiInitialCritiqueService() : new MockInitialReviewGenerator();

const service = new InitialReviewService(prisma, generator);
const controller = new InitialReviewController(service);

export const initialReviewRouter = Router();
initialReviewRouter.use(authenticate);

initialReviewRouter.post('/', validate(createInitialReviewSchema), controller.create);
initialReviewRouter.get('/:id', controller.getById);
initialReviewRouter.get('/:id/snapshot', controller.getSnapshot);
initialReviewRouter.post('/:id/add-context', validate(addContextSchema), controller.addContext);
initialReviewRouter.post('/:id/strategic-answers', validate(strategicAnswersSchema), controller.saveAnswers);
