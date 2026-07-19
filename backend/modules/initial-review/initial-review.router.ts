/**
 * Router de la revisión inicial guiada (ADR-025, PRD §21).
 * Montado en `/api/v1/initial-reviews`. Autenticado (la revisión es privada del creador,
 * PRD §24). IR-B2 usa el generador mock; IR-B3 inyectará el real.
 */
import express, { Router } from 'express';
import prisma from '../../shared/db/prisma';
import { authenticate } from '../auth/auth.middleware';
import { requireEntitlement } from '../billing/entitlement.middleware';
import { MAX_DOC_BYTES } from './initial-review.controller';
import { validate } from '../../shared/middleware/validate';
import { InitialReviewService } from './initial-review.service';
import { RouteConfirmationService } from './route-confirmation.service';
import { InitialReviewController } from './initial-review.controller';
import { MockInitialReviewGenerator } from './mock-generator';
import { AiInitialCritiqueService } from './ai-generator';
import { ResilientInitialReviewGenerator } from './resilient-generator';
import type { InitialReviewGenerator } from './initial-review.types';
import { ProjectService } from '../projects/project.service';
import {
  createInitialReviewSchema,
  addContextSchema,
  strategicAnswersSchema,
  confirmRouteSchema,
} from './initial-review.schemas';

// IR-B3/CC-02: el generador real (ai-service + guardrails §25) se activa con INITIAL_REVIEW_AI=real
// (con fallback al mock ante fallo del ai-service). `real-strict` desactiva el fallback (debug).
// Por defecto, mock determinista.
function buildGenerator(): InitialReviewGenerator {
  const mode = process.env.INITIAL_REVIEW_AI;
  if (mode === 'real') return new ResilientInitialReviewGenerator(new AiInitialCritiqueService(), new MockInitialReviewGenerator());
  if (mode === 'real-strict') return new AiInitialCritiqueService();
  return new MockInitialReviewGenerator();
}
const generator: InitialReviewGenerator = buildGenerator();

const service = new InitialReviewService(prisma, generator);
// IR-B4: reusa ProjectService.createProject (milestone #7) sin modificarlo.
const routeConfirmations = new RouteConfirmationService(prisma, new ProjectService(prisma));
const controller = new InitialReviewController(service, routeConfirmations);

export const initialReviewRouter = Router();
initialReviewRouter.use(authenticate);

initialReviewRouter.post('/', validate(createInitialReviewSchema), controller.create);
initialReviewRouter.get('/:id', controller.getById);
initialReviewRouter.get('/:id/snapshot', controller.getSnapshot);
initialReviewRouter.post('/:id/add-context', validate(addContextSchema), controller.addContext);
// ADR-026 v2: subir documento como contexto. Cuerpo raw (cualquier tipo → validado en el controller).
initialReviewRouter.post(
  '/:id/add-document',
  requireEntitlement('pdf_extract'),
  express.raw({ type: () => true, limit: MAX_DOC_BYTES }),
  controller.addDocument,
);
initialReviewRouter.post('/:id/strategic-answers', validate(strategicAnswersSchema), controller.saveAnswers);
initialReviewRouter.post('/:id/confirm-route', validate(confirmRouteSchema), controller.confirmRoute);
