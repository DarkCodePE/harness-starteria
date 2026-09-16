import { z } from 'zod';

export const continuePortfolioEntryBodySchema = z.object({
  expectedRevision: z.number().int().min(0),
}).strict();

export const continuationParamsSchema = z.object({
  continuationId: z.string().min(1),
});

export type ContinuePortfolioEntryBody = z.infer<typeof continuePortfolioEntryBodySchema>;
