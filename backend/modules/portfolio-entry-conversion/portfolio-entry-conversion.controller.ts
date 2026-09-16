import type { NextFunction, Request, Response } from 'express';
import { mapPortfolioEntryError } from '../portfolio-entry/portfolio-entry.errors';
import { sessionParamsSchema } from '../portfolio-entry/portfolio-entry.schemas';
import { AppError } from '../../shared/errors/AppError';
import type { PortfolioEntryConversionService } from './portfolio-entry-conversion.service';
import { convertPortfolioEntryBodySchema } from './portfolio-entry-conversion.schemas';

export class PortfolioEntryConversionController {
  constructor(private readonly service: PortfolioEntryConversionService) {}

  convert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = sessionParamsSchema.parse(req.params);
      const body = convertPortfolioEntryBodySchema.parse(req.body);
      if (!req.user?.id) {
        throw AppError.unauthorized('No autorizado.', 'PORTFOLIO_ENTRY_CONVERSION_AUTH_REQUIRED');
      }
      const data = await this.service.convert({
        sessionId,
        expectedRevision: body.expectedRevision,
        authenticatedUserId: req.user.id,
        idempotencyKey: getIdempotencyKey(req),
        requestId: getRequestId(req),
      });
      res.json({ success: true, data });
    } catch (err) {
      next(mapPortfolioEntryError(err));
    }
  };
}

function getIdempotencyKey(req: Request): string | undefined {
  const value = req.header('Idempotency-Key');
  return value && value.trim() ? value.trim() : undefined;
}

function getRequestId(req: Request): string {
  return (req as Request & { requestId?: string; id?: string }).requestId
    ?? (req as Request & { requestId?: string; id?: string }).id
    ?? 'unknown';
}
