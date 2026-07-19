/**
 * Controller de la revisión inicial guiada (ADR-025, PRD §21). Thin: delega en el
 * service y responde el envelope canónico ApiResponse.
 */
import { Response, NextFunction, Request as ExpressRequest } from 'express';
import { AuthenticatedRequest } from '../../shared/types/auth.types';
import { ApiResponse } from '../../shared/types/api.types';
import { AppError } from '../../shared/errors/AppError';
import { InitialReviewService } from './initial-review.service';
import { RouteConfirmationService } from './route-confirmation.service';
import { ContextAiClient } from '../companies/context-ai-client';

// ADR-026 v2: documentos aceptados como contexto de review (PDF/docx/txt/md).
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_DOC = [
  { mime: /pdf/i, ext: /\.pdf$/i },
  { mime: /officedocument\.wordprocessingml|msword/i, ext: /\.docx?$/i },
  { mime: /text\/(plain|markdown)/i, ext: /\.(txt|md|text|markdown)$/i },
];

export class InitialReviewController {
  constructor(
    private readonly service: InitialReviewService,
    private readonly routeConfirmations: RouteConfirmationService,
    private readonly aiClient = new ContextAiClient(),
  ) {}

  confirmRoute = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const result = await this.routeConfirmations.confirmRoute(req.params.id, req.user!.id, req.body?.snapshotId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

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
      const review = await this.service.addContext(req.params.id, req.user!.id, req.body.context, req.body.focusSection);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  // ADR-026 v2: POST /:id/add-document — sube un documento, extrae su texto (context-extract-file)
  // y lo inyecta como contexto (regenera TODA la iniciativa). Cuerpo raw (Buffer).
  addDocument = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const buffer = req.body as Buffer;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw AppError.badRequest('El documento está vacío.', 'DOCUMENT_EMPTY');
      }
      if (buffer.length > MAX_DOC_BYTES) {
        throw AppError.badRequest('El documento supera el tamaño máximo (10 MB).', 'DOCUMENT_TOO_LARGE');
      }
      const headers = (req as unknown as ExpressRequest);
      const fileName = decodeURIComponent(headers.header('X-File-Name') ?? 'documento').slice(0, 200);
      const mimeType = (headers.header('Content-Type') ?? 'application/octet-stream').split(';')[0].trim();
      const allowed = ALLOWED_DOC.some((a) => a.mime.test(mimeType) || a.ext.test(fileName));
      if (!allowed) {
        throw AppError.badRequest('Formato no soportado. Usa PDF, Word (.docx) o texto (.txt/.md).', 'DOCUMENT_UNSUPPORTED_TYPE');
      }

      const extracted = await this.aiClient.extractFile({
        sourceType: 'FILE',
        mimeType,
        fileName,
        fileBase64: buffer.toString('base64'),
        requestId: headers.header('X-Request-ID') ?? undefined,
        userId: req.user!.id,
        role: req.user!.role,
      });
      const text = (extracted.cleanContent ?? '').trim();
      if (!text) {
        throw AppError.badRequest('No pudimos extraer texto de ese documento.', 'DOCUMENT_NO_TEXT');
      }

      // Se inyecta como contexto (whole-initiative, sin focusSection) con el nombre del archivo.
      const framed = `Documento adjunto «${fileName}»:\n${text}`;
      const review = await this.service.addContext(req.params.id, req.user!.id, framed);
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
