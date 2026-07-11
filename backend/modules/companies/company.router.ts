import express, { Router } from 'express';
import prisma from '../../shared/db/prisma';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import {
  addMembershipSchema,
  createAreaSchema,
  createCompanySchema,
  createNoteSchema,
  createSnapshotSchema,
  createUrlSourceSchema,
  submitContributionSchema,
  updateAreaSchema,
  updateCompanySchema,
  updateContextSchema,
  updateMembershipSchema,
  uploadSourceQuerySchema,
} from './company.schemas';
import { MAX_CONTEXT_FILE_BYTES } from './context-utils';

const service = new CompanyService(prisma);
const controller = new CompanyController(service);

export const companyRouter = Router();
export const initiativeContextRouter = Router({ mergeParams: true });

companyRouter.use(authenticate);
initiativeContextRouter.use(authenticate);

companyRouter.get('/', controller.list);
companyRouter.post('/', validate(createCompanySchema), controller.create);
companyRouter.get('/:companyId', controller.get);
companyRouter.patch('/:companyId', validate(updateCompanySchema), controller.update);
companyRouter.delete('/:companyId', controller.delete);
companyRouter.post('/:companyId/clone', controller.clone);

companyRouter.get('/:companyId/context', controller.readContext);
companyRouter.patch('/:companyId/context', validate(updateContextSchema), controller.updateContext);
companyRouter.get('/:companyId/context/versions', controller.versions);
companyRouter.post('/:companyId/context/publish', controller.publish);
companyRouter.get('/:companyId/context/score', controller.score);

companyRouter.get('/:companyId/areas', controller.listAreas);
companyRouter.post('/:companyId/areas', validate(createAreaSchema), controller.createArea);
companyRouter.patch('/:companyId/areas/:areaId', validate(updateAreaSchema), controller.updateArea);
companyRouter.delete('/:companyId/areas/:areaId', controller.deleteArea);

companyRouter.post('/:companyId/sources/url', validate(createUrlSourceSchema), controller.createUrlSource);
companyRouter.post(
  '/:companyId/sources/upload',
  validate(uploadSourceQuerySchema, 'query'),
  express.raw({
    type: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/markdown',
      'text/plain',
      'application/octet-stream',
    ],
    limit: MAX_CONTEXT_FILE_BYTES,
  }),
  controller.uploadSource,
);
companyRouter.get('/:companyId/sources', controller.listSources);
companyRouter.get('/context-sources/:sourceId', controller.readSource);
companyRouter.delete('/context-sources/:sourceId', controller.deleteSource);
companyRouter.post('/context-sources/:sourceId/reprocess', controller.reprocessSource);

companyRouter.get('/:companyId/members', controller.memberships);
companyRouter.post('/:companyId/members', validate(addMembershipSchema), controller.addMembership);
companyRouter.patch('/:companyId/members/:membershipId', validate(updateMembershipSchema), controller.updateMembership);
companyRouter.delete('/:companyId/members/:membershipId', controller.removeMembership);

companyRouter.post('/:companyId/contributions', validate(submitContributionSchema), controller.submitContribution);
companyRouter.get('/:companyId/contributions', controller.listContributions);
companyRouter.post('/:companyId/contributions/:id/approve', controller.approveContribution);
companyRouter.post('/:companyId/contributions/:id/reject', controller.rejectContribution);

initiativeContextRouter.post('/:initiativeId/company-context/snapshot', validate(createSnapshotSchema), controller.createSnapshot);
initiativeContextRouter.get('/:initiativeId/company-context', controller.readSnapshot);
initiativeContextRouter.post('/:initiativeId/company-context/sync', controller.syncSnapshot);
initiativeContextRouter.post('/:initiativeId/context-notes', validate(createNoteSchema), controller.createNote);
initiativeContextRouter.get('/:initiativeId/context-export', controller.exportContext);
