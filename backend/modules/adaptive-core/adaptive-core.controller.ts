import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types/auth.types';
import { AdaptiveCoreService } from './adaptive-core.service';

export class AdaptiveCoreController {
  constructor(private service: AdaptiveCoreService) {}

  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.ensureInitialized(req.params.id, user.id, user.role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  confirmCheckpoint = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.confirmCheckpoint(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  registerCriticalChange = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.registerCriticalChange(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  confirmStep0Brief = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.confirmStep0Brief(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  confirmStep1Output = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.confirmStep1Output(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  confirmStep2Output = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.confirmStep2Output(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  confirmStep3Output = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.confirmStep3Output(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  confirmStep4Output = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const data = await this.service.confirmStep4Output(req.params.id, user.id, user.role, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
