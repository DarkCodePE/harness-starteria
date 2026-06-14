import { Router } from 'express';
import { prisma } from '../../shared/db/prisma';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { validate } from '../../shared/middleware/validate';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { requireEntitlement } from '../billing/entitlement.middleware';
import {
  createStrategicFrontSchema,
  updateStrategicFrontSchema,
  createChallengeSchema,
  updateChallengeSchema,
  addInvitationSchema,
  updateInvitationSchema,
  addSquadMemberSchema,
  updateSquadMemberSchema,
  addChallengeTeamMemberSchema,
  updateChallengeTeamMemberSchema,
  upsertInitiativeTeamMemberSchema,
  upsertInitiativeMetaSchema,
  createOverlapSchema,
  createExecutiveOutputSchema,
  updateExecutiveOutputSchema,
} from './portfolio.schemas';

const service = new PortfolioService(prisma);
const controller = new PortfolioController(service);

export const portfolioRouter = Router();

portfolioRouter.use(authenticate);

// ─── Strategic Fronts ─────────────────────────────────────────────────────────
portfolioRouter.get('/strategic-fronts', controller.listStrategicFronts);

portfolioRouter.post(
  '/strategic-fronts',
  requireRole('admin', 'mentor'),
  validate(createStrategicFrontSchema),
  controller.createStrategicFront,
);

portfolioRouter.patch(
  '/strategic-fronts/:id',
  requireRole('admin', 'mentor'),
  validate(updateStrategicFrontSchema),
  controller.updateStrategicFront,
);

portfolioRouter.delete(
  '/strategic-fronts/:id',
  requireRole('admin'),
  controller.deleteStrategicFront,
);

// ─── Challenges ───────────────────────────────────────────────────────────────
portfolioRouter.get(
  '/strategic-fronts/:frontId/challenges',
  controller.listChallenges,
);

portfolioRouter.post(
  '/strategic-fronts/:frontId/challenges',
  requireRole('admin', 'mentor'),
  validate(createChallengeSchema),
  controller.createChallenge,
);

portfolioRouter.patch(
  '/challenges/:id',
  requireRole('admin', 'mentor'),
  validate(updateChallengeSchema),
  controller.updateChallenge,
);

// ─── Challenge Actions ────────────────────────────────────────────────────────
portfolioRouter.post(
  '/challenges/:id/activate-open-call',
  requireRole('admin', 'mentor'),
  controller.activateOpenCall,
);

portfolioRouter.post(
  '/challenges/:id/publish',
  requireRole('admin', 'mentor'),
  controller.publishChallenge,
);

// ─── Invitations ──────────────────────────────────────────────────────────────
portfolioRouter.post(
  '/challenges/:id/invitations',
  requireRole('admin', 'mentor'),
  validate(addInvitationSchema),
  controller.addInvitation,
);

portfolioRouter.patch(
  '/challenges/:id/invitations/:invId',
  requireRole('admin', 'mentor'),
  validate(updateInvitationSchema),
  controller.updateInvitation,
);

// ─── Squad Members ────────────────────────────────────────────────────────────
portfolioRouter.post(
  '/challenges/:id/squad',
  requireRole('admin', 'mentor'),
  validate(addSquadMemberSchema),
  controller.addSquadMember,
);

portfolioRouter.patch(
  '/challenges/:id/squad/:memberId',
  requireRole('admin', 'mentor'),
  validate(updateSquadMemberSchema),
  controller.updateSquadMember,
);

// ─── Challenge Team Members (ADR-023) ───────────────────────────────────────────
portfolioRouter.get(
  '/challenges/:challengeId/team',
  controller.listChallengeTeam,
);

portfolioRouter.post(
  '/challenges/:challengeId/team',
  requireRole('admin', 'mentor'),
  validate(addChallengeTeamMemberSchema),
  controller.addChallengeTeamMember,
);

portfolioRouter.patch(
  '/challenges/:challengeId/team/:memberId',
  requireRole('admin', 'mentor'),
  validate(updateChallengeTeamMemberSchema),
  controller.updateChallengeTeamMember,
);

portfolioRouter.delete(
  '/challenges/:challengeId/team/:memberId',
  requireRole('admin', 'mentor'),
  controller.removeChallengeTeamMember,
);

// ─── Initiative Team (resolution + per-iniciativa override, #110/#114) ───────────
portfolioRouter.get(
  '/initiatives/:projectId/team',
  controller.getInitiativeTeam,
);

portfolioRouter.put(
  '/initiatives/:projectId/team/:userId',
  requireRole('admin', 'mentor'),
  validate(upsertInitiativeTeamMemberSchema),
  controller.upsertInitiativeTeamMember,
);

portfolioRouter.delete(
  '/initiatives/:projectId/team/:userId',
  requireRole('admin', 'mentor'),
  controller.removeInitiativeTeamMember,
);

// ─── Initiatives ──────────────────────────────────────────────────────────────
portfolioRouter.get(
  '/challenges/:challengeId/initiatives',
  controller.listInitiatives,
);

portfolioRouter.get(
  '/initiatives/:projectId/meta',
  controller.getInitiativeMeta,
);

portfolioRouter.put(
  '/initiatives/:projectId/meta',
  requireRole('admin', 'mentor'),
  validate(upsertInitiativeMetaSchema),
  controller.upsertInitiativeMeta,
);

// ─── Overlaps ─────────────────────────────────────────────────────────────────
portfolioRouter.get(
  '/challenges/:challengeId/overlaps',
  controller.listOverlaps,
);

portfolioRouter.post(
  '/challenges/:challengeId/overlaps',
  requireRole('admin', 'mentor'),
  validate(createOverlapSchema),
  controller.createOverlap,
);

// ─── Executive Outputs ────────────────────────────────────────────────────────
portfolioRouter.get(
  '/challenges/:challengeId/executive-outputs',
  controller.listExecutiveOutputs,
);

// PRD-005 / ADR-020: meter `exec_export` — the board-facing executive output is a
// high-value gated deliverable. Shadow mode by default.
portfolioRouter.post(
  '/challenges/:challengeId/executive-outputs',
  requireRole('admin', 'mentor'),
  requireEntitlement('exec_export'),
  validate(createExecutiveOutputSchema),
  controller.createExecutiveOutput,
);

portfolioRouter.patch(
  '/executive-outputs/:id',
  requireRole('admin', 'mentor'),
  validate(updateExecutiveOutputSchema),
  controller.updateExecutiveOutput,
);
