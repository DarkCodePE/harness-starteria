import { z } from 'zod';

export const continuePortfolioEntryBodySchema = z.object({
  expectedRevision: z.number().int().min(0),
  organizationId: z.string().min(1).optional(),
}).strict();

export const continuationParamsSchema = z.object({
  continuationId: z.string().min(1),
});

export type ContinuePortfolioEntryBody = z.infer<typeof continuePortfolioEntryBodySchema>;

export const portfolioContextParamsSchema = z.object({
  sessionId: z.string().min(1),
});
