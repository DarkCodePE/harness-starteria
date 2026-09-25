import { Router, type RequestHandler } from 'express';
import { prisma } from '../../shared/db/prisma';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { StrategicFramingController } from './strategic-framing.controller';
import { StrategicFramingProvisionalStateService } from './strategic-framing.provisional-state.service';
import { StrategicFramingEntryService } from './strategic-framing.entry.service';

export function buildStrategicFramingRouter(deps: { authenticate?: RequestHandler; service?: StrategicFramingProvisionalStateService; entryService?: StrategicFramingEntryService } = {}): Router {
  const router = Router();
  const auth = deps.authenticate ?? authenticate;
  const service = deps.service ?? new StrategicFramingProvisionalStateService(prisma);
  const controller = new StrategicFramingController(service, deps.entryService ?? new StrategicFramingEntryService(prisma, undefined, service));
  router.post('/states/from-source', auth, requirePermission('portfolio:write'), controller.createOrReuseFromSource);
  router.get('/states/:stateId', auth, requirePermission('portfolio:read'), controller.getState);
  router.patch('/states/:stateId', auth, requirePermission('portfolio:write'), controller.updateState);
  return router;
}

export const strategicFramingRouter = buildStrategicFramingRouter();
