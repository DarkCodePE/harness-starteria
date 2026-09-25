import { Router, type RequestHandler } from 'express';
import { prisma } from '../../shared/db/prisma';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { StrategicFramingController } from './strategic-framing.controller';
import { StrategicFramingProvisionalStateService } from './strategic-framing.provisional-state.service';
import { StrategicFramingEntryService } from './strategic-framing.entry.service';
import { StrategicFramingLensSuggestionEvaluator } from './strategic-framing.lens-suggestions';

export function buildStrategicFramingRouter(deps: { authenticate?: RequestHandler; service?: StrategicFramingProvisionalStateService; entryService?: StrategicFramingEntryService; lensEvaluator?: StrategicFramingLensSuggestionEvaluator } = {}): Router {
  const router = Router();
  const auth = deps.authenticate ?? authenticate;
  const service = deps.service ?? new StrategicFramingProvisionalStateService(prisma);
  const controller = new StrategicFramingController(service, deps.entryService ?? new StrategicFramingEntryService(prisma, undefined, service), deps.lensEvaluator ?? new StrategicFramingLensSuggestionEvaluator());
  router.post('/states/from-source', auth, requirePermission('portfolio:write'), controller.createOrReuseFromSource);
  router.get('/states/:stateId', auth, requirePermission('portfolio:read'), controller.getState);
  router.get('/states/:stateId/lens-suggestions', auth, requirePermission('portfolio:read'), controller.getLensSuggestions);
  router.patch('/states/:stateId', auth, requirePermission('portfolio:write'), controller.updateState);
  return router;
}

export const strategicFramingRouter = buildStrategicFramingRouter();
