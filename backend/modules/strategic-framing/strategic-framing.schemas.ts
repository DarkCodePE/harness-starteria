import { z } from 'zod';

export const strategicFramingStateParamsSchema = z.object({
  stateId: z.string().trim().min(1),
});

const nullableText = z.string().nullable().optional();

export const strategicFramingPromotionBodySchema = z.object({
  challengeCandidateId: z.string().trim().min(1),
  expectedVersion: z.number().int().positive(),
  strategicFrontId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  statement: z.string().trim().min(1),
  type: z.enum(['correccion', 'crecimiento', 'exploracion']),
  objective: nullableText,
  whyNow: nullableText,
  successCriteria: nullableText,
  rationale: nullableText,
}).strict();

export const strategicFramingCorrectionBodySchema = z.object({
  expectedVersion: z.number().int().positive(),
  intendedMovement: nullableText,
  whyItMatters: nullableText,
  movementSignalStatus: z.enum(['confirmed', 'proxy', 'suggested', 'unknown', 'conflicting']).nullable().optional(),
  movementSignalValue: nullableText,
  horizonContext: nullableText,
  decisionToEnable: nullableText,
  subjectLevel: z.enum(['front_like', 'challenge_like', 'initiative_like', 'unresolved']).optional(),
  parentStatus: z.enum(['known', 'provisional', 'unresolved']).optional(),
  parentLabel: nullableText,
  reason: nullableText,
}).strict();

const publicEntrySourceSchema = z.object({
  sourceMode: z.literal('public_entry'),
  bootstrapSessionId: z.string().trim().min(1),
}).strict();

const enterpriseDirectSourceSchema = z.object({
  sourceMode: z.literal('enterprise_direct'),
  intendedMovement: z.string().trim().min(1),
  whyItMatters: nullableText,
  movementSignalValue: nullableText,
  decisionToEnable: nullableText,
}).strict();

const existingPortfolioSourceSchema = z.object({
  sourceMode: z.literal('existing_portfolio'),
  sourceType: z.enum(['strategic_front', 'challenge', 'initiative']),
  sourceId: z.string().trim().min(1),
}).strict();

export const strategicFramingSourceBodySchema = z.discriminatedUnion('sourceMode', [
  publicEntrySourceSchema,
  enterpriseDirectSourceSchema,
  existingPortfolioSourceSchema,
]);

export type StrategicFramingSourceBody = z.infer<typeof strategicFramingSourceBodySchema>;

export type StrategicFramingCorrectionBody = z.infer<typeof strategicFramingCorrectionBodySchema>;
