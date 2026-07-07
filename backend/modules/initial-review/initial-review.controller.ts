/**
 * Controller de la revisión inicial guiada (ADR-025, PRD §21). Thin: delega en el
 * service y responde el envelope canónico ApiResponse.
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types/auth.types';
import { ApiResponse } from '../../shared/types/api.types';
import { InitialReviewService } from './initial-review.service';

export class InitialReviewController {
  constructor(private readonly service: InitialReviewService) {}

  create = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const review = await this.service.createReview(req.user!.id, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const review = await this.service.getReview(req.params.id, req.user!.id, req.user!.role);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  getSnapshot = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const snapshot = await this.service.getLatestSnapshot(req.params.id, req.user!.id, req.user!.role);
      res.json({ success: true, data: snapshot });
    } catch (err) {
      next(err);
    }
  };

  addContext = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const review = await this.service.addContext(req.params.id, req.user!.id, req.body.context);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  saveAnswers = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const review = await this.service.saveStrategicAnswers(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };
}
