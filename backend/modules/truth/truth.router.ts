import { Router } from 'express';
import { prisma } from '../../shared/db/prisma';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { TruthController } from './truth.controller';
import { TruthService } from './truth.service';
import {
  attentionItemSchema,
  claimSchema,
  evidenceSchema,
  impactAssertionSchema,
  impactTransitionSchema,
  resolveAttentionItemSchema,
  sourceRefSchema,
  validationSchema,
} from './truth.schemas';

const service = new TruthService(prisma);
const controller = new TruthController(service);

export const truthRouter = Router();

truthRouter.use(authenticate);

truthRouter.post('/source-refs', validate(sourceRefSchema), controller.createSourceRef);
truthRouter.post('/claims', validate(claimSchema), controller.createClaim);
truthRouter.post('/evidence', validate(evidenceSchema), controller.attachEvidence);
truthRouter.post('/validations', validate(validationSchema), controller.recordValidation);
truthRouter.get('/projects/:projectId/claims/:claimId/readiness', controller.getClaimReadiness);
truthRouter.post('/attention-items', validate(attentionItemSchema), controller.createAttentionItem);
truthRouter.get('/projects/:projectId/attention-items', controller.listAttentionItems);
truthRouter.patch(
  '/projects/:projectId/attention-items/:id/resolve',
  validate(resolveAttentionItemSchema),
  controller.resolveAttentionItem,
);
truthRouter.post('/impact-assertions', validate(impactAssertionSchema), controller.createImpactAssertion);
truthRouter.patch(
  '/projects/:projectId/impact-assertions/:id/transition',
  validate(impactTransitionSchema),
  controller.transitionImpact,
);
