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
import {
  createInitialReviewSchema,
  addContextSchema,
  strategicAnswersSchema,
} from './initial-review.schemas';

const service = new InitialReviewService(prisma, new MockInitialReviewGenerator());
const controller = new InitialReviewController(service);

export const initialReviewRouter = Router();
initialReviewRouter.use(authenticate);

initialReviewRouter.post('/', validate(createInitialReviewSchema), controller.create);
initialReviewRouter.get('/:id', controller.getById);
initialReviewRouter.get('/:id/snapshot', controller.getSnapshot);
initialReviewRouter.post('/:id/add-context', validate(addContextSchema), controller.addContext);
initialReviewRouter.post('/:id/strategic-answers', validate(strategicAnswersSchema), controller.saveAnswers);
