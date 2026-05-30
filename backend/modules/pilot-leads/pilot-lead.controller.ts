/**
 * Controller for the PUBLIC (no-auth) pilot-lead capture surface.
 * Thin: validate the boundary with Zod, hand off to the service, envelope.
 * Errors flow through `next(err)` → central handler (ZodError → 422,
 * AppError(PILOT_CONSENT_REQUIRED) → 409).
 */
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types/api.types';
import { pilotLeadBodySchema } from './pilot-lead.schemas';
import { PilotLeadService } from './pilot-lead.service';

export class PilotLeadController {
  constructor(private readonly service: PilotLeadService) {}

  /** POST /api/v1/public/pilot-leads */
  create = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const body = pilotLeadBodySchema.parse(req.body);
      const result = await this.service.submit(body, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
