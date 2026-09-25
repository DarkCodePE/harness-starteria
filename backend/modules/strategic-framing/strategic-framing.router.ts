import { Router, type RequestHandler } from 'express';
import { prisma } from '../../shared/db/prisma';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { StrategicFramingController } from './strategic-framing.controller';
import { StrategicFramingProvisionalStateService } from './strategic-framing.provisional-state.service';

export function buildStrategicFramingRouter(deps: { authenticate?: RequestHandler; service?: StrategicFramingProvisionalStateService } = {}): Router {
  const router = Router();
  const auth = deps.authenticate ?? authenticate;
  const controller = new StrategicFramingController(deps.service ?? new StrategicFramingProvisionalStateService(prisma));
  router.get('/states/:stateId', auth, requirePermission('portfolio:read'), controller.getState);
  router.patch('/states/:stateId', auth, requirePermission('portfolio:write'), controller.updateState);
  return router;
}

export const strategicFramingRouter = buildStrategicFramingRouter();
