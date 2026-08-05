import { Router } from 'express';
import { prisma } from '../../shared/db/prisma';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { validate } from '../../shared/middleware/validate';
import {
  updateProfileSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updatePlatformRoleSchema,
} from './user.schemas';

import { authenticate, requireRole } from '../auth/auth.middleware';
import { requireEntitlement } from '../billing/entitlement.middleware';
const service = new UserService(prisma);
const controller = new UserController(service);

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/profile', controller.getProfile);
userRouter.patch('/profile', validate(updateProfileSchema), controller.updateProfile);

// ADR-028: asignación de rol de plataforma. Sin esto el rol `portfolio_lead` sería
// inalcanzable — `register` rechaza cualquier valor distinto de `participante` y no
// existía ningún endpoint que asignara roles. Concede privilegios, así que va con
// `requireRole('admin')` explícito además del `authenticate` del router.
userRouter.patch(
  '/:userId/role',
  requireRole('admin'),
  validate(updatePlatformRoleSchema),
  controller.updatePlatformRole,
);

export const teamRouter = Router();

teamRouter.use(authenticate);

teamRouter.get('/:projectId/team', controller.getTeam);
// PRD-005 / ADR-022: gate collaborator invites on the plan's `seats` limit
// (resource count = current team members of this project). Shadow mode by default.
teamRouter.post(
  '/:projectId/team/invite',
  requireEntitlement('seats', {
    resourceCount: (req) =>
      prisma.teamMember.count({ where: { projectId: req.params.projectId } }),
  }),
  validate(inviteMemberSchema),
  controller.inviteMember,
);
teamRouter.patch(
  '/:projectId/team/:memberId',
  validate(updateMemberRoleSchema),
  controller.updateMemberRole
);
teamRouter.delete('/:projectId/team/:memberId', controller.removeMember);
