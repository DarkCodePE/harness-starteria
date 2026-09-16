import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { ApiResponse } from '../../shared/types/api.types';
import { PublicPdfService } from './public-pdf.service';
import {
  publicExtractBodySchema,
  publicRunIdParam,
} from './public-pdf.schemas';
import type { ParsedMultipartFile } from './public-multipart';

/**
 * Controllers for the PUBLIC (no-auth) PDF extraction surface (issue #23).
 *
 * Thin: validate the boundary with Zod, hand off to PublicPdfService, envelope
 * the result. Errors always flow through `next(err)` → the central handler so
 * internal details are never leaked to anonymous callers.
 */
export class PublicPdfController {
  constructor(private readonly service: PublicPdfService) {}

  /**
   * POST /api/v1/public/pdf-extract
   * multipart: `file` (PDF) + body `anonymousSessionId`, `draftId`.
   * The multipart middleware has already parsed + size/mime/extension-checked
   * the file and stashed it on `req.publicPdfFile`.
   */
  extract = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const file = (req as Request & { publicPdfFile?: ParsedMultipartFile }).publicPdfFile;
      if (!file) {
        throw AppError.badRequest(
          'Falta el archivo PDF.',
          'PDF_BODY_MISSING',
          { field: 'file', hint: 'Adjunta un archivo PDF en el campo "file".' },
        );
      }

      const body = publicExtractBodySchema.parse(req.body);

      const result = await this.service.startExtraction({
        draftId: body.draftId,
        anonymousSessionId: body.anonymousSessionId,
        fileName: file.fileName,
        bytes: file.bytes,
        requestId: (req as Request & { requestId?: string }).requestId,
      });

      res.status(202).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/public/pdf-extract/runs/:runId */
  getRun = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const { runId } = publicRunIdParam.parse(req.params);
      const state = await this.service.getRun(runId);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, data: state });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/public/pdf-extract/runs/:runId/proposals → AutofillProposalDto[] */
  listProposals = async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { runId } = publicRunIdParam.parse(req.params);
      const proposals = await this.service.listProposals(runId);
      res.json({ success: true, data: proposals });
    } catch (err) {
      next(err);
    }
  };
}
