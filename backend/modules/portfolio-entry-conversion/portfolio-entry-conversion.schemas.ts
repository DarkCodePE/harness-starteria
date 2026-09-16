import { z } from 'zod';

export const convertPortfolioEntryBodySchema = z.object({
  expectedRevision: z.number().int().min(0),
}).strict();

export type ConvertPortfolioEntryBody = z.infer<typeof convertPortfolioEntryBodySchema>;
