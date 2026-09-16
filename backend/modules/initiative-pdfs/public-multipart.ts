/**
 * Minimal, dependency-free `multipart/form-data` parser for the PUBLIC PDF
 * extraction route (issue #23).
 *
 * WHY hand-rolled instead of `multer`: the repo deliberately avoids pulling new
 * runtime deps (the authenticated PDF path uses `express.raw` for the same
 * reason). The public surface needs only: ONE file part named `file` plus two
 * short text fields. A focused parser keeps the attack surface tiny and the
 * dependency tree unchanged.
 *
 * Guardrails enforced HERE (before anything hits the service / ai-service):
 *   - total upload size hard-capped (`maxBytes`) — the stream is aborted the
 *     moment the cap is exceeded, so an attacker cannot exhaust memory.
 *   - the file part must be PDF by BOTH declared mime AND `.pdf` extension.
 * Field-level validation (draftId / anonymousSessionId) is done by Zod in the
 * controller.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';

export interface ParsedMultipartFile {
  fieldName: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
}

const ALLOWED_MIME = 'application/pdf';

function getBoundary(contentType: string | undefined): string | null {
  if (!contentType) return null;
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = (m && (m[1] || m[2]))?.trim();
  return boundary || null;
}

/** Split a raw multipart body buffer into part buffers using the boundary. */
function splitParts(body: Buffer, boundary: string): Buffer[] {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = body.indexOf(delimiter);
  if (start === -1) return parts;
  start += delimiter.length;
  while (start < body.length) {
    const next = body.indexOf(delimiter, start);
    if (next === -1) break;
    // Slice between this delimiter and the next; trim the leading CRLF and
    // trailing CRLF that frame each part.
    let chunk = body.subarray(start, next);
    // Leading CRLF after the boundary line.
    if (chunk[0] === 0x0d && chunk[1] === 0x0a) chunk = chunk.subarray(2);
    // Trailing CRLF before the next boundary.
    if (chunk[chunk.length - 2] === 0x0d && chunk[chunk.length - 1] === 0x0a) {
      chunk = chunk.subarray(0, chunk.length - 2);
    }
    if (chunk.length > 0) parts.push(chunk);
    start = next + delimiter.length;
  }
  return parts;
}

interface ParsedPart {
  name: string;
  fileName?: string;
  contentType?: string;
  data: Buffer;
}

function parsePart(part: Buffer): ParsedPart | null {
  // Header / body split is the first CRLFCRLF.
  const sep = part.indexOf('\r\n\r\n');
  if (sep === -1) return null;
  const headerText = part.subarray(0, sep).toString('utf8');
  const data = part.subarray(sep + 4);

  const disposition = /content-disposition:[^\r\n]*/i.exec(headerText)?.[0] ?? '';
  const nameMatch = /name="([^"]*)"/i.exec(disposition);
  if (!nameMatch) return null;
  const fileNameMatch = /filename="([^"]*)"/i.exec(disposition);
  const ctMatch = /content-type:\s*([^\r\n;]+)/i.exec(headerText);

  return {
    name: nameMatch[1],
    fileName: fileNameMatch ? fileNameMatch[1] : undefined,
    contentType: ctMatch ? ctMatch[1].trim() : undefined,
    data,
  };
}

/**
 * Express middleware factory. Buffers the request body up to `maxBytes`
 * (aborting if exceeded), parses the single `file` part + text fields, runs the
 * PDF guardrails, and stashes results on `req.body` / `req.publicPdfFile`.
 */
export function publicMultipart(opts: { maxBytes: number }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentType = (req.headers['content-type'] || '').toString();
    const boundary = getBoundary(contentType);
    if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundary) {
      next(
        AppError.badRequest(
          'La solicitud debe ser multipart/form-data.',
          'PDF_UPLOAD_INVALID',
          { hint: 'Envia el PDF en un campo de formulario llamado "file".' },
        ),
      );
      return;
    }

    const chunks: Buffer[] = [];
    let total = 0;
    let aborted = false;

    req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      total += chunk.length;
      if (total > opts.maxBytes) {
        aborted = true;
        // Drop buffered data to free memory, then drain the rest of the stream
        // so the connection closes cleanly and the error response can flush
        // (destroying the socket here would surface as a client "socket hang
        // up" instead of our 400 envelope).
        chunks.length = 0;
        req.resume();
        next(
          AppError.badRequest(
            `El PDF excede el limite de ${opts.maxBytes} bytes.`,
            'PDF_TOO_LARGE',
            { hint: 'Reduce el tamano del archivo a menos de 10 MB.' },
          ),
        );
        return;
      }
      chunks.push(chunk);
    });

    req.on('error', () => {
      if (aborted) return;
      aborted = true;
      next(AppError.badRequest('No se pudo leer el archivo.', 'PDF_UPLOAD_INVALID'));
    });

    req.on('end', () => {
      if (aborted) return;
      try {
        const body = Buffer.concat(chunks);
        const parts = splitParts(body, boundary).map(parsePart).filter(Boolean) as ParsedPart[];

        const fields: Record<string, string> = {};
        let file: ParsedMultipartFile | undefined;

        for (const part of parts) {
          if (part.fileName !== undefined) {
            // File part. We only accept ONE file, named `file`.
            if (part.name !== 'file') continue;
            file = {
              fieldName: part.name,
              fileName: part.fileName,
              contentType: part.contentType ?? '',
              bytes: part.data,
            };
          } else {
            fields[part.name] = part.data.toString('utf8');
          }
        }

        if (!file) {
          next(
            AppError.badRequest('Falta el archivo PDF.', 'PDF_BODY_MISSING', {
              field: 'file',
            }),
          );
          return;
        }

        // ─── PDF guardrails (mime + extension) ───────────────────────────────
        const declaredMime = (file.contentType || '').split(';')[0].trim().toLowerCase();
        if (declaredMime !== ALLOWED_MIME) {
          next(
            AppError.badRequest('Solo se aceptan archivos PDF.', 'PDF_MIME_INVALID', {
              field: 'file',
              hint: 'Sube un archivo .pdf valido.',
            }),
          );
          return;
        }
        if (!/\.pdf$/i.test(file.fileName)) {
          next(
            AppError.badRequest('El archivo debe tener extension .pdf.', 'PDF_MIME_INVALID', {
              field: 'file',
            }),
          );
          return;
        }
        if (file.bytes.byteLength === 0) {
          next(AppError.badRequest('Archivo vacio.', 'PDF_EMPTY', { field: 'file' }));
          return;
        }

        // Expose to the controller. `req.body` carries the text fields so the
        // controller's Zod schema validates them like any JSON body.
        (req as Request & { publicPdfFile?: ParsedMultipartFile }).publicPdfFile = file;
        req.body = fields;
        next();
      } catch {
        next(AppError.badRequest('No se pudo procesar el archivo.', 'PDF_UPLOAD_INVALID'));
      }
    });
  };
}
