/**
 * Contratos Zod de la revisión inicial guiada (ADR-025, PRD §21).
 * Validación en la frontera del router (SR-1). Sin PII sensible en esta etapa.
 */
import { z } from 'zod';

export const createInitialReviewSchema = z.object({
  originalInput: z.string().trim().min(10, 'Agrega un poco más de contexto para revisar tu propuesta.').max(8000),
  addedContext: z.array(z.string().max(8000)).max(20).optional(),
  sourceFileIds: z.array(z.string().max(120)).max(20).optional(),
  challengeId: z.string().max(120).optional(),
});
export type CreateInitialReviewInput = z.infer<typeof createInitialReviewSchema>;

export const addContextSchema = z.object({
  context: z.string().trim().min(1, 'Falta el contexto a agregar.').max(8000),
});
export type AddContextInput = z.infer<typeof addContextSchema>;

export const confirmRouteSchema = z.object({
  snapshotId: z.string().max(120).optional(), // por defecto: el último snapshot
});
export type ConfirmRouteInput = z.infer<typeof confirmRouteSchema>;

export const strategicAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        id: z.string().min(1),
        answer: z.string().max(2000).optional(),
        unknown: z.boolean().optional(),
      }),
    )
    .min(1, 'Envía al menos una respuesta.')
    .max(10),
});
export type StrategicAnswersInput = z.infer<typeof strategicAnswersSchema>;
