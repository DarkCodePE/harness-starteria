/**
 * Controller for the PUBLIC (no-auth) field-refinement bridge (ADR-016).
 * Thin: Zod-validate, forward via the service, envelope.
 */
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types/api.types';
import { refineFieldBodySchema } from './refine-field.schemas';
import { RefineFieldService } from './refine-field.service';

export class RefineFieldController {
  constructor(private readonly service: RefineFieldService) {}

  /** POST /api/v1/public/refine-field */
  refine = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const body = refineFieldBodySchema.parse(req.body);
      const requestId = (req as Request & { requestId?: string }).requestId;
      const result = await this.service.refine(body, requestId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
