import { Router } from 'express';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createCheckpointSchema, respondCheckpointSchema } from './sponsor.schemas';
import {
  createCheckpoint,
  respondToCheckpoint,
  skipCheckpoint,
  getCheckpoint,
  listProjectCheckpoints,
} from './sponsor.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create checkpoint (admin only)
router.post(
  '/checkpoints',
  requirePermission('sponsor:manage'),
  validate(createCheckpointSchema),
  createCheckpoint,
);

// Get checkpoint details (any authenticated user with project access)
router.get('/checkpoints/:id', getCheckpoint);

// Sponsor responds to checkpoint
router.patch(
  '/checkpoints/:id/respond',
  requirePermission('sponsor:decide'),
  validate(respondCheckpointSchema),
  respondToCheckpoint,
);

// Admin skips checkpoint
router.patch(
  '/checkpoints/:id/skip',
  requirePermission('sponsor:manage'),
  skipCheckpoint,
);

// List checkpoints for a project
router.get('/projects/:projectId/checkpoints', listProjectCheckpoints);

export { router as sponsorRouter };
