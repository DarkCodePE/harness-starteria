import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types/auth.types';
import { ApiResponse } from '../../shared/types/api.types';
import { CompanyService } from './company.service';

function actor(req: AuthenticatedRequest) {
  return { id: req.user!.id, role: req.user!.role, email: req.user!.email };
}

export class CompanyController {
  constructor(private service: CompanyService) {}

  list = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.list(actor(req)) }); } catch (err) { next(err); }
  };

  create = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.create(actor(req), req.body) }); } catch (err) { next(err); }
  };

  get = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.get(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  update = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.update(actor(req), req.params.companyId, req.body) }); } catch (err) { next(err); }
  };

  delete = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await this.service.deleteOrArchive(actor(req), req.params.companyId);
      res.json({ success: true, data: { message: 'Empresa archivada o eliminada' } });
    } catch (err) { next(err); }
  };

  clone = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.clone(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  readContext = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.readContext(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  updateContext = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.updateContext(actor(req), req.params.companyId, req.body) }); } catch (err) { next(err); }
  };

  versions = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.versions(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  publish = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.publish(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  score = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.score(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  listAreas = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.listAreas(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  createArea = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.createArea(actor(req), req.params.companyId, req.body) }); } catch (err) { next(err); }
  };

  updateArea = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.updateArea(actor(req), req.params.companyId, req.params.areaId, req.body) }); } catch (err) { next(err); }
  };

  deleteArea = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await this.service.deleteArea(actor(req), req.params.companyId, req.params.areaId);
      res.json({ success: true, data: { message: 'Area archivada' } });
    } catch (err) { next(err); }
  };

  createUrlSource = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(202).json({ success: true, data: await this.service.createUrlSource(actor(req), req.params.companyId, req.body) }); } catch (err) { next(err); }
  };

  uploadSource = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const headers = (req as any).headers ?? {};
      const fileName = String(headers['x-file-name'] ?? 'context-source');
      const mimeType = String(headers['content-type'] ?? '');
      res.status(202).json({
        success: true,
        data: await this.service.uploadSource(actor(req), req.params.companyId, {
          fileName,
          mimeType,
          bytes: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0),
          areaId: typeof req.query.areaId === 'string' ? req.query.areaId : undefined,
          requestId: headers['x-request-id']?.toString(),
        }),
      });
    } catch (err) { next(err); }
  };

  listSources = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.listSources(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  readSource = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.readSource(actor(req), req.params.sourceId) }); } catch (err) { next(err); }
  };

  deleteSource = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await this.service.deleteSource(actor(req), req.params.sourceId);
      res.json({ success: true, data: { message: 'Fuente eliminada' } });
    } catch (err) { next(err); }
  };

  reprocessSource = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(202).json({ success: true, data: await this.service.reprocessSource(actor(req), req.params.sourceId) }); } catch (err) { next(err); }
  };

  memberships = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.memberships(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  addMembership = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.addMembership(actor(req), req.params.companyId, req.body) }); } catch (err) { next(err); }
  };

  updateMembership = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.updateMembership(actor(req), req.params.companyId, req.params.membershipId, req.body) }); } catch (err) { next(err); }
  };

  removeMembership = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await this.service.removeMembership(actor(req), req.params.companyId, req.params.membershipId);
      res.json({ success: true, data: { message: 'Membresia removida' } });
    } catch (err) { next(err); }
  };

  submitContribution = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.submitContribution(actor(req), req.params.companyId, req.body) }); } catch (err) { next(err); }
  };

  listContributions = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.listContributions(actor(req), req.params.companyId) }); } catch (err) { next(err); }
  };

  approveContribution = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.reviewContribution(actor(req), req.params.companyId, req.params.id, true) }); } catch (err) { next(err); }
  };

  rejectContribution = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.reviewContribution(actor(req), req.params.companyId, req.params.id, false) }); } catch (err) { next(err); }
  };

  createSnapshot = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.createInitiativeSnapshot(actor(req), req.params.initiativeId, req.body) }); } catch (err) { next(err); }
  };

  readSnapshot = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.readInitiativeSnapshot(actor(req), req.params.initiativeId) }); } catch (err) { next(err); }
  };

  syncSnapshot = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.syncInitiativeSnapshot(actor(req), req.params.initiativeId) }); } catch (err) { next(err); }
  };

  createNote = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.createInitiativeNote(actor(req), req.params.initiativeId, req.body) }); } catch (err) { next(err); }
  };

  exportContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const format = req.query.format === 'pdf' ? 'pdf' : 'markdown';
      const out = await this.service.exportInitiativeContext(actor(req), req.params.initiativeId, format);
      res.setHeader('Content-Type', out.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
      res.send(out.body);
    } catch (err) { next(err); }
  };
}
