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

// ADR-028: las escrituras son `admin` + `portfolio_lead`. `mentor` las tenía por no
// existir el rol correcto, no por decisión de producto; se le retiran aquí.
//
// Las lecturas se quedan SIN gate a propósito: `AppLayout` llama a
// `GET /initiatives/:projectId/meta` para todo usuario autenticado, así que cerrarlas
// rompería a los participantes. Deuda declarada en el `scope_out` de la feature.

// ─── Strategic Fronts ─────────────────────────────────────────────────────────
portfolioRouter.get('/strategic-fronts', controller.listStrategicFronts);

portfolioRouter.post(
  '/strategic-fronts',
  requireRole('admin', 'portfolio_lead'),
  validate(createStrategicFrontSchema),
  controller.createStrategicFront,
);

portfolioRouter.patch(
  '/strategic-fronts/:id',
  requireRole('admin', 'portfolio_lead'),
  validate(updateStrategicFrontSchema),
  controller.updateStrategicFront,
);

portfolioRouter.delete(
  '/strategic-fronts/:id',
  requireRole('admin', 'portfolio_lead'),
  controller.deleteStrategicFront,
);

// ─── Challenges ───────────────────────────────────────────────────────────────
portfolioRouter.get(
  '/strategic-fronts/:frontId/challenges',
  controller.listChallenges,
);

portfolioRouter.post(
  '/strategic-fronts/:frontId/challenges',
  requireRole('admin', 'portfolio_lead'),
  validate(createChallengeSchema),
  controller.createChallenge,
);

portfolioRouter.patch(
  '/challenges/:id',
  requireRole('admin', 'portfolio_lead'),
  validate(updateChallengeSchema),
  controller.updateChallenge,
);

// ─── Challenge Actions ────────────────────────────────────────────────────────
portfolioRouter.post(
  '/challenges/:id/activate-open-call',
  requireRole('admin', 'portfolio_lead'),
  controller.activateOpenCall,
);

portfolioRouter.post(
  '/challenges/:id/publish',
  requireRole('admin', 'portfolio_lead'),
  controller.publishChallenge,
);

// ─── Invitations ──────────────────────────────────────────────────────────────
portfolioRouter.post(
  '/challenges/:id/invitations',
  requireRole('admin', 'portfolio_lead'),
  validate(addInvitationSchema),
  controller.addInvitation,
);

portfolioRouter.patch(
  '/challenges/:id/invitations/:invId',
  requireRole('admin', 'portfolio_lead'),
  validate(updateInvitationSchema),
  controller.updateInvitation,
);

// ─── Squad Members ────────────────────────────────────────────────────────────
portfolioRouter.post(
  '/challenges/:id/squad',
  requireRole('admin', 'portfolio_lead'),
  validate(addSquadMemberSchema),
  controller.addSquadMember,
);

portfolioRouter.patch(
  '/challenges/:id/squad/:memberId',
  requireRole('admin', 'portfolio_lead'),
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
  requireRole('admin', 'portfolio_lead'),
  validate(addChallengeTeamMemberSchema),
  controller.addChallengeTeamMember,
);

portfolioRouter.patch(
  '/challenges/:challengeId/team/:memberId',
  requireRole('admin', 'portfolio_lead'),
  validate(updateChallengeTeamMemberSchema),
  controller.updateChallengeTeamMember,
);

portfolioRouter.delete(
  '/challenges/:challengeId/team/:memberId',
  requireRole('admin', 'portfolio_lead'),
  controller.removeChallengeTeamMember,
);

// ─── Initiative Team (resolution + per-iniciativa override, #110/#114) ───────────
portfolioRouter.get(
  '/initiatives/:projectId/team',
  controller.getInitiativeTeam,
);

portfolioRouter.put(
  '/initiatives/:projectId/team/:userId',
  requireRole('admin', 'portfolio_lead'),
  validate(upsertInitiativeTeamMemberSchema),
  controller.upsertInitiativeTeamMember,
);

portfolioRouter.delete(
  '/initiatives/:projectId/team/:userId',
  requireRole('admin', 'portfolio_lead'),
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
  requireRole('admin', 'portfolio_lead'),
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
  requireRole('admin', 'portfolio_lead'),
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
  requireRole('admin', 'portfolio_lead'),
  requireEntitlement('exec_export'),
  validate(createExecutiveOutputSchema),
  controller.createExecutiveOutput,
);

portfolioRouter.patch(
  '/executive-outputs/:id',
  requireRole('admin', 'portfolio_lead'),
  validate(updateExecutiveOutputSchema),
  controller.updateExecutiveOutput,
);
